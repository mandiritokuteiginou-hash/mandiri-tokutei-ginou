-- 0005 matching storage. Results are stored SEPARATELY from candidate/job rows and are immutable;
-- human review is recorded in a second append-only table. Rule version + input snapshot make every result reproducible.

create table public.matching_results (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  job_id uuid not null references public.jobs(id) on delete restrict,
  rule_version text not null,
  input_fingerprint text not null,
  eligibility_overall text not null check (eligibility_overall in ('PASS','FAIL','UNKNOWN')),
  eligibility_class text not null check (eligibility_class in ('ELIGIBLE','NEEDS_REVIEW','INELIGIBLE')),
  gates jsonb not null, score numeric(5,2), score_completeness numeric(4,3),
  score_breakdown jsonb not null, salary_evaluation jsonb not null,
  missing_requirements jsonb not null default '[]'::jsonb, unknowns jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb, explanation jsonb not null default '[]'::jsonb,
  recommended_next_action text not null,
  input_snapshot jsonb not null,                       -- the exact candidate/job/context the engine saw
  ai_assist jsonb,                                     -- optional advisory AI note; never affects eligibility
  generated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  unique (candidate_id, job_id, rule_version, input_fingerprint),
  check (eligibility_class <> 'INELIGIBLE' or score is null)
);
create index matching_results_job_idx on public.matching_results(job_id, eligibility_class, score desc);
create index matching_results_candidate_idx on public.matching_results(candidate_id, created_at desc);
create trigger matching_results_immutable before update or delete on public.matching_results for each row execute function public.block_mutation();

create table public.matching_reviews (
  id uuid primary key default gen_random_uuid(),
  matching_result_id uuid not null references public.matching_results(id) on delete restrict,
  decision text not null check (decision in ('approved_for_proposal','rejected','needs_information')),
  notes text, reviewer_id uuid not null references public.users(id), created_at timestamptz not null default now()
);
create trigger matching_reviews_immutable before update or delete on public.matching_reviews for each row execute function public.block_mutation();

alter table public.matching_results enable row level security;
alter table public.matching_reviews enable row level security;
create policy mr_read on public.matching_results for select to authenticated using (public.has_permission('matching.review') or public.has_permission('matching.run'));
create policy mr_insert on public.matching_results for insert to authenticated with check (public.has_permission('matching.run') and generated_by = auth.uid() and public.consent_granted(candidate_id));
create policy mrev_read on public.matching_reviews for select to authenticated using (public.has_permission('matching.review'));
create policy mrev_insert on public.matching_reviews for insert to authenticated with check (public.has_permission('matching.review') and reviewer_id = auth.uid());
