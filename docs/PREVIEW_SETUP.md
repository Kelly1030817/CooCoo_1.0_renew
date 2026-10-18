# CooCoo Preview 前置清單

本文件保留 Preview 驗收清單；目前雲端與正式部署狀態以 `docs/PROJECT_HANDOFF.md` 為準。

## 目前設定與檢查項目

1. 已在費用確認（每月 US$0）後建立東京區專案 `CooCoo MVP`，project ref：`cpyvizycjvburtpljxiu`。
2. Supabase migrations 已包含整合 schema、advisor hardening、設定保存、catalog、OpenRouter 預算與 Supabase Cron、RPC 參數修復及交易修復；2026-09-08 Security Advisor 仍有「密碼外洩保護未啟用」警告，Performance Advisor 只有資料量尚少時的 unused index 資訊。Dashboard 已啟用 `public.before_user_created` Before User Created Hook，並以受邀／未受邀 Email 驗證。
3. 2026-10-14 本機改為 Email OTP（輸入支援 6 或 8 位），登入畫面不再使用 Google Provider。Hosted 上線前需設定自訂 SMTP、將 Confirm signup 與 Magic Link 信件範本都改為 `supabase/templates/magic_link.html`（包含 `{{ .Token }}`）、確認信件範本與 OTP 長度相容（2026-10-14 Hosted 查核目前為 8 位）；本機 `config.toml` 不會自動更新雲端。2026-10-18 已完成 Hosted SMTP／兩個中文 Token 範本及原帳號、新受邀別名帳號的真實寄送、登入與雲端保存驗證；正式 Web 部署狀態另見交接。
4. 第一位站長帳號已完成 Email 確認，`app_roles.role = 'owner'`，可由站長頁管理受邀 Email；交接文件與 commit 不保存其明確 Email。
5. Hosted 專案的 Auth URL Configuration 需將本機 Site URL 與 Redirect URL 設為 `http://localhost:5173`；取得 Vercel Preview 網址後再加入 Preview 網域。API 的 `PORT=3000` 不可作為 Web 登入回呼。
6. Render Docker Web Service 已建立並通過 `/api/v1/health`；免費服務仍需持續觀察冷啟動時間。
7. Vercel 已將 `/api/v1/*` rewrite 至正式 Render API，API 規則排在 SPA fallback 前面。仍需完成目標手機瀏覽器的整體驗收。
8. 排程使用 Supabase Cron、Vault 與 `pg_net` 每小時呼叫受保護的 Render worker；不建立 Render Cron 或 Vercel Cron。初始食譜、參考價格、Security Advisor 與雲端 E2E 已通過，正式 `recipe_catalog_control.paused=false`。

## 必要環境變數

公開 Web 只可取得 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`。`SUPABASE_SECRET_KEY` 與 `OPENROUTER_API_KEY` 只能存在後端；舊 `SUPABASE_SERVICE_ROLE_KEY` 僅保留相容性。完整名稱見根目錄 `.env.example`。

## Preview 驗收順序

1. 邀請外 Email 無法建立帳號，畫面顯示拒絕原因且保留主廚設定草稿。
2. 完成三步 Onboarding，重新整理與換裝置後資料仍在。
3. 390px 不出現橫向表格；三個採買入口可操作。
4. 真實發票圖片辨識、低信心修正、確認後入庫；原圖不可被其他帳號讀取。
5. 開始料理後切飛航模式，完成整段步驟與計時，再連線只同步一次。
6. 煮兩份、吃一份後，料理次數加一、自煮餐份加一、熟食庫存加一並發放對應 EXP；成本紀錄可略過。
7. 執行 Supabase Security 與 Performance Advisors，保存結果後才交付測試者。

## Email 切換驗收與舊帳號

- 保留現有 `auth.users`、Google identity 與業務資料；不刪除或重建舊帳號。關閉雲端 Google Provider 需等舊帳號 Email 登入驗證完成後再執行。
- 以原 Google 帳號相同 Email 驗證登入，確認登入後的 user ID 與舊 ID 相同，並讀到原冰箱、飲食限制、料理紀錄及站長角色；不可僅靠 Email 相同推定已銜接。
- 以全新受邀帳號完成三步 → 收信 → 在原頁輸入驗證碼 → 一次按「成立主廚檔案並開始」→ 確認 PUT /onboarding 與 GET /state → 今日；重新整理及換裝置後設定仍在。
- 錯碼、過期、寄信限流、未受邀、儲存／讀回失敗均需有明確錯誤及重試，不能把未儲存草稿標為完成。
- 本機瀏覽器測試攔截 Auth／API 僅證明流程，不證明真實收信、雲端資料保存或真機瀏覽器。
- 官方依據：https://supabase.com/docs/guides/auth/auth-email-passwordless 與 https://supabase.com/docs/guides/auth/auth-smtp。
