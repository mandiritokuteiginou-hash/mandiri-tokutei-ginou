# MTG WF10 — Monitoring & Recovery Layer · Spec V1.0

Status: spec written BEFORE any node (as requested). Schedule OFF. WF10 is **not a business workflow**: it never creates, edits, approves, publishes or deletes business facts.

## 1. Purpose and hard boundaries
WF10 watches WF01–WF09 (from their run logs, the distribution queue, the Leads DB and the n8n execution list), tells the human what needs attention, performs a *tiny whitelist* of idempotent technical recoveries, and prunes technical leftovers.

| WF10 MAY | WF10 MAY NOT (ever) |
|---|---|
| READ: 9 run-log tables, `mtg_distribution_queue`, `mtg_job_scout_error_log`, `mtg_monitor_state`, Leads DB (PII-safe columns only), n8n executions API (optional) | WRITE to Notion (Master Job DB **and** Leads DB: zero Notion writes) |
| WRITE data tables: `mtg_monitor_state`, `mtg_monitor_log`, `mtg_monitor_run_log` | Change a job fact, status, tier, hash, approval, Legal Review, or any lead status/consent/field |
| Recovery R1 on `mtg_distribution_queue` (section 5) | Re-publish, retry a FAILED post, send any message, unlock "approved" content |
| Prune (section 7), default DRY_RUN | Turn any schedule on, change `publish_mode`, or touch credentials |
| Send ONE PII-free digest to an optional webhook | Put phone, name, message text, e-mail, hash_salt or any Notion text into an alert or log |

## 2. Principles
1. Detect loudly, act rarely. Anything that needs judgement (facts, legality, "did the post really go out?") is an alert for a human.
2. Idempotent: running twice in a row yields the same state; a recovery row stops matching after it is applied.
3. Fail-safe: if an input is unreadable/ambiguous, WF10 raises a finding instead of "fixing".
4. Unknown ≠ Fine: missing timestamps / unknown statuses are findings, not silently ignored.
5. PII-safe by construction: the Leads query uses `filter_properties` with an allow-list of 8 non-PII columns; if any id cannot be resolved the query is **refused** (never an unfiltered fetch).
6. Alert fatigue control: dedup state per finding key, severity-based re-alert, one digest per run, daily heartbeat (silence = WF10 itself is dead).

## 3. Inputs
`mtg_distribution_queue` · run logs `mtg_job_scout_run_log`, `mtg_job_qc_run_log`, `mtg_job_organize_run_log`, `mtg_job_enrichment_run_log`, `mtg_job_content_run_log`, `mtg_content_qc_run_log`, `mtg_image_generation_run_log`, `mtg_distribution_run_log`, `mtg_lead_run_log` (latest 6 rows each, re-sorted in code) · `mtg_job_scout_error_log` (latest 300) · `mtg_monitor_state` · Leads DB (non-PII columns) · n8n `GET /executions?limit=100&includeData=false` (only if `n8n_api_base` set).

## 4. Monitoring metrics = findings catalog
Severity: HIGH = human action soon · WARN = look within a day · INFO = digest only (never pushes an alert on its own).

| Code | Sev | Trigger (defaults in Config) |
|---|---|---|
| NEVER_RAN `WFxx` | INFO (WARN if `expect_runs=true`) | no run-log row at all |
| RUN_STALE `WFxx` | WARN; HIGH at 2× | last run older than `stale_run_hours`=26 (only workflows that ran before) |
| RUN_QUEUE_STATUS `WFxx` | WARN | latest `queue_status` not in OK/EMPTY/blank |
| RUN_WRITE_ERRORS `WFxx` | WARN | latest run `write_errors+verify_failed` > 0 |
| RUN_REPEATED_ERRORS `WFxx` | HIGH | same, in the latest TWO runs |
| CONTENT_STALE (WF06) / IMAGE_STALE (WF07) / DISTRIBUTION_STALE (WF08) | WARN; HIGH if latest two runs both > 0 | run-log `stale` > 0 (content/image changed after approval, needs regen/re-QC) |
| QUEUE_STUCK_PUBLISHING `hash` | HIGH | status PUBLISHING older than `publishing_stuck_minutes`=90 (or timestamp unreadable) |
| QUEUE_MANUAL_REVIEW | HIGH if any older than `manual_review_row_hours`=24, else WARN | rows in MANUAL_REVIEW (ambiguous / attempts exhausted) |
| QUEUE_FAILED_STALE | WARN | FAILED rows older than `failed_stale_hours`=12 (WF08 backoff is 6h; still FAILED = not being retried) |
| QUEUE_DUPLICATE_HASH | HIGH | two queue rows with the same distribution_hash |
| QUEUE_PUBLISHED_NO_ID | WARN | PUBLISHED without external_post_id |
| QUEUE_UNKNOWN_STATUS | WARN | status outside PUBLISHING/PUBLISHED/FAILED/MANUAL_REVIEW/DRY_RUN |
| LEAD_PURGE_OVERDUE | HIGH | Purge After older than `purge_grace_days`=2 and PII Purged = false (PII retention breach) |
| LEAD_DORMANT_UNMARKED | WARN | active lead (NEW…DOCS_RECEIVED) idle > `dormant_after_days`(21)+`dormant_grace_days`(3) |
| LEAD_MANUAL_REVIEW_AGING | WARN | MANUAL_REVIEW older than `lead_review_days`=3 |
| LEADS_GUARD_REFUSED | HIGH | a PII-safe property id could not be resolved → lead monitoring blind (no lead data fetched) |
| LEADS_QUERY_ERROR / LEADS_TRUNCATED | WARN / INFO | Notion error / more than 100 leads (only first page scanned) |
| EXEC_FAILED `workflowId` | WARN; HIGH ≥ `exec_fail_high`=5 | error/crashed executions in last `exec_window_hours`=24 |
| EXEC_API_ERROR / EXEC_NOT_CONFIGURED | WARN / INFO | API unreachable / `n8n_api_base` empty |
| EXEC_PRUNING_UNCONFIRMED | WARN | `exec_pruning_confirmed` still false (execution data contains PII; set instance `EXECUTIONS_DATA_MAX_AGE=72`, then set true) |
| EXEC_PRUNING_INEFFECTIVE | HIGH | execution list shorter than limit yet oldest > 1.5 × `exec_max_age_hours`(72) |
| ERRLOG_SPIKE `source` | WARN | ≥ `errlog_spike`=20 error-log rows from one source in 24h |

Run health: **CRIT** if any HIGH, **WARN** if any WARN, else **OK**. This is the run-health summary written to `mtg_monitor_run_log` and the digest.

## 5. Recovery matrix
| ID | Situation | Action | Why safe |
|---|---|---|---|
| **R1** | Queue row PUBLISHING, age > `publishing_stuck_minutes`, timestamp readable | Upsert that row (match on distribution_hash): `status=MANUAL_REVIEW`, `error_code=AMBIGUOUS_PUBLISH`, `updated_at=now`; attempt / external_post_id kept; `published_at` left empty | Same transition WF08 itself uses; never retries (at-most-once: a post may exist); human checks the platform. Row no longer matches ⇒ idempotent. Cap `recovery_max_per_run`=10; switch `auto_recover`. |
| R-none | FAILED rows | alert only | WF08 owns retries (attempt cap, backoff) |
| R-none | MANUAL_REVIEW / PUBLISHED rows | never touched | human decision / dedup ledger |
| R-none | stale content/image, failed workflows, dormant leads, purge overdue | alert only | owners are WF05–WF09; WF10 does not write business data |
| R-none | unreadable timestamp, unknown status, duplicate hash | alert only | cannot prove it is safe |
Human runbook for QUEUE_MANUAL_REVIEW: check the platform; if the post exists, set the row PUBLISHED with the real external id; if not, delete the queue row *and* resolve the Notion QC status per WF08 spec.

## 6. Alert rules
- Key = `CODE|subject`. State row per key in `mtg_monitor_state` (OPEN/RESOLVED, first_seen, last_seen, last_alerted, times_alerted).
- Alert when: key is new · OPEN HIGH and last_alerted older than `realert_high_hours`=12 · OPEN WARN and older than `realert_warn_hours`=48 · INFO never. A key absent from the current run becomes RESOLVED (logged once).
- One digest per run (text only, ≤ 1500 chars) to `alert_webhook_url` (empty = log only; payload has both `text` and `content` so Slack/Discord-style webhooks work). Heartbeat digest at least every `heartbeat_hours`=24.
- `last_alerted` is only advanced after the webhook answered 2xx (a failed send is retried next run); with no webhook the channel is LOG and alerts are marked as logged.
- Digest content: codes, counts, workflow ids, queue hash prefixes, Lead IDs (opaque, max 5). Never phone, name, message text, e-mail, salt.

## 7. Pruning policy
| Target | Rule | Default |
|---|---|---|
| `mtg_distribution_queue` | DRY_RUN rows older than `prune_dry_run_days` | 7 d |
| | FAILED rows older than `prune_failed_days` (content hash long superseded; never posted) | 60 d |
| | PUBLISHED rows (hash ledger / duplicate-post protection) | **never** (`prune_published_days=0`; only if >0 AND Notion ledger confirmed) |
| | PUBLISHING, MANUAL_REVIEW, unknown status | **never** |
| `mtg_monitor_state` | RESOLVED older than `prune_state_days` | 14 d |
| `mtg_monitor_log` | not auto-pruned in V1.0 (≈ tens of rows/day, no PII); manual or V1.1 | — |
| n8n executions (PII) | instance setting, not WF10: `EXECUTIONS_DATA_PRUNE=true`, `EXECUTIONS_DATA_MAX_AGE=72` (h); workflow settings already save success=none; WF10 verifies via EXEC_PRUNING_* findings | 72 h |
| `hash_salt` | never in Notion/logs; rotate only with a planned re-hash (changes Lead Keys) | — |
`prune_mode` = **DRY_RUN** by default (candidates are logged as `PRUNE_CANDIDATE`, nothing deleted); set `LIVE` to delete. Cap `prune_max_per_run`=50.

## 8. Schema
`mtg_monitor_state`: state_key, code, severity, subject, status, first_seen, last_seen, last_alerted, times_alerted(number), detail
`mtg_monitor_log`: run_id, ts, event (FINDING_NEW | RESOLVED | RECOVERY | PRUNE_CANDIDATE | PRUNED | ALERT_SENT | ALERT_FAILED | HEALTH), code, severity, subject, detail, outcome
`mtg_monitor_run_log`: run_id, started_at, finished_at, health, findings_high/warn/info (number), new_findings, resolved, recoveries, prune_candidates, pruned, alert_status, queue_rows, leads_scanned, exec_status, summary_json

## 9. Flow (≈33 nodes, 12 are plain read-only Data Table gets)
Schedule 17:00 / 05:00 JST (OFF) → Config → [Get Queue → 9 run-log gets → Error log → Monitor state] (executeOnce chain) → Lead Schema (GET) → Build Lead Query (PII guard) → Lead Query → Exec Configured? → Exec Fetch/skip → Plan Monitor → Route Plan (recovery / prune queue / prune state / digest) → writers; digest → Send? → Webhook → Finalize → Route (state / log / run log).

## 10. Failure modes
Input table empty → NEVER_RAN info, not an error · Notion/n8n API error → finding, run continues · Webhook down → not marked alerted, retried · WF10 down → no heartbeat digest (the human notices silence) · Merge/ordering behaviour is listed as an open live-verification item.

## 11. Local test plan (0 failures required)
Findings per code with boundary values · R1 only for stale PUBLISHING with readable timestamp, cap, `auto_recover=false` · idempotent 2nd run (apply R1 result, re-plan ⇒ no recovery, no duplicate alert) · alert dedup / re-alert / resolve / heartbeat · webhook failure keeps last_alerted · no PII in digest/log (phone, e-mail, name, salt canaries) · PII guard refuses on missing property id · prune whitelist (never PUBLISHED/PUBLISHING/MANUAL_REVIEW) and DRY_RUN default · exec pruning checks · schema-stable output rows.

## 12. As built (V1.0)
- File: `MTG_WF10_Monitoring_Recovery_V1.0.json` — **33 nodes** (12 plain read-only Data Table gets, 3 Notion/HTTP reads, 4 code nodes, 2 switches, 2 IF, 2 merges, 3 monitor-table writers + R1 upsert + 2 prune deletes + webhook). Schedule `0 17,5 * * *` JST, imported inactive. Settings: success executions not saved, errors saved, timezone Asia/Tokyo.
- Data tables created: `mtg_monitor_state` (R9RmOhVr2PdOa1h0), `mtg_monitor_log` (ZVVCS9izakoLhGpG), `mtg_monitor_run_log` (EYpQp1RcJcYpUEQt).
- Zero Notion writes. The only Notion calls are GET data-source schema and one filtered Leads query (8 non-PII columns, re-validated on the response).
- Code: `plan10.js` (all findings, R1, prune, alert state machine, digest), `finalize10.js` (alert marking, rows), `lead_query10.js` (PII guard).
- Local test `tests/wf10_js10/t10.js`: **102 assertions, 0 failures** — every finding code and its threshold boundaries; R1 only for stale PUBLISHING with a readable timestamp (not for duplicates, not FAILED/PUBLISHED/MANUAL_REVIEW), cap, `auto_recover=false`; idempotent second run; alert dedup / re-alert / escalation / resolve / heartbeat; webhook 500 and network error do not mark alerted; 2-run end-to-end state hand-off; prune whitelist incl. dry-run default and cap; PII canaries (phone, e-mail, name, `hash_salt`) absent from findings/logs/digest; PII guard refuses on any missing property id or non-allow-listed response column; output rows match table columns exactly.
- Deviations from the first spec draft: none in behaviour. R2 (promote PUBLISHING→PUBLISHED) was deliberately dropped: WF10 never claims a post exists.

## 13. Open items (live verification, not testable offline)
1. Data Table `get` with `orderBy` on string ISO timestamps + `limit`; `executeOnce` chain of 12 gets returning `{}` on empty tables (code tolerates both).
2. Merge (append) when one input is empty (Exec Merge, Digest Outcome); `$input.first()` in Plan Monitor after Exec Merge.
3. Notion `filter_properties` honoured with ids from the data-source schema; Lead Query response shape.
4. n8n API: base URL + `X-N8N-API-KEY` credential, `/executions` response shape (`data[].status/startedAt/workflowId`), listing limit 100.
5. Webhook payload accepted by the chosen channel (both `text` and `content` are sent).
6. `deleteRows` / `upsert` on Data Tables with a filter on the key column; upsert of the whole row keeps all columns.
7. Instance pruning (`EXECUTIONS_DATA_MAX_AGE=72`) really configured → then set `exec_pruning_confirmed=true`.
8. Run-log column semantics of WF01–WF09 (`queue_status` values; `stale`, `write_errors`, `verify_failed`) are taken from the WF code, not from live data.
