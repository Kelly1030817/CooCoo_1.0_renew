# apps/web

CooCoo 手機網頁。固定五頁：今日、採買、冰箱、食譜、我的。Onboarding 在完成主廚檔案前攔截。

## 開發

```bash
bun install
bun run --cwd apps/web dev -- --host 127.0.0.1
```

本機未設 Supabase 時會走 MSW mock API。設 `VITE_USE_REAL_API=true` 才打真實 `/api`。`GET /state` 會用 `AppStateSchema` 做 `Value.Check`；契約不符時丟 `CONTRACT_MISMATCH`，畫面走錯誤狀態而不是壞資料。

## Lint（oxlint）

`bun run --cwd apps/web lint` 使用 `.oxlintrc.json`：`correctness` / `suspicious` 為 error，並啟用 `options.typeAware`（需 `oxlint-tsgolint`）。`react/react-in-jsx-scope` 關閉（Vite 新 JSX 轉換）。

MSW 合約測試 `src/shared/api/mock/handlers.test.ts` 仍大量使用 `response.json()` 斷言；在 C13 契約型別收斂前，該檔以 override 關閉 `typescript/no-unsafe-type-assertion`，避免與生產程式碼混用同一套 `as` 修復節奏。

## 驗證

```bash
bun run --cwd apps/web lint
bun run --cwd apps/web test
bun run --cwd apps/web test:e2e
bun run verify
```

Playwright 以 headless Chromium 比對無障礙樹（`toMatchAriaSnapshot`），不截圖。基準在 `e2e/**/*.spec.ts` 旁的 snapshot 檔。更新基準：

```bash
bun run --cwd apps/web test:e2e -- --update-snapshots
```

## 分層（FSD）

| 目錄           | 可以 import                              | 不可 import              |
| -------------- | ---------------------------------------- | ------------------------ |
| `src/app`      | 各層                                     | —                        |
| `src/pages`    | widgets、features、entities、shared、app | 其他 pages               |
| `src/widgets`  | features、entities、shared               | pages                    |
| `src/features` | entities、shared                         | pages、widgets           |
| `src/entities` | shared                                   | pages、widgets、features |
| `src/shared`   | shared                                   | 以上各層                 |

Onboarding 三步 UI 在 `src/widgets/onboarding/`；`pages/onboarding/OnboardingPage.tsx` 只組裝草稿、登入與蓋章。widgets 不得 import pages。

各目錄短 README 會隨後續重構補上。

## 樣式與 auth

目前仍有頁面級 CSS；全域設定留在 `src/index.css`。Auth session 由 `Providers` 訂閱一次，畫面用 `useAuthSession()`。Toast / modal 請用 `useUi()`；沒有 `Providers` 時會 throw，不再靜默 no-op。`AppRoute` 是底部導覽與 Header 的路由型別，已刪除未使用的 `TabId` 別名。Onboarding 送出走 react-hook-form + `typeboxResolver(OnboardingProfileSchema)` + `useMutation`；草稿仍自動寫入 `coocoo:onboarding-draft:v2`。
