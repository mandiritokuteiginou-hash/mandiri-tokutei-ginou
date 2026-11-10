# Authentication E2E Test Plan (against a Supabase DEVELOPMENT project)

**Status: PLAN ONLY — not executed.** Logic is covered by unit tests with a fake client (`tests/unit/auth-service.test.ts`) and DB rules by SQL tests (`tests/integration/*.sql`). Neither proves real Supabase Auth works. Run this plan (Playwright recommended, `tests/e2e/`) once a dev project or local stack exists. Test accounts use throwaway addresses on the dev project's mail catcher; never real people.

## Preconditions

Dev project with migrations 0001–0005 applied, email confirmation ON, min password 10, redirect URL `/auth/callback`, seed: one `super_admin`, one `recruitment_officer` created out-of-band (service role).

## Cases

| ID  | Scenario                                                               | Expected                                                                                                                                          |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Register as job_seeker with valid data                                 | "check your email"; `auth.users` row; `public.users.account_status='pending'`; `user_roles` = job_seeker only; `audit_logs` has `user.registered` |
| A2  | Register with tampered `role=super_admin` (edit form/POST)             | Rejected by validation; if forced via metadata directly to Supabase, DB trigger downgrades to job_seeker                                          |
| A3  | Register same email twice                                              | Identical response (no enumeration)                                                                                                               |
| A4  | Login before verifying email                                           | Generic "invalid credentials"                                                                                                                     |
| A5  | Click verification link                                                | Redirect via `/auth/callback`; status → `active`; login works                                                                                     |
| A6  | Wrong password ×9 for one email                                        | `tooMany` after 8; correct password also blocked until window ends                                                                                |
| A7  | Login with `?next=//evil.example`                                      | Lands on `/`, not the external site                                                                                                               |
| A8  | Logout                                                                 | Session cookie cleared; `/profile` and `/admin` redirect to `/login`                                                                              |
| A9  | Forgot password (existing and unknown email)                           | Same message both times; mail only for existing                                                                                                   |
| A10 | Open recovery link, set weak/mismatched/strong password                | Weak/mismatch rejected; strong succeeds; old password fails; new works                                                                            |
| A11 | Open `/reset-password` without recovery session                        | `sessionExpired`                                                                                                                                  |
| A12 | Reuse an already-used recovery link                                    | Rejected                                                                                                                                          |
| R1  | job_seeker opens `/admin`                                              | Forbidden message (server-side), no admin data in payload                                                                                         |
| R2  | recruitment_officer opens `/admin`                                     | Allowed; sees only permitted modules                                                                                                              |
| R3  | job_seeker calls PostgREST `GET /rest/v1/users`                        | Own row only                                                                                                                                      |
| R4  | job_seeker `PATCH /rest/v1/users?id=eq.self {account_status:'active'}` | Rejected (guard trigger)                                                                                                                          |
| R5  | job_seeker `POST /rest/v1/user_roles` for self as admin                | Rejected (RLS)                                                                                                                                    |
| R6  | job_seeker `POST /rest/v1/audit_logs`                                  | Rejected                                                                                                                                          |
| R7  | job_seeker reads another candidate's row / PII / documents             | Zero rows                                                                                                                                         |
| R8  | officer reads PII of a non-consented candidate                         | Zero rows; consented → visible; read logged (to implement)                                                                                        |
| R9  | officer sets job `published`                                           | Rejected (no `job.publish`); admin allowed only if QC-approved & verified                                                                         |
| R10 | anon `GET /rest/v1/jobs` and `public_jobs`                             | `jobs` denied; `public_jobs` shows only published, no internal columns                                                                            |
| S1  | Session fixation / cookie flags                                        | `HttpOnly`, `Secure`, `SameSite=Lax` on auth cookies in HTTPS                                                                                     |
| S2  | Security headers on `/`, `/login`                                      | CSP, HSTS, X-Frame-Options, nosniff present                                                                                                       |
| S3  | JWT expiry/refresh                                                     | Session refreshed by middleware; expired token → login                                                                                            |

## Exit criteria

All A/R/S cases pass on the dev project; results recorded in `docs/PROJECT_STATUS.md` with date and project ref (not keys). Only then may docs say "authentication verified against a real Supabase dev project".
