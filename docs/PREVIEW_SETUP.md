# CooCoo Preview 前置清單

本文件保留 Preview 驗收清單；目前雲端與正式部署狀態以 `docs/PROJECT_HANDOFF.md` 為準。

## 目前設定與檢查項目

1. 已在費用確認（每月 US$0）後建立東京區專案 `CooCoo MVP`，project ref：`cpyvizycjvburtpljxiu`。
2. Supabase migrations 已包含整合 schema、advisor hardening、設定保存、catalog、OpenRouter 預算與 Supabase Cron、RPC 參數修復及交易修復；2026-09-08 Security Advisor 仍有「密碼外洩保護未啟用」警告，Performance Advisor 只有資料量尚少時的 unused index 資訊。Dashboard 已啟用 `public.before_user_created` Before User Created Hook，並以受邀／未受邀 Email 驗證。
3. 設定 Google Provider；Beta 階段使用 Supabase 預設 Magic Link。新 Free 專案若要改成六位數 Email OTP，需先設定自訂 SMTP 才能自訂信件範本。
4. 第一位站長帳號已完成 Email 確認，`app_roles.role = 'owner'`，可由站長頁管理受邀 Email；交接文件與 commit 不保存其明確 Email。
5. Hosted 專案的 Auth URL Configuration 需將本機 Site URL 與 Redirect URL 設為 `http://localhost:5173`；取得 Vercel Preview 網址後再加入 Preview 網域。API 的 `PORT=3000` 不可作為 Web 登入回呼。
6. Render Docker Web Service 已建立並通過 `/api/v1/health`；免費服務仍需持續觀察冷啟動時間。
7. Vercel 已將 `/api/v1/*` rewrite 至正式 Render API，API 規則排在 SPA fallback 前面。仍需完成目標手機瀏覽器的整體驗收。
8. 排程使用 Supabase Cron、Vault 與 `pg_net` 每小時呼叫受保護的 Render worker；不建立 Render Cron 或 Vercel Cron。初始食譜、參考價格、Security Advisor 與雲端 E2E 已通過，正式 `recipe_catalog_control.paused=false`。

## 必要環境變數

公開 Web 只可取得 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`。`SUPABASE_SECRET_KEY` 與 `OPENROUTER_API_KEY` 只能存在後端；舊 `SUPABASE_SERVICE_ROLE_KEY` 僅保留相容性。完整名稱見根目錄 `.env.example`。

## Preview 驗收順序

1. 邀請外 Email 無法用 Email 或 Google 建立帳號。
2. 完成十步 Onboarding，重新整理與換裝置後資料仍在。
3. 390px 不出現橫向表格；三個採買入口可操作。
4. 真實發票圖片辨識、低信心修正、確認後入庫；原圖不可被其他帳號讀取。
5. 開始料理後切飛航模式，完成整段步驟與計時，再連線只同步一次。
6. 煮兩份、吃一份後，料理次數加一、自煮餐份加一、熟食庫存加一並發放對應 EXP；成本紀錄可略過。
7. 執行 Supabase Security 與 Performance Advisors，保存結果後才交付測試者。
