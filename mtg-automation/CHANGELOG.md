# Changelog
- 2026-10-07 handoff V1.0: WF01–WF10 built (WF02 V1.2, WF03 V1.2, others V1.0); Notion nodes patched to Header Auth (builders not yet back-ported); Phase A partial (blockers B1/B2).
- 2026-10-07 hardening pass (this branch):
  - Builders back-ported: Notion nodes now emit Header Auth (`Notion Bearer (Header Auth)`), relative paths (no scratchpad), no /tmp writes; rebuilt JSON is node-for-node identical to the handoff except the items below. WF09 builder inlines `//@LIB`.
  - Fix: Create Job Page / Create Company Page (WF01) and Company Write (WF02) no longer auto-retry — a retried create could duplicate pages (same rule WF09 already used).
  - Fix: WF01–WF08 gained the execution-data settings WF09/WF10 already had (`saveDataSuccessExecution: none`, `saveDataErrorExecution: all`, `saveManualExecutions: true`) — less PII/storage in execution history.
  - Added `tools/audit_workflows.py` (connections, orphans, notionApi remnants, Notion-Version header, JS syntax, settings, active flag).
  - Known: WF02/WF03 builders still produce V1.0 (V1.2 JSONs are hand-patched); several `t*.js` tests need fixtures not in the handoff (`hw.html`, `detail.html`) or cross-dir paths (`js5/`, `js8/`).
