# 舊專案業務邏輯盤點

本文件以 `/Users/kelly/Desktop/stitch_coocoo_1.0` 目前可操作版本為唯一基準。第一階段只搬移 active 流程；historical 規則僅留存，不可由新版 UI 或 API 進入。

## Active 功能與狀態轉移

| Context | 入口與狀態 | 驗證／錯誤 | 原子結果 |
| --- | --- | --- | --- |
| Identity | 未登入 → 模擬登入 → 登出 | email 必填且格式正確；錯誤回 `VALIDATION_ERROR` | 只替換 session；登出不刪使用者資料 |
| Goals | 無目標 → 六步設定 → 進行中 → 達標封存 → 下一目標 | 名稱、金額、外食／自煮資料及每週餐數必須有效；目標與已存為非負整數 TWD | 建立 goal、3 個 milestones 與 cooking plan；金額事件與進度同步 |
| Inventory | 容量未設定／已設定；冷藏／冷凍；正常／即期／過期 | 新增必須有名稱、數量、保存區與日期；找不到項目為 `ITEM_NOT_FOUND` | 新增、刪除、料理扣除或 rescue outcome 一次完成 |
| Cooking | 未選食材 → 選擇風格／食材 → 食譜 → 步驟／計時 → 完成 | 至少一項庫存食材；空選擇為 `INGREDIENT_REQUIRED` | completionKey 冪等；一次扣庫存、記錄 outcome、圓夢金、習慣與健康 |
| Shopping | 清單 → 新增／編輯／勾選 → 分析 → 批次補貨 | 名稱、數量、價格為有效值；解析失敗保留原輸入供修正 | 已勾選項一次移入庫存並從採買清單移除，不允許半完成 |
| Decision Support | 即期候選 → 食品安全閘門 → 吃掉／轉化保存／丟棄 | 不安全食材只能丟棄，其他行動回 `UNSAFE_ACTION` | 庫存變更與 rescue outcome 同一命令完成 |
| Settings | 冰箱容量、冷藏／冷凍比例與廚具設定 | 比例與容量不可為負；資料需符合共用 runtime schema | 整份 profile 原子替換 |
| Reset | 開發／測試環境的資料重設 | production 不暴露 | 清除目前 mock state，恢復固定 seed 與 schema version 1 |

## 圓夢六步與計算規則

1. 輸入單一金錢夢想名稱與目標金額。
2. 記錄目前已存金額；不得高於資料型別可接受範圍。
3. 以外食總額／餐數推導平均外食餐費；餐數為零時使用直接輸入基準。
4. 建議自煮預算為外食基準的 60%，使用者可調整。
5. 設定每週自煮餐數，預覽每餐節省與達標日期。
6. 確認後建立唯一 active goal、25%／60%／100% milestones 與 cooking plan。

- 平均外食餐費：`round(外食總額 / 外食餐數)`。
- 每餐估算節省：`max(外食餐費 - 自煮成本, 0)`。
- 尚需餐數：每餐節省大於零時為 `ceil((目標 - 已存) / 每餐節省)`；否則無法推估。
- 預估週數：`ceil(尚需餐數 / 每週自煮餐數)`；日期由確認日按週數推進。
- 目標進度：`min(已存 / 目標, 1)`；顯示時轉為百分比。
- 餘額調整記為 amount event，不覆寫事件歷史；正值為存入、負值為修正。
- 料理實際入帳高於預估時，拆分為 `meal_deposit` 與 `extra_deposit`。
- 25%／60% milestone 在首次跨越時完成；100% 使目標進入 completed，可封存後建立下一目標。
- 沒有 active goal 時仍可完成料理，但圓夢入帳為 0。

## 庫存、食品安全與救援

- 庫存以冷藏／冷凍分區，先依 `daysLeft` 升冪，再維持固定 seed 順序。
- `daysLeft <= 1` 顯示即期警示；小於 0 視為過期，必須先經食品安全判斷。
- 救援建議只可使用目標食材、基本調味與目前相容庫存，不憑空加入食材。
- `eat`：確認安全後移除庫存；`preserve`：原項目轉為冷凍並延長保存；`discard`：移除。
- rescue 是單一 application command；任何驗證失敗都不能留下局部 mutation。
- 冰箱容量只影響容量／警示呈現，不改變現有卡片幾何。

## 食譜、料理與結算

- fake recipe 由排序後的食材 ID、風格與排除標題產生固定索引，相同輸入可重現。
- 「換一道」必須排除目前標題；無其他候選時可回到唯一可用食譜。
- 步驟包含設備適配與計時資訊；未擁有的廚具不可成為必要步驟。
- 完成命令帶 `completionKey`；第一次 accepted，重送回 conflict／duplicate，且不得再次扣庫存或入帳。
- 完成後更新 cooking outcome、庫存、goal amount event、habit progress 與 health assets。
- 只有食品安全成立，且含蔬菜、低油或留意調味任一行動，才累積健康自主餐。

## 採買、解析與補貨

- 單筆可新增、編輯、刪除、勾選；全選只改目前清單的 checked 狀態。
- 金額為 `sum(checked ? quantity * unitPrice : 0)`，TWD 以非負整數保存。
- 文字／語音共用同一 parser，將名稱、數量、單位與價格轉為草稿；使用者確認後才寫入。
- 發票掃描第一階段為固定模擬結果，不呼叫外部 OCR。
- 購物助手讀取採買與庫存快照，輸出摘要與建議，不自行下單或刪改清單。
- restock 只處理已勾選項；同一 transaction 內新增庫存並移除採買項目。

## 公開契約與錯誤

- `/api/v1` 成功一律 `{ data }`；失敗一律 `{ error: { code, message, fieldErrors?, requestId } }`。
- 金額為非負整數 TWD；時間為 UTC ISO 8601；純日期為 `YYYY-MM-DD`；公開 ID 為 UUID-shaped string。
- MSW 與 Elysia 使用 `@coocoo/contracts` 同一份 TypeBox runtime schema，並委派至 `@coocoo/core` 同一業務服務。
- 固定業務錯誤包括 `VALIDATION_ERROR`、`ITEM_NOT_FOUND`、`INGREDIENT_REQUIRED`、`UNSAFE_ACTION`、`COOKING_REJECTED` 與 duplicate conflict。
- mock repository 使用 `coocoo.mock-db.v1`；重新整理保留資料，舊無版本資料遷移至 v1，未知未來版本拒絕載入並回 seed。

## Historical（文件保留、runtime 不啟用）

| 功能 | 舊規則摘要 | 第一階段處理 |
| --- | --- | --- |
| 多夢想 | 多筆夢想與分配比例 | 不建立頁面、route 或 state |
| 舊 30 天計畫 | 四步評估、30/7 換算與每週行動上限 | 只留來源歷史，不接到單一目標流程 |
| 外送阻斷器 | 狀態 → 等待時間 → 冰箱／ROI 選項 | 不啟用 |
| 週五 A/B/C／B 計畫 | 依精力與現況推薦週五行動 | 不啟用 |
| 舊 Supabase 直連 | 瀏覽器直接使用硬編專案資訊 | 不搬移；改由 Auth／repository ports 預留 |

## 第一階段資料邊界

- SQLite 僅提供 `:memory:` 連線、transaction、commit／rollback 與 adapter bootstrap 測試；本階段不建立業務表。
- 下一階段順序固定為 profiles/Auth ownership → goals → inventory → cooking/health → shopping → settings/assistant history。
- 每批先做 Supabase/Postgres migration、grants 與 RLS，再做 SQLite 等價測試 schema，最後替換該 context 的 MSW repository。

## 已知瑕疵處理

- fake recipe 未定義變數與重複 renderer 已在純 TypeScript 核心中收斂，不改可見輸出。
- 不搬移硬編 Supabase 專案資訊。
- 傳統市場缺圖維持舊版現況，留待取得視覺異動授權後另案處理。
