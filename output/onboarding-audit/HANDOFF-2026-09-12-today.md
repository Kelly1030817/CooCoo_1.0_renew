# HANDOFF · 今日頁（票券 × 任務板）對話交接

- 日期：2026-09-12
- 狀態：純設計討論＋**預覽檔已修正**；未更動 `apps/web`、未部署、未動 Supabase
- 用途：把本對話的最終結論交給下一個對話框接續

## 一、本次對話定案的三件事

1. **視覺語彙鎖定方案 A（融合）**
   - 沿用正式站暖米色 `#fdfae7` 底、赭紅 `#9a442d` 主色、票券深石板藍 `#34465b` 票根。
   - B（沿用正式站色）與 C（沙盒色）已移除，不再討論。

2. **裝備適配度雷達：確定移除**
   - 原因是它原本是假前端（`cookwareCount × 14`），且正式站五步根本沒引用它。
   - 已從預覽檔完整刪除（介面、CSS、計算邏輯、對照表文字）。

3. **今日頁採「舊版票券造型 × 任務板機制」融合**
   - 保留：票根、上下半圓缺口、虛線撕線、直排 TODAY、大數字。
   - 改：三欄數據只留圖示＋數字；食材 chips 用勾／購物車圖示取代文字；獎勵說明句改為 EXP 徽章。
   - 捨（收進第二層）：副標一句、後端診斷框、「點選卡片即可置換」提示。

## 二、使用者確認的三個決定

| 項目 | 決定 |
| :--- | :--- |
| 三個可行方向 | **保留**，做成票券下方的小票根列，點擊可與主任務互換 |
| 票根大數字 | 主數字＝**任務進度 N/3**；上方小字＝**今日第 N 餐** |
| 週節奏 | 拆兩半：今日頁只留**單行進度條**（本週 N/M 餐），詳細餐次清單移到**「我的」** |

## 三、後端定義的待決策（重要）

- 文件：`docs/product-decisions/2026-09-12-mission-backend-definition.md`
- 現況：後端**沒有** missions 實體。今日頁任務清單目前只能由前端推導。
- 建議採 **選項 A**：`/state` 多回一個唯讀 `missions` 陣列（`key`／`done`／`reward`／`source`），由既有 `exp_events`、`meal_servings`、`weekly_goals_v2` 即時推導。零 migration、不寫入資料、獎勵取 `EXP_POINTS`。

### 四項已全部決議（2026-09-12，詳見該文件第 6 節）

| 項目 | 決定 |
| :--- | :--- |
| 任務數量 | **3 項**，不含 `weekly_rhythm`；週節奏走今日頁單行進度條 |
| 即期門檻 | 沿用全站既有 **`daysLeft <= 3`**；「庫存有即期批次」只作提示，不納入 `done` |
| 顯示範圍 | 任務清單本期**只在今日頁**；但「我的」**新增**週節奏詳細餐次清單（屬本期範圍） |
| 選項 B 唯一性 | 因採 A 而**不適用**；保留結論：未來轉 B 時唯一性歸後端，沿用 `unique(user_id, operation_id, event_type)` |

## 三之二、本輪已修掉的預覽缺陷（僅限預覽檔）

1. **熟食任務永遠點不亮**：`eat_prepared` 原本写成 `prepared === 0 && has(...)`，邏輯反向。改為只讀今日 `prepared_serving_eaten` 事件。
2. **假互動殘留**：點任務列會本地切換 `done` 並加減 EXP，屬雷達同類問題。改為**唯讀**（點擊只做跳轉），符合選項 A「不得寫入、重複讀取 `done` 不得變化」。
3. **「就煮這道」不再自動標記任務完成**：只保留本地樂觀的 EXP 顯示，並註明上線由 `complete_cooking_v2_transaction` 決定。
4. **UTC／台北時區**：新增 `taipeiToday()`，對齊 `meal-planning.ts` 的 `taipeiDate()`；夜間 0–8 點不再錯天。
5. **「今日第 N 餐」定義不一致**：改與正式站 `TodayPage.tsx` 的 `plannedDayNumber` 同定義（找 `status === 'planned'`），不再自行排序過濾。
6. **第二層的安全提醒是寫死文字**：改為從食譜 `steps[].safetyNote` 取真實內容。
7. **本週節奏清單是寫死的四行**：改為由 `mealPlan.meals` 真實狀態推得（已完成／待安排／延後／已取消），並標示今日那餐。
8. **圖示字型重大缺陷（原为假渲染）**：Google 只以 fallback 提供 Material Symbols（無連字 cmap，且完整字型約 3.9MB），因此畫面上 `check`、`schedule`、`kitchen` 等**其實是英文單字而非圖示**。已全部改為**內嵌 SVG**（24 個圖示），與 `apps/web` 使用向量圖示的做法一致，離線也正常。
   - 驗證：瀏覽器實測 `.ms` 節點 41 個全部含 `<svg>`，無殘留文字，console 無錯誤。

## 四、預覽檔案（皆可開，皆未動正式站）

- 融合版（主成果）：`output/onboarding-audit/2026-09-12-today-ticket-fusion/index.html`
  - 已接真實契約欄位形狀；有登入 token 會打 `/state` 與 `/meal-decisions/today`，否則跑**模擬後端**（見第四之二節），HUD 右上會標示來源並可重置。
- 截圖（修正前）：`01-initial.png`、`02-cooked.png`、`03-sheet.png`、`04-api-wired.png`
- 截圖（2026-09-12 修正後，SVG 圖示＋唯讀任務）：`05-fixed-full.png`、`06-fixed-phone.png`、`07-fixed-missions.png`、`08-fixed-sheet.png`
- 截圖（接上模擬後端）：`09-mock-initial.png`、`10-mock-cooked.png`、`11-mock-all-done.png`
- 截圖（「我的」頁＋本週節奏詳細清單）：`12-me-page-full.png`、`13-me-week-list.png`、`14-me-after-cook.png`

## 四之三、「我的」頁預覽（本期範圍，2026-09-12 追加）

- 同一個預覽檔底部導覽可切 **今日／我的**；採買、冰箱、食譜不屬本次範圍，點了會明確提示「本預覽只實作今日與我的兩頁」，不會假裝能進。
- 「我的」四張卡：**本週節奏**（環形＋進度條＋已煮/待煮/延後/已取消四格計數）、**本週餐次逐餐明細**（依日期分組、保留全域「第 N 餐」序號、標示今日那餐）、**成長**（職階點、12 枚徽章、四個計數器）、**更多**（沿用正式站 `MePage` 的五個入口）。
- 資料與今日頁共用同一份 state：在今日煮一道 → 「我的」的已煮數、逐餐明細、進度條同步更新，無需重新整理；今日頁那條單行進度條的箭頭直接跳到「我的」。
- 煮完今日那餐時，該筆排程轉為 `cooked` 並補上食譜名，票根小字改標「本週第 N 餐 · 已煮」（不再謊稱是今日）。
- ⚠ **移植前要拍板的一件事**：現行後端其實沒有任何路徑會把 `PlannedMeal.status` 寫成 `cooked`（`complete_cooking_v2_transaction` 只寫事件與庫存；只有 `reschedule_planned_meal` 能改 status）。所以「已煮 N 道」在正式站無法由 `mealPlan` 取得，只能靠 `cookingOutcomes` 推。選項：(a) 請後端煮完真的結案該餐；(b) 「我的」逐餐明細改用 `cookingOutcomes` ＋排程合併顯示。**建議 (b)**，不必動 migration。
- 仍屬預覽沙盒：未動 `apps/web`、未動 API、未寫任何資料庫。

## 四之二、模擬後端（選項 A 的沙盒，2026-09-12 追加）

- 未登入時預覽**不再用寫死的樣本**，改跑一份照 migration 規則實作的記憶體後端：
  `mockCompleteCooking()` ≒ `complete_cooking_v2_transaction`、`mockEatPrepared()` ≒ `eat_prepared_serving_v2`。
- 動作只寫事件；畫面一律由 `mockReadState()` 重新讀回的 `/state` 形狀推得，因此票根大數字會真的走 0/3 → 2/3 → 3/3。
- 老實遵守的規則：`(operationId, eventType)` 防重複、即期才發 `expiring_ingredient_used`、扣庫存（先進先出）、產生餐份、週目標達標當週只發一次 +40、徽章依四個計數器達成、EXP 一律由事件總和推得。
- 「本餐已煮」改為**餐期層級**：今天已有 `cooking_completed` 就鎖定 CTA，換一道菜也不解鎖（文案為「本餐已煮」而非「已完成」），避免同一餐落進第二筆料理事件。
- HUD 右上新增來源標籤與「重置」；有登入 token 時仍走即時 `/state`，模擬層不會被用到。
- 驗證（瀏覽器實測，非僅本地推導）：連點三條任務列 → EXP／進度／事件數完全不變；同 operationId 重送 → `duplicate`；重置後庫存與 EXP 回到初始值；console 無錯誤。
- **這仍是預覽沙盒**：沒有動 `apps/web`、沒有動 API、沒有寫任何資料庫。
- 任務板（前一步）：`output/onboarding-audit/2026-09-12-today-mission-board/index.html`
- 圖示清單：`output/onboarding-audit/2026-09-12-icon-system/index.html`
  - 現有 35 個（真實渲染）＋建議新增 28 個（`quest-*`／`reward-*`／`status-*`／`act-*`），另附 7 條使用規則草案
- 五步 Onboarding：`output/onboarding-audit/chef-consultation-5step-proposal.html`

本機預覽指令：

```bash
cd /Users/kelly/kelly-product/stitch_coocoo_1.0_renew
python3 -m http.server 8901
# 開 http://127.0.0.1:8901/output/onboarding-audit/2026-09-12-today-ticket-fusion/index.html
```

## 五、尚未決定／尚未實作

- ~~「三個可行方向」與正式站 `alternatives` 數量一致性未驗證~~ → **已核對一致**：契约為 `primary` + `alternatives`（`maxItems: 2`），共 3 道。
- 「任務」若要真的上線，需先採行第三節的選項 A 並改 `/state`。
- ~~「我的」的週節奏詳細餐次清單尚未做~~ → **預覽已完成**（見第四之三節）；`MePage` 本身仍未實作，且移植前要先拍板 `cooked` 的來源（建議用 `cookingOutcomes`＋排程合併，不動 migration）。
- 正式站目前 `main` 尚未包含任何本次設計；預覽全部是獨立的靜態檔。
