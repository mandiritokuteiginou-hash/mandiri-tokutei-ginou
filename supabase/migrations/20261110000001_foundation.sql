-- 0001 foundation: roles, permissions, users, audit_logs, system_settings + RLS.
-- Forward-only. Review before applying to any shared/production database.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  kind text not null check (kind in ('public','internal')),
  created_at timestamptz not null default now()
);
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  created_at timestamptz not null default now()
);
create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  locale text not null default 'id' check (locale in ('id','ja')),
  account_status text not null default 'pending' check (account_status in ('pending','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index users_email_unique on public.users (lower(email)) where deleted_at is null;
create trigger users_updated_at before update on public.users for each row execute function public.set_updated_at();

create table public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  granted_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
create index user_roles_role_idx on public.user_roles(role_id);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

-- Safe defaults. Regulated placement stays off until verified authorization exists.
insert into public.system_settings (key, value) values
  ('legal_operating_mode', '"information_only"'),
  ('salary_baseline_jpy', '200000'),
  ('messaging_dry_run', 'true')
on conflict (key) do nothing;

-- BEGIN GENERATED SEED (from packages/shared/src/permissions.ts; a unit test verifies sync)
insert into public.roles (key, kind) values
  ('job_seeker', 'public'),
  ('student', 'public'),
  ('employer', 'public'),
  ('super_admin', 'internal'),
  ('admin', 'internal'),
  ('recruitment_officer', 'internal'),
  ('education_admin', 'internal'),
  ('content_manager', 'internal'),
  ('customer_support', 'internal'),
  ('ai_ops_manager', 'internal')
on conflict (key) do nothing;

insert into public.permissions (key) values
  ('profile.read_own'),
  ('profile.write_own'),
  ('candidate.read_all'),
  ('candidate.write_all'),
  ('candidate.documents_read'),
  ('job.read_published'),
  ('job.read_all'),
  ('job.write'),
  ('job.qc_review'),
  ('job.publish'),
  ('company.read_all'),
  ('company.write'),
  ('company.verify'),
  ('employer.manage_own_company'),
  ('employer.review_consented_candidates'),
  ('matching.run'),
  ('matching.review'),
  ('application.read_own'),
  ('application.write_own'),
  ('recruitment.manage'),
  ('learning.read'),
  ('learning.manage'),
  ('community.post'),
  ('community.moderate'),
  ('content.manage'),
  ('support.manage'),
  ('ai.view_runs'),
  ('ai.manage_agents'),
  ('reports.view'),
  ('settings.manage'),
  ('users.manage'),
  ('roles.manage'),
  ('audit.read')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from (values
  ('job_seeker', 'profile.read_own'),
  ('job_seeker', 'profile.write_own'),
  ('job_seeker', 'job.read_published'),
  ('job_seeker', 'application.read_own'),
  ('job_seeker', 'application.write_own'),
  ('job_seeker', 'learning.read'),
  ('job_seeker', 'community.post'),
  ('student', 'profile.read_own'),
  ('student', 'profile.write_own'),
  ('student', 'job.read_published'),
  ('student', 'learning.read'),
  ('student', 'community.post'),
  ('employer', 'profile.read_own'),
  ('employer', 'profile.write_own'),
  ('employer', 'job.read_published'),
  ('employer', 'employer.manage_own_company'),
  ('employer', 'employer.review_consented_candidates'),
  ('super_admin', 'profile.read_own'),
  ('super_admin', 'profile.write_own'),
  ('super_admin', 'candidate.read_all'),
  ('super_admin', 'candidate.write_all'),
  ('super_admin', 'candidate.documents_read'),
  ('super_admin', 'job.read_published'),
  ('super_admin', 'job.read_all'),
  ('super_admin', 'job.write'),
  ('super_admin', 'job.qc_review'),
  ('super_admin', 'job.publish'),
  ('super_admin', 'company.read_all'),
  ('super_admin', 'company.write'),
  ('super_admin', 'company.verify'),
  ('super_admin', 'employer.manage_own_company'),
  ('super_admin', 'employer.review_consented_candidates'),
  ('super_admin', 'matching.run'),
  ('super_admin', 'matching.review'),
  ('super_admin', 'application.read_own'),
  ('super_admin', 'application.write_own'),
  ('super_admin', 'recruitment.manage'),
  ('super_admin', 'learning.read'),
  ('super_admin', 'learning.manage'),
  ('super_admin', 'community.post'),
  ('super_admin', 'community.moderate'),
  ('super_admin', 'content.manage'),
  ('super_admin', 'support.manage'),
  ('super_admin', 'ai.view_runs'),
  ('super_admin', 'ai.manage_agents'),
  ('super_admin', 'reports.view'),
  ('super_admin', 'settings.manage'),
  ('super_admin', 'users.manage'),
  ('super_admin', 'roles.manage'),
  ('super_admin', 'audit.read'),
  ('admin', 'profile.read_own'),
  ('admin', 'profile.write_own'),
  ('admin', 'candidate.read_all'),
  ('admin', 'candidate.write_all'),
  ('admin', 'candidate.documents_read'),
  ('admin', 'job.read_published'),
  ('admin', 'job.read_all'),
  ('admin', 'job.write'),
  ('admin', 'job.qc_review'),
  ('admin', 'job.publish'),
  ('admin', 'company.read_all'),
  ('admin', 'company.write'),
  ('admin', 'company.verify'),
  ('admin', 'employer.manage_own_company'),
  ('admin', 'employer.review_consented_candidates'),
  ('admin', 'matching.run'),
  ('admin', 'matching.review'),
  ('admin', 'application.read_own'),
  ('admin', 'application.write_own'),
  ('admin', 'recruitment.manage'),
  ('admin', 'learning.read'),
  ('admin', 'learning.manage'),
  ('admin', 'community.post'),
  ('admin', 'community.moderate'),
  ('admin', 'content.manage'),
  ('admin', 'support.manage'),
  ('admin', 'ai.view_runs'),
  ('admin', 'ai.manage_agents'),
  ('admin', 'reports.view'),
  ('admin', 'settings.manage'),
  ('admin', 'users.manage'),
  ('admin', 'audit.read'),
  ('recruitment_officer', 'profile.read_own'),
  ('recruitment_officer', 'profile.write_own'),
  ('recruitment_officer', 'candidate.read_all'),
  ('recruitment_officer', 'candidate.write_all'),
  ('recruitment_officer', 'candidate.documents_read'),
  ('recruitment_officer', 'job.read_all'),
  ('recruitment_officer', 'job.write'),
  ('recruitment_officer', 'job.qc_review'),
  ('recruitment_officer', 'company.read_all'),
  ('recruitment_officer', 'matching.run'),
  ('recruitment_officer', 'matching.review'),
  ('recruitment_officer', 'recruitment.manage'),
  ('recruitment_officer', 'reports.view'),
  ('education_admin', 'profile.read_own'),
  ('education_admin', 'profile.write_own'),
  ('education_admin', 'learning.read'),
  ('education_admin', 'learning.manage'),
  ('education_admin', 'reports.view'),
  ('content_manager', 'profile.read_own'),
  ('content_manager', 'profile.write_own'),
  ('content_manager', 'content.manage'),
  ('content_manager', 'community.post'),
  ('content_manager', 'community.moderate'),
  ('content_manager', 'learning.read'),
  ('customer_support', 'profile.read_own'),
  ('customer_support', 'profile.write_own'),
  ('customer_support', 'candidate.read_all'),
  ('customer_support', 'support.manage'),
  ('customer_support', 'community.moderate'),
  ('ai_ops_manager', 'profile.read_own'),
  ('ai_ops_manager', 'profile.write_own'),
  ('ai_ops_manager', 'ai.view_runs'),
  ('ai_ops_manager', 'ai.manage_agents'),
  ('ai_ops_manager', 'reports.view')
) as v(role_key, perm_key)
join public.roles r on r.key = v.role_key
join public.permissions p on p.key = v.perm_key
on conflict do nothing;
-- END GENERATED SEED



-- Permission helper. SECURITY DEFINER so RLS policies can call it without recursion.
create or replace function public.has_permission(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.users u
    join public.user_roles ur on ur.user_id = u.id
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where u.id = auth.uid() and u.account_status = 'active' and u.deleted_at is null and p.key = perm
  );
$$;
revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated;

-- New auth user -> profile row + public role (only public roles may be self-selected; default job_seeker).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare requested text := coalesce(new.raw_user_meta_data->>'role', 'job_seeker'); role_key text;
begin
  role_key := case when requested in ('job_seeker','student','employer') then requested else 'job_seeker' end;
  insert into public.users (id, email, full_name, locale, account_status)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name',
          case when new.raw_user_meta_data->>'locale' = 'ja' then 'ja' else 'id' end,
          case when new.email_confirmed_at is not null then 'active' else 'pending' end);
  insert into public.user_roles (user_id, role_id) select new.id, id from public.roles where key = role_key;
  insert into public.audit_logs (actor_id, event_type, entity_type, entity_id, metadata)
  values (new.id, 'user.registered', 'user', new.id::text, jsonb_build_object('role', role_key));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Activate profile when email gets confirmed.
create or replace function public.handle_user_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.users set account_status = 'active' where id = new.id and account_status = 'pending';
  end if;
  return new;
end $$;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users for each row execute function public.handle_user_confirmed();

-- RLS
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

create policy roles_read on public.roles for select to authenticated using (true);
create policy permissions_read on public.permissions for select to authenticated using (true);
create policy role_permissions_read on public.role_permissions for select to authenticated using (true);

create policy users_select_own on public.users for select to authenticated using (id = auth.uid());
create policy users_select_admin on public.users for select to authenticated using (public.has_permission('users.manage'));
-- Users may edit their own profile but cannot change account_status (enforced by trigger below).
create policy users_update_own on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy users_update_admin on public.users for update to authenticated using (public.has_permission('users.manage')) with check (public.has_permission('users.manage'));

create or replace function public.guard_user_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Guard applies to end-user requests only (auth.uid() set); trusted triggers/service role pass.
  if auth.uid() is not null and not public.has_permission('users.manage') then
    if new.account_status is distinct from old.account_status or new.email is distinct from old.email or new.id is distinct from old.id then
      raise exception 'not allowed to change account_status/email';
    end if;
  end if;
  return new;
end $$;
create trigger users_guard before update on public.users for each row execute function public.guard_user_update();

create policy user_roles_select_own on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy user_roles_select_admin on public.user_roles for select to authenticated using (public.has_permission('users.manage'));
create policy user_roles_write on public.user_roles for all to authenticated using (public.has_permission('roles.manage')) with check (public.has_permission('roles.manage'));

-- audit_logs: readable by auditors; no insert/update/delete policy for clients (inserts via security-definer functions / service role only).
create policy audit_read on public.audit_logs for select to authenticated using (public.has_permission('audit.read'));

create policy settings_read on public.system_settings for select to authenticated using (public.has_permission('settings.manage'));
create policy settings_write on public.system_settings for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
