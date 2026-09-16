# 同一道食譜的詳細／精簡模式：OpenRouter 成本研究

- 查核日期：2026-09-13（Asia/Taipei）
- 性質：方案估算，未呼叫付費 API；價格與模型供應狀態會變動
- 範圍：只比較食譜文字／JSON 生成，不含圖片、語音合成、資料庫、流量與人力薪資

## 結論

以目前 repo 的 `google/gemini-3.7-flash` 公開標準價格及本文的代表性 token 假設估算，同一道食譜的模型費約為：

| 方案                                          | API 呼叫 |          每道食譜模型費 | 相對單次 canonical |
| --------------------------------------------- | -------: | ----------------------: | -----------------: |
| A. 一次生成可支援兩種呈現的 canonical package |        1 | 約 US$0.00975／NT$0.341 |               基準 |
| B. 詳細版、精簡版各自獨立生成                 |        2 | 約 US$0.01238／NT$0.433 |               +27% |
| C. 先生成詳細版，再用第二次 AI 呼叫簡化       |        2 | 約 US$0.01358／NT$0.475 |               +39% |

單道模型費差距只有約 NT$0.09–0.13；真正明顯的差距在人力、驗證、失敗重試與兩版本內容漂移。**建議採 A：一個權威食譜包、同一步驟內提供詳細與精簡呈現所需欄位，後端只做一次 AI 生成與一次共同安全檢核。**

## 目前 repo 的事實

1. `render.yaml`、`.env.example` 與 `OpenRouterJsonClient` 都把一般食譜模型設為 `google/gemini-3.7-flash`。
2. 食譜生成是一次 OpenRouter structured-output 呼叫，`maxTokens` 為 4096；這是輸出上限，不代表每次都會計費 4096 tokens。
3. 客戶端要求 strict JSON Schema、`require_parameters: true`、`data_collection: deny`，並將 OpenRouter 回傳的 `usage.cost`、prompt tokens 與 completion tokens 帶回。實際帳單應以 `usage.cost` 為準。
4. repo 的保守換算率是 US$1 = NT$35；單次食譜生成先保留的上限是 NT$2。資料庫預設食譜 AI 月上限為 NT$30、每位使用者每日 3 次。
5. 現有 `RecipePackage` 每一步只有 `instruction`、`voiceText`、`timerSeconds` 與 `safetyNote`，尚無 detailed／compact 的雙呈現欄位。

Repo 證據：

- `render.yaml:20-43`
- `.env.example:18-28`
- `apps/api/src/modules/ai/openrouter-json-client.ts:36-95`
- `apps/api/src/modules/recipes/openrouter-recipe.service.ts:10-35`
- `packages/contracts/src/index.ts:176-203`
- `supabase/migrations/20260908134224_unified_openrouter_budget.sql:1-56`

## 官方價格

OpenRouter models API 在查核日對 `google/gemini-3.7-flash` 回傳的 top-level default pricing：

- prompt：US$0.00000075／token，即 US$0.75／百萬 tokens
- completion：US$0.00000375／token，即 US$3.75／百萬 tokens
- internal reasoning：US$0.00000375／token
- input cache read：US$0.000000075／token

OpenRouter 文件說明 `pricing` 數值是每 token／request／unit 的美元價格，top-level 值代表預設條件；每次回應的 `usage` 會提供模型原生 tokenizer 計算的 prompt/completion token 與總成本。端點清單同時顯示 flex、standard、priority 等不同價格，但 repo 未送 `service_tier` 或 tier endpoint slug；依 OpenRouter 的路由說明，這類請求不會進非預設 tier。因此本文採 Standard／top-level default price，不把暫時性的 flex 折扣當成保證。

Google 第一方價格頁也列出相同的 2026 年優惠價，並註明優惠至 2026-12-31；2027-01-01 起 Standard input／output 會加倍為 US$1.50／US$7.50 每百萬 tokens。若產品在 2027 年仍使用同模型且 token 用量相同，本文模型費估算也應近似加倍。這是已公告的未來價格，不是今日帳單。

Structured output 透過 `response_format: json_schema` 啟用；官方 pricing 沒有另列 structured-output SKU，因此本文不另加一筆附加費，仍以實際 tokens、reasoning/cache 與 `usage.cost` 為準。Gemini 的 implicit caching 雖可自動生效，但單次動態食譜 prompt 的命中不可預先保證，基準估算不扣 cache 折扣。

官方來源：

- [OpenRouter models API](https://openrouter.ai/api/v1/models)
- [OpenRouter Gemini 3.7 Flash 模型頁](https://openrouter.ai/google/gemini-3.7-flash/api)
- [Gemini 3.7 Flash endpoints API](https://openrouter.ai/api/v1/models/google/gemini-3.7-flash/endpoints)
- [Google Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.7-flash)
- [OpenRouter Models API pricing 說明](https://openrouter.ai/docs/guides/overview/models#pricing-object)
- [OpenRouter Usage Accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting)
- [OpenRouter Service Tiers](https://openrouter.ai/docs/guides/features/service-tiers)
- [OpenRouter Structured Outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [OpenRouter Prompt Caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching)

## 估算假設

這不是 production 實測 token 紀錄；是為比較架構而使用的同尺度假設。

- 一般生成呼叫的 input：2,000 tokens，含 system prompt、使用者情境、硬限制、廚具、庫存與 JSON Schema。
- 詳細食譜 output：1,600 tokens。
- 精簡食譜 output：900 tokens。
- 一次輸出兩種呈現所需欄位的 canonical package：2,200 output tokens；共用食材、時間、步驟 ID、安全規則，因此小於 1,600 + 900。
- 第二次簡化呼叫需把完整詳細食譜一併輸入，因此 input 為原本 2,000 + 詳細食譜 1,600 = 3,600 tokens。
- 美元換算：US$1 = NT$35，沿用 repo 的保守固定值。
- 不計重試、隱藏 reasoning、cache 命中、OpenRouter/provider tier 差異及失敗呼叫；上線後應以 `usage.cost` 重算。

公式：

`成本（USD） = input tokens × 0.75 / 1,000,000 + output tokens × 3.75 / 1,000,000`

## 三種方案的計算

| 方案                          | Input tokens | Output tokens |     Input 費 |    Output 費 |     合計 USD |   合計 TWD |
| ----------------------------- | -----------: | ------------: | -----------: | -----------: | -----------: | ---------: |
| A. canonical package 一次生成 |        2,000 |         2,200 |     $0.00150 |     $0.00825 |     $0.00975 |     $0.341 |
| B. detailed 獨立呼叫          |        2,000 |         1,600 |     $0.00150 |     $0.00600 |     $0.00750 |     $0.263 |
| B. compact 獨立呼叫           |        2,000 |           900 |     $0.00150 |     $0.00338 |     $0.00488 |     $0.171 |
| **B 合計**                    |    **4,000** |     **2,500** | **$0.00300** | **$0.00938** | **$0.01238** | **$0.433** |
| C. 先生成 detailed            |        2,000 |         1,600 |     $0.00150 |     $0.00600 |     $0.00750 |     $0.263 |
| C. 第二次簡化                 |        3,600 |           900 |     $0.00270 |     $0.00338 |     $0.00608 |     $0.213 |
| **C 合計**                    |    **5,600** |     **2,500** | **$0.00420** | **$0.00938** | **$0.01358** | **$0.475** |

規模感：若每月成功產生 1,000 道且 token 分布相同，A／B／C 約為 NT$341／433／475，尚未計重試與額外審查。若嚴守目前食譜 AI 的 NT$30 月預算，理論上分別約可支援 87／69／63 道；實際可用量會因 token、路由、重試與其他食譜生成用途而下降。

## 工程與品管成本

以下是相對規模，不是報價。假設沿用目前 TypeScript contracts、Supabase repository、OpenRouter client 與既有 deterministic safety checks，不含 UI 全面重設、正式資料遷移回填及真機驗收等待時間。

| 方案                      |       初步工程量 |         品管量 | 主要風險                                                                                 |
| ------------------------- | ---------------: | -------------: | ---------------------------------------------------------------------------------------- |
| A. 一個 canonical package |  約 4–7 工程人日 | 約 2–4 QA 人日 | 需設計可共用的 step schema；但只需維護一份食材、計時、順序與安全事實                     |
| B. 兩份獨立生成           | 約 8–12 工程人日 | 約 5–8 QA 人日 | 兩份食材量、步驟、熟度、計時或過敏提示可能互相衝突；需配對版本、原子發布與交叉一致性檢查 |
| C. 詳細後再 AI 簡化       | 約 7–10 工程人日 | 約 4–6 QA 人日 | 比 B 容易維持來源關係，但多一個失敗點；必須阻止簡化呼叫刪掉食安、改變用量或重新排序      |

人力估算不含薪資，因 repo 沒有團隊日成本；用「人日 × 實際內部日成本」才能換算現金。即使工程日成本很低，人力仍會遠高於單道不到 NT$0.5 的推理費。

## 建議資料設計方向

採用一份權威 recipe／step，不讓兩個 AI 回答各自成為真相：

- 共用且不可分叉：食譜 ID、食材量、份數、步驟順序、計時、火力、熟度／完成判斷、食安與過敏提醒、庫存扣除。
- 詳細呈現欄位：完整說明、為什麼、成功判斷、補救方法、完整 voice text。
- 精簡呈現欄位：同一步驟的 `compactInstruction`；不得省略會改變安全或結果的數字。
- Onboarding 的 guidance mode 只選預設呈現；料理中可以切換，且兩種模式使用同一個 package revision。
- deterministic validator 檢查 compact 版仍保留關鍵溫度、時間、用量與安全提醒；不要再付費請另一個 AI 判斷兩份 AI 食譜是否一致。

如果產品最後只需要「少看字」，可更省：AI 只生成完整 canonical package，再由後端規則從結構化欄位組成 compact view。如此模型費接近單次生成，且比第二次 AI 簡化更容易證明沒有改變食譜事實。

## 驗證邊界

- 已查：目前 checkout 的模型設定、程式呼叫方式、schema、預算設定、OpenRouter 官方價格及 usage 說明。
- 未做：付費 production 呼叫、真實 token 分布採樣、正式環境變數讀取、供應商帳單核對、詳細／精簡 schema 實作。
- 上線前建議：以 30–50 道匿名化代表食譜做 shadow test，記錄 p50／p90 input、output、`usage.cost`、schema fail、safety fail 與重試率，再替換本文的假設值。
