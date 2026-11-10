-- 0002 integration / sync: provenance + synchronization state for external sources (Notion, Sheets, n8n).
-- Nothing here reads or writes external systems; it only records what an importer observed.

create or replace function public.record_audit(p_event text, p_entity_type text, p_entity_id text, p_meta jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, event_type, entity_type, entity_id, metadata)
  values (auth.uid(), p_event, p_entity_type, p_entity_id, coalesce(p_meta, '{}'::jsonb));
$$;
revoke all on function public.record_audit(text, text, text, jsonb) from public;

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,                      -- e.g. 'notion'
  source_container text not null,                   -- external database/sheet id
  mode text not null check (mode in ('dry_run','read_only_snapshot','import')),
  status text not null default 'running' check (status in ('running','succeeded','failed','partial')),
  stats jsonb not null default '{}'::jsonb,         -- counts only: seen/created/updated/unchanged/conflicts/errors
  error text,
  started_by uuid references public.users(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- One row per external record we have seen. Tracks sync state without ever touching the source.
create table public.sync_records (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  source_container text not null,
  source_ref text not null,                         -- external record id (e.g. Notion page id)
  entity_type text not null check (entity_type in ('job','candidate','company','job_audit_event')),
  entity_id uuid,                                   -- local row, once imported
  sync_status text not null default 'pending' check (sync_status in ('pending','synced','conflict','error','skipped')),
  source_hash text,
  source_last_edited_at timestamptz,
  last_run_id uuid references public.sync_runs(id),
  last_synced_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_system, source_container, source_ref)
);
create index sync_records_status_idx on public.sync_records(sync_status);
create index sync_records_entity_idx on public.sync_records(entity_type, entity_id);
create trigger sync_records_updated_at before update on public.sync_records for each row execute function public.set_updated_at();

-- Field-level disagreements between source and local data. Recorded, never auto-resolved.
create table public.sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  sync_record_id uuid not null references public.sync_records(id) on delete cascade,
  field text not null,
  source_value jsonb,
  local_value jsonb,
  status text not null default 'open' check (status in ('open','resolved_keep_source','resolved_keep_local','ignored')),
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index sync_conflicts_open_idx on public.sync_conflicts(status) where status = 'open';

alter table public.sync_runs enable row level security;
alter table public.sync_records enable row level security;
alter table public.sync_conflicts enable row level security;
-- Admin-only (settings.manage). Importers run with the service role, which bypasses RLS by design.
create policy sync_runs_admin on public.sync_runs for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
create policy sync_records_admin on public.sync_records for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
create policy sync_conflicts_admin on public.sync_conflicts for all to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
