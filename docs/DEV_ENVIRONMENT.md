# Development Environment (separate from production)

**Rules:** never use `mtg-production` (paused, untouched) or any production credential. Development uses its own Supabase project or a local stack. Secrets live only in `apps/web/.env.local` / CI secrets; `.env.example` lists names only.

## Status

| Item                                     | Status                                                                                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dedicated Supabase _development_ project | **NOT CREATED** — creating a project is an owner action (may incur cost / needs org approval).                                                      |
| Local Supabase stack (Docker + CLI)      | **Not available in the agent sandbox** (no Docker daemon, no CLI). Works on a developer machine.                                                    |
| Migrations                               | Plain SQL in `supabase/migrations/` (0001–0005), applied and tested on a scratch Postgres 16 with a stub `auth` schema; run in CI (`database` job). |
| Real Supabase Auth (GoTrue)              | **Never exercised.**                                                                                                                                |

## Setup on a developer machine (local stack)

1. Install Docker and the Supabase CLI.
2. `supabase start` (uses `supabase/config.toml`: email confirmation on, 10+ char passwords), then `supabase db reset` (applies all migrations).
3. Copy `.env.example` → `apps/web/.env.local`; fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `supabase status`; `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
4. `npm run dev --workspace apps/web`. Verification/recovery emails appear in the local Inbucket mail UI (nothing is sent externally).

## Setup with a hosted dev project (owner action)

1. Create a new Supabase project named e.g. `mtg-dev` (not `mtg-production`).
2. Auth settings: enable email confirmations; password min 10; set Site URL and redirect `…/auth/callback`; keep Google disabled until client credentials exist.
3. Apply migrations through the reviewed CLI flow (`supabase db push` against the dev project ref only). Production receives migrations only after review/approval.
4. Provide the URL/anon key via env vars. Do **not** paste keys in chat or commit them.
5. Then run the E2E plan in `AUTH_E2E_TEST_PLAN.md`. Until it passes, real authentication is **not** claimed to work.

## Hard rules for this repo

- No external side effects by default: `MESSAGING_DRY_RUN=true`, mock AI provider, Notion client is read-only, no n8n activation.
- Service-role key: server/CI only.
