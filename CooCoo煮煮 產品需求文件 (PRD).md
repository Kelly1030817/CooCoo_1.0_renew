# **CooCoo煮煮 App 最小可行性產品需求文件 (PRD)**

| 項目屬性 | 詳細資訊 |
| :---- | :---- |
| **專案名稱** | CooCoo煮煮 智慧自煮與圓夢儲蓄系統 |
| **文件版本** | V1.3 (全聯/家樂福對齊・自選加料版) |
| **目標用戶** | 都市單身外套房租屋族、下班後意志力破產的外食白領 |
| **核心宗旨** | 降低自煮阻力，15分鐘內精緻開飯，實現零剩食、低成本、極致理財的自煮閉環 |

## **1\. 產品定位與核心價值主張 (Value Proposition)**

傳統食譜或冰箱管理軟體多以「特定菜色」或「單純記帳」為中心，導致單身外食族為了煮一餐而到超市（如全聯、家樂福）採買大量多餘食材，最終因食材腐壞發臭與繁瑣洗滌而中途放棄。  
**CooCoo煮煮** 是一款專為單身租屋族設計的「**冰箱精益管理與圓夢儲蓄系統**」。我們提倡：

* **精益組合包採買**：預設對齊台灣主流連鎖超市（全聯、家樂福、楓康）常備包裝規格，物料重疊率達 100%，並支援用戶隨心「自選加料」。  
* **科學防護分裝**：圖解物理防護（壓扁冷凍、核心去梗紙巾保鮮），將生鮮壽命延長 2 至 3 倍，徹底消除剩食過期焦慮。  
* **15分鐘自適應烹飪**：食譜一鍵適配套房硬體（快煮鍋、電鍋、電磁爐），利用熱傳導與水汽物理，無油煙極速上菜，洗滌件數極限控制在 1 至 2 件（Cleanup Tax 減法）。  
* **圓夢差額儲蓄（ROI Blocker）**：自煮一餐，系統自動將省下的「外送差額」即時轉入使用者的「實體願望清單」，以真實的財務回報與健康指標驅動用戶持續自煮。

## **2\. 目標用戶痛點與精益解決方案**

### **都市租屋套房族的 4 大下廚防線：**

1. **空間硬體受限**：單門小冰箱空間極度受限、冷藏效果差；套房無明火，僅能使用快煮鍋、電鍋或單口電磁爐。  
2. **採買包裝不對稱**：全聯一盒梅花豬肉片 300g、一把蔬菜，對單人來說一餐根本消耗不完，屯到發黑腐爛。  
3. **洗滌與廚餘焦慮**：自煮後要洗大量鍋碗瓢盆，廚餘垃圾放在套房隔天立刻發臭，清理成本高昂。  
4. **多巴胺回饋缺失**：下廚耗時費力，外送只需點擊三下。自煮無法帶來即時、具體的正向多巴胺反饋。

### **CooCoo煮煮 系統閉環解決方案：**

  週日精益組合包採買 ➔ 科學分裝/分層防護 ➔ 工作日15分鐘自適應烹飪 ➔ 安全覆熱/庫存扣除 ➔ 願望清單 ROI 儲蓄累計  
        ▲                                                                                                    │  
        │───────────────────────────────【食材100%清空・週五 Plan B】───────────────────────────────────────┘

## **3\. MVP 產品功能範疇 (Scope)**

### **【應包含核心功能 (In Scope)】**

1. **模組一：六大主題黃金組合包與規格對齊購物車**：官方研發 6 套高重疊率預設食材包，對齊全聯與家樂福包裝規格，並支援「自選食材隨意加料」與打勾核對。  
2. **模組三：雙層冰箱沙漏與科學保存教學**：冷藏（燕麥沙色）與冷凍（深石板藍）幾何堆疊。即期食材計時器與一鍵「科學防護保存」升級天數。  
3. **模組三：橫屏自適應烹飪與髒手模擬**：超大字體、音量/語音下一步模擬。設備一鍵切換（快煮鍋、電鍋、電磁爐/平底鍋）對應食譜；科學物理去水計時器（嗶嗶聲模擬）；覆熱安全閘門。  
4. **模組四：圓夢看板與外送成本阻斷器**：動態外送預算對比、願望進度圈、自煮 ROI 多巴胺發票結算彈窗。  
5. **模組五：週五清冰箱 Plan B 挑戰**：針對剩餘零碎菜葉，提供 Boil (煲湯)、Blend (打肉排)、Bake (烘焙包) 科學處置，冰箱庫存安全歸零。

### **【不包含功能 (Out of Scope)】**

* 社群論壇、使用者食譜分享（MVP 食譜一律官方精選以確保 100% 重疊）。  
* AI 冰箱鏡頭自動影像辨識。

## **4\. 全域設計與配色規範 (Pixel-Perfect Color Tokens)**

為了在任何沙盒/ Stitched 預覽環境中 100% 還原，**禁止純粹使用 Tailwind 任意值色碼**，必須在核心 UI 元件的 style 中寫死以下專屬復古莫蘭迪色卡：

* 🌾 **全域背景底色（燕麥暖沙色 \- Oatmeal Sand）**：\#F4F1DE  
  * 提供溫潤、柔和且極具生活溫度的視覺背景，降低套房下廚的壓迫感。  
* 🧱 **主品牌/高亮點綴（暖心紅土色 \- Terracotta）**：\#E07A5F  
  * 用於選中分頁、進度圓環、主要操作按鈕，象徵手作自煮的溫度。  
* 🌿 **健康安全/保鮮成功（靜謐鼠尾草綠 \- Sage Green）**：\#81B29A  
  * 用於滿格保鮮食材、計時圈、安全防護成功、完成烹飪解鎖按鈕。  
* 🪙 **圓夢進度/儲蓄金幣（溫暖赭黃色 \- Ochre Gold）**：\#F2CC8F  
  * 用於省錢儲蓄圓環、發票圓夢金累積、外送阻斷卡高亮。  
* 🌌 **冷凍底色/夜間防眩（深邃石板藍 \- Slate Blue）**：\#3D405B  
  * 用於頂部 Header 背景、冷凍庫底層背景、烹飪模式控制台，提供高質感沉穩對比。  
* 🍅 **高度即期警告（熟成柿橘色 \- Rust Orange）**：\#D95D39  
  * 用於到期天數 \<= 1 天的食材、即期警告橫幅與安全覆熱警示。

## **5\. 使用者體驗與心理學激勵機制**

### **自煮 ROI 多巴胺發票彈窗 (多巴胺回饋機制)**

當用戶在烹飪模式點擊「完成自煮開飯」時，系統彈出高質感的實體收銀機發票，視覺化呈現以下數據，將辛苦自煮轉化為明確的成就多巴胺：

* **精益省下差額**：  
  ![][image1]  
* **健康護航指標**：少吃進鈉含量 ![][image2]，避開壞飽和油脂 ![][image3]（守護心血管健康）。  
* **圓夢計畫推動**：平底鍋/氣炸鍋進度條瞬間上漲並解鎖。

## **6\. MVP 成功評估指標 (KPIs)**

* **食材歸零率 (Waste Zero Rate)**：週五時用戶將冰箱庫存消耗完畢，或透過 Plan B 將剩食成功轉化為基底，使生鮮食材 100% 安全歸零的比例。  
* **外送阻斷率 (Blocker Conversion Rate)**：用戶點開 App ROI Tab，因看到 Blocker 計算器的動態省錢回報，進而點選「啟動圓夢自煮」並完成烹飪的比例。  
* **烹飪流暢度**：烹飪模式下，平均每個步驟的免髒手停留翻頁時間需小於 ![][image4] 分鐘，證明指引語句足夠清晰實用。

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADoAAAAYCAYAAACr3+4VAAACm0lEQVR4Xu2W2ctNURjGX5lSQsKFoe8jZUhJLrgRrtyIUvwDblAKIULqM2S4kTEypFAo96KIpJSpTFfKmGSeyfQ83nd937tfyzknN6dz2r96Ovv9rbX32WsPay+RkpKSRqEv8hT5hdxHehebZTFyHBlt9UjkCLKovUcHa5B3yCdkbmirK91EB5noJDrgcc6tN+dz3bUn7iBnXH0LueTquvImCjAG+eHqtch25DCyGuns2hK9RC9AhK5PlPWAJzI/uLHmExzcVFfnuCH/Huj+KOvBa9GTOesc7/IkV6+S6gNNj3TE+1nICuSg1d1F338+MV3NkeWifYY75+Ecwn22iR5jAvIB2eE7RfgYppNhOMjphR4iK5ENou2H7HdvoUdtA12KPLGag15ofqO5FuScOU54dDOsTmwy31N0EuX2UWSabVdkoBQHe7vYLEuQ08Gx37pQ5/4oet4l1pzFPXQ/M+5VxvGCJU6aqwqvxGfbniwdJ3azvUeeOIBYJ6JvtbrFOUK3O+PiMVkvcPUBc1XJdXooRc9PToSz8v8MdLDVA5wjdFsyLh7zO3LV1R9F38+KzJa/D5Sgn+i2X7q25Py+70OdoLvr6kHm+H556DZnXDzmFeSB6GPONm5XhYuCeKCE99xe5urkfJ85oU7QjXd1q7l+zhG6Wu5orGuGO7YFx5rfxQSXc/1dPUV0vxHOEbp5rt5qzsNB040Kno4Lkuji/ryTnKAui67CjiEzCz0q8Fb0gPfsl+vYCB/d9MfMsGLzH3qItvHx4mT2RYrvN2suNx/Z71dkJ/LM3GPRcxmCPHfuBXc2TknxPHyahj2iFyIHB7ovykblGnIxSoOT0okoGxl+1vyAuiDnkW/ONQ1DRRcXF5Bdoiu7kpJm4zdoGtuirWoxrQAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAYCAYAAAACqyaBAAABR0lEQVR4Xu2UoWtCURTGj5aBIkNwKy4tzGQ2zOKC/4DFsGpaNBoNwrANhIWltQUxLC2JGAwm2X8xy8oGwjbP8Z4H550d9T7ZwzB/8PH8vvN5zwMvAhz4z5RRc9QPaoJKhscrfDqRuUP1hP8At+BcZD6dnaBDSkZGkn5bJzJpsA+RmU9nZ9qoS5Xpg306AVXUE+qa/RDcz+QNHfqtQ4XuJDhrsX9gT9CzwJ83MgNXTumBwOqMOZOQ76psLXSp6AsneiBY13njXEL+RWUmWXDlIz0QbOrQnZDLz9ifisyE/jD0Wz8q79N5Bdd552cxPLaxLteX8ts6DVRdeC8W4N7SUpTOBfspaoR6Rt2ijkUnRB5+HxboM0KHyBnzQPeiFwu0JKND5ArcLFZoAf3RaKyL+ud0wC2piKzGWVNksUKLBqg+6kbNDuyXJXAdeggh6tVhAAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAZCAYAAAAIcL+IAAAAcElEQVR4XmNgGNpgKroANrAHiP+jC6IDOQaIIoIKQQreQGmcYCsQSzIQUCgBxNuhbLwKkSVwKlwMxEpIfJwK0QWxKpwJxBpoYlgVgjxwGA3DwhHEnoNQigmICnAQIKjwHBC/AOLHUAxin0ZRMQqwAQChHyhFMht4YQAAAABJRU5ErkJggg==>