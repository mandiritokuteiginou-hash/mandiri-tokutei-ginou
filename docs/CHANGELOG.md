# Changelog

## 0.1.0 — 2026-11-10 (unreleased)

- Phase 0 documentation set.
- Foundation: monorepo, RBAC package, validation package, foundation migration + RLS tests, Next.js app shell with i18n (id/ja), auth actions, admin shell, security headers, CI.

## 0.2.0 — 2026-11-10 (unreleased)

- Matching engine (`packages/shared/src/matching`): gates, salary evaluation, scoring, ranking, duplicate detection; sector normaliser.
- Migrations 0002–0005: sync/provenance, candidates (+PII, consents), companies/jobs (+QC, audit, publication guard, public view), matching storage; RLS integration test.
- `packages/integrations`: read-only Notion client + Notion→Job mapper (fictional fixtures only).
- Auth: password reset, callback route, testable auth service, dev Supabase config, E2E plan, dev environment guide.
- Notion comparison report.
