# Known Issues

1. Unauthenticated `/admin` responds 200 + meta-refresh redirect when Supabase env is missing (streamed redirect); with Supabase configured, middleware issues a 307. Verify in live env.
2. Rate limiter is in-memory per instance — not effective on serverless at scale; needs shared store before production.
3. CSP uses `'unsafe-inline'` for scripts/styles (Next inline bootstrap); move to nonce-based CSP in Phase 8.
4. Primary nav points to routes not yet built (404).
5. `next lint` is deprecated in Next 16; migrate to ESLint CLI.
6. DB tests run on a stub `auth` schema, not real Supabase GoTrue; re-verify on a Supabase dev project.
7. No PWA icons/service worker yet (manifest only).
8. Vercel project `mandiri-tokutei-ginou` had no framework preset (build failed with STATIC_BUILD_NO_OUT_DIR). Mitigated in-repo via root `vercel.json`. The project also has the production domain attached; **merging to main will deploy this app there** — owner must confirm before merge, and may prefer Root Directory = `apps/web` in project settings (not changed by us).
9. Notion SQL/row queries were rate-limited (allowance exhausted); Master Job v1/v2 row-level comparison is NOT done. Re-run after the allowance resets.
10. Real Supabase Auth has never been run; only fake-client unit tests and SQL tests exist (see AUTH_E2E_TEST_PLAN.md).
11. Minimum-wage table is not populated (needs an official source + effective date); until then every job's salary verdict is at best REVIEW.
12. Imported Notion jobs have no base-pay field, so the ¥200,000 baseline cannot be assessed automatically (see NOTION_COMPARISON_REPORT.md §3).
13. SSW eligibility defaults (JLPT N4 / JFT-Basic A2 / Intern-2 exemption) are engineering defaults awaiting legal review.
14. No importer or job/candidate UI exists yet; engine, schemas and mapper are libraries only.
15. Storage bucket + storage policies for candidate documents are not created yet (metadata table only).
16. Matching skill-test data from the Candidate Pool is lossy (one status, many fields) — importer rule pending.
