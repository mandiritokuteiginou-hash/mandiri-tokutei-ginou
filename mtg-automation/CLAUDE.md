# CLAUDE.md — working rules

- Read `docs/MTG_CLAUDE_CODE_HANDOFF_V1.0.md` first. Artifacts outrank the summary. Mark unknowns VERIFY; never invent.
- First task is read-only: reconstruct, list gaps/inconsistencies/VERIFY items, propose repo structure. Do not rebuild or redesign workflows (WF09 locked).
- Never activate schedules, publish live, build WF11, or commit secrets/hash_salt.
- Integration test order: Phase A → B → C → D (D only on explicit owner approval).
- Owner: Afandi; casual Indonesian-English; wants concrete files, minimal questions, one deliverable at a time.

First prompt: "Read MTG_CLAUDE_CODE_HANDOFF_V1.0.md and all referenced artifacts. Do not modify anything yet. Reconstruct the architecture, identify missing artifacts, inconsistencies, and unresolved VERIFY items. Then report your findings and proposed repository structure. Do not rebuild or redesign any workflow."
