# 今日頁與五步 Onboarding 設計落實（2026-09-12 ~ 09-13 對話完整紀錄）

- 日期：2026-09-13
- 狀態：**已合併 main 並部署 Production**（`coocoo-marketing.vercel.app`）
- 唯一現行產品語言：[`../../CONTEXT.md`](../../CONTEXT.md)
- 前置決策：[`2026-09-11-coocoo-v1-brand-product-reset.md`](./2026-09-11-coocoo-v1-brand-product-reset.md)、[`2026-09-12-mission-backend-definition.md`](./2026-09-12-mission-backend-definition.md)

> 本文件用來交接 2026-09-12～09-13 這個對話所做的全部改動。若你是新 session，先讀本文件，再讀上面兩份前置決策。

---

## 一、這個對話做了什麼（總覽）

1. 盤點並移除「裝備適配度雷達」（假前端）。
2. 定案視覺語彙「方案 A（融合）」，移除 B／C。
3. 產出今日頁「票券 × 任務板」融合版設計與預覽。
4. 定義「任務」後端規格（待決策，選項 A 建議）。
5. 產出全站圖示清單（現有 35＋建議 28）。
6. 把設計**實際套進網站本體**：改寫 `/today` 與 `/onboarding`。
7. 接上 Vercel ↔ GitHub 自動部署。
8. 清理：刪除舊版資料夾、移除誤建的預覽專案。

---

## 二、最終定案（產品決策）

### 2.1 視覺語彙：方案 A（融合）

- 沿用正式站暖米色 `#fdf8ea`／卡片 `#fffdf6`／赭紅 `#9a442d`，票券票根深石板藍 `#34465b`＋琥珀金 `#f4ce8d`。
- **B（沿用正式站色）與 C（沙盒色）已移除**，不再討論。

### 2.2 裝備適配度雷達：確定移除

- 原因：它是假前端（`cookwareCount × 14` 硬寫死），且正式站五步根本沒有 import 它；後端也沒有任何對應欄位。
- 已從預覽與程式碼完整移除。

### 2.3 今日頁：舊版票券造型 × 任務板機制

| 項目 | 決定 |
| :--- | :--- |
| 票根、缺口、虛線撕線 | 保留 |
| 票根大數字 | 改為**任務進度 N/M**；上方小字＝**今日第 N 餐** |
| 三欄數據（廚具／備料／步驟） | 改為圖示＋數字（時間／步驟／廚具） |
| 食材 chips | 狀態改圖示（勾／購物車），移除「（已有）」「（需買）」文字 |
| 獎勵說明句 | 改為 EXP 與徽章 chip |
| 副標一句、後端診斷框、置換提示 | 收進「⋯」第二層 |
| 三個可行方向 | 保留，做成票券下方**小票根列**，點擊可與主任務互換 |
| 週節奏 | 今日頁只留**單行進度條**，詳細清單移到「我的」 |

### 2.4 任務後端定義（**待決策**，尚未實作）

- 規格見 [`2026-09-12-mission-backend-definition.md`](./2026-09-12-mission-backend-definition.md)。
- 建議採**選項 A**：`/state` 多回一個唯讀 `missions` 陣列（`key`／`done`／`reward`／`source`），由既有 `exp_events`、`meal_servings`、`weekly_goals_v2` 即時推導。零 migration、不寫入資料。
- 尚未決定的四點：任務 3 或 4 項、即期門檻是否 `daysLeft <= 3`、是否顯示於今日頁以外、若採選項 B 的唯一性歸屬。
- **本對話的做法**：前端先用 `deriveMissions()` 在本機推導（唯讀），未改後端。若未來採行選項 A，應把這段推導移到 `/state`。

---

## 三、程式碼改動（已上線）

### 3.1 今日頁 `apps/web/src/pages/today/TodayPage.tsx`

- 新增 `deriveMissions()`：由 `expEvents`（今日事件）、`mealServings`（`prepared_inventory`）、`weeklyGoal`（進度／目標）推導四個任務；**唯讀，不寫入任何資料**。
- 新增 HUD：主廚職階與 EXP 進度條，資料來自 `/state` 的 `growth`（`CHEF_RANKS`／`totalExp`／`nextBadge`）。
- 票根改顯示 `missionsDone / missions.length` 與進度點（pips），上方小字為 `今日第 N 餐`（由 `mealPlan.meals` 依日期排序推得）。
- 票身新增 `.ticket-stats`（圖示＋數字）、`.ticket-rewards`（EXP／徽章 chip）、`.ticket-detail`（第二層，含缺料與安全提醒文字）。
- 三個可行方向改為 `.alt-stubs` / `.ministub`（小票根列）。
- 新增 `.mission-list`（今日任務）與 `.weekstrip`（本週單行進度）。
- 相談室入口改為 `.chef-entry` 卡片。
- **移除**：`roi-motivation-banner`、`backend-diagnostics-box`、`cook-prep-row`、`PostponeModal`（原本即無人使用的死碼）、`slotName`、`todaySlotText`。

### 3.2 今日頁樣式 `apps/web/src/pages/today/TodayPage.css`

- 追加約 397 行：`.today-hud`、`.hud-*`、`.stub-mealno`、`.stub-pips`、`.ticket-stats`、`.tstat`、`.ticket-rewards`、`.reward-chip`、`.ticket-cta`、`.ticket-more`、`.ticket-detail`、`.alt-stubs`、`.ministub`、`.mstub`、`.mbody`、`.mmeta`、`.mside`、`.mission-list`、`.mrow`、`.mmark`、`.weekstrip`、`.chef-entry`。

### 3.3 五步 Onboarding `apps/web/src/pages/onboarding/OnboardingPage.tsx` / `.css`

- 第 1 步新增主廚開場卡 `.chef-open`。
- 新增主廚心情標籤 `.chef-mood`，四態：`listen`／`applause`／`care`／`sealed`。
  - 選障礙→`listen`、選廚具→`applause`、填硬限制→`care`、完成設定→`sealed`。
- 步驟標頭改為 `.step-head`。

### 3.4 未變更（重要）

- 沒有動 API、`packages/contracts`、`packages/core`、Supabase、任何 migration。
- 沒有動其他頁面與路由。
- `.env`、金鑰、憑證均未進版控。

---

## 四、Commit 與 PR 對照

| Commit | 內容 | PR |
| :--- | :--- | :--- |
| `b9865a6` | 任務後端規格文件＋三份設計預覽 | [#3](https://github.com/Kelly1030817/CooCoo_1.0_renew/pull/3) |
| `85512bf` | 兩個靜態預覽放進 `apps/web/public/` | [#4](https://github.com/Kelly1030817/CooCoo_1.0_renew/pull/4) |
| `744a89c` | 今日頁與 Onboarding 套用設計（**本體改動**） | [#5](https://github.com/Kelly1030817/CooCoo_1.0_renew/pull/5) |

Production 部署：`coocoo-marketing.vercel.app`（由 push 到 `main` 自動觸發）。

---

## 五、Vercel 部署設定（已變更）

- **`coocoo-marketing` 已連接 GitHub repo**，之後 push 到 `main` 會自動部署 Production，其他分支產生 Preview。
- 連接方式：`vercel git connect https://github.com/Kelly1030817/CooCoo_1.0_renew.git`。
- 教訓：先前該專案未連 Git，只能 CLI 直傳，才會發生「已部署但不是你想的那樣」的落差。
- 帳號內**只有 `coocoo-marketing` 一個專案**（先前誤建的 `coocoo-design-preview` 已刪除）。

---

## 六、預覽資產（`output/onboarding-audit/`，供比對設計）

| 路徑 | 用途 |
| :--- | :--- |
| `2026-09-12-today-ticket-fusion/index.html` | 今日頁融合版靜態預覽（含 API 對接層示範） |
| `2026-09-12-today-mission-board/index.html` | 任務板前一步預覽 |
| `2026-09-12-icon-system/index.html` | 全站圖示清單（現有 35＋建議 28＋使用規則） |
| `chef-consultation-5step-proposal.html` | 五步 Onboarding 提案預覽 |
| `HANDOFF-2026-09-12-today.md` | 當時的簡短交接 |

靜態檔案版本（`apps/web/public/today-ticket-fusion.html`、`onboarding-5step.html`）仍在 main 上，若不需要可另行移除。

---

## 七、清理紀錄

- 刪除舊版資料夾 `/Users/kelly/Kelly_product/stitch_coocoo_1.0_renew`（1.5G，大小寫不同的另一個 clone）。刪除前已備份至 `~/Documents/coocoo-legacy-backup-2026-09-12/`（OAuth 憑證 2 檔、3 個 env 檔、Vercel 連結設定，checksum 已驗）。
- 該資料夾原先的 5173 服務已停止；Vercel 正式站確認是由**小寫 repo** `/Users/kelly/kelly-product/stitch_coocoo_1.0_renew` 的 `main` 部署。

---

## 八、驗證邊界（照實記錄）

- `bun run verify` 通過：oxlint、59 個測試、web build、API typecheck。
- 本機 mock 模式以 430×932 實測：HUD、票券、任務進度、圖示化票身、小票根列、任務清單、主廚心情標籤皆正常。
- 正式站已確認 bunlde 含新元件（`today-hud`、`mission-list`、`ministub`、`ticket-stats`、`chef-open`、`chef-mood`）。
- **未完成**：真機驗收（iPhone Safari／Android Chrome）；正式站登入後的實際畫面未由 AI 驗證（需帳號）；任務規格四項待決策。

---

## 九、下一步建議

1. 決定任務後端規格（選項 A 的四項待確認），再把前端推導改由 `/state` 提供。
2. 決定是否移除兩個靜態預覽檔。
3. 真機驗收。
4. 若要改版型或配色，直接改 `TodayPage.tsx` 對應區塊；不要再另開預覽檔流程，本體已是設計的實作。
