-- Integration test for 20261110000001_foundation.sql. Run against a scratch Postgres that has a
-- Supabase-like `auth` schema (see tests/integration/README.md). Any failed assertion aborts with an error.
\set ON_ERROR_STOP on
begin;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000a1','seeker@example.com', now(), '{"role":"super_admin","full_name":"Evil"}'),
 ('00000000-0000-0000-0000-0000000000a2','emp@example.com', null, '{"role":"employer"}'),
 ('00000000-0000-0000-0000-0000000000b1','admin@example.com', now(), '{}');
-- promote b1 to admin out-of-band (service role)
insert into user_roles(user_id, role_id) select '00000000-0000-0000-0000-0000000000b1', id from roles where key='super_admin';

do $$ begin
  assert (select count(*) from user_roles ur join roles r on r.id=ur.role_id where ur.user_id='00000000-0000-0000-0000-0000000000a1' and r.key='job_seeker')=1, 'signup metadata role=super_admin must downgrade to job_seeker';
  assert (select count(*) from user_roles where user_id='00000000-0000-0000-0000-0000000000a1')=1, 'exactly one role';
  assert (select account_status from users where id='00000000-0000-0000-0000-0000000000a2')='pending', 'unconfirmed -> pending';
  assert (select account_status from users where id='00000000-0000-0000-0000-0000000000a1')='active', 'confirmed -> active';
end $$;
update auth.users set email_confirmed_at = now() where id='00000000-0000-0000-0000-0000000000a2';
do $$ begin assert (select account_status from users where id='00000000-0000-0000-0000-0000000000a2')='active','confirmation activates'; end $$;

-- act as a normal job seeker
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',true);
do $$
declare ok boolean;
begin
  assert (select count(*) from users)=1, 'user sees only own profile';
  assert (select count(*) from audit_logs)=0, 'no audit access';
  assert not public.has_permission('job.publish'), 'seeker cannot publish';
  assert public.has_permission('profile.write_own'), 'seeker can edit profile';
  update users set full_name='Budi' where id=auth.uid();
  assert (select full_name from users where id=auth.uid())='Budi','own profile editable';
  begin update users set account_status='suspended' where id=auth.uid(); ok:=false; exception when others then ok:=true; end;
  assert ok, 'cannot change own account_status';
  begin insert into user_roles(user_id, role_id) select auth.uid(), id from roles where key='super_admin'; ok:=false; exception when others then ok:=true; end;
  assert ok, 'cannot self-grant roles';
  begin insert into audit_logs(event_type) values ('forged'); ok:=false; exception when others then ok:=true; end;
  assert ok, 'cannot forge audit logs';
  assert (select count(*) from system_settings)=0, 'settings hidden';
end $$;

-- act as super admin
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1',true);
do $$ begin
  assert (select count(*) from users)=3, 'admin sees all users';
  assert public.has_permission('job.publish'), 'super admin can publish';
  assert (select count(*) from audit_logs)>=3, 'admin reads audit log';
end $$;
rollback;
\echo FOUNDATION_RLS_TESTS_PASSED
