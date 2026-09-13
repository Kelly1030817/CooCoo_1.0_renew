# Onboarding 第四步登入同步與窄螢幕操作列修正

- 日期：2026-09-14
- 分支：`codex/onboarding-step4-fix`
- 基準：`origin/main@95f52ff`
- 狀態：本機完成並通過驗證；尚未推送、合併或部署至 Vercel Production

## 問題

後端已移除冰箱容量設定，Onboarding 不應再承擔建立或設定冰箱的責任。原第 4 步仍包含 OCR、確認空箱與手動食材，並把這些資料與登入狀態綁在同一個 disabled 條件。底部操作列的主要按鈕使用不可換行文字，在窄螢幕或放大字級下也可能向右溢出。

## 決定與實作

- 第 4 步改為純「登入與同步」，移除 OCR、確認空箱與手動食材。
- 使用者按下第四步「繼續」時，向 Supabase 即時確認 session；登入有效才進第五步。
- session 未完成或網路暫時無法確認時，保留 Onboarding 草稿並顯示可操作的登入／重試訊息。
- 完成 Onboarding 時固定送出 `inventoryReviewed: false`、`hasNoInventory: false`，避免舊草稿觸發後端清空庫存；不呼叫 `/inventory`。
- 登入顯示分成確認中、已登入、未登入三種狀態，避免把等待誤顯示成未登入。
- 底部與 OCR 操作按鈕加入可收縮、換行及最大寬度限制，保留 320px 手機寬度與放大字級下的可用性。

## 驗證邊界

- `bun run verify`：173 tests、Web production build、API typecheck 全數通過。
- Playwright 320 × 700 實走：第 4 步沒有任何冰箱設定，登入確認後可進第五步。
- 以 30px 放大按鈕字級壓力測試，底部操作列 `scrollWidth === clientWidth === 320`，無水平溢位。
- 正式站目前仍是修正前版本；登入中的正式帳號、iPhone Safari 與 Android Chrome 要在部署後再次驗證。
