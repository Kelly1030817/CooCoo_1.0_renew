# CooCoo 煮煮 integrated MVP

CooCoo helps budget-conscious renters and frequent takeout diners decide what to cook, buy the right quantities, cook safely in a small kitchen, and track confirmed savings toward a personal dream.

## Start here

- Product terms and invariants: [`CONTEXT.md`](./CONTEXT.md)
- Verified implementation status and backlog: [`docs/PROJECT_HANDOFF.md`](./docs/PROJECT_HANDOFF.md)
- Product decisions and version history: [`docs/product-decisions/2026-08-25-coocoo-mvp-direction.md`](./docs/product-decisions/2026-08-25-coocoo-mvp-direction.md)
- Preview and mobile acceptance: [`docs/PREVIEW_SETUP.md`](./docs/PREVIEW_SETUP.md)

## Workspace

- `apps/web`: React + Vite mobile Web/PWA.
- `apps/api`: Bun + Elysia `/api/v1` backend.
- `packages/contracts`: shared runtime schemas and TypeScript types.
- `packages/core`: product rules independent of UI and storage.
- `supabase`: schema migrations and local Supabase configuration.

## Local development

```bash
bun install
bun run --cwd apps/api dev
bun run --cwd apps/web dev -- --host 127.0.0.1
```

The two development servers run separately:

- Web: `http://127.0.0.1:5173/today`
- API health: `http://127.0.0.1:3000/api/v1/health`

Copy variable names from `.env.example`; keep real values only in ignored local environment files or deployment secret storage.

## Verification

```bash
bun run verify
```

This runs Web lint, all unit/contract tests, the Web production build, and API typecheck. Passing locally does not prove cloud authentication, Preview deployment, or mobile offline behavior; see the handoff document for current evidence boundaries.
