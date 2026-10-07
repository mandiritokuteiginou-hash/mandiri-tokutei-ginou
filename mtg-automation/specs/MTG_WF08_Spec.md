# MTG WF08 — Distribution Engine V1.0 (spec)

Status: built + locally tested (t8.js, 0 assertion failures). Never executed live. Schedule 15:00 / 03:00 JST, **OFF**. `publish_mode` default **DRY_RUN**.

## Boundary
WF08 is publisher/orchestrator only. It reads the Master DB and WF05–07 outputs; it writes **only**: Distribution Status, Published Platforms, Distribution Ledger, Distribution Notes, Last Published (Notion) + the data tables below. It never touches QC, Recruitability, Lifecycle, Tier, Salary, content copy, image, enrichment, or any Legal Review field.

## Flow (35 nodes)
Schedule → Config → Query Candidates (N8N + Content Approved + Image READY) → Load Queue State → **Plan Distribution** (final gate + idempotency + retry + cap) → Route
- PUBLISH → Format Payload → Payload OK? → Lock Row (status PUBLISHING stored first) → Confirm Lock → Lock OK? → Platform Router → Instagram / TikTok / WhatsApp Adapter → Parse Result → (Blotato: Wait → Verify Delivery → Parse Verify) → Update Queue Row
- ROW_UPDATE (stale / exhausted / ambiguous rows) → Update Queue Row; everything else → log only
- All Outcomes → Distribution Log, Error Log, Run Log, Summarize Jobs → Notion PATCH → Read-back → Verify Write.

## Final Publish Gate (all must pass, per job)
Lifecycle ACTIVE · QC APPROVED · Overseas Confirmed · Canonical (no Canonical Of, key present) · Content Status Approved · Image Status READY · https Image URL · not expired · Content Hash == recomputed fact hash · Image Build Hash == recomputed · **Legal Review Status = APPROVED**. WF07 READY is never permission to publish.
- Legal approval is **hash-bound**: `Legal Reviewed Hash` must equal the current Image Build Hash. Any content/image change invalidates it → LEGAL_HOLD. (My addition; revert in plan8.js if reviewers find it too strict.)
- No global bypass (no skip_legal_gate). Only per-record approval.
- Changed hash after queueing → STALE, old version never published.

## Idempotency / retry
Distribution Hash = fnv(job|content_hash|image_build_hash|platform). Already PUBLISHED (queue row or Notion Distribution Ledger) → SKIP. One platform failing never blocks others.
- 401/429 → retry; 408/5xx/timeout → retry but flagged AMBIGUOUS_RETRY (post may have gone through); max 3 attempts, `retry_after_hours` 6, then MANUAL_REVIEW.
- 400/403/422, invalid content, legal fail → MANUAL_REVIEW, never retried. Stale → STALE.
- At-most-once: PUBLISHING row is written before sending; no n8n-level retry on adapters; a leftover PUBLISHING row on the next run → MANUAL_REVIEW (AMBIGUOUS_PUBLISH), never re-posted. Unresolved verify → VERIFY_PENDING → same path.
- `max_posts_per_run` 6 (excess → DEFERRED_CAP).

## Adapters
Instagram/TikTok via Blotato REST (`POST /v2/posts`, status `GET /v2/posts/{id}`, header-auth credential "Blotato API Key (header)"). TikTok default privacy SELF_ONLY. WhatsApp via generic webhook bridge (credential "WhatsApp bridge API key", sends idempotency_key). A platform is active only if enabled in `platforms_enabled` and account/endpoint filled.

## Data tables
mtg_distribution_queue (state/idempotency) · mtg_distribution_log · mtg_distribution_run_log · shared mtg_job_scout_error_log.

## Notion fields added
Legal Review Status/Reviewed Hash/Reviewed By/Review Date/Review Note; Distribution Status, Published Platforms, Distribution Ledger, Last Published, Distribution Notes.

## Config parity
template_version, disclaimer, brand_footer, poster settings must equal WF05–WF07.

## Unverified until live test
1. Blotato REST body/endpoint/status shape and auth header (inferred from tool schema).
2. WhatsApp bridge contract.
3. Data Table upsert returns row `id` (Confirm Lock depends on it); Get on empty table with alwaysOutputData.
4. Merge empty-branch behaviour and `itemMatching` pairing through Merge/IF/Switch.
5. Update Queue Row is a side branch; its failure is not captured in the log (onError continue).
6. Duplicate-post risk on 5xx/timeout (flagged, not eliminated).
7. `mtg_distribution_queue` grows — pruning belongs in WF10.

## Go-live checklist (later)
Fill account ids/credentials → run DRY_RUN and inspect log → test one TikTok SELF_ONLY post → only then LIVE. Legal: MTGI has no P3MI licence; recruiting-claim wording needs a qualified reviewer (this is not legal advice).
