-- 0003 candidates. Identity data lives only in candidate_pii; staff access to it requires recorded consent.
-- Existing Notion pool IDs (CND-xxxx) are preserved in candidate_code. No Notion data is imported by this migration.

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete set null,   -- null until the person registers
  candidate_code text unique,                                           -- legacy anonymised ID, e.g. CND-0001
  pool_type text not null check (pool_type in ('KOKUNAI','KOKUGAI')),
  lifecycle_status text not null default 'registered' check (lifecycle_status in (
    'registered','profile_incomplete','eligibility_review','ready_for_matching','matched','applied',
    'interview','job_offer','hired','rejected','withdrawn','on_hold')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  consent_status text not null default 'none' check (consent_status in ('none','granted','revoked')),   -- maintained from consents
  residence_status text check (residence_status in ('GINOU_JISSHU','STUDENT','SSW1','OTHER','UNKNOWN')),
  ginou_jisshu2_completed boolean,
  ginou_jisshu2_sector text,
  jlpt text check (jlpt in ('N5','N4','N3','N2','N1','NONE')),
  jft_basic_a2 boolean,
  degree text check (degree in ('NONE','VOCATIONAL','BACHELOR','MASTER')),
  preferred_prefectures text[] not null default '{}',
  mobility_restricted_to text[] not null default '{}',
  preferred_sectors text[] not null default '{}',
  wants_dormitory boolean,
  expected_monthly_salary integer check (expected_monthly_salary is null or expected_monthly_salary >= 0),
  available_from date,
  -- provenance
  source_system text, source_ref text, source_url text, source_hash text,
  source_payload jsonb,                     -- raw external record, kept for traceability (pool is anonymised by design)
  provenance jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((source_system is null) = (source_ref is null))
);
create unique index candidates_source_unique on public.candidates(source_system, source_ref) where source_system is not null;
create index candidates_status_idx on public.candidates(lifecycle_status) where deleted_at is null;
create index candidates_pool_idx on public.candidates(pool_type) where deleted_at is null;
create trigger candidates_updated_at before update on public.candidates for each row execute function public.set_updated_at();

-- Direct identity / contact data. Separate table so it can have stricter policies.
create table public.candidate_pii (
  candidate_id uuid primary key references public.candidates(id) on delete cascade,
  full_name text, phone text, email text,
  country_of_origin text, current_country text, current_address text, date_of_birth date,
  updated_at timestamptz not null default now()
);
create trigger candidate_pii_updated_at before update on public.candidate_pii for each row execute function public.set_updated_at();

create table public.candidate_skills (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  kind text not null check (kind in ('skill','certificate','skill_test','experience')),
  name text not null,                       -- skill / certificate name, or sector for skill_test / experience
  status text check (status in ('PASSED','SCHEDULED','NOT_YET')),   -- skill_test only
  years numeric(4,1) check (years is null or years >= 0),            -- experience only
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  check (kind <> 'skill_test' or status is not null),
  check (kind <> 'experience' or years is not null)
);
create index candidate_skills_candidate_idx on public.candidate_skills(candidate_id, kind);

create table public.candidate_languages (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  language text not null, level text not null, evidence_ref text,
  created_at timestamptz not null default now(),
  unique (candidate_id, language)
);

create table public.candidate_preferences (
  candidate_id uuid primary key references public.candidates(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);

-- Metadata only; files live in a PRIVATE storage bucket (created with the storage setup, not here).
create table public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  doc_type text not null, storage_path text not null unique,
  mime_type text, size_bytes bigint check (size_bytes is null or size_bytes between 1 and 20971520),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','rejected')),
  uploaded_by uuid references public.users(id),
  created_at timestamptz not null default now(), deleted_at timestamptz
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,            -- total order for the ledger
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  purpose text not null check (purpose in ('profile_processing','matching','share_with_employer','marketing_messages')),
  status text not null check (status in ('granted','revoked')),
  evidence_ref text,                        -- pointer to where the consent record is kept, not the record itself
  recorded_by uuid references public.users(id),
  created_at timestamptz not null default now()      -- append-only ledger: latest row per purpose wins
);
create index consents_candidate_idx on public.consents(candidate_id, purpose, seq desc);

-- consent_status is derived from the ledger: granted iff the latest profile_processing row is 'granted'.
create or replace function public.sync_consent_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.purpose = 'profile_processing' then
    update public.candidates set consent_status = new.status where id = new.candidate_id;
  end if;
  perform public.record_audit('consent.' || new.status, 'candidate', new.candidate_id::text, jsonb_build_object('purpose', new.purpose));
  return new;
end $$;
create trigger consents_sync after insert on public.consents for each row execute function public.sync_consent_status();

-- Audit sensitive state transitions.
create or replace function public.audit_candidate_changes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.lifecycle_status is distinct from old.lifecycle_status then
    perform public.record_audit('candidate.status_changed', 'candidate', new.id::text, jsonb_build_object('from', old.lifecycle_status, 'to', new.lifecycle_status));
  end if;
  if new.verification_status is distinct from old.verification_status then
    perform public.record_audit('candidate.verification_changed', 'candidate', new.id::text, jsonb_build_object('from', old.verification_status, 'to', new.verification_status));
  end if;
  return new;
end $$;
create trigger candidates_audit after update on public.candidates for each row execute function public.audit_candidate_changes();

-- Candidates may edit their own profile but not workflow/verification/consent/provenance fields.
create or replace function public.guard_candidate_update() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_permission('candidate.write_all') then
    if new.lifecycle_status is distinct from old.lifecycle_status or new.verification_status is distinct from old.verification_status
       or (new.consent_status is distinct from old.consent_status and new.consent_status is distinct from (
             select c.status from public.consents c where c.candidate_id = new.id and c.purpose = 'profile_processing' order by c.seq desc limit 1))
       or new.candidate_code is distinct from old.candidate_code
       or new.user_id is distinct from old.user_id or new.source_system is distinct from old.source_system
       or new.source_ref is distinct from old.source_ref or new.source_payload is distinct from old.source_payload then
      raise exception 'not allowed to change workflow, verification, consent or provenance fields';
    end if;
  end if;
  return new;
end $$;
create trigger candidates_guard before update on public.candidates for each row execute function public.guard_candidate_update();

-- Consent rows can only be written for one's own candidate profile (or by staff). Ledger is append-only.
create or replace function public.owns_candidate(cid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.candidates c where c.id = cid and c.user_id = auth.uid());
$$;
create or replace function public.consent_granted(cid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.candidates c where c.id = cid and c.consent_status = 'granted');
$$;
revoke all on function public.owns_candidate(uuid), public.consent_granted(uuid) from public;
grant execute on function public.owns_candidate(uuid), public.consent_granted(uuid) to authenticated;

alter table public.candidates enable row level security;
alter table public.candidate_pii enable row level security;
alter table public.candidate_skills enable row level security;
alter table public.candidate_languages enable row level security;
alter table public.candidate_preferences enable row level security;
alter table public.candidate_documents enable row level security;
alter table public.consents enable row level security;

create policy cand_own_select on public.candidates for select to authenticated using (user_id = auth.uid());
create policy cand_own_insert on public.candidates for insert to authenticated with check (user_id = auth.uid() and lifecycle_status = 'registered' and consent_status = 'none' and verification_status = 'unverified' and candidate_code is null and source_system is null);
create policy cand_own_update on public.candidates for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cand_staff_select on public.candidates for select to authenticated using (public.has_permission('candidate.read_all'));
create policy cand_staff_write on public.candidates for all to authenticated using (public.has_permission('candidate.write_all')) with check (public.has_permission('candidate.write_all'));

-- PII: owner always; staff only with candidate.read_all AND granted consent.
create policy pii_own on public.candidate_pii for all to authenticated using (public.owns_candidate(candidate_id)) with check (public.owns_candidate(candidate_id));
create policy pii_staff_select on public.candidate_pii for select to authenticated using (public.has_permission('candidate.read_all') and public.consent_granted(candidate_id));
create policy pii_staff_write on public.candidate_pii for all to authenticated using (public.has_permission('candidate.write_all') and public.consent_granted(candidate_id)) with check (public.has_permission('candidate.write_all') and public.consent_granted(candidate_id));

do $$ declare t text; begin
  foreach t in array array['candidate_skills','candidate_languages','candidate_preferences'] loop
    execute format('create policy %I_own on public.%I for all to authenticated using (public.owns_candidate(candidate_id)) with check (public.owns_candidate(candidate_id))', t, t);
    execute format('create policy %I_staff_select on public.%I for select to authenticated using (public.has_permission(''candidate.read_all''))', t, t);
    execute format('create policy %I_staff_write on public.%I for all to authenticated using (public.has_permission(''candidate.write_all'')) with check (public.has_permission(''candidate.write_all''))', t, t);
  end loop;
end $$;

create policy docs_own on public.candidate_documents for all to authenticated using (public.owns_candidate(candidate_id)) with check (public.owns_candidate(candidate_id) and uploaded_by = auth.uid());
create policy docs_staff_select on public.candidate_documents for select to authenticated using (public.has_permission('candidate.documents_read') and public.consent_granted(candidate_id));

create policy consents_own_select on public.consents for select to authenticated using (public.owns_candidate(candidate_id));
create policy consents_own_insert on public.consents for insert to authenticated with check (public.owns_candidate(candidate_id) and recorded_by = auth.uid());
create policy consents_staff_select on public.consents for select to authenticated using (public.has_permission('candidate.read_all'));
create policy consents_staff_insert on public.consents for insert to authenticated with check (public.has_permission('candidate.write_all') and recorded_by = auth.uid());
-- No update/delete policies: the consent ledger is append-only.
