# CooCoo 煮煮第一階段移植設計

## 已核准決策

- 來源以 `/Users/kelly/Desktop/stitch_coocoo_1.0` 目前實際可操作版本為準。
- UI、版型、文案、色票、斷點與互動狀態不得改動。
- 前端採 FSD，後端採 DDD，共用純 TypeScript contracts 與 business core。
- 第一階段由 MSW 提供可持久化且可重設的資料；SQLite 只建立後端測試基座，不建立業務資料表。
- 登入最終對接 Supabase Auth；第一階段僅模擬 session。
- 不啟用已被單一目標版取代的多夢想、舊 30 天計畫、外送阻斷器與週五計畫。

## 完成定義

四分頁與目前可達互動均能經 typed client、MSW、共用 use case 完成；Elysia 暴露相同 contract。既有圓夢規則與新增的庫存、救援、料理、補貨規則有測試，production build、lint、SQLite smoke test 與 393px 無水平溢位驗收通過。
