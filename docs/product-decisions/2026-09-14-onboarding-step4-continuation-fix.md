# Onboarding 第四步登入同步與窄螢幕操作列修正

- 日期：2026-09-14
- 分支：`codex/onboarding-step4-fix`
- 基準：`origin/main@43df211`
- 狀態：程式與本機驗證完成；GitHub 與 Vercel 狀態以發布平台紀錄為準

## 問題

後端已移除冰箱容量設定，Onboarding 不應再承擔建立或設定冰箱的責任。原第 4 步仍包含 OCR、確認空箱與手動食材，並把這些資料與登入狀態綁在同一個 disabled 條件。底部操作列的主要按鈕使用不可換行文字，在窄螢幕或放大字級下也可能向右溢出。

## 決定與實作

- 第 4 步改為純「登入與同步」，移除 OCR、確認空箱與手動食材。
- 第四步已由 Supabase auth state 確認登入時直接前進；尚未確認登入時，按下「繼續」才即時重查 session。避免正式瀏覽器在已登入狀態重複取 session 時卡住。
- session 未完成或網路暫時無法確認時，保留 Onboarding 草稿並顯示可操作的登入／重試訊息。
- 完成 Onboarding 時固定送出 `inventoryReviewed: false`、`hasNoInventory: false`，避免舊草稿觸發後端清空庫存；不呼叫 `/inventory`。
- 第 1、3、5 步分別移除熟練度、料理預設指引與週主指標卡片；完成時固定寫入 `beginner`、`detailed`、`cooking_sessions`，避免舊草稿中的隱藏值延續。
- 登入顯示分成確認中、已登入、未登入三種狀態，避免把等待誤顯示成未登入。
- 底部與 OCR 操作按鈕加入可收縮、換行及最大寬度限制，保留 320px 手機寬度與放大字級下的可用性。

## 驗證邊界

- `bun run verify`：173 tests、Web production build、API typecheck 全數通過。
- Playwright 320 × 700 實走：第 4 步沒有任何冰箱設定，登入確認後可進第五步。
- 以 30px 放大按鈕字級壓力測試，底部操作列 `scrollWidth === clientWidth === 320`，無水平溢位。
- 部署後仍需分別確認登入中的正式帳號、iPhone Safari 與 Android Chrome；本機瀏覽器驗證不能取代這些環境。
