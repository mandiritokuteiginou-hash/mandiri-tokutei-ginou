# Decisions

- D-001 Modular monolith in an npm-workspaces monorepo at the repo root (not a nested `mtg-super-app/`).
- D-002 RLS in Postgres is the enforcement layer; TS permission matrix mirrors the SQL seed and a test enforces sync.
- D-003 `legal_operating_mode` defaults to `information_only`; messaging dry-run defaults to true.
- D-004 _(proposed, needs owner confirmation)_ Job/candidate status mappings in DATABASE_DESIGN.md §4.
- D-005 Signup role comes from user metadata but the DB trigger downgrades anything other than job_seeker/student/employer.
- D-006 Locale via cookie (no URL prefix) with next-intl; `id` default.
- D-007 Every admin page/action must call `requirePermission` itself; layout checks are not trusted.
- D-008 Notion remains the job system of record until an approved cut-over; import is read-only/idempotent.
