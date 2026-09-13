# 今日頁與五步 Onboarding 設計落實

- 日期：2026-09-13
- 狀態：實作與本機驗證完成；發布狀態以 `docs/PROJECT_HANDOFF.md` 與 GitHub `main` 為準
- 產品依據：[`../../CONTEXT.md`](../../CONTEXT.md)
- 任務規格：[`2026-09-12-mission-backend-definition.md`](./2026-09-12-mission-backend-definition.md)

## 視覺來源

- Today：`apps/web/public/today-ticket-fusion.html`
- 五步 Onboarding：`output/onboarding-audit/chef-consultation-5step-proposal.html`

正式 React 介面應忠實沿用以上設計，不再另行發明第三套樣式。靜態 HTML 是視覺參考；正式功能仍走 React、共用 contracts、API 與 Supabase。

## Today 定案

- 保留票根、缺口、虛線撕線、深石板藍票根與琥珀金數字。
- 票根顯示今日任務 `N/3`；今日任務固定為完成料理、吃掉熟食、使用即期食材。
- 只保留「冰箱就能煮」與「少量補買」兩種票券模式；Header 的低體力膠囊可直接切換當日推薦條件，但不是第三個票券頁籤。主廚相談室用於補充不切菜、指定鍋具等更細需求。
- 三個可行方向由主任務加兩張小票根構成。
- 週節奏不算今日任務；Today 留單行進度，「我的」顯示逐餐明細。
- Today 不顯示額外全域 Header，避免壓縮手機票券構圖。

## 任務資料契約

`GET /api/v1/state` 回傳唯讀 `missions`：

```ts
type TodayMission = {
  key: "cook_today" | "eat_prepared" | "use_expiring";
  label: string;
  reward: number;
  done: boolean;
  source: "cooking_completed" | "prepared_serving_eaten" | "expiring_ingredient_used";
  hint?: number;
};
```

完成狀態由後端依 `exp_events` 推導；即期庫存數只作提示，不等於任務完成。日期以 `Asia/Taipei` 計算，避免 UTC 跨午夜誤判。此方案不需要 migration。

## 五步 Onboarding 定案

1. 節奏與卡點：熟練度、目前頻率、多選障礙。
2. 餐桌與廚具：份量、預設／自訂廚具、過敏與禁食硬限制。
3. 口味與餐期：可移除口味標籤、時間滑桿、餐期與指引模式。
4. 登入與冰箱：Google Auth、OCR 草稿確認、手動精確食材或確認空箱。
5. 主廚檔案：週主指標、週目標、三類提醒、親簽與蓋章。

蓋章是確認動作；完成資料由既有 `/onboarding` 寫入 Supabase。Google Auth、OCR 與硬限制規則不可被視覺層繞過。

「詳細陪做／精簡步驟」只設定同一道食譜進入料理時的預設指引密度。後端維護一份權威料理包；兩種模式共用食材、份數、步驟順序、計時、完成標準與食安提醒，料理中可隨時切換。低體力則改變推薦菜色的時間、步驟數與鍋具條件，兩者不得混用。

## 驗收條件

- `bun run verify` 通過。
- 390px 手機 viewport 可完成五步且無水平溢位。
- 蓋章後進入 Today。
- Today 顯示兩個模式與三項任務，`/state` 確實回傳三項 missions。
- 「我的」顯示同一份餐單與料理完成紀錄推得的逐餐明細。
- 合併與部署後需在正式網址實際開啟目標頁查核，不得只以 Deployment READY 或 bundle 字串宣稱完成。
