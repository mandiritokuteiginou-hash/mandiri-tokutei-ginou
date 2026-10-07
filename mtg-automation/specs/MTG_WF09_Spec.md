# MTG WF09 — Applicant / Lead Management V1.0 (SPEC — written BEFORE any node)

Status: spec locked first; workflow then built from this spec only (33 nodes, 95 assertion statements, 0 failures). Schedule 16:00 / 04:00 JST, **OFF**. Replies are **draft-only**. Never executed live.

Spec amendments made during build (all found by the local tests): Lead Notes cannot be cleared by WF09 (not writable, §6); HANDOFF → MANUAL_REVIEW allowed for the 365-day retention review (§3); sent drafts keep their Draft Facts Hash so a sent draft is never regenerated (§8); license `Preferred` on a job is NA, not a hard requirement (§4).

---
## 0. Principles
1. Deterministic state machine. Every status change comes from the matrix in §3; anything not in the matrix is refused (`ILLEGAL_TRANSITION` → MANUAL_REVIEW).
2. AI never decides facts, eligibility, consent, or status. AI = intent classification only (and may only *escalate* to human, never de-escalate). Deterministic scanners run first and override AI.
3. Draft-only: WF09 never sends a message. Drafts come from fixed templates (no generated text).
4. Idempotent: same inbound message / same sweep twice = same result, no duplicate leads, no duplicate drafts.
5. PII minimal: phone + name live only in the Leads DB; never in data tables, run logs, error logs, or AI prompts.
6. **WF09 never writes to the Master Job DB.** Jobs are read (one query per distinct Job ID) for requirements/lifecycle only. Handoff outputs a reference `Job ID + Lead ID` for humans.

## 1. Scope / ownership
| Owns (writes) | Reads only | Never touches |
|---|---|---|
| Leads DB (all lead fields below) · mtg_lead_log · mtg_lead_run_log · mtg_lead_message_dedup · shared error log | Master Job DB: Job ID, Title, Company, Lifecycle Status, JLPT Required, License Required, Experience Required, Expiry Date · WhatsApp bridge inbox (pull) | Master Job DB (any write), WF01–08 fields, publishing, content, images |

## 2. Data contract — Notion DB `MTG — Leads / Applicants`
| Field | Type | PII | Notes |
|---|---|---|---|
| Lead ID | title | no | `LD-` + first 8 hex of Lead Key (or `LD-NOJOB-` + 8 hex of Phone Hash) |
| Lead Key | text | pseudonym | sha256(salt \| phone_e164 \| Job ID)[:24]. Empty if no Job ID |
| Phone Hash | text | pseudonym | sha256(salt \| phone_e164)[:24]; lookup + suppression after purge |
| Phone | phone | **yes** | E.164, purged per §6 |
| Name | text | **yes** | purged per §6 |
| Job ID | text | no | `MTG-123`; the only link to Master DB (no Notion relation → no schema change on Master) |
| Lead Status | select | no | NEW, CONTACTED, SCREENING, ELIGIBLE, NOT_ELIGIBLE, DOCS_REQUESTED, DOCS_RECEIVED, HANDOFF, WITHDRAWN, DORMANT, MANUAL_REVIEW |
| Prev Status | select | no | where RESUME / revive returns to |
| Status Reason | text | no | reason codes only (e.g. `LEGAL_SENSITIVE`, `NO_JOB_REF`) |
| Status Changed | date | no | |
| Source | select | no | WHATSAPP / MANUAL |
| Consent Status | select | no | NONE / GRANTED / WITHDRAWN |
| Consent Date · Consent Source · Consent Version · Consent Requested At | date/select/text/date | no | evidence of consent (§5) |
| Applicant JLPT | select | **yes** | None, N5…N1, Unknown (empty = Unknown) |
| JFT-Basic · Skill Test Passed · Tech Intern Completed · Has License | select Yes/No/Unknown | **yes** | empty = Unknown |
| Experience Years · Age | number | **yes** | empty = Unknown (no DOB stored) |
| Facts Hash | text | no | hash(facts + job requirements); re-evaluate only when it changes |
| Eligibility Result | select | no | NOT_EVALUATED / ELIGIBLE / NOT_ELIGIBLE / UNKNOWN |
| Eligibility Detail | text | derived | `R1:MET R2:UNKNOWN …` |
| Last Intent · Last Inbound | select/date | no | |
| Reply Draft · Draft Kind · Draft Facts Hash | text/select/text | **yes** (draft) | Reply Draft/Kind cleared on DRAFT_SENT; Draft Facts Hash (a hash of kind+facts) is kept so the same draft is never regenerated; all cleared on purge |
| Human Action | select | no | DRAFT_SENT, DOCS_REQUESTED, DOCS_RECEIVED, RESUME, CLOSE — consumed then cleared |
| Last Contact | date | no | set when DRAFT_SENT consumed |
| Handoff Ref | text | no | `HANDOFF MTG-123 / LD-AB12CD34` |
| Purge After · PII Purged · PII Purged At | date/checkbox/date | no | §6 |
| Lead Notes | text | maybe | human-only; WF09 never reads or writes it |
| Last Run | text | no | run_id |

WF09 write allow-list = every field above **except** Lead Notes. Plan code asserts the allow-list and that the target page belongs to the Leads DS.
Raw inbound message text is **never persisted** by WF09 (not in Notion, not in tables). Only message-id hash, intent, and timestamps.

## 3. State-transition matrix
Events are evaluated in priority order per lead per run; chained steps allowed (max 4 per run); the final status is written once, each step is logged.

Priority: (1) WITHDRAW → (2) Human CLOSE → (3) MANUAL_REVIEW triggers → (4) state transitions.

| From | To | Condition |
|---|---|---|
| (new record) | NEW | phone valid, Job ID present |
| (new record) | MANUAL_REVIEW | invalid phone (`PHONE_INVALID`), no Job ID (`NO_JOB_REF`), duplicate Lead Key on another page (`DUPLICATE_LEAD`) |
| NEW | CONTACTED | Consent = GRANTED |
| CONTACTED | SCREENING | ≥1 applicant fact known (human-entered) |
| SCREENING | ELIGIBLE | all rules MET / N-A |
| SCREENING | NOT_ELIGIBLE | any rule NOT_MET (known facts only) |
| SCREENING | SCREENING | any UNKNOWN, none NOT_MET → draft asks the missing facts |
| ELIGIBLE ⇄ NOT_ELIGIBLE ⇄ SCREENING | | only when Facts Hash changed (human corrected facts / job requirement changed) |
| ELIGIBLE | DOCS_REQUESTED | Human Action = DOCS_REQUESTED |
| DOCS_REQUESTED | DOCS_RECEIVED | Human Action = DOCS_RECEIVED (WF09 never sees documents) |
| DOCS_RECEIVED | HANDOFF | automatic, writes Handoff Ref |
| any active (not HANDOFF/WITHDRAWN) | DORMANT | no activity ≥ `dormant_after_days` (21), or Human CLOSE |
| DORMANT | Prev Status | new inbound message from that lead |
| any non-terminal | MANUAL_REVIEW | legal-sensitive message (§7), ambiguous message target, job unavailable (pre-DOCS_REQUESTED states), consent missing beyond NEW, illegal transition |
| MANUAL_REVIEW | Prev Status | Human Action = RESUME (triggers re-checked) |
| any non-terminal | WITHDRAWN | Consent WITHDRAWN, message says stop/delete/cancel, or replies NO to consent request |
| WITHDRAWN | NEW (reopen) | later inbound non-withdraw message; consent reset to NONE (must opt in again) |
| HANDOFF | WITHDRAWN / MANUAL_REVIEW | human-owned; only withdraw, or the 365-day retention review (`RETENTION_REVIEW`). Legal messages only append a reason |

Invalid Human Action for the state (e.g. DOCS_RECEIVED while NEW) is cleared and recorded as `ACTION_INVALID_FOR_STATE`; no transition.

## 4. Eligibility rules + Unknown handling
Result per rule: **MET / NOT_MET / UNKNOWN / NA**. Unknown ≠ No — an empty fact is UNKNOWN and never produces NOT_ELIGIBLE.
Overall: any NOT_MET → NOT_ELIGIBLE; else any UNKNOWN → UNKNOWN (stay SCREENING, ask); else ELIGIBLE.

| Rule | Logic |
|---|---|
| R1 Age | Age ≥ 18 MET; < 18 NOT_MET; empty UNKNOWN |
| R2 Japanese | job requires level r (N5=1…N1=5): applicant JLPT ≥ r MET; JFT-Basic=Yes counts as N4 equivalent (only for r ≤ N4); JLPT known but lower and (JFT=No or r>N4) NOT_MET; otherwise UNKNOWN; job requirement None → NA; job requirement Unknown → UNKNOWN |
| R3 SSW baseline (`require_ssw_baseline`, **default OFF (`false`) until wording and rules are legally verified from an official source; never a hard gate on assumption**) | Skill Test Passed=Yes OR Tech Intern Completed=Yes → MET; both No → NOT_MET; else UNKNOWN. *General SSW baseline as understood; actual requirements vary by field/route — verify with current ISA rules* |
| R4 License | job requires? No or Preferred → NA; Yes → applicant Yes MET / No NOT_MET / empty UNKNOWN; job Unknown → UNKNOWN |
| R5 Experience | same pattern using Experience Years > 0 |

Eligibility is internal screening. Drafts never say "pasti lolos / dijamin"; ELIGIBLE wording = "memenuhi persyaratan awal, belum jaminan".
Facts enter **only** from humans (Notion fields). V1.0 does not let AI extract facts from chat (an AI-proposed-fact + human-confirm step is a V1.1 candidate). `SUPPLY_INFO` / `DOCS_SENT` intents only set a reason (`FACTS_TO_ENTER` / `DOCS_MENTIONED`) so a human enters/checks them.

## 5. Consent rules
- Lawful basis = explicit consent. Without Consent=GRANTED WF09 holds only: phone, phone hash, job ref, status. No facts, no screening, only a consent-request draft.
- Consent request template includes: purpose (info lowongan), what is stored, that AI assists classification, deletion on request. Version string `consent_version` (config).
- WF09 records GRANTED **only** if: a CONSENT_REQUEST draft was marked DRAFT_SENT by a human (`Consent Requested At` set) AND the lead replies a deterministic YES (ya/iya/setuju/boleh/ok/oke) within `consent_window_days` (7). Writes Consent Source=WA_OPTIN, Consent Version, Consent Date. Otherwise a human sets consent manually (VERBAL_LOGGED/FORM).
- Reply NO / withdraw words → Consent=WITHDRAWN → WITHDRAWN.
- Consent is never inferred from AI.

## 6. Retention / purge
| Situation | Rule |
|---|---|
| NEW without consent | Purge After = created + `purge_no_consent_days` (14) → purge, status DORMANT `CONSENT_NOT_RECEIVED` |
| WITHDRAWN | Purge After = +`withdrawn_purge_days` (3; lets a human confirm) |
| NOT_ELIGIBLE | +`purge_not_eligible_days` (90) |
| DORMANT | +`purge_dormant_days` (180) from last activity |
| HANDOFF | never auto-purged (human-owned); flagged MANUAL_REVIEW `RETENTION_REVIEW` after 365 days |
Purge clears: Phone, Name, all applicant facts, Eligibility Result/Detail, Facts Hash, Reply Draft/Kind; sets PII Purged + date. **Lead Notes is human-only and WF09 never writes it — it must not contain PII, or humans clear it on erasure.** Keeps: Lead Key, Phone Hash (suppression/dedup), Job ID, status, dates.
**Caveat:** Notion keeps page version history; for a legal erasure request delete/archive the page manually in Notion. Purge here is operational minimisation, not certified erasure.

## 7. Legal / manual-review guardrails
Deterministic scanner (NFKC, whole-word) over inbound text **before** AI:
- WITHDRAW: berhenti, stop, unsubscribe, hapus data, hapus nomor, tidak jadi, batal, jangan hubungi.
- LEGAL_SENSITIVE: biaya, bayar, pembayaran, transfer, dp, uang muka, cicil, utang, hutang, potong gaji, jaminan, garansi, dijamin, pasti berangkat, visa, izin, legal, resmi, p3mi, sip2mi, bp2mi, kp2mi, kontrak, calo, tipu, penipuan, lapor, polisi, ilegal, asuransi, bpjs (over-triggering is the safe direction).
- Hit → lead MANUAL_REVIEW, **no draft**, AI not called. AI may add `sensitive=true` (escalate only).
- MTGI has no P3MI licence (2026-09): templates contain no licence/placement/fee/guarantee claim; template text is checked by the same banned/regulatory phrase lists as WF08 (tested). `legal_disclosure_line` is a config string the owner sets with legal advice. This is not legal advice.
- AI prompt receives only the message text (≤500 chars, digits ≥6, emails, URLs masked) — never phone/name.

## 8. Idempotency & message dedup
- Lead Key (salted sha256) uniquely identifies phone+job; duplicates across pages → `DUPLICATE_LEAD`, never auto-merged.
- Message dedup: `msg_hash` = sha256(salt | bridge message_id)[:24] in `mtg_lead_message_dedup`. Hash is committed only **after** the Notion write for that lead is read-back verified (at-least-once, effects idempotent). Same message twice (or replay after failed write) cannot create a second lead or second transition.
- Message → lead resolution: Job ref in text/bridge (`MTG-123`) → exact Lead Key, else CREATE. No job ref → single lead with same Phone Hash; none → CREATE lead in MANUAL_REVIEW `NO_JOB_REF`; several → attribute to most recently active, MANUAL_REVIEW `AMBIGUOUS_TARGET`.
- Drafts idempotent: Draft Kind + Facts Hash unchanged → not rewritten. One Notion write per lead per run; no write when nothing changed.
- Leads page cap 100 per run, newest-edited first (truncation flagged; paging belongs to WF10). Job lookups: max 40 distinct Job IDs per run; a lead whose job was not looked up is never flagged JOB_NOT_FOUND. Write cap 40 leads per run (rest deferred, hashes not committed).

## 9. Logs (no PII)
- `mtg_lead_log`: run_id, ts, lead_id, lead_key, job_id, event, from_status, to_status, reason, consent_status, intent, eligibility, draft_kind, outcome. **No phone, name, message text, facts values.**
- `mtg_lead_run_log`: counts + summary_json (counts only).
- `mtg_lead_message_dedup`: msg_hash, lead_key, first_seen.
- Shared `mtg_job_scout_error_log`: error messages sanitised (digit runs ≥6 masked).

## 10. Intake contracts
- **WhatsApp bridge (pull, UNVERIFIED contract)**: `GET whatsapp_inbox_url?since_hours=48` → `{messages:[{message_id, from, text, timestamp, job_ref?}]}`. Header-auth credential. Empty URL = skip (manual intake still works).
- **Manual**: human creates a Leads row (Phone, Name?, Job ID, Consent fields if known). WF09 normalizes phone, computes keys, sets status.

## 11. Human actions
DRAFT_SENT (clear draft, Last Contact, Consent Requested At if consent draft) · DOCS_REQUESTED · DOCS_RECEIVED · RESUME · CLOSE (→ DORMANT). Consumed once and cleared.

## 12. Schedule / safety
16:00 / 04:00 JST (after WF08), OFF. No outbound messaging node exists in WF09.

## 13. Open / unverified until live
Bridge inbox contract; Notion `select:null` clear + `phone_number` filter behaviour; Data Table `get` empty + alwaysOutputData; Merge empty-branch; Anthropic JSON reliability for intent (fallback OTHER); legality of SSW baseline rules and consent wording (needs qualified review).

## 14. Execution data (PII caveat)
n8n execution records store node inputs/outputs, which here include phone numbers, names, raw message text and drafts. The workflow is exported with `saveDataSuccessExecution: none`, `saveDataErrorExecution: all`, `saveManualExecutions: true`. For error executions (and manual test runs) n8n keeps PII until pruned: set instance-level execution pruning to a short window (`EXECUTIONS_DATA_MAX_AGE`, e.g. 72h) and restrict who can open executions. Debug live problems from node JSON + the Notion record; do not paste executions into other tools.

## 15. As built (33 nodes)
Schedule → Config → Query Leads → Inbox Configured? → (Fetch Inbox | skip) → Inbox → **Normalize Inbox** → Load Dedup → **Dedup Messages** → Needs AI? → (Prepare AI → AI Intent → Parse Intent) → Intents → **Prepare Job Lookups** → Any Job Lookups? → Job Lookup (READ) → Job Data → **Plan Leads** → Needs Write? → **Prepare Write** → Write Lead → Read-back Page → **Verify Write** → All Outcomes → Shape Lead Rows / Commit Dedup / Shape Error Rows / Run Log → data tables.
There is no outbound-message node and no node that targets the Master Job DB with anything but a read query.

Data tables: mtg_lead_log, mtg_lead_run_log, mtg_lead_message_dedup (+ shared error log). Notion: `🇯🇵 MTG — Leads / Applicants` (data source `05a640fc-dff7-4975-9b85-e818008c642e`; created at workspace level, move it where you want it).
Credentials to set: Notion MTG Integration (share the Leads DB with it), Anthropic API Key (x-api-key), WhatsApp bridge API key (header auth).

## 16. Local test coverage (t9.js — 0 assertion failures)
sha256/phone parity · normalization, in-batch dedup, deterministic scan priority (withdraw > legal > consent) · AI masking (no phone/name in prompt), AI cannot invent withdraw/legal/consent, can only escalate · create vs patch vs replay (no second lead) · consent only with sent request inside window · withdraw / NO · legal → MANUAL_REVIEW without draft · RESUME refused while trigger persists · full eligibility matrix (Unknown ≠ No, JFT, SSW baseline, license/experience, job-unknown → human) · re-evaluation on corrected facts · job not active/expired/not requested · docs → handoff reference · HANDOFF human-owned · retention/purge, no purge of HANDOFF · dormancy + revive · duplicate / ambiguous / reopen · idempotent second run = NOOP · DRAFT_SENT never re-drafts · allow-list + Master-DB field names blocked · salt guard · write cap · all templates pass phrase policy · verify (CJK) / commit only after verify · logs, errors, run log contain no PII.

## 17. Not yet verified (live test list)
Bridge inbox contract · Notion `select:null` clearing, `phone_number` round-trip, `unique_id` filter on Master DB, create-page `data_source_id` parent · Data Table get/insert behaviour with empty tables · Merge with an empty branch · `itemMatching` through Merge/IF · Anthropic output shape for haiku · consent wording and SSW baseline rules need qualified legal/ISA review · n8n execution pruning actually configured.

## 18. Addendum (post-approval notes, no rebuild)
1. `hash_salt` must be changed from `CHANGE_ME` before live (plan refuses to run otherwise). It lives only in the Config node/credentials store: never in a Notion field, a data table or a log (WF10 tests assert this). Changing it later re-keys every lead.
2. `require_ssw_baseline` default is now `false` (OFF). Turn on only after the wording/rules are verified against an official source.
3. Execution pruning: default 72 h (`EXECUTIONS_DATA_PRUNE=true`, `EXECUTIONS_DATA_MAX_AGE=72`); WF10 raises EXEC_PRUNING_UNCONFIRMED until `exec_pruning_confirmed=true` and EXEC_PRUNING_INEFFECTIVE if old executions are still stored.
