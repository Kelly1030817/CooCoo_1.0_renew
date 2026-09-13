# CooCoo「本週一次備齊」週啟動流程

- 日期：2026-09-13
- 分支：`codex/weekly-stockup-flow`
- 狀態：功能分支已推送並建立 Vercel Preview；尚未核准合併、Supabase migration 或 Production
- 目的：讓使用者一週內第一次打開 CooCoo 時，能先決定本週實際要安排的料理餐數，將食材合併成一次採買，減少重複跑超市。

## 1. 產品決策

1. 「本週料理餐數」是這週的採買規劃，不是 EXP 週主目標，也不會改寫週目標。
2. 目前週尚未有 `mealPlan` 時，Today 自動開啟一次可跳過的週啟動 sheet；跳過只在同一瀏覽器本週內記住，確認餐單則由後端跨裝置保存。
3. 使用者先選餐數，再預覽日期、餐期、菜色與合併缺料；預覽不寫入餐單或採買。
4. 確認後才建立 `mealPlan`，並將扣除現有庫存後的合併缺料同步成 `source=plan` 的一般採買項。
5. 安全食譜不足時保留未排餐期，不以不符合過敏、禁食或廚具限制的食譜補滿。
6. 本週已過日期不可再排入；可安排上限依剩餘天數與 Onboarding 常用餐期計算。
7. 使用者可在「我的 → 本週餐次」延後或取消尚未料理的餐；未勾選採買項會隨餐單重新計算，已勾選品項不被系統靜默刪除。

## 2. 使用者流程

`本週第一次進入 Today` → `選擇料理餐數` → `預覽一週七日帶／餐點／一次採買草稿` → `確認本週餐單` → `合併缺料加入採買` → `到採買一次勾選與入庫`

使用者也可以選擇「這週先照下一餐」，繼續原本的單餐 `MealTask` 流程。

## 3. 模組與資料責任

- `WeeklyStockupFlow` 只負責互動、預覽與確認，不自行計算食材。
- meal-planning 模組負責剩餘餐期、餐單建立、庫存扣除及合併缺料。
- `POST /api/v1/meal-plans/preview` 不持久化；`POST /api/v1/meal-plans` 維持同週冪等。
- `shopping_items.meal_plan_id` 將週餐單採買項連回來源；唯一索引避免同餐單、同食材、同單位重複建立。
- MealTask 必買與週餐單一般採買仍分開；週餐單品項不會讓單餐 MealTask 提前變成 `ready`。

## 4. 價格與食安邊界

- 合併草稿沒有可靠單品價格時顯示「待確認」，不得顯示成免費或假估價。
- 採買勾選不等於入庫或料理完成，不發 EXP。
- 入庫仍需依既有流程確認實際數量、單位、保存位置與期限。

## 5. 本機驗證

- 整合 `origin/main@5a1e6fa` 後執行 `bun run verify`：174 tests、Web build、API typecheck、PGlite migrations 全數通過。
- 390 × 844 瀏覽器走過：自動週啟動 → 預覽 → 確認 → Today 已安排狀態 → 採買頁出現 `本週餐單` 品項。
- Vercel Preview：`https://coocoo-marketing-git-codex-weekly-00e98f-kelly1030817s-projects.vercel.app`。部署為 `target=preview` 且狀態 `Ready`；以 Vercel 保護繞過查核 `/today` 回傳 CooCoo 應用，Today 程式包包含本流程文案。匿名瀏覽會先進入 Vercel 登入保護。
- 尚未驗證：Supabase 正式 migration、Preview 正式帳號完整週採買寫入與跨裝置、iPhone Safari、Android Chrome、Production。
