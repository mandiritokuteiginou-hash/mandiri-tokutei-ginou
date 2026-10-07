# MTG Integration Test — Phase A (Infrastructure / Contract) · 2026-10-07
Schedules: all OFF. Nothing published, no lead data read. Probe workflows were archived; the only data written was one `__PROBE__` row in `mtg_monitor_state`, deleted in the same run.

## Verdict: 2 BLOCKERS found (fixed in code / need your action), rest PASS or WAITING FOR YOU

### BLOCKERS
| # | Finding | Evidence | Status |
|---|---|---|---|
| B1 | **The built-in Notion credential overrides our `Notion-Version: 2025-09-03` header.** Every `/v1/data_sources/...` call (WF01–WF10) returned `400 invalid_request_url`; `/v1/search` with that credential returned old-style `database` objects. | probe executions 32338/32339 | **Patched** in all 10 JSONs (40 Notion nodes): now `Header Auth` credential named **`Notion Bearer (Header Auth)`** (Name `Authorization`, Value `Bearer <Notion integration secret>`). **You must create this credential** and assign it. |
| B2 | **The n8n Notion integration ("N8N" bot) cannot see the Master Job DB or the Leads DB** (search returns only 3 unrelated databases). | probe 32340 | **You must**: Notion → each DB (Master Job DB, Leads/Applicants, Companies DB) → ••• → Connections → add the integration. |
After B1+B2 the Notion contract checks below must be re-run (filter_properties, `unique_id` filter, create/PATCH, `select:null`, `phone_number`).

### PASS (verified live in this n8n)
- 10 workflows vs 43 real Data Tables: **0 missing tables, 0 missing columns**.
- Notion schema vs code: all property names used by WF02–WF09 exist in Master (138 props) / Leads (39 props); status literals written match existing select options. (Types: Master `Job ID` is `auto_increment_id` → WF09 uses the `unique_id` filter; `Age` on Master is text.)
- Merge (append) with an empty input 0 + one item on input 1 → exactly 1 item (WF08/WF09/WF10 pattern OK).
- Data Table `upsert` twice on the same key → 1 row; upsert returns the row **with `id`** (WF08 open item closed).
- `deleteRows` with filter works; `get` on an empty table with `alwaysOutputData` returns one empty `{}` item (WF10 code already filters these); `get` with `orderBy/limit` works on an empty table.

### WAITING FOR YOU (cannot be tested without secrets/accounts)
| Item | Needed |
|---|---|
| Anthropic API | credential **`Anthropic API Key (x-api-key)`** (Custom Auth: header `x-api-key`) — does not exist yet |
| gBizINFO | credential **`gBizINFO API Token`** (Header Auth `X-hojinInfo-api-token`) — does not exist yet |
| HTML-to-Image render API | credential `HTML-to-Image Render API (Basic Auth)` + which service |
| Blotato REST | credential `Blotato API Key (header)`; REST contract unverified (the existing "Blotato account" is the n8n node credential, not a header key) |
| WhatsApp bridge | you already have a **WAHA** credential. WF08/WF09 assume a generic bridge (`POST` send, `GET` inbox). Tell me if WAHA is the bridge and I adapt the two HTTP contracts. |
| n8n API (WF10) | credential `n8n API key (X-N8N-API-KEY)` + `n8n_api_base` |
| n8n instance pruning | `EXECUTIONS_DATA_PRUNE=true`, `EXECUTIONS_DATA_MAX_AGE=72` |
| `hash_salt` | replace `CHANGE_ME` in WF09 Config (never in Notion/logs) |

### Next (after you create the credentials + connect the DBs)
1. I re-run the Notion contract probe (≈5 min) → Phase A closes.
2. Phase B: 1–5 test jobs through WF01→WF08 in DRY_RUN, WF09 with synthetic phone, WF10.
3. Phase C adversarial list as you specified.
