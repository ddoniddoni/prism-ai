# Prism AI

> Ask your data. Build your dashboard.

Prism AI is a Generative Analytics Dashboard for synthetic e-commerce data. It
turns supported natural-language questions into a validated analysis plan and a
data-backed dashboard. AI selects from an allowlist; deterministic application
code calculates every displayed business number.

## Status

Phase 0 (Bootstrap) is complete. The project runs with local, mock-first
defaults and does not require a Gemini or Supabase key.

## Stack

- Next.js App Router, React, TypeScript strict, Tailwind CSS, and shadcn/ui
- TanStack Query for server state
- Zod for environment and AI-output validation
- Vitest, React Testing Library, and Playwright

## Requirements

This bootstrap was created with Node.js `v26.4.0` and npm `11.17.0`. Use npm
only; the committed lockfile is `package-lock.json`.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run test:e2e
```

Run `npx playwright install` once before the E2E command if a Playwright
browser is not already installed.

## Documentation

The supplied project guidance lives in `AGENTS.md` and `docs/`:

- `docs/PROJECT_SPEC.md` — product and user experience scope
- `docs/ARCHITECTURE.md` — module boundaries and request flow
- `docs/ANALYTICS_AI_SPEC.md` — allowlisted analytics and AI schemas
- `docs/IMPLEMENTATION_PLAN.md` — phased implementation plan
- `docs/QUALITY_GUIDE.md` — testing, security, accessibility, and performance
- `docs/PROGRESS.md` — implementation status and verification history
