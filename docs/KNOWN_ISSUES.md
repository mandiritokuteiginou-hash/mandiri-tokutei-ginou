# Known Issues

1. Unauthenticated `/admin` responds 200 + meta-refresh redirect when Supabase env is missing (streamed redirect); with Supabase configured, middleware issues a 307. Verify in live env.
2. Rate limiter is in-memory per instance — not effective on serverless at scale; needs shared store before production.
3. CSP uses `'unsafe-inline'` for scripts/styles (Next inline bootstrap); move to nonce-based CSP in Phase 8.
4. Primary nav points to routes not yet built (404).
5. `next lint` is deprecated in Next 16; migrate to ESLint CLI.
6. DB tests run on a stub `auth` schema, not real Supabase GoTrue; re-verify on a Supabase dev project.
7. No PWA icons/service worker yet (manifest only).
