# MTG #04 — Job Enrichment V1.0 (24 nodes) + WF03 V1.2 patch

**Principle: WF04 enriches, it never guesses. Unknown is valid data.**

## Flow
Schedule 11:00/23:00 JST (OFF) → Config → Query Candidates → Flatten Candidates → Is Candidate? → Fetch Source → Extract → Needs AI? → (Prepare AI → AI Extract → Parse AI) → Enrich Inputs → Enrich Diff → Needs Write? → Notion PATCH → Read-back → Verify Write → All Outcomes → enrichment log / error log / run log.

## Candidates
`Ingestion Source = N8N`, `Lifecycle = ACTIVE`, `QC Decision = APPROVED` (re-checked in code), AND one of: JLPT / License / Experience Unknown-or-empty, or Salary Basis empty; AND `Enrichment Checked` empty or older than `recheck_days` (7). Priority: JLPT → salary basis → license → experience. Cap `max_per_run` (20). REVIEW / REJECT are never touched.

## Ownership (final)
| Domain | Owner |
|---|---|
| Discovery, extraction | WF01 |
| QC, company verification, Recruitability | WF02 |
| Canonical, dedup, lifecycle, tier, **Matching Ready + reason** | WF03 |
| JLPT, License (+type), Experience (+years min), Salary Basis, stated hourly / monthly when empty | **WF04** |
WF04 never writes QC fields, company fields, Recruitability, lifecycle, tier or Matching Ready. Its edit re-queues the job into WF03 automatically (WF03 picks up pages edited in the last `lookback_hours`), so tier and readiness are recomputed by their owner. WF04 does NOT set Recheck Required (that flag means "back to WF02").

## Rules
- Deterministic extraction first, from the live HelloWork page, each value with the verbatim source line as evidence. Not stated = Unknown (`日常会話が可能` is Unknown, not N-anything). Conflicting levels = Unknown.
- AI runs only for fields still Unknown after that, extract-only. A value is accepted only if its quote exists verbatim in the page AND the quote itself supports the value; otherwise Unknown (logged as `ai_rejected`). AI cannot override a deterministic value.
- Fill-only: never overwrite a known value (a disagreement is logged as a conflict), never write Unknown, never downgrade.
- License: Yes / Preferred / No / Unknown (`Preferred` option added). Experience: `未経験歓迎` → No, `3年以上` → Yes + years min.
- Salary: basis (MONTHLY/HOURLY/DAILY/ANNUAL) from the stated 賃金形態. Hourly/monthly filled only if empty and stated. No assumed hours, no estimates.
- Overseas: WF04 only logs an `overseas_hint` row when explicit wording is seen; WF02 decides.
- Idempotent: same value → no write. The `Enrichment Checked` stamp is the only write when nothing new is found, and keeps the job out of the queue for `recheck_days`.
- Every write is read back and compared (CJK check).

## Evidence / provenance
`Enrichment Evidence` (per field: source DET/AI, quote, date), `Enrichment Checked`, plus `mtg_job_enrichment_log` (run_id, job, field, old, new, source_url, evidence, confidence, changed). Source URL = the job's Source URL.

## New Notion fields (already added)
Enrichment Checked (date), Enrichment Evidence (text), License Type (text), Experience Years Min (number), Salary Basis (select), License Required option `Preferred`.

## Data tables (already created)
mtg_job_enrichment_log, mtg_job_enrichment_run_log; errors go to the shared mtg_job_scout_error_log (`source = wf04`).

## WF03 V1.2 change (required, 3 lines)
WF03 parses JLPT/License/Experience from stored text. Without a guard it would reset a value WF04 filled back to Unknown. V1.2: a parse that finds nothing keeps the current known value; a parse that finds something still wins. Tests: idempotent run NO_CHANGE; WF04-filled values survive.

## Deferred to a later WF04 version (not guessed)
Allowance / overtime pay / night-shift / bonus split, estimated annual salary, Overseas Evidence fields, effective-hourly from monthly + hours (needs explicit schedule), minimum-wage reference.

## Known live-test risks
- HelloWork label for the license section (`必要な免許・資格`) was not in the saved sample page; confirm on a real page. Experience and 賃金形態 labels were confirmed on a real page.
- Merge `Enrich Inputs` / `All Outcomes` with empty branches: same check as WF03.
- WF04 has no candidates until a record is APPROVED + ACTIVE (Phase B, or a manually verified test record).
- Readiness lag: WF04 11:00 → WF03 recomputes at 22:00 (and 10:00 next day).
