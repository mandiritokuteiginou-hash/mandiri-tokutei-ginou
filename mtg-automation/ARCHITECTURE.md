# Architecture (short)

Notion Master DB = single source of truth. WF01 discovery → WF02 QC → WF03 canonical → WF04 enrich → WF05 content → WF06 content QC → WF07 image → WF08 distribution (DRY_RUN default, hash-bound legal gate, PUBLISHING lock). WF09 leads (separate Leads DB, draft-only, Master read-only). WF10 monitoring/recovery (no Notion writes).
Hash chain: fact_hash → Content Hash → Image Build Hash → Distribution Hash.
Deterministic gates outrank AI; AI may only lower/escalate. Details: handoff §2, §9, §10.
