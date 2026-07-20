# CooCoo 視覺黃金基準

## 基準來源

- 唯一視覺基準：`/Users/kelly/Desktop/stitch_coocoo_1.0` 的目前可操作頁面。
- 凍結資產：舊版 CSS、Material Symbols、六張庫存圖片與現有市場缺圖狀態。
- 已核對頁面：圓夢看板、冰箱沙漏、小廚房、補貨區，以及設定目標、食譜、料理完成、庫存／救援、採買與設定 modal。
- 參考靜態圖：來源專案各 `*_saffron_cream_style/screen.png` 與根目錄既有截圖；不得重新設計或補圖。

## 固定 viewport 與幾何

| 項目 | Mobile | Desktop |
| --- | ---: | ---: |
| viewport | 393 × 852 | 1440 × 900 |
| document scroll width | 393 | 1440 |
| 頂欄高度 | 57 | 57 |
| 底部導覽 | 固定於 viewport 底部 | 同一導覽結構與既有斷點 |
| 非預期水平 overflow | 0 | 0 |

Mobile 空白圓夢看板的精確基準：main `x=0, y=57, w=393, h=715, padding=16`；card `x=16, y=73, w=361, h=376`；主標題 `x=41, y=175.5, w=311, h=64`；說明 `x=41, y=247.5, w=311, h=72`；主要按鈕 `x=114.5, y=343.5, w=164, h=48`。

## 截圖狀態矩陣

| 畫面 | 初始／空白 | 表單 | 錯誤 | 完成 | Modal |
| --- | --- | --- | --- | --- | --- |
| 圓夢看板 | 無 active goal | 六步設定 | 欄位驗證 | 里程碑／封存 | 目標與餘額 |
| 冰箱沙漏 | 固定 seed | 新增／容量 | 食安阻擋 | 救援結果 | 庫存、設定、救援 |
| 小廚房 | 風格與食材 | 已選食材 | 空選擇 | 料理結算 | 食譜、步驟、完成 |
| 補貨區 | 固定 seed | 新增／解析 | 無效資料 | 批次補貨 | 編輯、語音、發票、助手 |

## 驗收規則

- 色彩、字級、文案、行高、間距、border、radius、shadow、圖片裁切、動畫與 responsive breakpoint 均以舊版為準。
- 每次互動截圖前等待字型、MSW 與動畫穩定；只允許瀏覽器反鋸齒噪聲。
- 截圖差異需搭配 bounding-box assertions；任何元素位置、尺寸或換行變動都視為失敗。
- 393px 必須 `document.documentElement.scrollWidth === 393`；兩個 viewport 都不得有 console error、未處理 promise 或非預期水平 overflow。
- hidden historical flow 不納入新版截圖，且不得出現在導覽或可達 modal。
