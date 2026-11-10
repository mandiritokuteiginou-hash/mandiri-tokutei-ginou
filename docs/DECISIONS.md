# Decisions

- D-001 Modular monolith in an npm-workspaces monorepo at the repo root (not a nested `mtg-super-app/`).
- D-002 RLS in Postgres is the enforcement layer; TS permission matrix mirrors the SQL seed and a test enforces sync.
- D-003 `legal_operating_mode` defaults to `information_only`; messaging dry-run defaults to true.
- D-004 _(proposed, needs owner confirmation)_ Job/candidate status mappings in DATABASE_DESIGN.md §4.
- D-005 Signup role comes from user metadata but the DB trigger downgrades anything other than job_seeker/student/employer.
- D-006 Locale via cookie (no URL prefix) with next-intl; `id` default.
- D-007 Every admin page/action must call `requirePermission` itself; layout checks are not trusted.
- D-008 Notion remains the job system of record until an approved cut-over; import is read-only/idempotent.
- D-009 _(proposed, needs owner confirmation)_ Notion→app field mappings in NOTION_COMPARISON_REPORT.md §3–§6. Key principle: unstated source facts become UNKNOWN; Notion `PUBLISHED` is not trusted without QC approval; salary min/max is gross of unknown composition.
- D-010 Matching is a pure, deterministic function (`evaluateMatch`) with a versioned rule set; AI input is accepted only by `rankMatches` as a bounded (+/-5) tie-breaker inside an eligibility class and can never alter gates.
- D-011 Hard gates: consent, job verification, Kokunai/Kokugai pool, COE support (Kokugai), SSW skill + language (or Intern-2 same-sector exemption), mandatory JLPT/certificates/experience/skills, explicit candidate mobility limit. Gijinkoku never auto-FAILs. SSW thresholds (JLPT N4) are configurable and **need legal confirmation**.
- D-012 Local minimum-wage data is never hard-coded; it must be supplied from an official source via `MinimumWageTable`. Without it the salary verdict is REVIEW, not ACCEPTABLE.
- D-013 Matching results, QC reviews, audit events and the consent ledger are append-only (RLS has no update/delete policy + immutability triggers).
- D-014 Notion client is read-only by construction (endpoint allowlist; no write methods exist).
- D-015 PR #6 stays a draft and is not merged; `vercel.json` only makes preview builds work. Production domain is untouched.
