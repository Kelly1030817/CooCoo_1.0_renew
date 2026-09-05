# CooCoo Preview 前置清單

本文件只準備 Preview，不代表已建立雲端資源或已部署正式站。

## 需要使用者確認後才執行

1. 已在費用確認（每月 US$0）後建立東京區專案 `CooCoo MVP`，project ref：`cpyvizycjvburtpljxiu`。
2. 已套用三個 `supabase/migrations`；2026-09-05 Security Advisor 只剩「密碼外洩保護未啟用」警告（目前 Beta 使用 Passwordless／Google，公開密碼登入前再啟用），Performance Advisor 只剩測試資料量尚少時會出現的 unused index 資訊。Dashboard 已啟用 `public.before_user_created` Before User Created Hook，並以受邀／未受邀 Email 驗證。
3. 設定 Google Provider；Beta 階段使用 Supabase 預設 Magic Link。新 Free 專案若要改成六位數 Email OTP，需先設定自訂 SMTP 才能自訂信件範本。
4. 第一位站長帳號已完成 Email 確認，`app_roles.role = 'owner'`，可由站長頁管理受邀 Email；交接文件與 commit 不保存其明確 Email。
5. Hosted 專案的 Auth URL Configuration 需將本機 Site URL 與 Redirect URL 設為 `http://localhost:5173`；取得 Vercel Preview 網址後再加入 Preview 網域。API 的 `PORT=3000` 不可作為 Web 登入回呼。
6. 在 Render 建立 Docker Preview、填入伺服器端密鑰，量測免費服務冷啟動。
7. 取得實際 Render Preview 網域後，先新增 Vercel `/api/v1/*` rewrite，再將 `/today`、`/shopping`、`/fridge`、`/kitchen`、`/dream` 與其他前端路徑 fallback 至 `index.html`。API 規則必須排在 SPA fallback 前面，避免把無效占位網址提交成部署設定，接著才建立 Vercel Preview。

## 必要環境變數

公開 Web 只可取得 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`。`SUPABASE_SECRET_KEY`、`OPENROUTER_API_KEY` 與 `GEMINI_API_KEY` 只能存在後端；舊 `SUPABASE_SERVICE_ROLE_KEY` 僅保留相容性。完整名稱見根目錄 `.env.example`。

## Preview 驗收順序

1. 邀請外 Email 無法用 Email 或 Google 建立帳號。
2. 完成十步 Onboarding，重新整理與換裝置後資料仍在。
3. 390px 不出現橫向表格；三個採買入口可操作。
4. 真實發票圖片辨識、低信心修正、確認後入庫；原圖不可被其他帳號讀取。
5. 開始料理後切飛航模式，完成整段步驟與計時，再連線只同步一次。
6. 煮兩份、吃一份後，料理次數加一、自煮餐數加一、熟食庫存加一；確認差額後才圓夢入帳。
7. 執行 Supabase Security 與 Performance Advisors，保存結果後才交付測試者。
