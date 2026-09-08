# Recipe catalog and small-purchase operating decision

Last verified: 2026-09-08 (Asia/Taipei)

This record captures the approved production behavior for CooCoo recipe automation. It contains no credentials.

## Recommendation behavior

- Weekly planning prioritizes published recipes fully covered by current inventory and excludes recent repeats.
- Unfilled meal slots remain visible. Small-purchase candidates are shown separately and are never mixed into the plan without user confirmation.
- Small-purchase candidates may lack at most two distinct ingredients. Cost uses the whole retail package, not the recipe portion.
- The first purchase budget is NT$100. A per-run edit does not change the profile default; only the explicit save-default action persists it across devices.
- A missing, untrusted, future-dated, or older-than-30-days price is `價格待確認` and cannot be represented as within budget.
- Adding ingredients to the shopping list does not debit Dream savings. Confirmed cooking remains the savings-entry boundary.

The approved confirmation copy is:

> 這道食譜需要補買約 NT$ {amount} 的食材。這筆支出可能降低本週可存入「{goalName}」的金額，讓圓夢時間稍微延後。價格為參考值，實際結帳可能不同；系統不會自動扣除圓夢金額。要加入購物清單嗎？

Actions: `改用現有食材` and `加入購物清單`.

## Automation and AI

- Vercel serves the Web UI and rewrites API requests to Render. It does not schedule catalog work.
- Supabase Cron calls the protected Render catalog endpoint hourly. There is no separate Render Cron service.
- The worker creates work only from recent unmet demand and processes at most one candidate per hourly tick.
- OpenRouter is used for catalog generation/review and shopping analysis. The pinned model is `google/gemini-3.7-flash`.
- Catalog output is text only. Every candidate must pass the RecipePackage schema, deterministic rules, independent quality review, and independent food-safety review.
- A candidate gets at most three attempts. A budget deferral does not consume a quality retry.
- Published catalog packages use `source: catalog`; user recipe snapshots retain `catalogVersionId`.

## Reports and safety

- A food-safety report immediately quarantines the version.
- Three distinct non-safety reporters within 30 days quarantine a version and queue one revision.
- Quarantined or otherwise withdrawn versions cannot start a new cooking session.

## Operating limits

| Limit | Production value |
| --- | ---: |
| Catalog candidates | 50 per month |
| Catalog AI | NT$50 per month |
| Shopping AI | NT$100 per month |
| Combined OpenRouter usage | NT$150 per month |
| Shopping AI per user | 20 calls per day |

The teacher-provided OpenRouter credit is finite and has no automatic top-up. Database sync and published recipes remain available if AI budget or provider access is exhausted.

## Data and authorization

- Catalog service tables use RLS as deny-by-default for browser roles.
- Privileged implementations live in the private schema. Public Data API wrappers are narrow, security-invoker functions executable only by `service_role`.
- Shopping-list additions, cooking completion, inventory deduction, savings entry, and offline replay use database transactions and idempotency keys.
- Legacy local operations require an import preview and user confirmation before cloud adoption.

## Verified production state

- GitHub integration branch: `codex/coocoo-integrated-mvp`.
- Render runs the protected API/worker; Vercel production rewrites `/api/v1/*` to it.
- Supabase job `coocoo-recipe-catalog-hourly` is active at `0 * * * *` and the catalog control is unpaused.
- A real OpenRouter catalog run published `家常洋蔥炒豬肉蓋飯` only after all three reviews passed.
- A real shopping-analysis run completed through OpenRouter.
- The initial live-test cost recorded by CooCoo was NT$0.8918175 using a fixed internal USD/TWD rate of 35.
- The reference-price seed contains 25 traceable common ingredients observed on 2026-09-08. It is a starter set, not a live retailer guarantee; each row expires after 30 days unless an owner refreshes it.

## Remaining acceptance work

- Run the two recommendation modes, NT$100 default/save behavior, reminder, purchase confirmation, cooking completion, and idempotent savings flow end to end on the production mobile UI.
- Verify offline package use, reconnect sync, legacy import preview, conflict acknowledgement, receipt OCR, and fresh OAuth login on iPhone Safari and Android Chrome.
- The seven-day natural-demand monitor starts on 2026-09-09 at 10:00 Asia/Taipei. It checks the previous 24 hours daily and stays quiet unless worker failures, a stale heartbeat, unexpected AI use, duplicate candidates, or 80% budget use require action. Its seventh run produces the week report.
- The Owner catalog view uses the live NT$50 catalog budget and 50-candidate limit. It lists failed jobs, actual and reserved cost, reports, quarantine/review actions, and price-expiry warnings from day 23; prices older than 30 days remain ineligible for budget claims.
- Enable Supabase leaked-password protection before password login is offered.
