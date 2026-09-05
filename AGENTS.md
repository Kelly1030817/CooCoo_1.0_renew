# CooCoo cross-model working agreement

This repository is the source of truth for the CooCoo integrated MVP. These rules apply to every coding assistant or engineer working here.

## Read before changing code

1. Read `CONTEXT.md` for product terminology and non-negotiable rules.
2. Read `docs/PROJECT_HANDOFF.md` for the verified implementation status and backlog.
3. Read `docs/product-decisions/2026-08-25-coocoo-mvp-direction.md` for product intent and version history.
4. Inspect the active branch and dirty worktree. Never assume a historical test or deployment result is current.

## Repository boundaries

- `codex/coocoo-integrated-mvp` is the active integration branch.
- `main` is the TypeScript architecture baseline.
- `legacy-720-development` is preserved for visual and behavior comparison. Do not rewrite or delete it.
- Preserve the approved five-page mobile navigation and page-level CSS isolation. Discuss broad product, architecture, or page-boundary changes before implementation.
- Never commit `.env.local`, OAuth credential JSON, API keys, Supabase secret keys, generated `dist`, `.next`, `.vercel`, or `node_modules` content.

## Evidence and status language

- Local tests prove local behavior only. They do not prove Google OAuth, Supabase cloud sync, Preview deployment, or mobile-browser behavior.
- Mark incomplete or manually unverified work as `待驗證` or `未完成`; do not describe it as delivered.
- A real AI failure must return a clear fallback or error. Never label deterministic fixture data as Gemini or OpenRouter output.
- Run `bun run verify` before handing off code. Record any narrower verification boundary explicitly.

## Development commands

```bash
bun install
bun run --cwd apps/api dev
bun run --cwd apps/web dev -- --host 127.0.0.1
bun run verify
```

Environment variable names and Preview setup are documented in `.env.example` and `docs/PREVIEW_SETUP.md`; values belong only in ignored local or deployment-secret storage.
