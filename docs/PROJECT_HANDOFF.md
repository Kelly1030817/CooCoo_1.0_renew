# CooCoo integrated MVP handoff

Last verified: 2026-09-06 (Asia/Taipei)

This is the canonical cross-model handoff. It summarizes decisions and evidence; it is not a verbatim chat transcript and contains no credentials.

## Product and success criteria

CooCoo serves budget-conscious renters and frequent takeout diners who want help deciding what to eat, shopping for the right quantities, cooking in a small kitchen, and seeing the money and healthy habits they actually achieved.

The core loop is:

`設定目標 → 決定今日／本週餐點 → 採買 → 入庫 → 離線料理 → 確認省錢 → 圓夢與健康進度`

Primary measures are fewer takeout meals and confirmed money saved. Health measures are self-cooked meals eaten and distinct vegetables actually eaten; the MVP must not estimate sodium, fat, disease risk, or medical outcomes.

## Confirmed decisions

- Build one integrated product on the TypeScript `main` architecture while selectively carrying over the mobile cards, 主廚相談室, 圓夢通行證, cooking steps, and celebration behavior from `legacy-720-development`.
- Keep both original branches intact for comparison and recovery.
- The fixed mobile navigation has five separate pages: 今日、採買、冰箱、廚房、圓夢. Page-specific UI and CSS must stay isolated.
- Onboarding is mandatory and collects servings, cookware including a free-text `其他`, hard dietary restrictions, current ingredients, daily meal budget, meal slots, weekly cooking target, dream name/amount, and sign-in.
- Recommendations must apply hard restrictions first, then cookware, expiring inventory, budget, time/energy, and cross-meal ingredient overlap.
- Shopping advice gives ingredients and quantities only; real retailer products, live prices, promotions, and ordering are outside MVP.
- Receipt OCR accepts itemized photos/screenshots, requires user correction and confirmation before inventory entry, and must not fake success.
- Cooking uses one large step per screen, button alternatives for every voice command, timers, wake lock where available, and an offline package downloaded before cooking begins.
- AI may require network access. The active cooking flow must remain usable after its core package is stored locally.
- Developer controls are development-only. Invite administration is a protected owner function, not a developer menu.

Definitions and invariants are in `CONTEXT.md`.

## Branch roles

| Branch | Role | Rule |
| --- | --- | --- |
| `codex/coocoo-integrated-mvp` | Active integrated implementation | Continue work here. |
| `main` | TypeScript contracts/core/API/Web baseline | Do not silently replace with legacy code. |
| `legacy-720-development` | Rich legacy UI and behavior reference | Preserve unchanged; port only selected behavior. |

At this handoff, `main` and the integration branch shared commit `ebd8d49` before the three local handoff commits. No push or deployment is implied by these commits.

## Verified implementation status

### Implemented and locally verified

- Shared TypeBox contracts and core rules for onboarding, dietary restrictions, meal plans, ingredients, receipts, recipe packages, cooking sessions, servings, savings, offline operations, conflicts, and beta invites.
- Elysia `/api/v1` backend with authenticated Supabase repositories for onboarding/profile, goals, inventory, shopping, settings, receipts, cooking completion, account export/deletion, AI usage, and invite administration.
- Today decision and persisted weekly meal-plan APIs, idempotent weekly creation, quantity-aware inventory coverage, overlap rate, expiry warnings, postpone/specific-date/cancel operations, and optimistic concurrency conflicts.
- OpenRouter shopping analysis receives the user's inventory, restrictions, and budget. It uses deterministic safe rules after provider failure and labels that fallback honestly.
- Gemini recipe generation produces a full `RecipePackage`; fallback uses reviewed brand recipes and is never labeled as Gemini output.
- Gemini receipt recognition parses structured OCR fields with per-field confidence and fails closed on invalid JSON, pure QR images, or non-itemized content.
- Five real frontend routes with separate Today and Shopping CSS, mandatory ten-step onboarding with tag-based individual flavor input and custom cookware, auth recovery, card-based shopping UI, recipe package cooking flow, and dream dashboard integration.
- PWA manifest/service worker, IndexedDB recipe packages, Cache Storage images, wake-lock attempt, voice commands where supported, and an offline operation queue foundation.
- Published-recipe catalog foundation: inventory-only and opt-in small-purchase recommendations, NT$100 user default, whole-package reference pricing, explicit dream-goal spending reminder, owner controls, quality/safety reports, and text-only scheduled generation with a NT$300 monthly reservation cap.
- Demand-driven catalog jobs use three gates (deterministic rules, independent quality review, independent food-safety review), no more than 50 candidates per month, and defer budget-blocked work without consuming a retry.
- Offline cooking replay is bound to the signed-in user and operation ID; unowned legacy operations require a visible preview and confirmation before adoption.
- Local verification on 2026-09-06: `bun run verify` passed 114 tests across 20 files, lint, Web production build, API typecheck, and all migrations in PGlite.

### Cloud evidence

- Supabase project `cpyvizycjvburtpljxiu` has five applied migrations: integrated schema, advisor hardening, persisted goal/meal-plan settings, recipe catalog automation, and catalog advisor indexes.
- Catalog tables and private transaction implementations are live with browser execution revoked; `recipe_catalog_control.paused` remains enabled until seed, price-reference, and Preview checks finish.
- A rollback-only remote transaction verified goal create/update/read, immutable amount events, idempotent weekly plan creation, recipe persistence, and meal rescheduling without retaining test data.
- Sensitive RPC execution is restricted to database administration and `service_role`.
- Security Advisor had one warning: leaked-password protection is disabled. Beta currently uses Passwordless/Google; enable it before offering password login.
- Vercel production deployment is active at `https://coocoo-marketing.vercel.app`, routing `/api/v1/*` to `https://coocoo-1-0-renew.onrender.com/api/v1/:match*` with SPA fallback.

### Awaiting verification or implementation

- Google OAuth configuration exists, and local recovery tests pass, but a fresh end-to-end Google login must be rechecked in the target Preview domain before calling it complete.
- Receipt upload/OCR/correction/confirmation needs full browser-to-cloud mobile acceptance with a real receipt image.
- `/sync`, idempotent cooking replay, conflict acknowledgement, and legacy-operation preview are implemented locally; mobile reconnect acceptance remains pending.
- Flight-mode cooking, timer restoration, missing-image fallback, wake-lock behavior, and one-time reconnect sync still require iPhone Safari and Android Chrome testing.
- Render API Preview, Vercel Web Preview, cold-start measurement, Preview rewrites, and production deployment are not complete.
- The Render Blueprint defines an hourly catalog Cron Job, but the service and its secrets are not verified in Render yet. The initial catalog seed runs idempotently from the deployed API/worker; no unsourced price rows are inserted.
- The brand marketing-site source has not been migrated into this TypeScript workspace; local `marketing-site/.next` and `coocoo-webapp/dist` are generated remnants, not source of truth.

## Public API inventory

All endpoints use `/api/v1` and the shared success/error envelopes.

- Profile/auth data: `/profile`, `/onboarding`, `/session`
- Planning: `/meal-plans`, `/meal-plans/meals/:id`, `/meal-decisions/today`
- Shopping: `/shopping-items`, `/shopping/analyze`, `/shopping/restock`, `/shopping/parse`
- Inventory/settings: `/inventory`, `/inventory/:id/rescue`, `/settings/fridge`, `/settings/cookware`
- Receipts: `/receipts`, `/receipts/:id/recognize`, `/receipts/:id/confirm`
- Recipes/cooking: `/recipes/generate`, `/recipes/:id/package`, `/cooking/outcomes`
- Recipe catalog: `/settings/recipes`, `/recipes/recommendations`, `/recipes/:id/start`, `/recipes/:id/purchases`, `/recipes/:id/report`, `/admin/recipes/*`
- Offline sync: `/sync`, `/sync/conflicts`, `/sync/conflicts/:id/acknowledge`
- Goals/account/admin: `/goals`, `/goals/:id/amount-events`, `/exports`, `/admin/invites`

`/sync` and recipe catalog/settings/admin endpoints are implemented. A dedicated `/dashboard` endpoint remains unimplemented; the current dashboard state is assembled through `/state`.

## Local operation

Requirements: Bun 1.3.x. Install dependencies with `bun install`.

Run the API and Web in separate terminals:

```bash
bun run --cwd apps/api dev
bun run --cwd apps/web dev -- --host 127.0.0.1
```

- Web: `http://127.0.0.1:5173/today`
- API health: `http://127.0.0.1:3000/api/v1/health`
- Full local verification: `bun run verify`

The Web uses `VITE_USE_REAL_API=true` in an ignored development-local file to proxy `/api` to port 3000. Use `.env.example` for variable names only.

## Credential boundary

- Browser-visible values: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Server-only values: `SUPABASE_SECRET_KEY`, legacy `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`.
- Never paste credential values into issues, documents, commits, screenshots, or model prompts. Keep them in ignored local files or deployment secret stores.
- Google OAuth JSON and all `.env.local` files are intentionally ignored.

## Recommended next delivery order

1. Deploy the updated API and paused catalog Cron Job, then verify the curated seed and add traceable reference prices.
2. Run real receipt OCR from mobile upload through confirmed inventory entry and private-image access checks.
3. Complete flight-mode cooking, legacy-operation preview, conflict acknowledgement, and reconnect acceptance on both target mobile browsers.
4. Verify Render and Vercel Previews, exact redirect/rewrite URLs, cold start, and OAuth/cloud acceptance before enabling catalog generation.
5. Give 10–30 invited testers the Preview only after the full acceptance checklist in `docs/PREVIEW_SETUP.md` passes.

## Handoff protocol

Before changing code, read `AGENTS.md`, `CONTEXT.md`, and this file; inspect branch/status; then verify the exact module involved. After changing code, run relevant focused tests followed by `bun run verify`. Report local, cloud, Preview, and production evidence separately. Never infer deployment or user-visible completion from local tests.
