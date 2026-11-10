-- Integration test for migrations 0002-0005 (sync, candidates, jobs/companies, matching). Scratch DB only.
\set ON_ERROR_STOP on
begin;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant select on public.public_jobs to anon;

-- users: seeker (a1), other seeker (a2), recruitment officer (c1), admin (b1) ; roles granted out-of-band
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000a1','s1@example.com', now(), '{}'),
 ('00000000-0000-0000-0000-0000000000a2','s2@example.com', now(), '{}'),
 ('00000000-0000-0000-0000-0000000000c1','ro@example.com', now(), '{}'),
 ('00000000-0000-0000-0000-0000000000b1','admin@example.com', now(), '{}');
insert into user_roles(user_id, role_id) select '00000000-0000-0000-0000-0000000000c1', id from roles where key='recruitment_officer';
insert into user_roles(user_id, role_id) select '00000000-0000-0000-0000-0000000000b1', id from roles where key='admin';

-- service-role seed: a pool candidate (anonymised code), a job, a company
insert into candidates (id, user_id, candidate_code, pool_type, source_system, source_ref, source_payload)
 values ('11111111-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','CND-0001','KOKUNAI','notion','page-cnd-1','{"k":"v"}'),
        ('11111111-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000a2','CND-0002','KOKUGAI',null,null,null);
insert into candidate_pii (candidate_id, full_name, phone) values ('11111111-0000-0000-0000-000000000001','Budi Test','+620000'),('11111111-0000-0000-0000-000000000002','Siti Test','+620001');
insert into companies (id, name, source_system, source_ref) values ('22222222-0000-0000-0000-000000000001','Acme KK','notion','page-co-1');
insert into jobs (id, legacy_job_id, job_number, title, company_id, sector, visa_track, source_system, source_ref, source_hash, source_payload, original_status)
 values ('33333333-0000-0000-0000-000000000001', 282, 'MTG--1', 'Care worker', '22222222-0000-0000-0000-000000000001','kaigo','TG','notion','page-job-1','h1','{"Status":"VERIFIED"}','VERIFIED');
insert into job_audit_events (job_id, event_type, ingestion_source, source_system, source_ref) values ('33333333-0000-0000-0000-000000000001','Ingested','N8N','notion','audit-1');
insert into job_salary (job_id, base_monthly, scheduled_monthly_hours) values ('33333333-0000-0000-0000-000000000001', 220000, 160);

do $$ declare ok boolean; begin
  -- provenance uniqueness: the same external record cannot be imported twice
  begin insert into jobs (title, source_system, source_ref) values ('dup','notion','page-job-1'); ok:=false; exception when unique_violation then ok:=true; end;
  assert ok, 'duplicate source_ref must be rejected';
  begin insert into jobs (title, source_system) values ('half',null); insert into jobs (title, source_system) values ('x','notion'); ok:=false; exception when check_violation then ok:=true; end;
  assert ok, 'source_system without source_ref must be rejected';
  -- sync state
  insert into sync_runs (id, source_system, source_container, mode) values ('44444444-0000-0000-0000-000000000001','notion','db-1','dry_run');
  insert into sync_records (source_system, source_container, source_ref, entity_type, last_run_id) values ('notion','db-1','page-job-1','job','44444444-0000-0000-0000-000000000001');
  begin insert into sync_records (source_system, source_container, source_ref, entity_type) values ('notion','db-1','page-job-1','job'); ok:=false; exception when unique_violation then ok:=true; end;
  assert ok, 'sync_records unique per external record';
  -- unverified job can NOT be published (service-role context, auth.uid() null)
  begin update jobs set lifecycle_status='published' where id='33333333-0000-0000-0000-000000000001'; ok:=false; exception when others then ok:=true; end;
  assert ok, 'unverified job must not publish';
end $$;

-- ===== seeker a1 =====
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',true);
do $$ declare ok boolean; begin
  assert (select count(*) from candidates)=1, 'seeker sees only own candidate';
  assert (select count(*) from candidate_pii)=1, 'seeker sees only own pii';
  assert (select count(*) from jobs)=0 and (select count(*) from companies)=0, 'seeker cannot read internal jobs/companies';
  begin update candidates set lifecycle_status='hired' where id='11111111-0000-0000-0000-000000000001'; ok:=false; exception when others then ok:=true; end;
  assert ok, 'seeker cannot change own lifecycle';
  begin update candidates set consent_status='granted' where id='11111111-0000-0000-0000-000000000001'; ok:=false; exception when others then ok:=true; end;
  assert ok, 'seeker cannot forge consent_status directly';
  begin update candidates set candidate_code='CND-9999' where id='11111111-0000-0000-0000-000000000001'; ok:=false; exception when others then ok:=true; end;
  assert ok, 'seeker cannot change legacy id';
  update candidates set jlpt='N3', preferred_prefectures=array['Tokyo'] where id='11111111-0000-0000-0000-000000000001';
  assert (select jlpt from candidates)='N3', 'seeker can edit own profile';
  begin insert into consents (candidate_id, purpose, status, recorded_by) values ('11111111-0000-0000-0000-000000000002','profile_processing','granted', auth.uid()); ok:=false; exception when others then ok:=true; end;
  assert ok, 'seeker cannot grant consent for someone else';
  insert into consents (candidate_id, purpose, status, recorded_by) values ('11111111-0000-0000-0000-000000000001','profile_processing','granted', auth.uid());
  assert (select consent_status from candidates)='granted', 'consent ledger drives consent_status';
  update consents set status='revoked';
  assert (select count(*) from consents where status='revoked')=0, 'consent ledger is not updatable (RLS: no update policy)';
  delete from consents;
  assert (select count(*) from consents)=1, 'consent ledger rows cannot be deleted';
  assert (select count(*) from public_jobs)=0, 'no published jobs yet';
end $$;

-- ===== recruitment officer c1 (candidate.read_all, job.read_all, matching.run; no publish) =====
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000c1',true);
do $$ declare ok boolean; begin
  assert (select count(*) from candidates)=2, 'officer reads candidate rows';
  assert (select count(*) from candidate_pii)=1, 'officer sees PII only for the consented candidate';
  assert (select full_name from candidate_pii)='Budi Test', 'consented candidate pii visible';
  assert (select count(*) from jobs)=1 and (select count(*) from companies)=1, 'officer reads jobs/companies';
  -- matching: refused for non-consented candidate, allowed for consented
  begin insert into matching_results (candidate_id, job_id, rule_version, input_fingerprint, eligibility_overall, eligibility_class, gates, score_breakdown, salary_evaluation, recommended_next_action, input_snapshot, generated_by)
        values ('11111111-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001','v1','f','PASS','ELIGIBLE','[]','{}','{}','HUMAN_REVIEW_THEN_PROPOSE','{}', auth.uid()); ok:=false; exception when others then ok:=true; end;
  assert ok, 'matching not allowed without consent';
  insert into matching_results (id, candidate_id, job_id, rule_version, input_fingerprint, eligibility_overall, eligibility_class, gates, score, score_breakdown, salary_evaluation, recommended_next_action, input_snapshot, generated_by)
        values ('55555555-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','v1','f','PASS','ELIGIBLE','[]',77,'{}','{}','HUMAN_REVIEW_THEN_PROPOSE','{}', auth.uid());
  begin insert into matching_results (candidate_id, job_id, rule_version, input_fingerprint, eligibility_overall, eligibility_class, gates, score_breakdown, salary_evaluation, recommended_next_action, input_snapshot, generated_by)
        values ('11111111-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','v1','f','PASS','ELIGIBLE','[]','{}','{}','X','{}', auth.uid()); ok:=false; exception when unique_violation then ok:=true; end;
  assert ok, 'same rule version + inputs is idempotent (unique)';
  update matching_results set score=99;
  delete from matching_results;
  assert (select score from matching_results where id='55555555-0000-0000-0000-000000000001')=77, 'matching_results cannot be altered or deleted via RLS';
  begin insert into matching_results (candidate_id, job_id, rule_version, input_fingerprint, eligibility_overall, eligibility_class, gates, score, score_breakdown, salary_evaluation, recommended_next_action, input_snapshot, generated_by)
        values ('11111111-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','v2','g','FAIL','INELIGIBLE','[]',50,'{}','{}','DO_NOT_PROPOSE','{}', auth.uid()); ok:=false; exception when check_violation then ok:=true; end;
  assert ok, 'ineligible results cannot carry a score';
  -- QC approve + verify, but cannot publish (no job.publish)
  update jobs set qc_status='qc_approved', job_verified=true, source_verified=true, lifecycle_status='approved' where id='33333333-0000-0000-0000-000000000001';
  begin update jobs set lifecycle_status='published' where id='33333333-0000-0000-0000-000000000001'; ok:=false; exception when others then ok:=true; end;
  assert ok, 'officer lacks job.publish';
  insert into job_qc_reviews (job_id, decision, reviewer_id) values ('33333333-0000-0000-0000-000000000001','lolos', auth.uid());
  update job_qc_reviews set decision='tidak_lolos';
  assert (select decision from job_qc_reviews)='lolos', 'qc reviews cannot be altered via RLS';
  begin insert into sync_runs (source_system, source_container, mode) values ('notion','x','import'); ok:=false; exception when others then ok:=true; end;
  assert ok, 'officer cannot touch sync tables';
end $$;

-- ===== admin b1: can publish; job must stay verified =====
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1',true);
do $$ declare ok boolean; begin
  update jobs set lifecycle_status='published' where id='33333333-0000-0000-0000-000000000001';
  assert (select published_by from jobs)='00000000-0000-0000-0000-0000000000b1', 'publisher recorded';
  begin update jobs set job_verified=false where id='33333333-0000-0000-0000-000000000001'; ok:=false; exception when others then ok:=true; end;
  assert ok, 'published job cannot silently lose verification';
  assert (select count(*) from audit_logs where event_type='job.status_changed')>=2, 'job status changes audited';
  assert (select count(*) from audit_logs where event_type='consent.granted')=1, 'consent audited';
end $$;

-- ===== privileged context: triggers still make the ledgers append-only =====
reset role;
do $$ declare ok boolean; begin
  begin update matching_results set score=1; ok:=false; exception when others then ok:=true; end;
  assert ok, 'trigger blocks UPDATE of matching_results even for privileged roles';
  begin delete from job_qc_reviews; ok:=false; exception when others then ok:=true; end;
  assert ok, 'trigger blocks DELETE of job_qc_reviews even for privileged roles';
  begin update job_audit_events set notes='x'; ok:=false; exception when others then ok:=true; end;
  assert ok, 'job_audit_events immutable';
end $$;

-- ===== anonymous visitor =====
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ declare ok boolean; begin
  assert (select count(*) from public_jobs)=1, 'public portal sees the published job';
  assert (select count(*) from pg_attribute where attrelid='public.public_jobs'::regclass and attname in ('source_payload','company_id','published_by'))=0, 'public view exposes no internal columns';
  begin perform 1 from jobs; ok:=false; exception when insufficient_privilege then ok:=true; end;
  assert ok, 'anon cannot read base jobs table';
end $$;
rollback;
\echo DATA_MODEL_RLS_TESTS_PASSED
