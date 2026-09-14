# CooCoo 1.0 實作交接

- 更新：2026-09-13
- 現行產品依據：[`../CONTEXT.md`](../CONTEXT.md)、[`product-decisions/2026-09-11-coocoo-v1-brand-product-reset.md`](product-decisions/2026-09-11-coocoo-v1-brand-product-reset.md)
- 本次發布分支：`codex/remove-fridge-capacity-main`（由最新 `origin/main@bf72b6c` 建立）
- 發布目標：GitHub `main` 與 Vercel Production；正式站結果須以發布後瀏覽器查核為準

## 唯一產品方向

「陪你從冰箱裡，煮出自己的生活節奏。」

精確冰箱 → 三道可行推薦 → 選食譜／補買 → 料理 → EXP／徽章 → 再次回來。固定五頁為今日、採買、冰箱、食譜、我的。

## 2026-09-13 本機待發布：低體力與雙指引料理包

- 今日 Header 的低體力膠囊維持當日推薦條件快捷鍵：後端只保留 30 分鐘內、最多 6 個主要步驟、1–2 個鍋具的候選；它不會把原食譜文字縮短，也不是第三個票券頁籤。
- Onboarding 的「詳細陪做／精簡步驟」改為同一份權威料理包的呈現偏好。每個新食譜步驟可同時保存詳細指令、精簡指令、完成判斷、原因與補救；食材、順序、計時及食安提醒不可分叉。
- AI 食譜產生、AI 調整與 Catalog 獨立品管均要求兩種指引描述相同料理事實；Catalog 缺少精簡指令或完成判斷時不通過。舊食譜缺少新欄位時沿用原指令，避免破壞既有資料。
- 料理模式依 Onboarding 偏好進入，並可在料理中切換；切換只改文字密度，不重抓食譜、不重設計時器，食安提醒永遠顯示。
- 整合最新 GitHub `main` 後，本機 `bun run verify`：170 tests、Web build、API typecheck 全數通過。390 × 844 瀏覽器實走完成精簡預設、詳細切換、計時／食安保留與無水平溢位。
- 尚未提交、推送或部署；未呼叫付費 AI，OpenRouter 真實輸出品質、正式帳號、iPhone Safari 與 Android Chrome 仍為 `待驗證`。本次不需要 migration。

## 2026-09-13 本次發布內容

### 採買任務票根

- `/shopping` 以 `docs/prototypes/shopping_mission_ticket_preview.html` 為互動與視覺基準，正式 React 頁面加入主廚職階列、料理任務摘要、補齊度環、採買範圍、MealTask 票根章格、一般採買、惜食提醒與固定採買籃。
- 任務章格只來自 `/state` 的 `mealTasks[].shortages`；使用 `shortageId` 精確連結採買項，不使用食材名稱模糊配對。
- 勾選買到不等於入庫。結算時確認實際數量、單位、價格、保存位置與期限；任務項缺期限不可送出。
- 入庫沿用 `operationId` 與 `shortageRevision`：重送不可重複建立庫存批次，過期 revision 會刷新並要求重新確認。
- 一般採買不阻擋 MealTask 轉為 `ready`；採買本身不發 EXP。缺貨可保留、經安全預覽後替代，或保留餐期與份數回今日重選。
- 空任務仍可使用一般採買、發票 OCR 與手動／語音新增，不顯示假任務進度。

### 今日、我的與 Onboarding

- Today 以 `apps/web/public/today-ticket-fusion.html` 為視覺基準：深石板藍票根、兩種票券模式、三個可行方向、熟食列、三項今日任務與獨立週節奏列。
- `/api/v1/state` 現在回傳固定三項唯讀 `missions`；完成狀態依台北日期從既有 EXP 事件與庫存推導，不新增資料表。
- `weekly_rhythm` 不再出現在今日任務，週進度只留在獨立進度列。
- 「今日第 N 餐」只計算今天的有效餐次，並以 `Asia/Taipei` 處理跨午夜事件。
- 「我的」新增本週逐餐明細，將 `mealPlan.meals` 與 `cookingOutcomes` 合併顯示，不修改既有餐單資料。
- Onboarding 收斂為三步：時間／餐期／口味／硬限制；人數／廚具／卡點；登入同步／主廚通行證。熟練度、目前每週料理次數、料理預設指引、週主指標、可見週目標與提醒卡片不再詢問。
- Onboarding 使用既有 `/onboarding`、Supabase Auth 與 `save_onboarding_profile`；不呼叫 `/inventory`，過敏／禁食維持後端硬限制。
- 蓋章後才送出完成資料，完成後進入「今日」。

## 後端與資料庫邊界

- 本次 UI 提交不新增 migration；採買功能依賴已進入 `main` 的 `supabase/migrations/20260913090000_shopping_restock_v2.sql`。正式資料庫套用狀態必須另行查核，不可以 GitHub 檔案存在代替雲端證據。
- `shopping_items.shortage_id/source`、`restock_operations` 與 `restock_checked_shopping_v2` 是採買票根的正式持久化邊界；`pantry` 類別入庫到常溫位置。
- 冰箱頁只管理食材庫存；不再提供冰箱品牌、型號、總容量、容量佔比或冷藏／冷凍比例設定。
- `fridge_profiles` 由 migration 移除；食材庫存仍由 `inventory_batches` 管理。
- Onboarding 寫入既有 `profiles`、`cookware`、`dietary_restrictions`、`weekly_goals_v2`、`notification_preferences`，不新增、清空或修改庫存；食材由登入後的冰箱頁管理。
- OCR 仍先建立草稿，使用者逐項確認數量、單位、位置與期限後才入庫。
- 任務為 `/state` 回應的衍生資料，不可由前端切換，也不直接寫入資料庫。

## 驗證

- 2026-09-13 冰箱容量移除整合最新 `main` 後執行 `bun run verify`：159 tests、Web build、API typecheck 與 PGlite migration 全數通過；包含容量設定移除的 API、狀態契約與資料表回歸檢查。
- 2026-09-14 三步 Onboarding 本機 `bun run verify`：173 tests、Web production build、API typecheck 全數通過；390 × 844 實走三步並確認無水平溢位。
- 先前五步版本曾實走 `/shopping`、Today 與「我的」；三步改版部署後仍須重新驗證正式帳號完成寫入與進入 Today。
- viewport 模擬不等於 iPhone Safari／Android Chrome 真機驗收。
- MealTask 有缺口的正式帳號票根互動、Google OAuth、正式帳號 OCR、OpenRouter、Push、離線重播與同步衝突仍須在正式服務以測試帳號驗證。

## 本機操作

```bash
bun run --cwd apps/api dev
bun run --cwd apps/web dev -- --host 127.0.0.1
bun run verify
```
