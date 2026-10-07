# MTG WF07 — Image / Poster Generation Engine V1.0

## Purpose
Approved Content + current Job Facts → a simple recruitment poster → QC → `READY` for WF08. Never publishes, never changes Job DB, never changes Content Status.

## Ownership
| Domain | Owner |
|---|---|
| Job facts | WF03 / WF04 |
| Content | WF05 |
| Content QC / Approved | WF06 |
| Image | **WF07** |
| Publishing | WF08 |
WF07 writes ONLY: Image Status, Image URL, Image Build Hash, Image Template, Image Generated, Image QC Result, Image QC Flags, Image Attempt, Image Notes. (Tested: no Content/Job/QC/tier/copy field is ever in a PATCH.)

## Key design decision: text is never drawn by AI
Image models misspell numbers and Japanese. So the poster is rendered **deterministically from HTML/CSS** (Noto Sans JP) using only strings from the stored fact sheet. No AI background, no decoration → no "AI-slop", no invented text. `generation_method = HTML_TEMPLATE`. AI is used only as a **vision OCR transcriber** after rendering; code compares the transcript with the strings that were drawn. AI never decides which fact is right.

## Schedule (JST, keep OFF)
WF05 12:00/00:00 → WF06 13:00/01:00 → WF07 14:00/02:00.

## Inputs
(A) Content Status = Approved and Image Status empty / Not Started / REGENERATE / STALE / FAILED → generate.
(B) Image Status = READY (any content status) → staleness re-check.
Legacy Image Status values (Prompt Ready / Generated / Approved) and MANUAL_REVIEW are never touched.

## Flow (27 nodes)
Schedule → Config → Query Generate + Query Ready → Queues → Flatten → Build Poster → Needs Render? → Render Poster → Parse Render → Needs Vision? → Prepare Vision → AI Vision → Parse Vision → Decision Inputs → Decide → Needs Write? → Notion PATCH → Read-back → Verify Write → All Outcomes → Image log / Error log / Run log.

## Gates (Flatten)
1. Job gate: ACTIVE + QC APPROVED + Overseas Confirmed + canonical + enough facts.
2. Content gate: Content Status = Approved, Content QC Decision = APPROVED, **Content Hash == current fact hash** (rebuilt with the same logic as WF05/WF06; parity tested). Content Hash is treated as immutable input.
3. READY image fails any gate, or its Image Build Hash differs → `STALE` (Image URL cleared, old hash kept for audit). Non-READY with a failed gate → no write (WF06/WF05 handle it).

## Image Build Hash
fnv( fact_hash | content_hash | image_template_version | visual_data_hash | template_id | poster_size ).
Same hash + READY → SKIP. Salary/location/title change → fact hash changes → content stale → image STALE → regenerate after WF05/WF06 produce new Approved content. Tests: tier, template version, visual data (CTA text) and size each change the hash.

## Visual fact sheet (exactly what is drawn)
label · sector (ID) · **job title (JP, as stored)** · **location** · **salary** (¥ + "menurut sumber") · 2–4 key facts (JLPT, license, experience, dormitory, holidays, overtime — only known fields, Unknown dropped) · company · CTA (config text) · source line (HelloWork No. + expiry) · short disclaimer. Contact line is empty unless a human sets `contact_line`; WF07 never invents one.

## Templates
POSTER_TIER_S / A / B / C (from Priority Tier; missing = C). Tier only changes hierarchy (title/salary size, palette). Tested: salary font S 150 > A 132 > B 118 > C 108 while the text is identical across tiers, and no "terbaik/tertinggi" wording. Attempt 2 uses layout variant B (×0.88), attempt 3 variant C (×0.78). Contrast ≥ 4.5 is checked per palette.

## Image QC
1. **Spec self-check (before rendering)** on what is actually drawn: title/company/location equal facts; amount equals salary; no number outside facts/config; no URL/phone/email unless configured; banned / regulatory / hype words ("terbaik", "paling" …); text fits its box (else TEXT_TOO_LONG → MANUAL_REVIEW). Any flag → no render.
2. **Render** (HTTP, https URL required).
3. **Vision transcript** (temp 0): code checks every drawn element appears (NFKC, whitespace-insensitive; wrapped/merged lines OK); extra numbers, extra text lines, URLs/phones, watermark/logo → MANUAL_REVIEW; Japanese near-miss (Dice ≥ 0.8) → OCR_UNCERTAIN → MANUAL_REVIEW; missing text or layout flags (clipped, overlap, low contrast, small text, cluttered) → REGENERATE.
4. Vision unavailable → **no write, no attempt used** (retry next run). `require_vision_pass=false` → READY with flag NO_VISION_PASS (test only).

## Decision / Image Status
| Result | Image Status |
|---|---|
| spec + render + transcript pass | **READY** (URL, hash, template, date stored) |
| layout/missing text | REGENERATE (next variant, URL not stored) |
| render error | FAILED (retry next run) |
| unexpected content / spec fail / OCR doubt / 3 attempts | MANUAL_REVIEW (URL stored for the human) |
| hash/gate no longer valid | STALE |
Attempts are counted per Image Build Hash and reset when the hash changes. `GENERATING` exists as an option but is deliberately not written (a crash would leave a stuck lock). `Not Started` is treated as NOT_STARTED.
**WF08 must require: Content Status = Approved AND Image Status = READY AND Image Build Hash == current build hash.** WF07 only produces READY.

## Logs
`mtg_image_generation_log`: run_id, ts, job_number, job_id, page_id, content_hash, fact_hash, visual_hash, image_build_hash, template_version, generation_method, image_status, qc_result, qc_flags, attempt, image_url, outcome, reason, write_status.
`mtg_image_generation_run_log`: run_id, started_at, finished_at, queue_status, summary_json, seen, not_eligible, skipped_unchanged, deferred, rendered, ready, regenerate, manual_review, failed, stale, written_ok, write_errors, verify_failed, render_errors, ai_errors.
Errors → `mtg_job_scout_error_log` (source `wf07`).

## Notion fields added
Image Status options (+ READY, REGENERATE, MANUAL_REVIEW, FAILED, STALE, GENERATING; existing four kept); Image Build Hash, Image Template, Image Generated, Image QC Result, Image QC Flags, Image Attempt, Image Notes.

## Install
Import JSON; attach Notion, Anthropic and **HTML-to-Image Render API (Basic Auth)** credentials. Config `template_version` MUST equal WF05/WF06. Schedule OFF.

## Local tests (js7/t7.js) — all pass
Hash parity WF05=WF07; READY skip / stale on salary, content hash, content back to Draft, job expired, build-hash mismatch; legacy statuses untouched; candidate set; attempt carry/reset; cap; build-hash sensitivity; tier hierarchy; text identical across tiers; variant B/C; long title → no render; contact config; hype CTA blocked; perfect transcript → READY; clipped, cluttered, watermark, missing/misread salary, OCR near-miss, other company, extra text, phone, URL; wrapped/merged lines; vision garbage/HTTP error; render failed ×3; regenerate ×3; 2nd attempt success; STALE clears URL and never touches Content; verify (URL/hash mismatch), log/run-log shape. Local Chromium screenshots of tier A and S show no clipped text.

## Not validated live
- **Render provider** (contract written for htmlcsstoimage-style APIs, not tested; free plans may add a watermark → caught as MANUAL_REVIEW) and Google-Font loading for Japanese.
- Anthropic **URL image source** (needs the render URL to be publicly fetchable).
- OCR false-alarm rate on Japanese company names → more MANUAL_REVIEW.
- Merge empty branches; `itemMatching` across IF/Merge (Parse Render, Parse Vision, Verify).
- Notion accepting `url: null` to clear Image URL.

## Legal note
READY means "text matches stored facts and the layout is readable", not "legally cleared". MTGI has no P3MI licence as of 2026-09; posters must pass legal review before WF08 publishes. Not legal advice.
