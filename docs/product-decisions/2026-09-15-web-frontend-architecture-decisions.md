# apps/web 前端架構與工具鏈決策

- 日期：2026-09-15
- 分支：`codex/coocoo-integrated-mvp`（討論時的工作樹含未提交的 `apps/web/src/pages/onboarding/OnboardingPage.tsx` 與 `package.json` 變更）
- 狀態：**決策已與使用者確認，尚未實作。** 本文件只記錄決策與理由，實作計劃另開工作階段制定。
- 觸發來源：以 Codebase Memory 完整索引專案（`full` 模式，2026 nodes／5814 edges）後，對 `apps/web` 登入流程與整體前端實作所做的靜態稽核。

## 為什麼要寫這份文件

`AGENTS.md` 要求「broad product, architecture, or page-boundary changes 要先討論再實作」。本次涉及樣式策略、目錄分層、schema 來源與工具鏈四項跨頁面決策，全部落在該條款範圍內。

同時本文件也用來鎖定兩個容易被後續協作者反覆重提的決定：

1. **runtime schema 一律使用 `@sinclair/typebox`，不引入 zod。**
2. **樣式以 Tailwind v4 為主，不再新增頁面級 CSS 檔案。**

若未來要推翻這兩項，請以新的 product-decision 文件覆蓋，不要在實作 PR 中夾帶。

---

## 一、稽核發現的既有缺陷

以下為靜態程式碼分析結果，作為後續實作的依據。**「已確認」指可從程式碼直接證實；「待驗證」指需要在正式站或真機環境觀察才能確認。**

### 1.1 正式站登入後不顯示「登入完成」UI

**已確認｜OAuth 回呼失敗完全無聲（最可能主因）**

`apps/web/src/shared/auth/supabase.ts` 的 `readAuthCallbackIssue()` 會把回呼 hash 中的 `error_code`／`error_description` 轉成中文訊息，並針對 `otp_expired` 與 `Unable to exchange external code` 各寫了專屬文案。但全 repo 搜尋顯示它**只出現在自身定義與 `supabase.test.ts`，沒有任何 UI 呼叫**。

後果：任何回呼失敗都不會產生 session，`authStatus` 回到 `signed-out`，畫面只是再次顯示 Google 登入按鈕，沒有任何錯誤提示。使用者觀感即「登入完回來卻什麼都沒發生」。

**已確認｜`redirectTo` 丟失路由，回站步數完全依賴 localStorage**

`OnboardingPage.tsx` 呼叫 `startGoogleAuth()` 未傳參數，`redirectTo` 取 `window.location.origin`（根路徑，非 `/onboarding`）。`app/routing/routes.ts` 的 `routesByPath` 沒有 `"/"` 這個鍵，`routeFromPathname("/")` 走 fallback 回傳 `"today"`，`useAppRoute` 隨後 `replaceState` 成 `/today`。

`App.tsx` 此時僅因 `!onboardingComplete` 而重新 render `OnboardingPage`，且傳入 `initialStep={undefined}`、`key="onboarding-initial"`，起始步數 100% 取自 `readOnboardingDraft().currentStep`。

因此草稿一旦讀不到（無痕視窗、iOS 儲存限制、使用者清資料、換裝置、in-app 瀏覽器與系統瀏覽器 storage context 不同），使用者會被丟回第 1 步，而「登入完成」文案只存在第 3 步，根本不會被 render。

**已確認｜`stamped` 為 component state，整頁跳轉後歸零**

使用者若先按「蓋章」被要求登入，登入回站後 `stamped` 為 `false`，蓋章動畫與 1450ms 的 `sealDropped` 解鎖重新開始，需再按一次。

**待驗證｜PKCE code_verifier 跨 browser context 遺失**

supabase-js v2 預設 PKCE flow，code_verifier 存於 localStorage。自 LINE／FB／IG 等 in-app 瀏覽器發起登入時，常被導向系統瀏覽器完成授權，回呼落在不同 context 導致 verifier 取不到，換 code 失敗。程式碼中 `Unable to exchange external code` 的專屬文案正是為此情境所寫。

**待驗證｜未受邀 email 被 `before_user_created` hook 拒絕**

`supabase/config.toml` 啟用 `[auth.hook.before_user_created]`，`supabase/migrations/20260826012036_integrated_mvp_schema.sql` 的函式對非 `beta_invites`（`status='invited'`）email 回 403「CooCoo 封閉測試目前只接受受邀 Email」。

此為正式站與本機最大差異：本機 `supabase` 為 `null` 時 `authStatus` 初始值直接是 `signed-in`，所以本機永遠看得到完成文案。這解釋了「本機正常、正式站不正常」。

**待驗證｜Supabase Auth Redirect URL 白名單**

`docs/PREVIEW_SETUP.md` 第 5 點僅記錄 `http://localhost:5173` 與「取得 Vercel Preview 網址後再加入」。若正式網域未加入 Redirect URLs，Supabase 會忽略 `redirectTo` 改用 Site URL，使用者被導向其他網域，原分頁自然永不顯示完成狀態。

**診斷方式**：正式站登入回站瞬間檢查 URL 是否帶 `#error_code=`／`error_description=`，以及 console 是否有 Supabase auth error。有 → 屬回呼失敗類（無聲 bug + PKCE／未受邀）；URL 乾淨但停在第 1 步 → 屬草稿遺失類。

### 1.2 選項按鈕選中樣式失效

**已確認**。`OnboardingPage.tsx` 的 `Choice` component 串接 className 時漏空格：

```
let className = 'onboarding-choice';
if(selected) { className += 'selected'; }   // 產出 "onboarding-choiceselected"
if(danger)   { className += 'danger'; }
```

CSS 定義為 `.onboarding-choice.selected`（`OnboardingPage.css:605-607`），故第 1、2 步的餐期／廚具／卡點選項按下後**完全沒有選中樣式**。`danger` 分支同樣失效，且該 prop 從未被傳入，屬死參數。

### 1.3 工具鏈實質失效

**已確認**。`bun run lint` 執行 `oxlint`，而 `apps/web/.oxlintrc.json` 只啟用兩條規則、未開 `typeAware`：

```json
{
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

且 **oxlint 不含 formatter**，專案沒有任何格式化工具。這直接解釋了為何 1.2 的 className bug 與 `OnboardingPage` auth effect 的空 deps 都能通過 `bun run verify`。

### 1.4 型別在邊界宣告、實作卻自行放寬

**已確認**。問題不只是「未宣告 interface」，而是型別約束在實作層流失：

- `app/ui-context.ts` 的 `UiContextValue` 正確把 `type` 限制為 `'success'|'warning'|'error'`，但 `app/providers.tsx` 實作寫成 `useState<{message:string;type:string}|null>`，union 消失。拼錯字（如 `'warnning'`）會靜默落入 success 分支。
- prop 型別風格三種並存：`AuthRecoveryPanel` 有 named `AuthRecoveryPanelProps`；`OnboardingPage` 內有 `interface ChoiceProps`；`StepCard`、`OnboardingPage` 本身、`Header`、`ProfileModal`、`CookwareModal` 全為 inline 匿名 object。
- `UiContext` 預設值是 no-op 物件而非 `undefined` + guard hook，component 在 `Providers` 外 render 時 `ui.toast()` 靜默失效，型別無法反映。
- `shared/api/client.ts` 以 `JSON.parse(text) as ApiSuccess<T> | ApiErrorBody` 雙重斷言，泛型 `T` 沒有任何 runtime 保證。
- `widgets/app-shell/types.ts` 整個檔案僅一行 `export type { AppRoute as TabId }`，同一概念兩個名字，屬殘留 indirection。

### 1.5 其他已確認缺陷

- **`App.tsx` 繞過 API client**：`applySession` 使用裸 `fetch("/api/v1/state")` 手動組 header，因此沒有 `ApiError`、沒有 `fallbackMessages`、路徑硬編；失敗時僅 `invalidateQueries`，但 `authStatus` 已是 `signed-in`。
- **auth 狀態雙軌**：`App.tsx` 與 `OnboardingPage.tsx` 各自維護一份 authStatus（一個是 `loading|signed-in|signed-out`，一個是 `checking|signed-in|signed-out`）並各掛一份 `onAuthStateChange` 訂閱。
- **`MePage` stale initial state**：`useState(data?.weeklyGoal.target ?? 1)` 位於 `if (!data) return null` 之前，`data` 由 undefined 變有值時 `target` 不會更新。
- **`Providers` toast timer 未清除**：`window.setTimeout` 沒有對應 clear，連續兩個 toast 時前一個 timer 會提早關掉後一個。
- **可及性不一致**：`Choice` 為多選按鈕但無 `aria-pressed`，同頁的 `restriction-chip` 有。
- **`UiContext` 以 `ReactNode` 存 modal 內容於 state**：modal 內容無法隨 state 更新。
- **`widgets/app-shell/Header.tsx` 職責混雜**：同時 export `Header`、`ProfileModal`、`CookwareModal`，且 `pages/me/MePage.tsx` 反向 import 這些 modal。
- **`apps/web/README.md` 為 Vite 樣板原文未修改**；全 repo 僅 root 與 `apps/web` 兩份 README，`apps/web/src/` 下各分層目錄皆無說明。
- **五個未使用的 dependency**：`axios`、`react-hook-form`、`clsx`、`tailwind-merge`、`lucide-react` 皆列於 `apps/web/package.json` 但全 `src` 無任何 import。

---

## 二、已確認的決策

### 決策 1：runtime schema 一律使用 `@sinclair/typebox`，不引入 zod

**決定**：不引入 zod。缺失的 runtime 驗證改以既有 typebox schema 補上。

**理由**：`packages/contracts/src/index.ts` 以 `Type` + `Static` 同時產出 runtime schema 與 TS 型別，共 122 個 export，是前後端唯一契約來源。API 端已有多處 `Value.Check` 驗證 AI 回傳（`recipes/openrouter-recipe.service.ts`、`receipts/openrouter-receipt-recognizer.ts`、`catalog/quality.ts`、`catalog/worker.ts`、`meal-plans/routes.ts`、`shopping/openrouter-shopping.service.ts`、`recipes/recipe-adjustment.service.ts`），web 的 `shared/api/mock/handlers.ts` 亦使用 `Value.Check` + `FormatRegistry`。

引入 zod 會造成兩套 schema 並存、契約來源分裂，且因 contracts 是 workspace package，遷移必須連同 API 一起做。

**真正的缺口在 web 端**：`shared/api/client.ts` 收到回應後直接斷言，沒有驗證。解法是讓 `createApiClient` 可接受 typebox schema，由呼叫端（如 `useAppState` 傳入 `AppStateSchema`）做 `Value.Check`。

**被否決的替代方案**：引入 zod 並在 web 端建立第二套 schema。否決原因如上。

**備註**：若未來的動機是「zod DX 較佳」或「要用 `zodResolver` 配 react-hook-form」，那是整個 contracts 層的遷移決策，需另開文件討論，不得在實作 PR 中夾帶。RHF 應改用 typebox resolver（見決策 5）。

### 決策 2：Tailwind 直接升級到 v4

**決定**：`tailwindcss` 由 3.4.17 升至 v4，改用 `@tailwindcss/vite` plugin。

**理由與連帶效果**：

- v4 不再需要 `postcss.config.js` 與 `tailwind.config.js`，兩個檔案直接刪除。這一併解決了「config 全部改成 ts」中最麻煩的部分 —— `postcss.config.js` 無法直接改為 `.ts`（`postcss-load-config` 需額外 TS loader，收益極低）。
- theme 改以 CSS `@theme` 宣告。現有 `tailwind.config.js` 只有 `colors`、`borderRadius`、`spacing` 三段 extend，遷移成本低。
- `autoprefixer` 與 `postcss` 可依 v4 實際需求評估是否移除。

**待實作階段確認**：v4 對現有 utility class 命名的 breaking changes（如 opacity 語法、`@apply` 行為）需逐項比對；`index.css` 目前為壓縮成單行的全域樣式，遷移時需先展開。

### 決策 3：樣式策略 —— 除全域設定外不再有頁面級 CSS 檔案

**決定方向**：全面 Tailwind，`apps/web/src` 下 8 個 CSS 檔（`index.css`、`OnboardingPage.css`、`ShoppingPage.css`、`TodayPage.css`、`MePage.css`、`RecipesPage.css`、`FridgePage.css`、`BottomNav.css`）中，除全域設定外皆應消除。

**實作階段必須定案的細節（尚未決定）**：

以下三類樣式在 Tailwind 中表達性較差，需在計劃階段決定處理方式（保留於全域 `@layer components`，或硬轉為 utility）：

1. keyframes 動畫：蓋章動畫、chef avatar nodding、`step-slide-down`、`toast-in`。
2. `radial-gradient` 背景：`.onboarding-shell`。
3. 多層巢狀 media query：`OnboardingPage.css` 有 680+ 行，含多組 breakpoint。

**必須遵守的執行約束**：

- `AGENTS.md` 要求保留 page-level CSS isolation 與已核可的五頁行動導覽。**逐頁進行，每頁完成後立即與 `legacy-720-development` 分支做視覺比對，再進行下一頁**，不得一次全部翻寫。
- 原因：`legacy-720-development` 被保留作視覺與行為比對基準。CSS 檔一旦刪除，像素級 diff 的能力就消失，樣式跑掉將無法回溯。

**相關**：`clsx` 與 `tailwind-merge` 已在 `package.json` 中但未使用，正是此階段所需的 `cn()` 工具，保留。

### 決策 4：圖示統一使用 `lucide-react`

**決定**：採用 `lucide-react`，移除 Material Symbols。

**影響範圍（實測）**：`material-symbols-outlined` 在 `apps/web/src` 共出現 87 次，分布於 15 個檔案 —— TSX 63 次（`TodayPage.tsx` 37、`ShoppingPage.tsx` 8、`ShoppingChefChatModal.tsx` 6、`OnboardingPage.tsx` 3、`Header.tsx` 2、`ShoppingModals.tsx` 2，其餘 6 檔各 1），CSS 24 次（`TodayPage.css` 18、`index.css` 4、`BottomNav.css` 1、`MePage.css` 1）。

另需移除 `apps/web/index.html:13` 的 Material Symbols webfont `<link>`。

**注意**：CSS 中的 24 處與決策 3 的 CSS 消除工作重疊，兩者應合併規劃。移除 webfont 同時可減少一個外部字型請求。

### 決策 5：Onboarding 表單重寫為 react-hook-form + typebox + TanStack Query

**決定**：`react-hook-form`（已在 dependency 中但未使用）正式啟用，搭配 typebox resolver 做驗證，提交走 TanStack Query mutation。

**理由**：現況為 12 個 `useState` 加手寫 `update()` 逐欄位寫入 localStorage。Codebase Memory 顯示 `update` 與 `cheer` 的 fan-in 皆為 7，是該檔案最集中的耦合點。

**要保留的既有行為**：

- localStorage 草稿（`coocoo:onboarding-draft:v2`）的自動保存機制必須保留 —— 這是 OAuth 整頁跳轉後能還原步數的唯一機制。
- 完成時仍須固定送出 `inventoryReviewed: false`、`hasNoInventory: false`（見 `2026-09-14-onboarding-step4-continuation-fix.md`），避免舊草稿觸發後端清空庫存。
- 三步的驗證條件（`isOnboardingStepValid`）與 `completeOnboardingProfile` 的固定值寫入邏輯。

**注意**：typebox resolver 需確認可用方案（`@hookform/resolvers` 是否支援 typebox，或需自行實作一個薄 resolver 包裝 `Value.Check`）。此為實作階段的技術驗證項。

### 決策 6：Auth 狀態以 TanStack Query 集中管理

**決定**：建立單一 auth session query，取代 `App.tsx` 與 `OnboardingPage.tsx` 各自維護的兩套狀態機。

**設計要點**：

- Supabase session 是 push 模型（`onAuthStateChange`），TanStack Query 是 pull 模型。正確形狀為 `useQuery({ queryKey: ['auth','session'], queryFn: () => supabase.auth.getSession(), staleTime: Infinity })`，並由**單一一個** `onAuthStateChange` 訂閱呼叫 `queryClient.setQueryData` 推入更新。
- **訂閱不可放在 hook 內**，否則 N 個 component 產生 N 個訂閱，正是現況的問題。應置於 `Providers` 層或模組層，全程只執行一次。
- **`shared/api/client.ts` 不改為讀 query cache**。目前每次請求 `await supabase.auth.getSession()` 取 token 是正確的；改讀 cache 會造成 client → query → client 的循環依賴。supabase-js 內部本身有 cache。
- 兩套狀態機的字面值需統一（`loading|signed-in|signed-out` 與 `checking|signed-in|signed-out` 擇一）。

**同時修復**：將 `readAuthCallbackIssue()` 接入此集中層，確保任何 OAuth 回呼錯誤都會顯示訊息。**這是正式站 1.1 缺陷的實際修復點，也是本次重構最高優先的產出。**

### 決策 7：OnboardingPage 移入 widgets，邏輯抽成 hook

**決定**：`pages/onboarding/` 只保留一層薄 page，三步組裝移至 `widgets/onboarding/`，state machine 抽成 hook（如 `useOnboardingDraft()`、`useOnboardingStep()`）。三步各自成獨立 component。

**理由**：`OnboardingPage.tsx` 現為 411 行、12 個 useState，footer 的按鈕文案是三層嵌套三元運算。

**必須避開的反例**：`widgets/app-shell/Header.tsx` 同時 export `Header`、`ProfileModal`、`CookwareModal`，而 `pages/me/MePage.tsx` 反向 import 這些 modal —— 這是 widget 被當成雜物櫃的既有反例，搬移 onboarding 時不得複製此模式。

**FSD 方向性**：pages 可以 import widgets，**widgets 不得 import pages**。

### 決策 8：工具鏈統一

**決定**：

- 補齊 oxlint 規則：開啟 `typeAware`（需安裝 `oxlint-tsgolint`），啟用 `correctness` 與 `suspicious` 類別。
- 加入 prettier，並將 `format:check` 納入 `bun run verify`。
- config 檔改為 TypeScript。**經決策 2 後，`postcss.config.js` 與 `tailwind.config.js` 直接刪除而非改寫**，實質上只剩已是 `.ts` 的 `vite.config.ts` 與 tsconfig 系列。

**待實作階段驗證**：oxlint 對 `react-hooks/exhaustive-deps` 的支援程度未確認。若覆蓋不足，需保留一個最小 eslint 設定專跑 hooks 規則。此決定必須在實測後才能定案。

**這一步應優先執行**，因為它是後續所有重構的安全網。

### 決策 9：TanStack Query 快取策略分層

**決定**：分兩階段。

**第一階段（現在）**：`app/providers.tsx` 目前為 `staleTime: 0, retry: false`。改為給 `['app-state']` 一個折衷 staleTime（約 30 秒）、對 GET 開啟有限 retry、並以 `placeholderData` 消除整頁 loading 閃動。

**第二階段（後續）**：細緻的 staleTime 分層。

**前置阻礙（必須理解）**：目前 inventory、shoppingItems、mealPlan、growth、session 全部在同一個 query key `['app-state']` 下，由單一 `/state` endpoint 回傳。**staleTime 綁定 query key，因此在拆分 endpoint 之前，物理上無法對不同資料給不同過期時間。** 「分析哪些資料高機率更新」的分析做得出來，但落地必須先拆 query 與 endpoint。

**理由（retry）**：API 部署於 Render 免費方案，有冷啟動延遲，現行 `retry: false` 對此特別不利。

### 決策 10：暫不引入 Zustand

**決定**：不引入。

**理由**：目前的問題不是缺少 state manager，而是 `UiContext` 把 modal 內容當 `ReactNode` 存在 state 裡（導致 modal 內容無法隨 state 更新）—— 這是設計問題，換 state manager 不會改善。應先做 props 傳遞與 context 設計的優化，再評估是否需要。

### 決策 11：型別使用強化

**決定**：

- 所有 component prop 型別統一為 named type（風格採 `type XxxProps = {...}`，與既有 `AuthRecoveryPanelProps` 一致）。
- 實作層不得放寬邊界型別。`Providers` 的 notice state 必須沿用 `UiContextValue` 的 union，不可寬化為 `string`。
- `UiContext` 改為 `createContext<UiContextValue|undefined>(undefined)` + 會 throw 的 `useUi()` guard hook。
- `shared/api/client.ts` 移除 `as` 斷言，改以 typebox `Value.Check` 驗證（見決策 1）。
- 刪除 `widgets/app-shell/types.ts`，統一使用 `AppRoute`。

### 決策 12：dependency 清理

| 套件              | 決定                                                             |
| ----------------- | ---------------------------------------------------------------- |
| `axios`           | 刪除。與既有原生 fetch + `createApiClient` + `ApiError` 實作衝突 |
| `react-hook-form` | 啟用（見決策 5）                                                 |
| `clsx`            | 保留並啟用（決策 3 的 `cn()` 工具）                              |
| `tailwind-merge`  | 保留並啟用（同上）                                               |
| `lucide-react`    | 保留並啟用（決策 4）                                             |

### 決策 13：README 補齊

**決定**：

- 改寫 `apps/web/README.md`（現為 Vite 樣板原文未修改），內容涵蓋 FSD 分層說明、五頁邊界、樣式策略、auth 流程。
- 在 `apps/web/src/` 各分層目錄（`app`、`pages`、`widgets`、`features`、`entities`、`shared`）各放一份短 README，明確寫出「本層可以 import 誰、不可 import 誰」。FSD 最容易腐化的正是這條依賴方向，寫下來比口頭約定有效。
- README 隨各實作階段同步更新，不留到最後。

### 決策 14：小範圍缺陷修正

以下可合併為一批低風險修正：

- `Choice` component 的 className 串接漏空格（1.2），並移除未使用的 `danger` prop。
- `Choice` 補上 `aria-pressed`，與 `restriction-chip` 一致。
- `startGoogleAuth` 帶回原路由（如 `${origin}/onboarding?step=3`），onboarding 步數納入 URL query 而非僅依賴 localStorage。
- `routes.ts` 將 `"/"` 明確 map 到 `today`，不再依賴 fallback + `replaceState` 補救。
- `App.tsx` 的 `applySession` 改用 `api<AppState>("/state")`，收回裸 fetch。
- `MePage` 的 `target` state 修正 stale initial state。
- `Providers` 的 toast timer 加上清除。

---

## 三、建議執行順序

改動之間存在依賴，順序錯誤會造成重工。

1. **工具鏈安全網**（決策 8）：lint 規則補齊 + prettier + `verify` 納入 format check。先做，後續重構才有保護。
2. **Tailwind v4 升級**（決策 2）：只做升級與 config 刪除，暫不動 CSS 內容。
3. **低風險修正一批**（決策 14 + 12 的 `axios` 刪除）。
4. **Auth 集中化 + 接上 `readAuthCallbackIssue`**（決策 6）：正式站缺陷的實際修復。
5. **API 回應驗證 + 型別強化**（決策 1、11）。
6. **拆解 OnboardingPage 進 widgets + RHF 重寫**（決策 7、5）：此時已有 lint 與型別保護。
7. **快取策略第一階段**（決策 9）。
8. **圖示遷移 + CSS 逐頁 Tailwind 化**（決策 4、3）：風險最高，需逐頁與 legacy 視覺比對，放最後。

README（決策 13）隨各階段同步更新。

---

## 四、驗證邊界

- **本文件為純文件變更，未修改任何程式碼，未執行 `bun run verify`。**
- 第一節所有「已確認」項目來自靜態程式碼分析與 Codebase Memory 圖查詢，**未在瀏覽器或正式站實際重現**。其中「登入後不顯示完成 UI」的根因判定是基於程式碼路徑推論，實際主因仍須依「診斷方式」一節在正式站觀察後才能確定。
- 標記「待驗證」的項目（PKCE context、未受邀 email、Redirect URL 白名單）**無法從程式碼證實**，必須在正式站以測試帳號實測。
- Codebase Memory 覆蓋率檢查：本文件引用的所有 `apps/web` 檔案狀態均為 `no_recorded_issue`；`supabase/migrations/20260826012036_integrated_mvp_schema.sql` 為 `parse_partial`，故其中的 `before_user_created` 函式內容是直接讀取原始碼確認，非依賴圖索引結果。覆蓋率為 best-effort 訊號，不構成完整性證明。
- 本文件所有決策**尚未實作**。實作計劃、工作拆分與各階段驗收標準將於另一工作階段制定。
- 決策 8（oxlint `exhaustive-deps` 支援度）、決策 5（typebox resolver 可用方案）、決策 2（v4 breaking changes 清單）、決策 3（動畫與漸層處理方式）四項含待驗證或待定案內容，計劃階段必須先解決才能排入實作。
