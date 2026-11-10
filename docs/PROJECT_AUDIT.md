# MTG Super App — Project Audit (Phase 0)

Audit date: 2026-11-10. Method: read-only inspection. No external data was modified.

## 1. Repository

| Item              | Finding                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Repo              | `mandiritokuteiginou-hash/mandiri-tokutei-ginou`, branch `ccr-96d71c2b-af4ubz`                   |
| Contents at start | `README.md` (2 lines), `LICENSE`, `.gitignore`. **No application code.**                         |
| Toolchain         | Node v22, npm 10                                                                                 |
| Conclusion        | Greenfield. Nothing to preserve in code; the existing assets are the _data and workflows_ below. |

## 2. Existing MTG assets (inspected via Notion connector, read-only)

| Asset                                                        | Status                               | Notes                                                                                                                                                                                          |
| ------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🇯🇵 MTG — Master Job Database (`a454e35c…`)                   | **Found, schema read**               | 100+ properties. Operational source of truth today. Details in §3.                                                                                                                             |
| 🇯🇵 MTG — Master Job Database v2 (Muse) (`fcb2f041…`)         | **Found, not inspected**             | A second database with a near-identical title. Risk of two "masters" (see R1).                                                                                                                 |
| 🔒 MTG — Candidate Pool (`a27e744e…`)                        | **Found, schema read**               | Privacy-first: anonymised `CND-xxxx` IDs only, consent flag, no PII. Details in §4.                                                                                                            |
| 🔒 MTG — Private Company Database (`c2b791bf…`)              | **Found, schema read**               | ~20 properties; company intelligence, contact status, partnership status.                                                                                                                      |
| 🇯🇵 MTG — Job Audit Log (`29064a65…`)                         | **Found, schema read**               | Event-type based audit trail (Ingested, Source Verified, Status Changed …).                                                                                                                    |
| MTG — Database RSO Terdaftar (`c59564c8…`)                   | Found, not inspected                 | Registered support organisations (RSO); referenced by the QC process.                                                                                                                          |
| 🧠 MTG — Kaizen Backlog & Change Log (`dc7593ee…`)           | Found, not inspected                 | Contains a record on Master Job DB count drift (see R2).                                                                                                                                       |
| MTG Job Scout — Self-Iteration Log, Job Scout Findings (Web) | Found, not inspected                 | Job discovery outputs.                                                                                                                                                                         |
| Google Sheets candidate/job data                             | **Not inspected**                    | No sheet IDs provided. Write access unverified.                                                                                                                                                |
| n8n workflows WF01–WF07                                      | **Not found**                        | `search_workflows("WF")` returned 0 workflows on the connected n8n instance. They may be local-only, on another instance, or named differently. **Status unverified; nothing assumed active.** |
| Supabase `mtg-production` (ap-northeast-1)                   | **Exists, status INACTIVE (paused)** | Contents unknown. Not restored. Also present: `wa-tg-jualan`, `resume-ai-app` (unrelated — untouched).                                                                                         |
| WAHA / WhatsApp, AI provider keys, Vercel project            | Not verified                         | No credentials were requested or exposed.                                                                                                                                                      |

## 3. Master Job Database — observed schema (summary)

Identifiers: `Job ID` (Notion auto-increment), `Job Number` (text, e.g. `13010-14891262`, `MTG--319`).
Key enums observed:

- `Status`: NEW, EXTRACTED, VERIFICATION_REQUIRED, VERIFIED, CONTENT_READY, IMAGE_READY, APPROVED, PUBLISHED, UPDATED, CLOSED
- `MTG QC Status`: QC Approved, QC Review, QC Rejected (MTG internal)
- `Audit Status`: Audited, Needs Review, Unverified, Conflict
- `Claude Gate`: Lolos, Perlu Cek, Tidak Lolos, Lead Mitra RSO
- `Visa Track`: TG, Gijinkoku · `Pool Type`: Indonesia, Jepang, Jepang+Indonesia, 不明
- `Source Type`, `Source Confidence`, `Application Route`, `CoE Support`, `Role Type`, `JLPT Required`, `Experience Required`, `License Required`
- Salary: `Monthly Salary Min/Max`, `Effective Hourly Wage`, `Salary Basis`, `Take Home Pay`, `Bonus`, `Overtime Hours Avg`
- Verification: `Job Verified`, `Source Verified`, `Employer Verified`, `Company Verification Method/Date`, `Corporate Number`
- Public-facing derived fields (`📢 …`), poster/publishing pipeline fields, `Data Completeness/Confidence/Conflicts`.

**Gap vs. PRD:** the PRD job lifecycle (Draft → QC Review → Approved → Published → Expired → Archived) does **not** map 1:1 to the existing `Status` + `MTG QC Status` pair. A mapping table is defined in `DATABASE_DESIGN.md` §4 and must be confirmed by the owner (Decision D-004).

## 4. Candidate Pool — observed schema

`Candidate ID` (anonymised), `Pool Type` (KOKUGAI/KOKUNAI), `Status` (Intake → Consented → Match-ready → Proposed → Interview → Placed / Withdrawn), `Consent Recorded/Date/Evidence Ref`, `JLPT Level`, `SSW Skill Test`, `Field` (multi), `Visa Status (KOKUNAI)`, `Preferred Region`, `Availability Date`, `Ginou Jisshu 2 Completed`.

**Gap vs. PRD:** PRD Module 02 wants full PII (name, address, DOB, documents). The existing pool deliberately holds **no** PII (UU PDP posture). The new PostgreSQL DB becomes the _only_ place identity data lives, under RLS + consent. Existing `CND-xxxx` IDs are preserved as `candidates.legacy_candidate_code`.
Pipeline gap: PRD CRM statuses (12) vs. pool statuses (7) — mapping in `DATABASE_DESIGN.md` §4.

## 5. Reusable assets

1. Job schema + enums → seed for `jobs`, `job_requirements`, `job_salary`, and lookup tables.
2. Audit Log event taxonomy → `audit_logs.event_type` + `job_audit_events`.
3. Consent-first candidate model → `consents` table; matching/outreach gated on it.
4. Company intelligence fields → `companies`, `company_verifications`.
5. QC gate vocabulary (Lolos/Perlu Cek/Tidak Lolos/Lead Mitra RSO) → `job_qc_reviews`.

## 6. Missing components

Everything in application code: web app, auth, RBAC, DB migrations, matching engine, CRM, employer portal, learning, community, notifications, admin, AI layer, CI, tests, i18n.

## 7. Risks

| ID  | Risk                                                                                       | Severity | Mitigation                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Two Master Job DBs** (v1 and "v2 (Muse)") — risk of divergent masters and double import. | High     | Owner must declare the canonical one before any import (Blocker B-1). Importer is keyed on Notion page ID + Job Number and is idempotent. |
| R2  | Kaizen log records unexplained row-count drift (217→127→237→253) in the Master Job DB.     | High     | Import runs in **read-only snapshot** mode with reconciliation report; never deletes.                                                     |
| R3  | Supabase `mtg-production` is paused with unknown contents.                                 | Medium   | Do not restore or write. Develop on local/dev project; production adoption requires approval (B-2).                                       |
| R4  | n8n WF01–WF07 unverifiable.                                                                | Medium   | Treat as not production-active. Integration is via a documented webhook contract, not by modifying workflows.                             |
| R5  | Candidate PII is new to MTG's stack (current pool is anonymised).                          | High     | RLS, private storage bucket, signed URLs, consent table, audit on reads, retention policy.                                                |
| R6  | Legal posture (information-only vs. licensed placement) unverified.                        | High     | `system_settings.legal_operating_mode` defaults to `information_only`; regulated features feature-flagged off.                            |
| R7  | Notion/Sheets sync can create conflicting masters.                                         | Medium   | Provenance columns, `sync_runs` log, conflict states; Notion stays source for jobs until cut-over is approved.                            |
| R8  | No Supabase/Docker runtime in this sandbox may limit DB integration tests.                 | Medium   | See KNOWN_ISSUES; migrations are tested against a local Postgres where available, and RLS tests documented.                               |

## 8. Blockers requiring owner input (none block Phase 1 scaffolding)

- **B-1** Which Master Job DB is canonical (v1 vs v2)?
- **B-2** Approval to use/restore `mtg-production`, or create a fresh dev project?
- **B-3** n8n instance location and WF01–WF07 export/status.
- **B-4** Supabase/Vercel/AI/WAHA credentials via env vars (never in chat or repo).
- **B-5** Legal operating mode and any licence/registration to be displayed.
