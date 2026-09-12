# CooCoo 1.0「任務」後端定義規格（待決策）

- 日期：2026-09-12
- 狀態：**已定案採選項 A**（四項 `待確認` 已於 2026-09-12 決議，見第 6 節）。本文件仍未新增資料表、未更動 API、未修改 migration；實作尚未開始。
- 唯一現行產品語言：[`../../CONTEXT.md`](../../CONTEXT.md)
- 相關決策：[`2026-09-11-coocoo-v1-brand-product-reset.md`](./2026-09-11-coocoo-v1-brand-product-reset.md)

## 1. 為什麼需要這份規格

今日頁任務板預覽會顯示「今日任務」清單與票根的「任務進度 N/3」。目前後端**沒有「任務」這個實體**，因此該區塊只能靠前端自行推導。本文件要決定：任務要不要有自己的後端定義，或是由既有資料推導。

## 2. 現況盤點（已核對程式碼與 migration）

### 2.1 後端已經有的東西

| 實體 | 位置 | 重點欄位 |
| :--- | :--- | :--- |
| MealTask | `meal_tasks` 表／`MealTaskSchema` | `status`（`needs_shopping`／`ready`／`cooking`／`needs_replan`／`complete`）、`shortages`、`plannedTotalServings`、`currentMeal`、`nextMeal` |
| EXP 事件 | `exp_events` 表／`EXP_POINTS` | `event_type` 五種，點數固定 30／10／10／20／40；`unique(user_id, operation_id, event_type)` |
| 週目標 | `weekly_goals_v2` 表 | `metric`、`target`、`progress`、`reward_granted_at` |
| 徽章 | `badge_awards` 表 | `badge_key`、`category`（cooking／rhythm／waste_less／exploration）、`tier` |
| 成長檔 | `deriveGrowthProfile()` | `totalExp`、`rank.{level,name,threshold,nextThreshold}`、`nextBadge.{badgeKey,title,current,target}` |
| 餐份 | `meal_servings` 表 | `status`（`eaten`／`prepared_inventory`）、`eaten_at` |
| 今日決策 | `TodayDecisionSchema` | `primary`（可為 null）、`alternatives`（最多 2）、`slot`、`notice` |
| 推薦 | `RecipeRecommendation` | `recipe`、`missing[]`、`estimatedPurchaseCost`、`budgetStatus`、`issues[]` |

### 2.2 後端**沒有**的東西

- 沒有任何 `missions`／`quests`／`daily_tasks` 資料表或契約。
- 沒有「任務標題」「任務獎勵」「任務完成時間」這類欄位。
- 徽章計數器（`cooking`／`rhythm`／`wasteLess`／`exploration`）存在，但只用於徽章，未對外成為任務。

### 2.3 一個關鍵發現

`integratedState` 已經在算四個計數器：

```
cooking     = 完成的料理次數
rhythm      = weekly_goal_completed 事件數
wasteLess   = expiring_ingredient_used + prepared_serving_eaten 事件數
exploration = 不同食譜名稱數
```

這四個正好可以對應任務板想呈現的「今日任務」，**不需要新表**。

## 3. 三個選項

### 選項 A（建議）：任務由既有資料推導，唯讀

- 任務不是新實體，而是後端在 `/state` 多回一個 `missions` 陣列，內容由既有資料即時推導。
- 每個任務只有四個欄位：`key`、`done`、`reward`、`source`（指向哪個真實事件）。
- 完成與否**不儲存**，每次讀取重算；不新增 migration。
- 獎勵數字直接取 `EXP_POINTS` 常數，不另外定義。

建議的推導規則：

| 任務 key | 顯示 | 完成判定 | 獎勵來源 |
| :--- | :--- | :--- | :--- |
| `cook_today` | 完成今天的料理 | 今日有 `cooking_completed` 事件 | `EXP_POINTS.cooking_completed` = 30 |
| `eat_prepared` | 吃掉 1 份熟食 | 今日有 `prepared_serving_eaten` 事件，或 `meal_servings` 尚有 `prepared_inventory` | 10 |
| `use_expiring` | 用掉即期食材 | 今日有 `expiring_ingredient_used` 事件，或庫存有 `daysLeft <= 3` 批次 | 10 |
| `weekly_rhythm` | 本週節奏 | `weekly_goals_v2.progress >= target` | 40 |

優點：零 migration、不違反「EXP 不得重複」與「採買不發 EXP」規則、可立即實作。
缺點：任務無法個人化排序，也不能由後端下指令（例如活動限時任務）。

### 選項 B：新增 `daily_missions` 表

- 後端每日生成任務列，含 `assigned_at`、`completed_at`、`reward_exp`。
- 需要新 migration、新端點、新的排程或 lazy 生成邏輯。
- 風險：與 `exp_events` 的防重複規則重疊，需明確界定「任務完成」與「EXP 事件」的先後與唯一性，否則會產生重複發點或漏發。

### 選項 C：把「任務」直接等同 MealTask

- 只保留「完成今天的料理」一項，其餘兩個任務移除。
- 最省事，但失去任務板的養成節奏，也讓徽章的四個計數器在今日頁沒有出口。

## 4. 建議

採 **選項 A**。理由：

1. 完全不需要資料庫變更，也不動既有契約的破壞性欄位。
2. 資料來源全部是真的（EXP 事件、週目標、餐份），符合「不假造」原則。
3. 與既有的四個徽章計數器語意一致，未來徽章與任務可以共用同一份計數。
4. 之後若要做選項 B，`missions` 的欄位形狀可以沿用，前端不用重寫。

## 5. 驗收條件（若採 A）

- `/state` 回應新增 `missions: Array<{ key, done, reward, source }>`；既有欄位不得變動。
- 任務數量固定 **3 項**，順序穩定（`cook_today` → `eat_prepared` → `use_expiring`）；`done` 必須可由回應中的既有欄位獨立驗證。
- 任務完成不得寫入任何新資料；重複讀取 `done` 不得變化。
- `reward` 必須等於 `EXP_POINTS` 對應值，不得另寫常數。
- 未達成任何任務時，畫面不得出現「失敗」「歸零」「扣分」字樣。
- 空冰箱使用者仍能看到任務（不得因無庫存而整區消失）。
- 「今日第 N 餐」的推導必須與正式站 `TodayPage.tsx` 的 `plannedDayNumber` 同定義（`meals` 中第一筆 `date === 今日 且 status === 'planned'` 的索引 + 1），且日期判定須用台北時區（對齊 `meal-planning.ts` 的 `taipeiDate()`），不得用 UTC 日期。

## 6. 決議（2026-09-12）

1. **任務 3 項，不含 `weekly_rhythm`。** 週節奏改由今日頁的單行進度條承擔（本週 N/M 餐），不進任務清單，也不參與票根大數字的分母。理由：符合「今日頁只做一件事」，並避免達標瞬間分母從 3 跳 4 造成進度失真。
   - 代價（已知並接受）：徽章的 `rhythm` 計數器在今日頁不透過任務列出口，改由該進度條呈現。
2. **即期門檻沿用全站既有定義 `daysLeft <= 3`。** 此為 `RecipeModal.tsx` 決定是否送出 `usedExpiringIngredient`（進而寫入 `expiring_ingredient_used` 事件）所用的同一數字；改動會造成「任務顯示可完成、料理完卻不發點」。
   - 但「庫存有即期批次」只是**可完成的機會**，僅作為提示（hint），**不得**納入 `done` 判定；`done` 只認今日的 `expiring_ingredient_used` 事件。
3. **任務清單本期只出現在今日頁。** 「我的」不重複列任務。
   - 「我的」新增**週節奏詳細餐次清單**版位，屬本期範圍（非搬移既有區塊，是新增；`MePage` 現況只有週目標／職階／徽章三段）。
4. **選項 B 的唯一性問題因採行 A 而不適用。** 保留結論備查：若未來轉 B，唯一性**必須由後端負責**，沿用 `exp_events` 的 `unique(user_id, operation_id, event_type)`，任務完成一律由既有 EXP 事件反推，不得新增第二條發點路徑（否則違反 CONTEXT.md 第 5、7、8 條）。

## 7. 後續

- 本文件的實作（改 `/state`、改契約、移植 `apps/web`）**尚未開始**；目前所有設計仍只在 `output/onboarding-audit/` 的靜態預覽。
- 移植前須先通過融合版預覽的验收，再單獨取得部署授權。
