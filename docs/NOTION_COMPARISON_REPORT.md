# Notion Read-Only Comparison Report

Date: 2026-11-10 · Method: Notion connector, **read-only** (fetch / search only). Nothing was written, renamed, moved, or archived.
Legend: **[VERIFIED]** observed directly · **[NOT VERIFIED]** could not be observed · **[ASSUMPTION]** inference · **[RECOMMENDATION]** proposal needing owner approval.

## 0. Limits of this report

- **[VERIFIED]** Schemas (property names, types, select options) of all five databases were read.
- **[NOT VERIFIED]** Row-level facts (row counts, ID ranges, duplicate IDs across v1/v2, overlap, last-edit distribution). The Notion "Query Data Source" allowance for this workspace was exhausted (allowance resets within ~60 min; the tool instructed not to retry automatically). I did not work around it. Everything in §2 "row-level" is therefore open.
- **[NOT VERIFIED]** The prototype client has never run with a real token against the live API (no token provided).

## 1. Database inventory

| Database                               | Data source ID                         | Props | Role                                                      |
| -------------------------------------- | -------------------------------------- | ----- | --------------------------------------------------------- |
| 🇯🇵 MTG — Master Job Database ("v1")    | `a5cfe2a2-de3f-426c-8449-77f0de1c24c9` | 117   | Original master. 14 views.                                |
| 🇯🇵 MTG — Master Job Database v2 (Muse) | `515ef192-609d-4b1a-8b0c-5f077797727e` | 111   | "Muse-only" master, 2 views.                              |
| 🔒 MTG — Candidate Pool                | `44645d3d-552f-4a1c-95b0-b9eba9c9dfda` | 14    | Anonymised pool, consent flag, no PII.                    |
| 🔒 MTG — Private Company Database      | `a72e12ca-f829-407f-945e-4b87e9195cd2` | 20    | Company intelligence; "not for automatic public posting". |
| 🇯🇵 MTG — Job Audit Log                 | `54a262e1-aece-4c09-ada0-6030228f7250` | 15    | Event log (Ingested, Source Verified, …).                 |

Also seen, not inspected: Database RSO Terdaftar, Kaizen Backlog & Change Log, Job Scout Findings (Web).

## 2. Master Job Database v1 vs v2

### 2.1 Stated relationship **[VERIFIED]**

v2's own description (Indonesian, translated): _"Master Job Database v2 — purely Muse (Muse Single-Source rule, 3 Nov 2026). Rows enter only if produced by the Muse pipeline, or legacy rows re-verified and rewritten by Muse; AI Source must be "Muse" from insert; entry gate: Muse Verification + Muse Verification Date; traceability: Source Database + Source Row ID. **The old master is frozen (read-only/archive).**"_

### 2.2 Conflicts with that statement

1. **[VERIFIED]** The description promises traceability fields ("Database Asal", "ID Baris Asal"). **No such properties exist in v2's schema.** Provenance back to v1 is therefore not machine-readable today.
2. **[VERIFIED, indicative]** Search results show v1 job pages with last-edit times of 2026-11-07 to 2026-11-09 (after the 3 Nov "freeze"), and a Kaizen record titled _"Reconcile Master Job DB snapshot and unexplained writes (217 → 127 → 237 → 253)"_ mentions new records added to v1. This suggests v1 is **still being written to**, contradicting "frozen". Exact counts: **[NOT VERIFIED]**.
3. **[VERIFIED]** `Job ID` is an auto-increment ID in v1 but a plain **number** in v2 → ID spaces can collide or diverge; `Job ID` alone cannot be the cross-database key.

### 2.3 Schema differences **[VERIFIED]**

- Only in v1 (18): AI Comparison Notes, AI Source, Claude Assessment, Claude Gate, Claude Gate Date, GPT Assessment, Image URL, Interview, **Job Verified**, Kyuujinhyou URL, **MTG QC Status**, Monthly Salary Max, **Monthly Salary Min**, Muse Assessment, **Pool Type**, Poster Template, Poster Versi, Published Platforms.
- Only in v2 (12): Bisa Dilamar Dari, Cara Melamar, **Kategori Visa**, Kontak Pengirim, No Registrasi RSO, **RSO**, Sumber Lowongan, Sumber Verifikasi RSO, **Tanggal Verifikasi Muse**, URL/Email Lamaran, **Verifikasi Muse**, Verifikasi RSO.
- Type changes: `Job ID` auto_increment→number; `Gaji Bulanan (Min–Max)` formula→text; `Gaji Per Jam (Konversi)` formula→number; `📢 Deadline Publik` date→formula.
- Vocabulary: `Field` in v2 holds **both** Japanese labels (介護…) **and** Indonesian labels (Kaigo, Restoran…) in one select. v1 has Japanese only. v2 adds sectors not in v1 (Transportasi Darat, Kereta Api, Kehutanan, Industri Kayu) plus non-SSW labels (Teknik & IT, Bahasa & Layanan Internasional).
- Same in both: Status (10 values), QC Decision, CoE Support, JLPT/Experience/License Required, Salary Basis, Visa Track, Source Type/Confidence.
- **v2 lost** `MTG QC Status`, `Job Verified`, `Monthly Salary Min/Max`, `Pool Type`; replaced by `Verifikasi Muse`/`Bisa Dilamar Dari`/`Kategori Visa`. Salary min/max are **gone** from v2.

### 2.4 Row-level checks still required **[NOT VERIFIED]**

Row counts; `Job Number` / `Source URL` overlap v1↔v2; rows in v2 lacking `Verifikasi Muse`; v1 rows edited after 3 Nov; duplicate `Job Number`s within each. Re-run when the allowance resets (the prototype client + `findDuplicateJobs` can compute these via the Notion REST API once a read-only token exists).

### 2.5 Canonical-source analysis **[RECOMMENDATION — owner decides]**

| Option                        | For                                                                                                 | Against                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **v2 canonical**              | States an explicit single-source rule; stricter entry gate; has RSO/visa-category fields            | Smaller, newer, lost QC/verification & salary fields, mixed sector vocabulary, no row-level provenance fields, v1 apparently still active |
| **v1 canonical**              | Larger/older; carries QC status, audit trail, salary min/max; matches the Candidate Pool vocabulary | Declared frozen by v2; contains pre-Muse unverified rows                                                                                  |
| **Neither yet** (recommended) | Avoids choosing on unverified data                                                                  | Delays import                                                                                                                             |

Recommended: **do not import either yet.** Owner confirms the canonical source after the §2.4 row checks. The importer is built to ingest from **both** as separate `source_container`s (provenance preserved), and `findDuplicateJobs` surfaces overlaps without merging.

## 3. Recommended field mappings (implemented in `packages/integrations/src/notion/map-job.ts`, tested with fictional fixtures) **[ASSUMPTION — D-009]**

| Notion                         | App                                            | Rule                                                                                          |
| ------------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| page id                        | `jobs.source_ref` (+ `source_system='notion'`) | immutable provenance                                                                          |
| Job ID                         | `jobs.legacy_job_id`                           | preserved, not a key across v1/v2                                                             |
| Job Number                     | `jobs.job_number`                              | preserved, not assumed unique                                                                 |
| Status + QC                    | `lifecycle_status`, `qc_status`                | Notion `PUBLISHED` is **not trusted** without QC approval → imported as `qc_review` + warning |
| Pool Type / Bisa Dilamar Dari  | `accepts_pool`                                 | Indonesia→KOKUGAI, Jepang→KOKUNAI, both→BOTH, else UNKNOWN                                    |
| CoE Support                    | `coe_support`                                  | Confirmed→CONFIRMED; Unverified/Not Provided→UNKNOWN (no DECLINED exists in source)           |
| JLPT Required                  | requirements                                   | N1–N5→mandatory required (field is named "Required"); None→none; Unknown→unknown              |
| Experience Required            | requirements                                   | Yes needs `Experience Years Min`, else UNKNOWN + warning                                      |
| License Required               | requirements                                   | Yes→mandatory, Preferred→not mandatory, needs `License Type`                                  |
| Skills                         | requirements                                   | **unknown** (only free text exists; not parsed)                                               |
| Monthly Salary Min             | `grossMonthlyStated`                           | composition unknown → never counted as base                                                   |
| Field                          | `sector`                                       | via `normalizeSector`; unmapped → null + warning                                              |
| Role Type ≠ "Pekerja langsung" | excluded from matching                         | support/union/HR/interpreter roles are not candidate jobs                                     |

### Findings that affect product behaviour **[VERIFIED from schema]**

1. **No base-pay field exists** in either master. Every imported job will evaluate salary as `REVIEW`, never `ACCEPTABLE`, until base pay (and scheduled monthly hours, for the minimum-wage check) is captured. _Recommendation:_ add `Base Monthly Salary` and `Scheduled Monthly Hours` to the QC checklist (owner decision — we do not modify Notion).
2. **Mandatory vs preferred is not distinguished** for JLPT (the field says "Required"). Mapped as mandatory; a wrong assumption would wrongly FAIL candidates, so **[RECOMMENDATION]** add `JLPT Mandatory?`.
3. **Sector vocabulary is inconsistent** (Japanese vs Indonesian, "製造" ambiguous). Handled by `normalizeSector`; unknown → UNKNOWN.
4. Source has no `DECLINED` COE value, so a refusing employer cannot be represented.

## 4. Candidate Pool → `candidates` **[ASSUMPTION]**

| Pool field                                                                      | App                                   | Note                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate ID (`CND-xxxx`)                                                       | `candidates.candidate_code`           | preserved, unique                                                                                                                                                                                                                                                                                   |
| Pool Type KOKUGAI/KOKUNAI                                                       | `pool_type`                           | direct                                                                                                                                                                                                                                                                                              |
| Status Intake…Withdrawn                                                         | `lifecycle_status`                    | Intake→registered; Consented→eligibility_review; Match-ready→ready_for_matching; Proposed→matched; Interview→interview; Placed→hired; Withdrawn→withdrawn                                                                                                                                           |
| Consent Recorded/Date/Evidence Ref                                              | `consents` ledger → `consent_status`  | **Matching is blocked without consent**                                                                                                                                                                                                                                                             |
| JLPT Level (incl. JFT-Basic A2)                                                 | `jlpt` / `jft_basic_a2`               | split: "JFT-Basic A2" is not a JLPT level                                                                                                                                                                                                                                                           |
| SSW Skill Test (single value) + Field (multi)                                   | `candidate_skills(kind='skill_test')` | **Lossy:** the pool cannot say which sector a test was passed in. The importer must emit a `skill_test` row only when exactly one Field is listed; otherwise it must leave the skill-test data unknown so the engine returns UNKNOWN, not PASS (rule to be implemented with the candidate importer) |
| Visa Status (KOKUNAI)                                                           | `residence_status`                    | direct                                                                                                                                                                                                                                                                                              |
| Ginou Jisshu 2 Completed                                                        | `ginou_jisshu2_completed`             | sector of the internship not recorded → exemption stays UNKNOWN                                                                                                                                                                                                                                     |
| Preferred Region                                                                | `preferred_prefectures`               | free text → needs normalisation                                                                                                                                                                                                                                                                     |
| Pool holds **no PII**; names/contacts go only to `candidate_pii` after consent. |

## 5. Private Company DB → `companies` **[ASSUMPTION]**

Company Name/JP → name/name_jp · Prefecture/City · Industry · Official Website/Recruitment Page · SSW & Foreigner Acceptance (free text, kept verbatim) · Partnership Status → enum · Email/Phone/Contact Person → `contact` jsonb (private) · Source/Source URL → provenance. **No corporate number field** in this DB (the Master Job DB has one) → company↔job linking must use the job's `Corporate Number`/`Company` text and will need review. **Not exposed publicly** (`public_jobs` omits companies).

## 6. Job Audit Log → `job_audit_events` **[ASSUMPTION]**

Event Type, Event Date, Run ID, Automation Workflow, Ingestion Source (GPT Schedule/Manual, Claude Schedule, **N8N**, Manual, …), Confidence, Result, Notes, Job ID/Job Number/Job Title (all **text**, not a relation) → append-only table. Join to jobs by `Job ID`+`Job Number` is **not guaranteed**, especially across v1/v2 (see §2.2-3). The `N8N` ingestion source implies workflows have run somewhere; their location remains unverified.

## 7. Decisions needed from the owner

1. Canonical Master Job DB (after row checks) and whether v1 is really frozen.
2. Approve/modify the mappings in §3–§6 (D-009).
3. Add base-pay, scheduled-hours and JLPT-mandatory fields to the QC checklist.
4. Provide a **read-only** Notion integration token (names only in `.env.example`) so the importer can run dry-run mode.
