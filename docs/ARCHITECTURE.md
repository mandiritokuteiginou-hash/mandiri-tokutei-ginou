# MTG Super App — Architecture

## 1. Style

Modular monolith. One Next.js app (`apps/web`) with business logic isolated in framework-free packages. Supabase (Postgres, Auth, Storage, Edge Functions) is the backend. No microservices.

## 2. Repository layout

```
apps/web/              Next.js (App Router, TS strict, Tailwind) — UI + route handlers
packages/shared/       Pure domain logic: permissions/RBAC, eligibility + matching engine, salary eval
packages/validation/   Zod schemas shared by UI, API, and importers
packages/types/        Generated DB types + shared TS types
supabase/migrations/   Versioned SQL migrations (forward-only, reviewed)
supabase/functions/    Edge Functions (webhooks, scheduled jobs — disabled by default)
tests/{unit,integration,e2e}/
docs/
.github/workflows/     CI (lint, typecheck, test, build)
```

Rule: `packages/*` never import from `apps/*`; UI never contains eligibility/permission logic.

## 3. Module map (logical, inside the monolith)

auth/users · candidates · jobs (master) · matching · crm · employers · learning · community · career-services · notifications · admin · ai-os · integrations. Each has: `schema` (SQL), `domain` (packages/shared), `service` (server-side), `routes` (UI + API).

## 4. Authorization (defense in depth)

1. **Postgres RLS** is the enforcement layer (candidate sees own rows; employer sees only consented, application-linked candidates; internal roles via permission grants).
2. **Permission service** (`packages/shared/permissions`) — role → permission matrix, checked server-side in route handlers/server actions.
3. **UI** hides what the user cannot do (convenience only, never the control).
   Roles: public (`job_seeker`, `student`, `employer`) and internal (`super_admin`, `admin`, `recruitment_officer`, `education_admin`, `content_manager`, `customer_support`, `ai_ops_manager`).

## 5. Data flow & integrations

- Postgres = operational source of truth for the _new_ app.
- **Notion Master Job DB → Postgres** via an idempotent, read-only importer (`integrations` module): keyed on Notion page ID + Job Number, writes `sync_runs` + provenance (`source_system`, `source_ref`, `source_hash`). Notion stays authoritative for jobs until an approved cut-over.
- Google Sheets and n8n: adapters behind interfaces; **mock adapters are labelled and off by default**. No schedule activation without approval.
- Matching results are stored in `matching_results` with `rule_version` and `input_snapshot`, never mutating candidate/job rows.

## 6. AI layer

`AiProvider` interface → adapters (Anthropic, OpenAI, Mock-for-dev). Model chosen via `system_settings`/env, never hard-coded. Agents declare tools, permission scope, I/O schemas, approval rules; every run logged in `ai_runs` (tokens, cost, status). Agents get **no direct DB write/delete**; they propose actions into an approval queue.

## 7. Matching engine (deterministic first)

Hard gates → `PASS | FAIL | UNKNOWN` (UNKNOWN is never PASS; optional-missing never FAILs). Weighted score (skills 25, Japanese 20, salary 20, experience 15, location 10, preferences 10) computed only for non-FAIL candidates; salary baseline ¥200,000 is configurable and never sufficient alone. Pure functions → reproducible; output includes `rule_version`.

## 8. i18n

`next-intl`, locales `id` (default) and `ja`. No hard-coded UI strings.

## 9. Environments

dev / staging / prod: separate Supabase projects and Vercel environments; secrets only in env vars (`.env.example` lists names). Production changes require approval.

## 10. Observability

Structured JSON logger, request IDs, error boundary pages, `audit_logs` for security-relevant events, `ai_runs` for AI cost.
