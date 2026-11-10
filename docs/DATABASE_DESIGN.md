# MTG Super App — Database Design

PostgreSQL (Supabase). UUID PKs, `created_at/updated_at`, soft delete (`deleted_at`) on business entities, RLS on every table, forward-only versioned migrations in `supabase/migrations/`.

## 1. Migration plan

| Migration             | Scope                                                                                                                                                                                                       | Status                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `0001_foundation`     | extensions, `roles`, `permissions`, `role_permissions`, `users` (profile mirror of `auth.users`), `user_roles`, `audit_logs`, `system_settings`, helper functions (`has_permission`, `set_updated_at`), RLS | **Written (Phase 1)** |
| `0002_candidates`     | candidates, documents, skills, languages, preferences, consents                                                                                                                                             | Phase 2               |
| `0003_jobs_companies` | companies, verifications, jobs, requirements, salary, qc reviews, sync provenance                                                                                                                           | Phase 2               |
| `0004_matching`       | matching_results, rule_versions                                                                                                                                                                             | Phase 3               |
| `0005_crm`            | applications, interviews, job_offers, status history                                                                                                                                                        | Phase 4               |
| later                 | learning, community, notifications, conversations, ai_runs, integrations                                                                                                                                    | Phases 5–7            |

## 2. Foundation tables (0001)

- `roles(id, key, kind: public|internal)`; `permissions(id, key)`; `role_permissions`.
- `users(id = auth.users.id, email, full_name, locale, account_status: active|suspended|pending, ...)`.
- `user_roles(user_id, role_id)` — a user may hold several roles.
- `audit_logs(id, actor_id, event_type, entity_type, entity_id, metadata jsonb, ip, created_at)` — insert-only (no update/delete policy).
- `system_settings(key, value jsonb, updated_by)` — includes `legal_operating_mode` (default `information_only`), `salary_baseline_jpy` (200000).

## 3. Privacy-critical design (from the audit)

- `candidates.legacy_candidate_code` preserves Notion `CND-xxxx`.
- `consents(candidate_id, purpose, granted_at, revoked_at, evidence_ref)`; employer visibility requires an active consent **and** an application/interest link.
- Documents in a **private** Storage bucket; access by short-lived signed URL; every read logged.

## 4. Status mappings (to be confirmed by owner — D-004)

**Job lifecycle** (PRD → existing Notion):

| PRD                                                                                                                       | Notion `Status` / `MTG QC Status`                                  |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Draft                                                                                                                     | NEW, EXTRACTED                                                     |
| QC Review                                                                                                                 | VERIFICATION_REQUIRED, or `MTG QC Status = QC Review`              |
| Approved                                                                                                                  | VERIFIED/CONTENT_READY/IMAGE_READY with `QC Approved`, or APPROVED |
| Published                                                                                                                 | PUBLISHED, UPDATED                                                 |
| Expired                                                                                                                   | `Expiry Date` passed                                               |
| Archived                                                                                                                  | CLOSED                                                             |

Publication rule: only `QC Approved` + `Job Verified` + `Source Verified` may become Published (human approval recorded).

**Candidate/CRM**: Intake→Registered/Profile Incomplete; Consented→Eligibility Review; Match-ready→Ready for Matching; Proposed→Matched/Applied; Interview→Interview; Placed→Hired; Withdrawn→Withdrawn.

## 5. Master Job import (Phase 2)

`jobs.legacy_job_id` (Notion Job ID), `jobs.job_number`, `jobs.source_system='notion'`, `jobs.source_ref` (page id), `source_hash`; `sync_runs`/`sync_conflicts` tables. Import never deletes; conflicting values are recorded, not overwritten.

## 6. Matching storage

`matching_results(id, candidate_id, job_id, rule_version, eligibility jsonb, gate_results jsonb, score numeric, score_breakdown jsonb, explanation, missing_requirements, risks, next_action, input_snapshot jsonb, reviewed_by, reviewed_at, created_at)` — append-only.
