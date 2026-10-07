# MTG WF06 — Content QC & Approval Engine V1.0

## Purpose
Decide whether a WF05 Draft may become **Approved**. Deterministic fact QC decides; AI is only a second opinion. Never publishes, never makes images.

## Ownership
- WF06 writes ONLY: Content Status, Content QC Decision, Content Risk, Content QC Attempt, Content QC Fact Hash, Content QC Date, Content QC Flags, Content QC Notes — and clears Content Hash when it sends content back to WF05.
- WF06 never touches Job QC, Lifecycle, Tier, Recruitability, Salary, Company or any copy text. It does not edit copy.
- WF05 = draft, WF06 = QC/approval, WF07 = image, WF08 = distribution.

## Schedule (JST, keep OFF)
WF05 12:00/00:00 → WF06 13:00/01:00.

## Inputs
Master DB pages with Ingestion Source = N8N and Content Status = **Draft** (QC) or **Approved** (re-check for stale / ineligible job; no AI for these).

## Flow (24 nodes)
Schedule → Config → Query Drafts + Query Approved → Queues → Flatten → Fact QC → Needs AI? → Prepare AI → AI QC → Parse AI → QC Inputs → Decide → Needs Write? → Notion PATCH → Read-back → Verify Write → All Outcomes → QC log / error log / run log.

## Gates, in order
1. **Job gate** (Flatten): ACTIVE + QC APPROVED + Overseas Confirmed + canonical + enough facts. Fail → REJECTED, flag JOB_NOT_ELIGIBLE, Content Status = Rejected (also withdraws Approved content).
2. **Stale gate**: Content Hash ≠ current fact hash → STALE. Never approved. Decision REJECTED, flag STALE_CONTENT, Content Status → **Not Started**, Content Hash cleared, attempts reset, so WF05 regenerates. If the same facts go stale again after one reset → MANUAL_REVIEW (STALE_LOOP; means WF05/WF06 config mismatch).
3. **Deterministic Fact QC** on the *stored* copy vs current facts (below).
4. **AI second pass** only when 1–3 are clean and the item is a Draft.
5. **Decision**.

## Deterministic checks
| Severity | Codes |
|---|---|
| REJECT (wrong/unsupported fact) | AMOUNT_MISMATCH, NUMBER_MISMATCH, COMPANY_MISMATCH, POSITION_MISMATCH (job-title-like JP term not in facts), JOB_NUMBER_MISMATCH, URL_MISMATCH, JLPT_MISMATCH, LICENSE_UNSUPPORTED / LICENSE_MISMATCH, EXPERIENCE_MISMATCH, HOUSING_UNSUPPORTED, LOCATION_MISMATCH (other prefecture) |
| MANUAL (high-risk) | REGULATORY_CLAIM (P3MI / berizin / izin resmi / penyalur resmi …), INDONESIA_SPECIFIC_CLAIM (WNI / khusus Indonesia: stored evidence only says Overseas Confirmed) |
| REVISION (minor) | EMPTY_CHANNEL, POSSIBLY_TRUNCATED, COMPANY_MISSING, JOB_NUMBER_MISSING, SALARY_MISSING, ABBREVIATED_AMOUNT, NEW_JP_TERM, BANNED_PHRASE, DISCLAIMER_MISSING |
| INFO (logged only) | LOCATION_NOT_SHOWN, POSITION_NOT_SHOWN |
Fixed disclaimer / brand footer text is excluded from banned/regulatory phrase checks. Phrases match whole words ("Pastikan" ≠ "pasti").

## AI second pass
Judge only (verdict PASS/MINOR/FAIL/UNSURE + issues). An issue counts only with a **verbatim quote** from the stored copy. AI cannot reject alone and cannot approve over a deterministic failure.
- PASS → APPROVED. MINOR → REVISION_REQUIRED. verified fact/risk issue → MANUAL_REVIEW (AI_DISAGREES). FAIL/UNSURE without a verifiable quote → MANUAL_REVIEW (AI_UNSURE).
- AI down / invalid → **no write, no attempt consumed**, retried next run (DEFERRED_NO_AI). `require_ai_second_pass=false` lets deterministic QC approve alone (test mode, flagged DETERMINISTIC_ONLY).

## Decision table
| Condition | Decision | Content Status |
|---|---|---|
| all PASS | APPROVED (risk LOW) | Approved |
| minor wording | REVISION_REQUIRED | Draft + Content Hash cleared (WF05 regenerates) |
| wrong fact | REJECTED (HIGH) | Rejected |
| ambiguous / high-risk / AI disagrees / attempts exhausted | MANUAL_REVIEW | Manual Review |
| stale | REJECTED + STALE_CONTENT | Not Started + hash cleared |
Attempts: counted per fact hash; reset when facts change; REVISION at attempt ≥ 3 → MANUAL_REVIEW (ATTEMPTS_EXHAUSTED). This bounds the WF05↔WF06 loop to 3 rounds.
Note: WF05 only picks up Draft / Not Started, so revision uses Draft + empty Content Hash. The select option "Revision Required" exists but is unused until a later WF05 revision.

## Logs
`mtg_content_qc_log`: run_id, ts, job_number, job_id, page_id, content_hash, fact_hash, deterministic_result, ai_result, qc_decision, risk_flags, qc_attempt, manual_review, risk_level, outcome, reason, write_status.
`mtg_content_qc_run_log`: run_id, started_at, finished_at, queue_status, summary_json, seen, awaiting_regen, deferred, still_valid, approved, revision_required, rejected, stale, manual_review, written_ok, write_errors, verify_failed, ai_errors.
Errors go to `mtg_job_scout_error_log` (source `wf06`).

## Notion fields added
Content Status options + Revision Required / Rejected / Manual Review; Content QC Decision, Content Risk, Content QC Attempt, Content QC Fact Hash, Content QC Date, Content QC Flags, Content QC Notes.

## Install
Import JSON, attach Notion + Anthropic credentials. **Config must match WF05**: template_version, disclaimer, brand_footer. Schedule OFF.

## Local tests (js6/t6.js) — all pass
Fact-hash parity WF05=WF06; AI/template draft approves; AI MINOR/FAIL/UNSURE/garbage/HTTP error; AI PASS cannot override edited salary; company, job number, URL, JLPT, license, prefecture, position, new JP term, promise word, disclaimer, P3MI, Indonesia-only, empty channel, extra number; stale draft/approved after salary or company change; stale loop guard; job expired / QC changed / duplicate; attempts 2/3 and reset; awaiting regen; empty/error queue; deterministic-only mode; read-back verify (CJK/number mismatch); log/run-log shape.

## Not validated live
Merge empty branches; `itemMatching` pairing across IF/Merge (Verify, Parse AI); AI reviewer false-alarm rate (→ more MANUAL_REVIEW); false rejects from NEW_JP_TERM / POSITION_MISMATCH on real copy; Notion clearing Content Hash with an empty rich_text array; WF05 and WF06 Config parity.

## Legal note
Approval means "matches stored facts and has no flagged wording", not "legally cleared". MTGI has no P3MI licence as of 2026-09; recruitment-style posts need legal review before WF08 publishes anything. Not legal advice.
