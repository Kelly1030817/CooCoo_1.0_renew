# apps/web

CooCoo 手機網頁。固定五頁：今日、採買、冰箱、食譜、我的。Onboarding 在完成主廚檔案前攔截。

## 開發

```bash
bun install
bun run --cwd apps/web dev -- --host 127.0.0.1
```

本機未設 Supabase 時會走 MSW mock API。設 `VITE_USE_REAL_API=true` 才打真實 `/api`。

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

| 目錄 | 可以 import | 不可 import |
| --- | --- | --- |
| `src/app` | 各層 | — |
| `src/pages` | widgets、features、entities、shared、app | 其他 pages |
| `src/widgets` | features、entities、shared | pages |
| `src/features` | entities、shared | pages、widgets |
| `src/entities` | shared | pages、widgets、features |
| `src/shared` | shared | 以上各層 |

各目錄短 README 會隨後續重構補上。

## 樣式與 auth

目前仍有頁面級 CSS；後續改為 Tailwind v4，全域設定留在 `src/index.css`。Auth 仍由 `App.tsx` 與 Onboarding 各訂閱一次，後續會收成單一 session query。
