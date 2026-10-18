# CooCoo 零月費 Email 登入測試方案

日期：2026-10-14。狀態：使用者已確認採用 Brevo Free 作為測試方案；Brevo 帳號已建立；2026-10-17 已確認寄件地址 Verified、每日免費額度 300 封；2026-10-18 已重新載入確認 CooCoo SMTP 設定儲存並啟用；驗證碼範本已儲存；先前寄送遭 Brevo 535 拒絕，現由代理儲存使用者貼入的新密鑰並暫停 IP 封鎖後，OTP 寄送、使用者收信／登入及原帳號雲端資料重整查核已通過；持續寄信 IP 政策已依使用者授權設定；全新受邀帳號成立檔案、今日與重整保存已驗證；正式發布與真機驗證仍未完成。

## 建議：Brevo Free，先用於受邀小規模測試

- 官方目前 Free 每日 300 封、含 transactional emails，不需信用卡。用於 CooCoo 的登入驗證信；不啟用行銷或付費加購。
- 尚無自有網域時，Brevo 官方說明對 Gmail 等免費地址會將寄件網域暫時改為 brevosend.com。這是測試候選，不保證新帳號獲准 transactional sending、實際送達或可長期作正式寄件方式。
- 帳號及寄件地址需要驗證，transactional sending 可能需要額外啟用。須在後台確認核准狀態並實際收信後才能接上 CooCoo。
- 公開提供服務前建議以 CooCoo 可控制的網域建立正式寄件地址，完成 DKIM／DMARC；網域成本另外確認，不把未購買的網域計入零費用方案。

## 執行順序

1. 使用者確認 Brevo Free 候選後，註冊免費帳號並自行完成條款、帳號驗證與憑證步驟。
2. 驗證寄件地址，確認 transactional sending 已啟用、免費額度及實際寄件地址替換行為。
3. 在 Supabase 自訂 SMTP 設定填入 Brevo 提供的 host、port、SMTP login 與專用 SMTP key；憑證僅在安全後台保存，不能進聊天或程式庫。Sender name 使用 CooCoo。
4. Hosted Confirm signup 與 Magic Link / OTP 範本使用本庫 supabase/templates/magic_link.html 的 Token。保留雲端現有 8 位、3600 秒 OTP；Web 支援 6 或 8 位，不降低雲端驗證碼長度。
5. 連接 Hosted Auth 的受控測試環境先用原帳號收信 → OTP → 相同 UID／舊資料；再以全新受邀測試帳號完成三步 → 寫入 → 今日 → 重整／跨裝置。不要以本機 mock API 當雲端保存證據。
6. 舊帳號驗證成功並通過介面確認後，再提出提交／PR／正式部署與停用 Google Provider 的具體發布內容。

## 其他方案比較

- SMTP2GO Free：1000 封／月，但官方不接受 Gmail／Yahoo 等免費 Email 註冊，目前缺少自有網域／商務 Email，不作首選。
- 有自有網域後可重新評估 Resend 等寄信服務；目前不假設其測試網域可寄給所有 CooCoo 使用者。

## 官方依據

- Brevo Free：https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans
- Brevo 免費額度：https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan
- 免費寄件地址替換：https://help.brevo.com/hc/en-us/articles/16045394674066-Troubleshooting-Domain-authentication
- SMTP：https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP
- 交易郵件啟用：https://help.brevo.com/hc/en-us/articles/115000188150-Troubleshooting-Issues-with-Brevo-SMTP
- SMTP2GO 註冊限制：https://support.smtp2go.com/hc/en-gb/articles/12922807451289-Migrating-to-SMTP2GO-FAQ

## 2026-10-17 續作進度

- Ego 工作區 `CooCoo Brevo SMTP 續作 1017`（本次 id 1）：p1 為 Brevo SMTP，p2 為 CooCoo MVP 的 Supabase SMTP。
- Brevo 已驗證寄件地址；仍有 freemail domain／DKIM／DMARC 提示，實際寄件地址替換與送達須實測。
- Supabase 僅編輯未儲存草稿：寄件名稱 CooCoo、已驗證的寄件 Email、host smtp-relay.brevo.com、port 587、後台顯示的 SMTP login。未建立 SMTP key，未讀取／寫入任何密鑰；Password 留空，未按 Save changes。
- 下一步由使用者在 Brevo Generate SMTP key 建立專用密鑰，直接貼入 CooCoo Supabase 的 Password 欄後儲存。不得將 key 貼到聊天或程式庫。
- 密鑰儲存後，再核對 SMTP 啟用狀態、修改 Hosted OTP 信件範本，並做真實收信與新舊帳號資料驗證。Google Provider／正式 Web 發布仍未變更。

## 2026-10-18 SMTP 與 OTP 範本查核

- 使用者回覆 SMTP 已儲存後，重新載入 CooCoo MVP SMTP 設定，確認 Toggle on、host smtp-relay.brevo.com、port 587、寄件名稱 CooCoo。SMTP 登入名稱與 Brevo 顯示的一致；未讀取或輸出密鑰內容。
- Hosted Magic link / OTP 主旨改為「CooCoo 登入驗證碼」，Confirm sign up 改為「CooCoo 帳號驗證碼」，兩者本文使用本庫 `supabase/templates/magic_link.html`。兩頁重新載入後均確認主旨及本文 .Token 存在；不是只保存本機 config。
- 本機 5177 使用 Hosted Auth 與目前正式 Render API（非 MSW）；對已驗證寄件帳號發出兩次 OTP 請求。Supabase Auth logs 明確回報 `/otp` HTTP 500、535 "5.7.8 Authentication failed"。目前沒有成功寄送或登入證據。
- 使用者已明確允許啟用並測試；已開啟 Brevo Activate SMTP Key 確認視窗並按 Activate。隨後實際 OTP 仍失敗，17:38–17:43 UTC 的 Supabase Auth logs 再次確認 HTTP 500、535 Authentication failed。重新載入 Brevo 後表格顯示 Click here to generate an SMTP key，無法確認有效專用密鑰已啟用；不能將確認按鈕操作視為啟用成功。下一步需使用者在 Brevo 核對／重新建立專用 SMTP key，直接更新 Supabase Password 並儲存；不能改用 Brevo API key 或登入密碼。未讀取、輸出或刪除密鑰。
- 原 UI 把 AuthRetryableFetchError 一律當網路失敗，已修正 HTTP 5xx 為寄信／登入服務錯誤，新增 SMTP 500 單元回歸測試。9 個 Auth 單元測試通過；Web build 通過，API typecheck 另行確認。
- `bun run verify` 仍有相同 3 個既有採買日期失敗：184 pass、3 fail。Render `/api/v1/health` 回應 200；這不等同真實帳號同步驗證。
- 狀態仍是未完成：SMTP 成功寄送、OTP 登入、原 UID／資料恢復、新受邀帳號三步到今日、手機真機、正式 Web 發布及停用 Google Provider 均待驗證／待發布。

## 2026-10-18 使用者更新後重測

- 使用者回覆已更新後，從實際 Hosted Auth 測試頁再次寄送；18:29–18:32 UTC 的 Auth logs 仍為 `/otp` HTTP 500、535 Authentication failed。
- 重新載入 Supabase，SMTP 啟用、host 與 SMTP user 保持正確；未讀取 Password。
- Brevo 等待表格完成載入後，仍顯示 Click here to generate an SMTP key，未列出任何密鑰；畫面 SMTP login 與 Supabase 一致。不能確認使用者此次更新的密鑰有效，亦不能推斷寄信成功。已交還瀏覽器，需使用者確認在該 Brevo 帳號完成專用 SMTP key 的建立／啟用，並將完整 key 直接儲存到 CooCoo Supabase Password。

## 2026-10-18 專用密鑰 Active 查核

- 使用者再度回覆已填入後，Brevo 表格已列出 CooCoo 專用 SMTP key，Status 為 Active；不再是空清單。未讀取完整密鑰。
- Supabase SMTP host、user、port 587 正確，Save changes disabled（無待存草稿）；實際 OTP 在 18:41–18:44 UTC 仍回報 HTTP 500、535 Authentication failed。
- 尚不能確認 Supabase Password 與此 Active key 一致，已請使用者只確認貼入類型（完整 key／遮罩值或名稱），不得貼出密鑰。沒有要求重建 Active key，真實收信與帳號資料驗證仍未完成。

## 2026-10-18 新發現：SMTP IP 封鎖

- 使用者無法確認貼入內容類型。只讀核對既有 key 清單無完整值複製控制；曾開啟 Generate new SMTP Key 視窗，隨即 Cancel，未建立新 key。
- 新發現 Brevo SMTP 頁顯示 Unauthorized IP addresses are blocked for your SMTP keys。Security → Authorized IPs 顯示 SMTP keys Activated、Authorized IP addresses (0)、Unauthorized IP addresses (0)，與先前未啟用狀態不同。
- 官方 https://help.brevo.com/hc/en-us/articles/5740111683858 說明 SMTP 沒有自動學習期，必須先授權來源 IP；提前啟用會立即阻擋 SMTP traffic。這是已確認的設定障礙，但尚不能單憑此斷言 535 唯一原因或密鑰正確。
- 尚未調整 IP 安全設定。已請使用者明確允許暫時關閉帳號 SMTP IP 封鎖後重測，或保留限制並查證 Supabase 寄信來源 IP。既有 key、API IP 設定及雲端資料均未修改。

## 2026-10-18 已授權 IP 封鎖對照測試

- 使用者明確允許暫時關閉並測試。已 Deactivate SMTP IP blocking，畫面確認可 Activate for SMTP keys；API keys 設定未修改。
- 實際 Web /auth/v1/otp 請求仍 HTTP 500；18:49–18:50 UTC Auth logs 兩筆均為 535 Authentication failed。僅關閉 IP 封鎖未解決，不能宣稱根因已修復。測試結束已恢復原本 SMTP IP blocking（再次顯示 Deactivate for SMTP keys）。
- 原 key 保留 Active，未刪除。為排除使用者不確定貼入的值，已準備 Generate new SMTP Key 視窗，名稱 CooCoo-OTP-20261018，尚未按 Generate。瀏覽器已 handOff，由使用者產生並直接 Copy 完整 key 到 Supabase Password、Save changes；不得回傳完整 key。後續憑證測試仍需在已授權的暫停 IP 封鎖條件下進行，不能讓現存 0 授權 IP 設定混淆結果。

## 2026-10-18 新 key 儲存後重測仍失敗

- 使用者回覆已儲存後，再次暫停 SMTP IP 封鎖測試，18:51–18:52 UTC Auth logs 仍 535／HTTP 500。Brevo CooCoo 與 CooCoo-OTP-20261018 均 Active、Last used --；未讀取完整 key。
- Supabase 正確專案 SMTP host、user、port 587 正確，無待存草稿，Password 輸入欄無 maxlength 限制。官方故障排解區分 535 憑證無法驗證與 525 未授權 IP；不能把 535 歸因於 IP。
- Brevo Transactional 顯示設定引導；按 Next 只到 Verification／Waiting for log／no items。未按 It works!，不能推斷平台已啟用或被停權。
- 測試後再次恢復原本 IP 封鎖。已清空並聚焦 CooCoo Supabase Password 的本機草稿（未按 Save，未改雲端密碼），handOff 使用者貼入剛複製的新 key，接著由代理按 Save 並重測，以確認操作的是正確專案與欄位。沒有要求再建立 key。

## 2026-10-18 新密鑰明確儲存後 OTP 寄送請求成功

- 使用者明確請代理儲存並測試；CooCoo Supabase SMTP Save changes 初始 enabled，代理按 Save 後 disabled。未讀取或輸出密鑰內容。
- 已授權測試期間暫停 SMTP IP 封鎖，實際 CooCoo Hosted Auth OTP 請求成功，畫面顯示「驗證信已寄出」並出現驗證碼欄及「驗證並登入」。不把此當成信箱送達或登入成功證據。
- 寄送後已恢復原本 SMTP IP 封鎖，畫面再次提供 Deactivate for SMTP keys。尚無授權來源 IP，後續正常寄信前必須解決 IP 政策；不可宣稱正式登入流程已可用。
- 已聚焦本機 5177 真實測試頁驗證碼欄並 handOff，由使用者在頁面輸入信中 8 位碼。後續待確認收信、OTP 登入、同 UID／原資料、Today 及重整狀態。

## 2026-10-18 原帳號 Email 登入與重整驗證通過

- 使用者在頁面輸入 OTP 並回覆已登入。實際本機 5177 進入 /today，使用 Hosted Auth 與 Render API，非 MSW。
- 透過現有應用的 supabase.auth.getUser() 與 API client GET /state，只輸出摘要，確認 UID 與先前原帳號相同，onboardingProfile.status 為 complete；未擷取或輸出 session token。
- 重整前後讀取雲端 state，主廚檔案、廚具、冰箱與 growth 序列化摘要 SHA-256 一致，且仍為相同帳號並停留 /today。此摘要未包含 shoppingItems，不能擴張為所有 state 欄位均已比對；沒有原帳號變更前的完整快照，亦不能聲稱所有歷史資料逐筆未變。
- Brevo SMTP IP blocking 仍 Activated，Authorized 與 Unauthorized 均 0，沒有可核實的來源 IP 可直接加入。官方 Supabase 整合文件建議確認來源 IP 穩定並先加入授權清單後再啟用 IP 限制：https://developers.brevo.com/docs/supabase-smtp-integration 。
- 已詢問是否允許持續關閉 SMTP IP 限制以維持正常寄信，先前授權只限暫時測試，因此尚未變更。新受邀帳號初始化三步、跨裝置、正式部署與停用 Google Provider 仍待驗證／待發布。

## 2026-10-18 持續關閉 SMTP IP 限制已授權並保存

- 使用者明確同意「允許持續關閉 SMTP IP 限制」。已在 Brevo Security → Authorized IPs 針對 SMTP keys Deactivate，確認視窗後重新載入，仍顯示 Activate for SMTP keys，證明設定已保存。此後不再自動恢復 SMTP IP 封鎖。
- API keys IP 政策維持原本 Deactivated，未修改；SMTP 仍須有效專用 key，現有 key 未刪除或讀取。
- 原帳號真實 OTP 登入、Today、雲端 state 重整已查核；此回合未重複寄信或登出原帳號。已請使用者提供可收信且尚未註冊 CooCoo 的測試 Email，以驗證全新受邀帳號三步設定、寫入、讀回、Today 及重整，未自行捏造／建立帳號或繞過邀請限制。

## 2026-10-18 已授權測試別名的新帳號流程

- 使用者明確同意以原 Gmail 的 +coocootest 別名作新帳號測試。先用原帳號經既有受 owner 角色保護的 /admin/invites API 建立該別名邀請，回報 invited；未修改／繞過邀請政策。
- 使用 localhost:5177 的獨立 origin 開啟全新三步，保留 127.0.0.1:5177 原帳號登入。測試資料：可用時間 25 分鐘、口味 台式測試、硬限制 花生、2 人份、電鍋、日常卡點 下班沒力氣。這些是測試資料，不代表使用者真實飲食設定。
- 第三步重新載入後草稿仍在；向測試別名送出 OTP 成功，顯示驗證碼欄。已 handOff，請使用者直接在頁面輸入 8 位驗證碼並驗證，完成檔案寫入與讀回仍待下一步。

## 2026-10-18 新受邀帳號三步成立檔案與資料保存通過

- 使用者已在頁面完成別名帳號 OTP，代理確認 Email 為授權別名、UID 不同於原帳號。成立前雲端 state 無 onboardingProfile，冰箱／採買／廚具均為 0，證明未沿用原帳號完整資料。
- 在第三步只按一次「成立主廚檔案並開始」，導向 /today。雲端 GET /state 回傳 onboardingProfile.status complete，包含 2 人份、電鍋、花生 allergy 且 isHardLimit true、台式測試口味；週目標 1 次，日常卡點 no_ideas 與 low_energy。
- 可用時間實際保存為 30 分鐘；先前嘗試以 browser.fill 將 range 調至 25 分鐘，未獨立確認該互動觸發 React 變更，因此不能將 25 分鐘列作通過斷言，本次不據此判斷應用缺陷。以上都是新別名帳號測試資料，不代表使用者的真實飲食設定。
- 重整前後對雲端讀回的 onboardingProfile、cookware、inventory、shoppingItems、growth 作 SHA-256 摘要比較，兩者一致；冰箱與採買均仍為 0。今日最終顯示新帳號 EXP 0 與空庫存檢核提示，未停留登入頁或讀取中。
- 另從保留的原帳號頁讀回，仍為原 UID、1 人份、無花生限制、廚具 0，未被測試帳號設定覆蓋。
- 驗證範圍：本機 Web localhost:5177／127.0.0.1:5177 + Hosted Supabase Auth + Render API，非 MSW；未執行跨實體裝置或 iPhone Safari／Android Chrome，正式 Web 尚未部署，Google Provider 未停用。

- 本次收尾重跑 `bun run verify`：lint／格式通過，187 個單元／契約測試為 184 pass、3 個相同採買日期測試 fail，後續 build／E2E 未由此次 verify 執行；`git diff --check` 通過。
- 邀請查核：測試別名的 beta invite 仍顯示 invited，未將它記為 accepted；不影響已實測的新 UID、complete profile 與雲端讀回結果。沒有為此擅自更改邀請狀態。瀏覽器工作已 finish，保留測試帳號今日頁與原帳號頁供檢視。

## 2026-10-18 修正剩餘測試與發布準備

- 使用者明確授權在所有檢查通過後發布正式站。三個採買測試改用可控時鐘或相對未來期限，未放寬過期食材規則；補上過期拒絕與庫存不變斷言。
- 本次完整 verify exit 0：187 單元／契約測試、27 瀏覽器測試通過，Web build、API typecheck、lint／格式通過。GitHub main 的現有 Vercel 自動部署為發布路徑；正式站驗證尚待部署完成。
