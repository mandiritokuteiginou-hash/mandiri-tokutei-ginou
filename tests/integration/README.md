# Integration tests (database)

`foundation_rls.sql` asserts signup role downgrade, RLS isolation, and anti-escalation rules.
Run against a scratch Postgres 15+ with a minimal Supabase-like `auth` schema (`auth.users`, `auth.uid()`, roles `authenticated`/`anon`):
`psql -d scratch -f tests/integration/stub_supabase_auth.sql && for f in supabase/migrations/*.sql; do psql -d scratch -f $f; done && psql -d scratch -f tests/integration/foundation_rls.sql && psql -d scratch -f tests/integration/data_model_rls.sql`
Never run against a shared or production database. Last run: see docs/PROJECT_STATUS.md.
