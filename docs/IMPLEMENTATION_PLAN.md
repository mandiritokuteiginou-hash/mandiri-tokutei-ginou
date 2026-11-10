# MTG Super App — Implementation Plan & Backlog

Status legend: ☐ not started · ◐ in progress · ☑ done (implemented **and** tested)

## Phase 0 — Discovery

☑ Audit, architecture, DB design, security plan, plan (this folder).

## Phase 1 — Foundation (current)

- ☑ Monorepo (npm workspaces), TS strict, ESLint, Prettier
- ☑ `packages/shared`: permission matrix + `can()` (unit tested)
- ☑ `packages/validation`: auth/profile schemas (unit tested)
- ☑ `supabase/migrations/0001_foundation.sql` with RLS + seed roles/permissions
- ☑ `apps/web`: Next.js app, Tailwind design tokens (Navy/White/Japanese Red), reusable UI primitives
- ☑ i18n (id/ja) with message catalogs
- ◐ Public layout + Admin layout; error/loading/empty states
- ◐ Auth pages (login/register done; reset/verify pending) + Supabase client wiring (needs credentials to run end-to-end)
- ☑ Security headers, basic rate limiter, structured logger
- ◐ CI workflow (written, not yet run) (lint, typecheck, test, build)
- Acceptance: registration/login/roles working **against a real Supabase project** — blocked on B-2/B-4 for the live part; local checks are unit tests + build.

## Phase 2 — Candidates & Jobs

Candidate schema + RLS + document upload · Notion Master Job read-only importer with reconciliation report · job portal, filters, detail · QC workflow + controlled publication · admin candidate/job management.

## Phase 3 — Matching

Eligibility engine (PASS/FAIL/UNKNOWN) · weighted scoring · salary evaluation (configurable baseline + min-wage table) · results store · human review UI. _Core engine is pure TS and can be built and fully unit-tested without any external service — scheduled early inside Phase 1/2 if desired._

## Phases 4–8

CRM → Employer portal → Learning & Community → AI OS (provider abstraction, n8n/WAHA adapters, mocks labelled) → Production readiness (perf, security review, E2E, backup/recovery drills, deploy automation).

## Approval gates (never auto-executed)

Production DB changes · restoring `mtg-production` · activating n8n schedules · sending WhatsApp/email · publishing jobs · enabling regulated placement · paid API/subscription changes.
