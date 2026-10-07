# MTG WF05 — Job → Content Engine V1.0

## Purpose
Turn approved, canonical Master-DB jobs (WF03) plus WF04 enrichment into Indonesian recruitment copy **without creating any new fact**. Output is **Draft only**.

## Ownership / boundary
- WF05 writes: Poster Copy, WhatsApp Copy, Instagram Caption, TikTok Caption, Content Status (=Draft), Content Hash, Content Generated, Content Method, Content Build Notes.
- WF05 never sets Ready/Approved, never makes images, never publishes (no Blotato/Poster). Later WFs own those.
- WF05 never touches QC, lifecycle, tier or enrichment fields.

## Gates (all required)
ACTIVE + QC APPROVED + Recruitability = Overseas Confirmed + Canonical Key set + Canonical Of empty + tier in `allowed_tiers` + Content Status empty / Not Started / Draft.
Also needs: company, title or position, prefecture, canonical monthly salary, job number — otherwise INSUFFICIENT_FACTS.
Actions: GENERATE | SKIP_UNCHANGED | INSUFFICIENT_FACTS | NOT_ELIGIBLE. GENERATE capped at `max_per_run` (15).

## Fact sheet
Built only from stored fields. Unknown/empty is dropped, never written as "No". Sector JP→Indonesian via fixed map.

## Idempotency
Hash of fact sheet + template_version → Content Hash. Draft with same hash = SKIP_UNCHANGED. Changed facts → regenerate (Drafts queue re-checked within `lookback_hours` 14).

## AI + validator
AI (claude-sonnet-5-5) rewrites facts into JSON {poster_headline, poster_points, whatsapp_body, instagram_body, tiktok_body}. Validator rejects: banned phrases, amounts/numbers/N-levels not in facts, abbreviated amounts, URLs, unsupported experience/housing/language/license claims, missing company name, other-prefecture mention, bad lengths. Any issue → deterministic template from the same facts (Content Method = TEMPLATE; issues in Build Notes). Footer (source, job number, expiry, disclaimer, optional brand footer) appended by code.

## Flow (24 nodes)
Schedule 12:00/00:00 JST (OFF) → Config → Query New + Query Drafts → Queues → Flatten → Needs Content? → Needs AI? → Prepare AI → AI Write → Parse AI → Content Inputs → Compose → Needs Write? → Notion PATCH → Read-back → Verify Write (CJK check) → All Outcomes → Content log / Error log (shared) / Run log.

## Data tables (created)
`mtg_job_content_log`, `mtg_job_content_run_log`; errors go to `mtg_job_scout_error_log` (source `wf05`).

## Install
Import JSON; attach credentials (Notion MTG Integration, Anthropic API Key). Schedule stays OFF.

## Live risks (not validated live)
- Merge append with empty branches (same open item as WF02–04).
- Validator false-reject rate on real AI output → more TEMPLATE drafts than expected.
- No candidates until Phase B (needs APPROVED + ACTIVE + Overseas Confirmed).
- Stale copy after Approved: later WFs must compare Content Hash to current facts.
- Legal: recruitment-style posts by an entity without a P3MI licence (MTGI, none as of 2026-09) may need legal review before any publishing. Not legal advice.
