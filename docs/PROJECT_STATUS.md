# Project Status

PROJECT: MTG Super App · PHASE: 1 (Foundation, continuing) + early Phase 2/3 libraries · STATUS: **IN PROGRESS / NEEDS REVIEW** (as of 2026-11-10)

## Done and verified

- Phase 0 audit/architecture/DB/security/plan docs (inspection was read-only).
- Monorepo, TS strict, ESLint (next lint), Prettier config, CI workflow (not yet run on GitHub).
- RBAC matrix (10 roles / 33 permissions) with unit tests; TS matrix ⇄ SQL seed sync test.
- Validation schemas (register blocks self-assigned internal roles) with unit tests.
- Migration `20261110000001_foundation.sql`: applied to a scratch Postgres 16; `tests/integration/foundation_rls.sql` PASSED (role downgrade at signup, RLS isolation, no self-escalation, no audit forgery). One real bug was found and fixed by this test.
- Web app: Next.js build passes; id/ja i18n; public + admin layout; login/register/logout server actions (validation, rate limit, no account enumeration, open-redirect guard); security headers verified on a running server; per-page `requirePermission` guard pattern.
- Tests: 15 unit tests pass; typecheck, lint, build pass.

## NOT verified / not done

- **Live auth against a real Supabase project** (registration email, login, session, RLS via PostgREST) — no credentials/project yet (B-2, B-4).
- Password recovery page, email-verification landing, Google auth, profile page, role-management UI: not built.
- Nav links `/jobs`, `/matching`, `/learning`, `/profile` currently 404 (modules arrive in later phases).
- E2E tests, PWA icons/service worker, shared rate-limit store: not done.
- CI workflow untested on GitHub.

## Next milestone

Phase 1 completion once a dev Supabase project is available: password reset, profile, live auth E2E. In parallel (no external deps): Phase 3 pure eligibility/matching engine with unit tests.

## Update — continuation milestone (verified facts)

- Matching engine + 55 tests (+ mutation checks: breaking 'UNKNOWN≠PASS', 'ineligible excluded from ranking', 'gross satisfies baseline' each fail the tests).
- Migrations 0002–0005 applied to scratch Postgres 16; `foundation_rls.sql` and `data_model_rls.sql` pass locally (CI runs both).
- Notion read-only client + mapper: 16 tests with fictional fixtures; never run against live Notion.
- Auth service/password reset: 11 unit tests with a fake client. **Real Supabase auth: NOT tested.**
- Total unit tests: 98 passing; typecheck, lint, build pass locally.
- Notion schema comparison complete; row-level comparison blocked by Notion query allowance (see report).

## Awaiting owner

Canonical Master Job DB (v1 vs v2); approve mappings (D-009); legal confirmation of SSW defaults (D-011); minimum-wage source; create dev Supabase project; read-only Notion token; add base-pay / hours / JLPT-mandatory fields to QC.
