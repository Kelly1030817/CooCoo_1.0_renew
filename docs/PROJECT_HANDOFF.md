# CooCoo 1.0 實作交接

- 更新：2026-09-13
- 現行產品依據：[`../CONTEXT.md`](../CONTEXT.md)、[`product-decisions/2026-09-11-coocoo-v1-brand-product-reset.md`](product-decisions/2026-09-11-coocoo-v1-brand-product-reset.md)
- 本次發布分支：`codex/remove-fridge-capacity-main`（由最新 `origin/main@bf72b6c` 建立）
- 發布目標：GitHub `main` 與 Vercel Production；正式站結果須以發布後瀏覽器查核為準

## 唯一產品方向

「陪你從冰箱裡，煮出自己的生活節奏。」

精確冰箱 → 三道可行推薦 → 選食譜／補買 → 料理 → EXP／徽章 → 再次回來。固定五頁為今日、採買、冰箱、食譜、我的。

## 2026-10-18 發布準備：Email OTP 與採買測試全數通過

- 使用者明確要求修正剩餘三個失敗並在全數通過後發布正式站。三個失敗均來自固定的 2026-09 保存期限與真實時鐘不一致；core 測試注入固定 Runtime，PGlite 測試以資料庫台北日期加 7／12 日產生保存期限，MSW 測試使用未來 7 日期限。正式食安判斷未修改，新增過期食材拒絕入庫／庫存不變的斷言。
- 完整 `bun run verify` exit 0：187 個單元／契約測試、27 個 Playwright 測試全部通過，lint、格式、Web build 與 API typecheck 通過。仍有既有 Fast Refresh warning；E2E 模擬後端的 health proxy 探測紀錄不影響通過結果。
- 發布路徑已查核：GitHub main → Vercel coocoo-marketing → https://coocoo-marketing.vercel.app 。當前 Production commit 為 0d26353，尚未發布本次變更。Vercel CLI token 過期，使用現有 GitHub 自動部署，不建立額外專案。
- 新舊帳號 Hosted Auth／Render 資料流程已實測；部署後正式網址的實際 Email 登入與頁面重整仍需再查核，手機真機仍待驗證。

## 2026-10-18 最新驗證：Email OTP 新舊帳號流程通過，待發布

- 本機 Web 5177 使用 Hosted Supabase Auth + Render API，已實測原帳號 Email OTP 收信、登入、相同 UID、雲端 state 讀回及重整保留；新受邀 Gmail 別名也完成三步草稿 → OTP → 單次成立檔案 → /today → 重整。
- 新帳號成立前無 onboardingProfile，成立後為 complete；2 人份、電鍋、花生硬限制、測試口味與日常卡點由雲端讀回。重整前後主廚檔案、廚具、冰箱、採買及 growth 摘要一致。冰箱與採買保持空白，原帳號資料與登入狀態未被覆蓋。
- Hosted Confirm signup、Magic link / OTP 使用中文 Token 範本，保留 8 位 OTP／3600 秒。Brevo 專用 SMTP key 由使用者直接貼入後，代理明確儲存並寄送成功；憑證未寫入程式庫。SMTP IP 封鎖已依使用者持續關閉授權設定並重新載入確認，未更動 API keys IP 政策。
- 本次重跑 `bun run verify`：lint 與格式檢查通過，單元／契約測試 184 pass、3 個相同採買日期測試 fail，流程在 test 階段停止，本次 verify 未執行後續 build／E2E。`git diff --check` 通過。真實雲端瀏覽器流程另已完成，不能把 verify 標為全通過。
- 尚未提交、推送、建立 PR、部署正式 Web 或停用 Google Provider。手機真機、跨實體裝置仍待驗證；本機真實後端流程通過不等於正式站已發布。詳細查核紀錄見 `docs/EMAIL_DELIVERY_PLAN.md`。

## 2026-10-14 本機待確認：Email 驗證碼與一次完成設定

- 隔離工作目錄：`/Users/kelly/kelly-product/coocoo-email-onboarding`；分支 `codex/email-onboarding`，由當前乾淨 `main@0d26353` 建立。未提交、推送、建立 PR 或部署。
- 第三步、登入失效恢復、「我的」與個人檔案視窗改用共用 Email OTP 表單；移除 Web 的 Google OAuth 啟動函式與入口。Google AI 模型設定不屬於登入，維持原樣。
- 第三步在 Email 驗證前停用開始按鈕；驗證完成後按一次「成立主廚檔案並開始」，確認 session、PUT `/onboarding`、GET `/state` 的設定狀態為 complete 後才完成本機草稿並進入今日。失敗保留草稿及重試；送信與完成操作防重複送出，寄信有 60 秒重寄倒數。
- 不新增 migration、不刪除 auth.users／Google identity／個人資料、不修改雲端 Provider 或邀請規則。新增本機 OTP 郵件範本及 config；Hosted 設定不會隨程式檔案自動同步。
- 本機 Web build、API typecheck、lint（僅既有 Fast Refresh warning）與格式檢查通過。登入相關 6 個單元測試通過；25 個本機瀏覽器測試全數通過（攔截 Auth／API，不代表真實雲端登入）；涵蓋三步 → OTP → 單次完成 → 今日 → 重整、錯碼／儲存失敗重試、未受邀拒絕、讀回未完成保留草稿與重新登入不重寫設定。390px／320px 無水平溢位，390px 預覽已目視檢查。
- `bun run verify` 已執行，整體仍未通過：181 pass、3 fail；三個採買測試的固定期限已過。以未修改 `0d26353` 重跑得到相同三個失敗（182 pass、3 fail，原 recovery 有兩個測試，本次合為一個）。本次不修改採買邏輯／既有日期測試，不能將完整 verify 標成通過。
- Supabase MCP 唯讀查核：專案 ACTIVE_HEALTHY，2 個帳號、其中 1 個 Google identity，資料庫存在 before_user_created 函式。函式存在不等同 Hosted Hook 啟用證據；目前寄信範本、SMTP 與 Hook 啟用狀態待驗證。Dashboard 寄信設定頁要求登入，未能存取。
- **未完成／待驗證**：自訂 SMTP、Hosted Confirm signup／Magic Link 信件範本、六位數 OTP 設定、真實受邀新帳號收信 → 寫入 → 今日 → 重整／跨裝置，以及原 Google 帳號相同 user ID 與舊資料銜接、iPhone Safari／Android Chrome 真機。正式 Google Provider 停用須在舊帳號銜接驗證後執行。
- 本機預覽：`http://127.0.0.1:5176/onboarding?step=3`，使用本機測試設定及 mock API；無真實寄信／雲端同步。預覽確認後才提交／發布。

### 2026-10-14 預覽寄信錯誤修正

- 使用者在 5176 預覽按寄信遇到 `Failed to fetch`：該預覽連到未啟動的本機 Auth 54321，並非 Hosted 寄信服務。原先可點按鈕的呈現不足，已修正。
- `VITE_AUTH_PREVIEW_ONLY=true` 僅在 DEV 生效；5176 已以此設定重啟，顯示未開放寄信的提示，停用 Email 輸入／寄信並在 Auth helper 阻擋請求。正式登入及本機真實 Supabase 測試不受此旗標預設影響。
- 連線錯誤改為中文，明確指出寄送或驗證尚未完成，保留草稿；OTP 過期與寄信限流也有中文訊息。
- 新增 network-abort 瀏覽器測試：不能宣稱已寄信、不能顯示驗證欄或完成設定；7 個 Auth 瀏覽器測試通過，Web build／API typecheck 通過。ego-browser 已確認預覽提示顯示、Email 輸入與寄信按鈕停用。
- 再次執行 `bun run verify`，仍被相同三個既有採買日期測試阻擋。正式 SMTP／Hosted 範本／真實新舊帳號驗證仍未完成，不能宣稱登入功能正式可用。

### 2026-10-14 已登入後台的設定查核

- 使用者登入 Supabase Safari 獨立視窗後，已在 CooCoo MVP Hosted 後台確認：自訂 SMTP Toggle off；Templates 明確要求 Set up custom SMTP to edit templates，無可沿用的已啟用 SMTP。
- Email Provider enabled、Confirm email on、Allow new users to sign up on；Email OTP length 8、expiration 3600 秒。將 Web 驗證碼欄位修正為接受 6 或 8 位，避免截斷 Hosted 的 8 位碼，未降低雲端 OTP 長度。
- Users 頁確認既有 Google 帳號在同一 UID 下已有 Email 與 Google 登入方式；這仍不等同 OTP 登入及舊資料讀取實測。
- 專案概覽出現 Unhealthy，頁首顯示 Supabase technical issue 公告；是否影響 Auth 真實請求待驗證。
- 未變更雲端設定／Provider／使用者／邀請規則。下一步需使用者提供可用寄信服務與寄件網域，憑證在服務後台安全填入；不在聊天或文件保存憑證。SMTP 仍未設定，真實登入未完成。

### 2026-10-18 雲端 SMTP／驗證碼實測仍未完成

- Hosted SMTP 儲存及啟用已重新載入確認；Magic link / OTP、Confirm sign up 兩個雲端信件範本已改為中文 Token 驗證碼並重新載入查核。
- 真實 OTP 請求被 Brevo 拒絕，Supabase logs 顯示 HTTP 500、535 Authentication failed。已核對 SMTP username／host／port，沒有成功寄送或登入證據，不能標為可用。
- Brevo 頁提供 Activate SMTP Key；啟用會開放實際寄信權限，已請使用者作此步確認，尚未執行。憑證不進聊天／文件／程式庫。
- Web 錯誤提示修正 HTTP 5xx 與瀏覽器網路錯誤的區別；9 個 Auth 單元測試通過，Web build 通過。`bun run verify` 184 pass、3 個既有採買日期測試失敗；Google Provider 與正式 Web 發布尚未變更。
- 真實測試環境：5177，Hosted Auth + 正式 Render API；5176 仍是不能寄信的舊畫面預覽。詳細證據與剩餘步驟見 `docs/EMAIL_DELIVERY_PLAN.md`。

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
