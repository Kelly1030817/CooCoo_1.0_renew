# CooCoo「採買」MealTask 串接故事線

> **2026-09-11 實作註記：** A「任務優先清單」已納入本機 v2 Preview；採買仍是 MealTask 的執行／入庫層，完成採買不發 EXP。正式資料庫與 Production 尚未變更，需待 Preview 人工確認後另行核准。

- 日期：2026-09-10
- 狀態：互動預覽已確認，正式資料接口待分階段實作
- 適用範圍：Shopping、Today `MealTask`、庫存入庫、缺貨處理、料理交接
- 前置決策：[Today 雙餐決策與 AI 主廚故事線](./2026-09-10-today-dual-meal-ai-chef-storyline.md)
- 互動預覽：[A「任務優先清單」](../prototypes/shopping_meal_task_preview.html?variant=A&review=scope-v2)

> 先買任務真正缺少的；本週其他品項順路再帶。

## 1. 本次確認結論

採用 A「任務優先清單」作為採買頁骨架：

1. 已確認的 `MealTask` 必買品項置頂。
2. 本週一般採買維持在同頁，但與任務區分開。
3. 只有使用者確認過的菜色與料理份數能形成任務缺口。
4. AI 可以討論下一餐或明日，但不能因為提過某道菜就自動增加採買品項。
5. 部分買到、缺貨、替代及取消都必須保留真實狀態，不把未完成誤算為完成。
6. 任務必需品完成入庫後，提供「返回任務」與「直接開始料理」。
7. 完成採買不是完成料理，不發 EXP，也不更新自煮餐數。

本文件延伸 Today 已確認規則，不改寫 Today 對下一餐、份數、熟食或 EXP 的定義。

## 2. 採買頁的產品定位

採買頁是「已確認餐食決策的執行與入庫層」，不是第二個菜單規劃中心。

它負責：

- 呈現任務真正缺少的食材及份量。
- 區分任務必買與本週一般採買。
- 記錄實際買到、未買到與替代結果。
- 將實際買到的品項原子入庫。
- 更新 `MealTask` 是否已具備料理條件。
- 將使用者送回 Today 重選，或交接到廚房開始料理。

它不負責：

- 自動替使用者決定新的菜色。
- 把未確認的明日料理加入任務必買。
- 因 AI 建議直接修改任務或庫存。
- 在入庫前假設品項已買到。
- 在採買完成時發放料理、熟食或雙餐 EXP。

## 3. 「這一餐＋下一餐」如何影響採買

### 3.1 順便多煮

若使用者確認同一道菜一次多煮，採買依兩餐的「預計料理總份數」計算。

範例：

- 今天晚餐：1 人、1 份。
- 明天午餐：1 人、預計留下 1 份。
- 已確認策略：順便多煮。
- 本次料理總份數：2 份。
- 任務缺口：以 2 份食譜需求扣除可用庫存後計算。

### 3.2 下一餐另外規劃

只保留下一餐日期與餐期，不把尚未選定的料理食材加入本次任務必買。

使用者之後確認另一道料理與份數時，再建立或更新對應任務並重新計算缺口。

### 3.3 跳過下一餐

只依目前這一餐的確認份數計算採買缺口。

### 3.4 本週餐單

本週餐單可以產生一般採買需求，但不能混入目前 `MealTask` 的必買區。一般品項買不到或未入庫，不會阻擋目前任務轉為 `ready`。

## 4. 主要故事線

### 4.1 從 Today 進入採買

1. 使用者在 Today 確認菜色、這一餐人數、下一餐策略及料理總份數。
2. 後端以食譜總需求扣除可安全使用的庫存，產生缺口。
3. 若存在缺口，`MealTask.status = needs_shopping`。
4. 使用者從任務條進入採買頁。
5. 採買頁載入同一個 `MealTask`，不得以頁面本地狀態複製後端規則。

### 4.2 任務優先清單

首屏依序呈現：

1. 精簡跨頁任務條：菜名、餐期、狀態、返回 Today。
2. 採買範圍：這一餐、下一餐、策略與料理總份數。
3. `MealTask` 必買：缺少品項、需要份量、建議購買包裝及預估價格。
4. 本週一般採買：沿用既有新增、勾選、編輯與刪除能力。
5. AI 陪逛、掃描發票及語音／文字新增。
6. 本次已買到品項、預估金額及「完成這次採買」。

### 4.3 完整買到並入庫

1. 使用者只勾選實際買到的品項。
2. 完成前預覽入庫項目、實際份量、價格及保存位置。
3. 使用者確認後，以唯一 operation ID 原子入庫。
4. 任務必需品全部滿足後，`MealTask.status = ready`。
5. 顯示：
   - 返回任務。
   - 直接開始料理。

### 4.4 部分買到

1. 只將實際勾選品項入庫。
2. 未買到與缺貨品項繼續保留。
3. 重新依最新庫存計算任務缺口。
4. 仍有任務缺口時，維持 `needs_shopping`。
5. 一般採買是否完成不影響任務就緒狀態。

### 4.5 找不到與替代品

找不到任務食材時，使用者可以：

- 查看安全替代建議。
- 保留原品項，下次再買。
- 返回 Today 重選料理。

替代流程：

1. 系統提出替代品、換算份量、價格差與料理影響。
2. 後端重新檢查飲食硬限制、食譜相容性及必要廚具。
3. 使用者預覽並確認替代。
4. 替代品加入待採買，但尚未視為買到。
5. 實際勾選、確認並入庫後，才重新判斷任務是否 `ready`。

AI 只能提出替代建議，不能直接變更任務或庫存。

### 4.6 取消與放棄

需區分兩種操作：

- 結束這次採買：保留任務與未買品項，狀態維持 `needs_shopping`。
- 放棄目前菜色：保留原定日期／餐期，任務轉為 `needs_replan`，返回 Today 重選。

已經入庫的品項仍屬真實庫存，不因放棄菜色而刪除或回滾。

### 4.7 採買服務失敗

- AI 失敗：清楚標示規則型備援；仍可手動完成採買。
- 發票辨識失敗：保留照片處理失敗狀態，改為逐項手動確認，不得假裝已入庫。
- 入庫請求失敗：不清除勾選結果，允許使用相同 operation ID 安全重試。
- 任務資料過期或衝突：重新載入後端任務並顯示差異，不以舊頁面狀態覆蓋。

## 5. 與 Today MealTask 的接口

以下為故事線需要的「暫定契約」，名稱可在正式實作時依既有 contracts 模組收斂；語意不可省略。

### 5.1 採買頁讀取

```ts
interface MealTaskShoppingContext {
  mealTaskId: string
  status: 'needs_shopping' | 'ready' | 'cooking' | 'needs_replan' | 'complete'
  recipeId: string
  recipeTitle: string
  currentMeal: {
    date: string
    slot: 'breakfast' | 'lunch' | 'dinner'
    servings: number
  }
  nextMeal:
    | {
        strategy: 'cook_extra' | 'plan_separately'
        date: string
        slot: 'breakfast' | 'lunch' | 'dinner'
        servings: number
      }
    | { strategy: 'skip' }
  plannedTotalServings: number
  shortageRevision: string
  shortages: MealTaskShoppingItem[]
}

interface MealTaskShoppingItem {
  shortageId: string
  ingredientKey: string
  name: string
  requiredQuantity: number
  requiredUnit: string
  suggestedPurchaseQuantity: number | null
  suggestedPurchaseUnit: string | null
  estimatedCost: number | null
  resolution: 'needed' | 'bought' | 'restocked' | 'unavailable' | 'replaced'
}
```

### 5.2 完成入庫

```ts
interface MealTaskRestockCommand {
  operationId: string
  mealTaskId: string
  shortageRevision: string
  purchasedItems: Array<{
    shortageId: string | null
    shoppingItemId: string
    actualQuantity: number
    actualUnit: string
    actualPrice: number | null
    storageLocation: 'pantry' | 'fridge' | 'freezer' | 'other'
  }>
}

interface MealTaskRestockResult {
  operationId: string
  replayed: boolean
  mealTaskStatus: 'needs_shopping' | 'ready'
  remainingShortages: MealTaskShoppingItem[]
  nextActions: Array<'return_to_task' | 'continue_shopping' | 'start_cooking'>
}
```

### 5.3 替代或重選

```ts
type ShoppingResolutionCommand =
  | {
      operationId: string
      mealTaskId: string
      shortageId: string
      action: 'replace'
      replacementIngredientKey: string
      replacementQuantity: number
      replacementUnit: string
    }
  | {
      operationId: string
      mealTaskId: string
      shortageId: string
      action: 'keep_for_later'
    }
  | {
      operationId: string
      mealTaskId: string
      action: 'replan_meal'
    }
```

### 5.4 狀態轉移

| 採買事件 | MealTask 結果 |
|---|---|
| 從 Today 建立且有缺口 | `needs_shopping` |
| 部分品項入庫，仍有缺口 | `needs_shopping` |
| 替代品已確認但尚未買到 | `needs_shopping` |
| 任務必需品全部入庫 | `ready` |
| 放棄目前菜色並保留餐期 | `needs_replan` |
| 一般採買未完成 | 不影響 MealTask |

## 6. 可移植或整併的現有元件

可沿用：

- AI 陪我逛。
- 掃描發票。
- 語音／文字新增。
- 本週採買單。
- 勾選、全選、編輯及刪除。
- 已勾選預估金額。
- 已勾選品項原子入庫、未勾選品項保留。

需擴充：

- 現有平面清單增加 `MealTask` 必買區與一般區。
- 入庫操作增加 `mealTaskId`、`shortageId`、revision 與唯一 operation ID。
- AI 分析增加任務缺口脈絡，但仍只能提議、不能直接修改。
- 完成面板增加「返回任務」與「直接開始料理」。
- 新增缺貨、替代、保留與回 Today 重選流程。

不得直接移植：

- 預覽 HTML 的記憶體狀態。
- 固定假價格、假完成數或假省錢成果。
- 跨頁 localStorage 任務狀態。

## 7. 驗收情境

1. `cook_extra` 會依兩餐確認總份數計算缺口。
2. `plan_separately` 不會把未選定的下一餐食材加入必買。
3. 一般採買品項不會阻擋 MealTask 轉為 `ready`。
4. 部分入庫後仍保留未完成缺口。
5. 替代品確認後仍須實際買到及入庫。
6. 放棄菜色會保留餐期並轉為 `needs_replan`。
7. 重複提交相同 operation ID 不會重複入庫。
8. 入庫完成後可返回原任務或直接料理。
9. 採買完成不發 EXP。
10. iPhone Safari 與 Android Chrome 的固定底部操作、安全區及長清單可正常使用。

## 8. 實作與發布邊界

- 本文件與 HTML 是決策和互動預覽，不代表正式功能已完成。
- 正式實作需在 shared contracts、MealTask repository／API、Shopping UI 與庫存入庫流程共同完成。
- 完成 focused tests 後執行 `bun run verify`。
- Preview 經人工驗收後，才另行討論 GitHub、合併及 Production。

## 9. 下一個介面的交接資料

建議下一步先討論「冰箱／入庫」，再討論「廚房」。原因是採買完成後必須先確認實際份量、保存位置與庫存批次，`MealTask` 才能可靠地判斷 `ready`；之後廚房才能使用同一份已確認庫存開始料理。若產品希望優先驗證「直接開始料理」，也可先討論廚房，但必須把入庫確認視為料理入口前的必要前置步驟。

開啟下一個對話框時，至少提供：

1. 本文件路徑。
2. Today 故事線文件路徑。
3. 下一個要討論的介面名稱與範圍。
4. 從採買頁帶入該介面的入口事件。
5. 該介面需要讀取的 `MealTask` 狀態。
6. 成功、部分完成、失敗、取消與返回路徑。
7. 哪些現有元件必須保留或可以整併。
8. 是否仍採「先獨立預覽、確認後才改正式程式」流程。

建議下一個對話框先完整閱讀：

- `AGENTS.md`
- `CONTEXT.md`
- `docs/PROJECT_HANDOFF.md`
- `docs/product-decisions/2026-09-10-today-dual-meal-ai-chef-storyline.md`
- `docs/product-decisions/2026-09-10-shopping-meal-task-storyline.md`

### 可直接貼到下一個對話框的開場提示

```md
請針對 CooCoo「＿＿＿」介面做延伸收斂。

開始前請完整閱讀：

1. AGENTS.md
2. CONTEXT.md
3. docs/PROJECT_HANDOFF.md
4. docs/product-decisions/2026-09-10-today-dual-meal-ai-chef-storyline.md
5. docs/product-decisions/2026-09-10-shopping-meal-task-storyline.md

Today 與採買文件是目前跨頁邏輯來源，不要改寫已確認規則。

本次只討論：

- MealTask 如何從採買進入「＿＿＿」
- 該頁需要讀取與更新哪些任務資料
- 成功、部分完成、失敗、取消及返回路徑
- 該頁可移植或整併的現有元件

請先分析目前 Vercel 正式站的「＿＿＿」邏輯，再提出候選故事線。
先做獨立預覽，未確認前不要修改正式程式、GitHub 或 Production。

討論完成後，請建立一份「＿＿＿故事線」Markdown，並清楚列出它與 Today、Shopping MealTask 的接口。
```
