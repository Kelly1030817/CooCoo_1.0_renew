# CooCoo 1.0 實作交接

- 更新：2026-09-13
- 現行產品依據：[`../CONTEXT.md`](../CONTEXT.md)、[`product-decisions/2026-09-11-coocoo-v1-brand-product-reset.md`](product-decisions/2026-09-11-coocoo-v1-brand-product-reset.md)
- 本次發布分支：`codex/today-ticket-fusion-fix`（由 `origin/main@6547304` 建立）
- 發布目標：GitHub `main` 與 Vercel Production；正式站結果須以發布後瀏覽器查核為準

## 唯一產品方向

「陪你從冰箱裡，煮出自己的生活節奏。」

精確冰箱 → 三道可行推薦 → 選食譜／補買 → 料理 → EXP／徽章 → 再次回來。固定五頁為今日、採買、冰箱、食譜、我的。

## 2026-09-13 本次發布內容

- Today 以 `apps/web/public/today-ticket-fusion.html` 為視覺基準：深石板藍票根、兩種票券模式、三個可行方向、熟食列、三項今日任務與獨立週節奏列。
- `/api/v1/state` 現在回傳固定三項唯讀 `missions`；完成狀態依台北日期從既有 EXP 事件與庫存推導，不新增資料表。
- `weekly_rhythm` 不再出現在今日任務，週進度只留在獨立進度列。
- 「今日第 N 餐」只計算今天的有效餐次，並以 `Asia/Taipei` 處理跨午夜事件。
- 「我的」新增本週逐餐明細，將 `mealPlan.meals` 與 `cookingOutcomes` 合併顯示，不修改既有餐單資料。
- 五步 Onboarding 以 `output/onboarding-audit/chef-consultation-5step-proposal.html` 為視覺基準，保留主廚心情、卡片、計數器、標籤、精確冰箱、親簽與蓋章動態。
- Onboarding 仍使用既有 `/onboarding`、`/inventory`、收據 OCR、Supabase Auth 與 `save_onboarding_profile`，過敏／禁食維持後端硬限制。
- 蓋章後才送出完成資料，完成後進入「今日」。

## 後端與資料庫邊界

- 本次不新增 migration、不改資料表。
- Onboarding 寫入既有 `profiles`、`cookware`、`dietary_restrictions`、`weekly_goals_v2`、`notification_preferences`；確認空箱時依既有 RPC 規則清除該帳號庫存。
- OCR 仍先建立草稿，使用者逐項確認數量、單位、位置與期限後才入庫。
- 任務為 `/state` 回應的衍生資料，不可由前端切換，也不直接寫入資料庫。

## 驗證

- 2026-09-13 `bun run verify`：149 tests、Web build、API typecheck 與 PGlite migration 全數通過。
- Playwright 以 390 × 844 viewport 實際走過五步 Onboarding、空箱、蓋章、進入 Today、Today 三任務票券與「我的」週餐次區塊。
- viewport 模擬不等於 iPhone Safari／Android Chrome 真機驗收。
- Google OAuth、正式帳號 OCR、OpenRouter、Push、離線重播與同步衝突仍須在正式服務以測試帳號驗證。

## 本機操作

```bash
bun run --cwd apps/api dev
bun run --cwd apps/web dev -- --host 127.0.0.1
bun run verify
```
