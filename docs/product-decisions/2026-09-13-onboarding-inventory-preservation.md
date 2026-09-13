# Onboarding 不得刪除食材庫存

- 日期：2026-09-13
- 狀態：本機已修正，雲端 migration、資料回填與正式發布待授權

## 事故與根因

正式帳號原有 10 批 `inventory_batches`，之後變成 0。前端與 `/api/v1/state` 一致回傳 0，確認不是畫面篩選問題。程式中可一次清除該使用者全部食材批次的產品路徑，是 `save_onboarding_profile` 在 `inventoryReviewed=true` 且 `hasNoInventory=true` 時執行刪除；共用 core 的 mock 行為亦相同。

現有證據能確認資料庫曾有 10 批、其後變為 0，以及上述為唯一整批清除的產品程式路徑；目前日誌不足以判定是哪一個瀏覽器請求實際觸發。

## 決策

`save_onboarding_profile` 只保存個人設定、廚具、飲食限制、每週目標與提醒，不得新增、修改或刪除 `inventory_batches`。`hasNoInventory=true` 只代表使用者在 Onboarding 當下確認沒有要登錄的食材，不是清空既有庫存的指令。

若未來需要「清空冰箱」，必須設計為獨立操作，包含明確二次確認、範圍提示與可稽核紀錄，不得附帶在設定儲存或重播流程。

## 修正與驗證邊界

- core 的 `applyOnboardingProfile` 保留既有庫存。
- 新 migration 覆蓋 `save_onboarding_profile`，移除清庫副作用並保留既有權限。
- core 與 PGlite 資料庫回歸測試都驗證首次儲存及重播不會刪除既有批次。
- 所有正式回填均以單一 `user_id` 為範圍；新帳號完成 Onboarding 不會取得其他帳號的批次，且在本人尚未新增食材前維持 0 批。
- migration 尚未套用正式 Supabase，正式帳號 10 批資料亦尚未回填；在另行授權與完成雲端驗證前均為 `待驗證`。
