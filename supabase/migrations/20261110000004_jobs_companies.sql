-- 0004 companies + jobs. These tables are an application-side mirror: the Notion Master Job Database remains the
-- system of record until an owner-approved cut-over. Original external identifiers and payloads are preserved.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null, name_jp text,
  corporate_number text,
  industry text, prefecture text, city text, official_website text, recruitment_page text,
  ssw_acceptance text, foreigner_acceptance text,
  partnership_status text check (partnership_status in ('prospect','active','not_suitable','on_hold')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  contact jsonb not null default '{}'::jsonb,        -- private outreach contacts; never exposed publicly
  source_system text, source_ref text, source_url text, source_hash text, source_payload jsonb,
  provenance jsonb not null default '{}'::jsonb, last_synced_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  check ((source_system is null) = (source_ref is null))
);
create unique index companies_source_unique on public.companies(source_system, source_ref) where source_system is not null;
create unique index companies_corp_no_unique on public.companies(corporate_number) where corporate_number is not null and deleted_at is null;
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();

create table public.company_verifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  method text not null, result text not null check (result in ('verified','rejected','needs_review')),
  evidence_ref text, verified_by uuid references public.users(id), verified_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  legacy_job_id integer,                               -- Notion auto-increment "Job ID"
  job_number text,                                     -- Notion "Job Number" (not assumed unique: duplicates are detected, not rejected)
  title text not null,
  company_id uuid references public.companies(id),
  sector text, visa_track text check (visa_track in ('TG','GIJINKOKU')),
  accepts_pool text not null default 'UNKNOWN' check (accepts_pool in ('KOKUNAI','KOKUGAI','BOTH','UNKNOWN')),
  coe_support text not null default 'UNKNOWN' check (coe_support in ('CONFIRMED','DECLINED','UNKNOWN')),
  prefecture text, city text,
  lifecycle_status text not null default 'draft' check (lifecycle_status in ('draft','qc_review','approved','published','expired','archived')),
  qc_status text not null default 'qc_review' check (qc_status in ('qc_approved','qc_review','qc_rejected')),
  job_verified boolean not null default false, source_verified boolean not null default false, employer_verified boolean not null default false,
  expiry_date date, published_at timestamptz, published_by uuid references public.users(id),
  duplicate_of uuid references public.jobs(id),        -- advisory link only; the duplicate keeps its own record and history
  original_status text,                                -- source system's own status value, kept verbatim
  -- provenance
  source_system text, source_ref text, source_url text, source_hash text, source_payload jsonb,
  provenance jsonb not null default '{}'::jsonb, last_synced_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  check ((source_system is null) = (source_ref is null)),
  check (lifecycle_status <> 'published' or (published_by is not null and published_at is not null))
);
create unique index jobs_source_unique on public.jobs(source_system, source_ref) where source_system is not null;
create unique index jobs_legacy_unique on public.jobs(source_system, legacy_job_id) where legacy_job_id is not null and source_system is not null;
create index jobs_job_number_idx on public.jobs(job_number);
create index jobs_lifecycle_idx on public.jobs(lifecycle_status) where deleted_at is null;
create index jobs_filter_idx on public.jobs(sector, prefecture, accepts_pool) where deleted_at is null;
create trigger jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();

create table public.job_requirements (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  jlpt_kind text not null default 'unknown' check (jlpt_kind in ('unknown','none','required')),
  jlpt_level text check (jlpt_level in ('N5','N4','N3','N2','N1')), jlpt_mandatory boolean,
  certificates_kind text not null default 'unknown' check (certificates_kind in ('unknown','none','required')),
  certificates text[] not null default '{}', certificates_mandatory boolean,
  experience_kind text not null default 'unknown' check (experience_kind in ('unknown','none','required')),
  experience_min_years numeric(4,1), experience_sector text, experience_mandatory boolean,
  skills_kind text not null default 'unknown' check (skills_kind in ('unknown','none','required')),
  skills text[] not null default '{}', skills_mandatory boolean,
  preferred_skills text[] not null default '{}',
  raw_text jsonb not null default '{}'::jsonb,         -- original wording of each requirement, as imported
  updated_at timestamptz not null default now(),
  check (jlpt_kind <> 'required' or (jlpt_level is not null and jlpt_mandatory is not null)),
  check (certificates_kind <> 'required' or certificates_mandatory is not null),
  check (experience_kind <> 'required' or (experience_min_years is not null and experience_mandatory is not null)),
  check (skills_kind <> 'required' or skills_mandatory is not null)
);

create table public.job_salary (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  base_monthly integer check (base_monthly is null or base_monthly >= 0),
  hourly_base numeric(8,2) check (hourly_base is null or hourly_base >= 0),
  scheduled_monthly_hours numeric(6,2) check (scheduled_monthly_hours is null or scheduled_monthly_hours > 0),
  fixed_overtime_monthly integer, allowances_monthly integer, bonus_annual integer, take_home_monthly integer,
  gross_monthly_stated integer,                        -- composition unknown (e.g. min–max range from the source)
  salary_basis text, raw_text text,
  updated_at timestamptz not null default now()
);

-- Append-only QC decisions (mirrors the Claude Gate vocabulary).
create table public.job_qc_reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  decision text not null check (decision in ('lolos','perlu_cek','tidak_lolos','lead_mitra_rso')),
  notes text, reviewer_id uuid references public.users(id), created_at timestamptz not null default now()
);

-- Append-only audit events per job. Mirrors the Notion "Job Audit Log"; imports add rows and never overwrite.
create table public.job_audit_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  event_type text not null, event_date timestamptz, run_id text, automation_workflow text,
  ingestion_source text, confidence text, result text, notes text,
  source_system text, source_ref text,
  created_at timestamptz not null default now()
);
create unique index job_audit_events_source_unique on public.job_audit_events(source_system, source_ref) where source_system is not null;
create index job_audit_events_job_idx on public.job_audit_events(job_id, event_date);

create or replace function public.block_mutation() returns trigger language plpgsql as $$
begin raise exception '% is append-only', tg_table_name; end $$;
create trigger job_qc_reviews_immutable before update or delete on public.job_qc_reviews for each row execute function public.block_mutation();
create trigger job_audit_events_immutable before update or delete on public.job_audit_events for each row execute function public.block_mutation();

-- Publication control: a job may become 'published' only when QC-approved and verified, by a user holding job.publish.
create or replace function public.guard_job_publication() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.lifecycle_status = 'published' and (tg_op = 'INSERT' or old.lifecycle_status is distinct from 'published') then
    if new.qc_status <> 'qc_approved' or not new.job_verified or not new.source_verified then
      raise exception 'cannot publish: job must be QC-approved with verified job and source';
    end if;
    if auth.uid() is not null then
      if not public.has_permission('job.publish') then raise exception 'cannot publish: missing job.publish permission'; end if;
      new.published_by := auth.uid();
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  if tg_op = 'UPDATE' and new.lifecycle_status is distinct from old.lifecycle_status then
    perform public.record_audit('job.status_changed', 'job', new.id::text, jsonb_build_object('from', old.lifecycle_status, 'to', new.lifecycle_status));
  end if;
  if tg_op = 'UPDATE' and new.lifecycle_status = 'published' and old.lifecycle_status = 'published'
     and (new.qc_status <> 'qc_approved' or not new.job_verified or not new.source_verified) then
    raise exception 'published job must stay QC-approved and verified; unpublish first';
  end if;
  return new;
end $$;
create trigger jobs_publication before insert or update on public.jobs for each row execute function public.guard_job_publication();

alter table public.companies enable row level security;
alter table public.company_verifications enable row level security;
alter table public.jobs enable row level security;
alter table public.job_requirements enable row level security;
alter table public.job_salary enable row level security;
alter table public.job_qc_reviews enable row level security;
alter table public.job_audit_events enable row level security;

create policy companies_staff_read on public.companies for select to authenticated using (public.has_permission('company.read_all'));
create policy companies_staff_write on public.companies for all to authenticated using (public.has_permission('company.write')) with check (public.has_permission('company.write'));
create policy company_ver_read on public.company_verifications for select to authenticated using (public.has_permission('company.read_all'));
create policy company_ver_insert on public.company_verifications for insert to authenticated with check (public.has_permission('company.verify') and verified_by = auth.uid());

create policy jobs_staff_read on public.jobs for select to authenticated using (public.has_permission('job.read_all'));
create policy jobs_staff_write on public.jobs for all to authenticated using (public.has_permission('job.write')) with check (public.has_permission('job.write'));
create policy job_req_staff_read on public.job_requirements for select to authenticated using (public.has_permission('job.read_all'));
create policy job_req_staff_write on public.job_requirements for all to authenticated using (public.has_permission('job.write')) with check (public.has_permission('job.write'));
create policy job_sal_staff_read on public.job_salary for select to authenticated using (public.has_permission('job.read_all'));
create policy job_sal_staff_write on public.job_salary for all to authenticated using (public.has_permission('job.write')) with check (public.has_permission('job.write'));
create policy qc_read on public.job_qc_reviews for select to authenticated using (public.has_permission('job.read_all'));
create policy qc_insert on public.job_qc_reviews for insert to authenticated with check (public.has_permission('job.qc_review') and reviewer_id = auth.uid());
create policy jaudit_read on public.job_audit_events for select to authenticated using (public.has_permission('job.read_all'));
create policy jaudit_insert on public.job_audit_events for insert to authenticated with check (public.has_permission('job.write'));

-- Public job portal view: published, non-expired jobs only, safe columns only. Companies are private and not exposed.
create view public.public_jobs as
  select j.id, j.job_number, j.title, j.sector, j.visa_track, j.accepts_pool, j.prefecture, j.city, j.published_at, j.expiry_date
  from public.jobs j
  where j.lifecycle_status = 'published' and j.deleted_at is null and (j.expiry_date is null or j.expiry_date >= current_date);
grant select on public.public_jobs to anon, authenticated;
