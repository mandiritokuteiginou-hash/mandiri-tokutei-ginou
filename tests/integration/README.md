# Integration tests (database)

`foundation_rls.sql` asserts signup role downgrade, RLS isolation, and anti-escalation rules.
Run against a scratch Postgres 15+ with a minimal Supabase-like `auth` schema (`auth.users`, `auth.uid()`, roles `authenticated`/`anon`):
`psql -d scratch -f tests/integration/stub_supabase_auth.sql && psql -d scratch -f supabase/migrations/*.sql && psql -d scratch -f tests/integration/foundation_rls.sql`
Never run against a shared or production database. Last run: see docs/PROJECT_STATUS.md.
