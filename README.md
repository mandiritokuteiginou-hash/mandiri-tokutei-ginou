# Mandiri Tokutei Ginou (MTG) Super App

AI-assisted Japan career & talent platform for Indonesian workers. Modular monolith: Next.js + Supabase.

```
npm install
npm run lint && npm run typecheck && npm test && npm run build
cp .env.example apps/web/.env.local   # fill in Supabase values; never commit secrets
npm run dev --workspace apps/web
```
Docs: `docs/` (start with PROJECT_STATUS.md, PROJECT_AUDIT.md, ARCHITECTURE.md). DB tests: `tests/integration/README.md`.
Status: early development — see docs/PROJECT_STATUS.md for what is and is not verified.
