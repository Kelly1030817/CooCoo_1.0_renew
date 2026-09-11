# CooCoo 1.0 實作交接

- 更新：2026-09-11
- 現行產品依據：[`../CONTEXT.md`](../CONTEXT.md)、[`product-decisions/2026-09-11-coocoo-v1-brand-product-reset.md`](product-decisions/2026-09-11-coocoo-v1-brand-product-reset.md)
- 工作分支：`codex/coocoo-v1-visual-lock-preview`（由 `main@d9bdec9` 建立）
- 狀態：本機獨立 Preview 實作；尚未提交、推送、部署或套用 Supabase migration

## 唯一產品方向

「陪你從冰箱裡，煮出自己的生活節奏。」

精確冰箱 → 三道可行推薦 → 選食譜／補買 → 料理 → EXP／徽章 → 再次回來。

五頁固定為今日、採買、冰箱、食譜、我的。CooCoo 1.0 沒有舊用戶相容期；圓夢、願望金額、入帳、強制預算與 `/goals` 已從現行 UI、API、contracts 及 core 移除。成本只是選用紀錄，不影響 EXP。

## 本機已實作

- 五步 Onboarding v2，包含手動／發票 OCR 精確冰箱與空箱路徑。
- 五步 Onboarding、食譜與我的頁已鎖回正式站暖米白／陶土橘／深藍／鼠尾草綠色票與圓角卡片語言。
- Today 三種固定推薦角色；空箱使用「從零也能開始」。
- 找食譜／自由搭配、搜尋、分類、收藏、全符合優先、缺料與調整確認。
- MealTask 串接食譜、採買與補貨；必買品項全數補齊後才進入 `ready`。
- 料理完成以 operation ID 防重，扣庫存、建立已吃／熟食品項、可選成本、EXP、週進度與徽章。
- 五職階、12 枚徽章、週獎勵最多一次、目標可調整且未達不扣分。
- 提醒每週最多三則、每類一次、21:00–09:00 安靜；首次成功料理後才詢問 Web Push 權限。
- 「我的」可逐類開關提醒，並提供料理歷程、可選成本、廚具、帳號與主廚檔案入口。
- 冰箱即期食材可直接帶入食譜頁的自由搭配備料盤。
- 主廚相談室最近 10 次可刪除；每日 30 則與月 NT$100 由預算閘門控制，失敗時明示規則型備援。
- 未套用 migration：`supabase/migrations/20260911090000_coocoo_v2_growth_and_meal_tasks.sql`。

## 正式站合併矛盾修正

- Today 只保留下一餐的三種推薦角色，不再自動建立或顯示另一套週餐單；廚具設定統一放在「我的」。
- 舊 Kitchen 已拆除；食譜頁的自由搭配只保留風格、備料盤、冰箱食材與產生建議，不再重複 Today、食譜庫或廚具管理。
- 中文、英文與常見食材別名共用同一套核心判定，硬限制、搜尋覆蓋率、缺料與採買推薦不再各自維護別名。
- AI 調整預覽必須存在、屬於同一食譜且未過期；無效預覽回傳 422，確認後的份數與食材才寫入 MealTask。
- 部分補貨只抵扣實際數量並維持 `needs_shopping`；完全補齊才轉為 `ready`，料理完成後同交易轉為 `complete`。
- 取消舊 Onboarding 預算後，以 `null` 表示未設定餐費限制，不再將極大假數字送入推薦或 AI 提示。
- Onboarding 的週目標預設會實際套用「目前頻率 +1」；確認空箱會清除該帳號庫存，避免 Today 讀到不存在的食材。
- 帳號匯出只讀新版週目標、EXP、徽章、成本、MealTask、提醒及相談資料，不再查詢已移除的 goals／savings tables。

## 現行 API

所有端點使用 `/api/v1`。

- 帳號與設定：`/profile`、`/onboarding`、`/session`、`/weekly-goal`、`/settings/fridge`、`/settings/cookware`、`/settings/reminders`
- 決策與餐單：`/meal-plans`、`/meal-decisions/today`
- 食譜與任務：`/recipes/search`、`/recipes/:id/favorite`、`/recipes/generate`、`/meal-tasks`
- 採買與庫存：`/shopping-items`、`/shopping/analyze`、`/shopping/restock`、`/inventory`
- 發票：`/receipts`、`/receipts/:id/recognize`、`/receipts/:id/confirm`
- 料理與同步：`/cooking/outcomes`、`/sync`、`/sync/conflicts`
- 陪伴：`/chef-chat/sessions`、`/push-subscriptions`

## 驗證邊界

- 2026-09-11 本機 `bun run verify`：145 tests、Web build、API typecheck 與 PGlite migration 全數通過。
- Playwright 以 390 × 844 viewport 檢查五步 Onboarding、Today、採買、找食譜、自由搭配與我的；無瀏覽器 console error。這是模擬 viewport，不是真機驗收。
- `bun run verify` 只證明本機 lint、測試、Web build、API typecheck 與 PGlite migration。
- 發票 OCR、OpenRouter、Google OAuth、Push、離線重播與衝突處理仍需在核准的 Preview 網域接真實服務驗收。
- iPhone Safari 與 Android Chrome 真機驗收未完成；viewport 模擬不能替代真機。
- GitHub、Supabase 正式資料庫與 Production 必須在人工確認後另行核准。

## 下一個核准關卡

1. 人工檢視本機五頁與五步 Onboarding。
2. 在 iPhone Safari、Android Chrome 驗證 OCR、料理、Push、離線與返回流程。
3. 通過後另行盤點 migration、GitHub 與部署差異，再請求套用或發布核准。

## 本機操作

```bash
bun run --cwd apps/api dev
bun run --cwd apps/web dev -- --host 127.0.0.1
bun run verify
```

Web：`http://127.0.0.1:5173/today`；API health：`http://127.0.0.1:3000/api/v1/health`。
