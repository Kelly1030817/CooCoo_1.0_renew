# **CooCoo煮煮 App 前端極速 MVP 開發設計文件 (FSD)**

本文件專為 **Stitch** 或 AI 程式碼生成工具設計，旨在將 《CooCoo煮煮 App PRD V1.3》中定義的核心功能，在單一 React 檔案（或 HTML 單頁應用程式）中快速實現為高保真、可流暢操作的互動式 MVP 原型。

## **1\. 前端技術棧與視覺 Token (Design Tokens)**

為了確保在小螢幕（行動端套房環境）上能有最高雅、清晰的視覺呈現，樣式全部使用 **Tailwind CSS**，並預設支援適應廚房低光源環境的深色模式（Dark Mode）。

### **🎨 顏色系統 (Color Palette)**

> **注意：** 本專案已全面採用「Saffron Cream (藏紅花奶油) / 溫暖廚房風格」。
> 詳細的色碼定義請直接參考 `warm_kitchen_narrative/DESIGN.md`。

* **主色/點綴**：Terracotta (#e07a5f) - 暖心紅土色
* **安全/成功**：Sage Green (#81b29a) - 鼠尾草綠
* **進度/品質**：Ochre Gold (#f2cc8f) - 赭金色
* **標題/導覽**：Slate Blue (#3d405b) - 板岩藍
* **警告/急期**：Rust Orange (#d95d39) - 鐵鏽橘
* **背景基底**：Oatmeal Sand (#f4f1de) - 燕麥沙色

### **📱 佈局規範 (Layout)**

* **響應式斷點**：優先針對 Mobile (iPhone 15 Pro, 393x852) 進行流體佈局優化。  
* **導覽列**：底部導覽（Bottom Navigation），4 個分頁圖示加文字，固定置底（fixed bottom-0），高度 h-16。  
* **廚房橫屏（Landscape）自適應**：當切換至「烹飪模式」時，UI 應自動優化為橫向排版，以最大化左右分欄。

## **2\. 全域狀態管理與模擬數據 (State & Mock Data)**

為了實現單檔案、無後端的高保真互動，前端必須設計一組高相依性的 React 狀態。

### **💾 核心 State 結構 (React State)**

// 1\. 當前分頁視角控制  
const \[activeTab, setActiveView\] \= useState('fridge'); // 'fridge' | 'shopping' | 'roi' | 'cooking'

// 2\. 冰箱庫存狀態 (動態沙漏基礎)  
const \[ingredients, setIngredients\] \= useState(\[  
  { id: 'pork', name: '梅花豬肉片', category: 'protein', baseQty: '300g', currentQty: '300g', expiryDays: 2, isFrozen: false, protected: false },  
  { id: 'shrimp', name: '急凍大蝦仁', category: 'protein', baseQty: '200g', currentQty: '200g', expiryDays: 3, isFrozen: false, protected: false },  
  { id: 'cabbage', name: '高麗菜', category: 'vegetable', baseQty: '1顆', currentQty: '1顆', expiryDays: 5, protected: false },  
  { id: 'onion', name: '洋蔥', category: 'vegetable', baseQty: '2顆', currentQty: '2顆', expiryDays: 10, protected: false },  
  { id: 'sauce', name: '肉醬罐頭', category: 'pantry', baseQty: '1罐', currentQty: '1罐', expiryDays: 365, protected: true }  
\]);

// 3\. 真實願望清單狀態  
const \[wishlist, setWishlist\] \= useState({  
  name: '我的新平底鍋',  
  targetAmount: 1500,  
  savedAmount: 480  
});

// 4\. ROI 累計健康與金錢數據  
const \[roiData, setRoiData\] \= useState({  
  totalSaved: 480,  
  sodiumReduced: 3400, // mg  
  fatReduced: 88 // g  
});

// 5\. 烹飪狀態 (單鍋控制)  
const \[currentRecipe, setCurrentRecipe\] \= useState(null); // 當前選中食譜  
const \[cookingStep, setCookingStep\] \= useState(0); // 當前步驟  
const \[timerActive, setTimerActive\] \= useState(false);  
const \[timerSeconds, setTimerSeconds\] \= useState(0);  
const \[selectedCooker, setSelectedCooker\] \= useState('pot'); // 'pot' (快煮鍋) | 'ricecooker' (電鍋) | 'stove' (電磁爐)

## **3\. 畫面元件與 UI 設計 (Screen Components)**

### **畫面 A：【冰箱幾何沙漏】(Home / Fridge)**

* **視覺頂部**：  
  * 溫馨提示卡片：先進先出提醒（顯示最快到期的食材）。  
  * 模擬冰箱頂層冷氣出風口的動態旋轉微動畫。  
* **中央主體：2D 冰箱垂直架構 (Vertical Split Container)**：  
  * **上層冷藏區 (Chamber \- Fridge)**：放置蔬菜與罐頭。  
  * **下層冷凍區 (Chamber \- Freezer)**：放置經扁平包裝的肉類與鮮蝦。  
* **食材幾何卡片 (Ingredient Card)**：  
  * 形狀為俐落的圓角方形盒（模擬收納方盒）。  
  * 帶有狀態條（Progress Bar）：  
    * 綠色：safe（\> 4天）  
    * 黃色：warning（2-3天）  
    * 紅色閃爍：critical（\<= 1天）  
  * **互動觸發：科學防護彈窗**：  
    * 點擊食材，右側/中央彈出科學防護教學 Modal（帶有 5 秒圖解 GIF/插畫佔位符）。  
    * 點擊教學中的 \[一鍵實行扁平紙巾包覆\]。  
    * **樣式與狀態變更**：食材保鮮條瞬間變回滿格綠色，保鮮剩餘天數從 2天 延長至 21天（肉類）或 14天（蔬菜），且圖示標記上「🛡️ 科學防禦中」。

### **畫面 B：【週日採買矩陣】(Shopping / Bundles)**

* **頂部：矩陣包選擇滑塊 (Bundle Selector Carousel)**：  
  * 提供「高麗菜梅花豬蝦仁包（蛋白質*2+耐久菜*2+風味\*1）」卡片。  
  * 點擊卡片，下方動態高亮展示該矩陣包可延伸的 5 天晚餐列表（非線性 5 晚餐方塊）。  
* **中部：全聯/家樂福規格對齊清單 (Grocery Checklist)**：  
  * 顯示採買清單：  
    * \[ \] 國產洗選蛋 1盒 (10入)  
    * \[ \] 台灣鯛魚片 1包 (約 300g) \-- 預計消耗: 100%  
    * \[ \] 本地高麗菜 1顆 \-- 預計消耗: 100%  
  * 使用者打勾時，項目變灰並劃上刪除線。  
* **底部：巨型確認入庫按鈕**：  
  * 點擊 \[確認採買並一鍵科學防護入庫\] ➔ 冰箱沙漏狀態重新初始化，全部食材生命條回到 100% 滿格狀態，跳出炫麗的圓滿入庫特效。

### **畫面 C：【下班烹飪模式】(Cooking / Focus Mode)**

* **首頁晚餐卡片翻牌 UI**：  
  * 5 個晚餐卡片呈 2x3 網格平鋪，卡片標示：*「洋蔥炒肉片」*、*「鮮蝦高麗菜飯」*。  
  * **非線性順延體驗**：卡片上沒有標記星期幾，而是只有 \[今晚就吃這道\] 按鈕。用戶想吃哪道就點哪道，即使今天聚餐沒煮，卡片也只是完好保留在原地，不產生「逾期破功感」。  
* **烹飪大字卡橫屏佈局 (Landscape Landscape Container \- 橫屏優化)**：  
  * 當點擊卡片啟動自煮時，自動強行或模擬橫屏比例：  
    * **左側 (60% 寬度)**：超大字體步驟卡片，白底黑字（高對比度 24pt 以上）。  
      * *「步驟 2/4：在保鮮膜上將洋蔥切絲（免洗砧板）。保留豬肉片薄片在盤子上 3 分鐘自然均勻退冰。」*  
    * **右側 (40% 寬度) \- 控制台**：  
      * **硬體適配器 (Toggle Buttons)**：快煮鍋 ｜ 電鍋 ｜ 電磁爐。  
        * 切換時，左側步驟文字動態更新（如切換到「電鍋」➔ 步驟文字自動變成「外鍋加半杯水按下按鈕」）。  
      * **物理計時器**：內嵌一個巨大的 \[啟動 5 分鐘滲透壓去水計時\] 圓形按鈕。點擊後數字動態跳動倒數，結束時發出「叮！」的提示音。  
      * **免髒手操作模擬區 (Hands-free Mock)**：  
        * 提供 \[語音喊:下一步\] 或 \[按音量鍵\] 的模擬觸發按鈕，點擊時左側步驟自動翻頁，並播放流暢的轉場動畫。  
      * **最後一頁：安全覆熱卡片**：顯示紅色食品安全警示：*「警告：請確保食材煮沸，中心溫度 \> 70℃，以消滅腸炎弧菌！」*

### **畫面 D：【圓夢省錢與 Plan B】(ROI & Friday Plan B)**

* **頂部：多巴胺結算圓環**：  
  * 展示累計省錢進度圈（Wishlist Radial Progress）：*「已省 $480 / $1,500 (32%) ➔ 離【實體氣炸鍋】更近了！」*。  
* **中部：外送成本即時阻斷器 (Delivery Blocker)**：  
  * 互動計算器：  
    * 輸入今晚外送預算框：\[ 260 \] 元  
    * 系統即時比對冰箱價值，並吐出打擊文字：「你冰箱裡有價值 $45 的即期高麗菜與豬肉片。如果今晚改吃它，你的圓夢平底鍋進度將瞬間增加 **$215**！本週可提前 2 天圓夢！」  
    * 巨型按鈕 \[啟動圓夢自煮\] ➔ 直接一鍵導航跳轉到烹飪頁面。  
* **底部：週五續食 Plan B 清空引擎**：  
  * 點擊 \[一鍵啟動週五清空冰箱\]：  
  * 顯示三個橫向卡片：  
    1. **Boil（煲煮）**：一鍵將洋蔥碎與豬肉骨頭熬製高湯冷凍。  
    2. **Blend（攪拌）**：將高麗菜葉打碎揉入絞肉漢堡排。  
    3. **Bake（烘焙）**：將菜葉揉入麵粉烤成高纖蔬菜麵包。  
  * 點擊任一轉化，播放「冰箱清空！食材 100% 歸零」的炫麗全螢幕解鎖動畫。

## **4\. 前端開發用核心 Javascript 邏輯 (React Helpers)**

為確保原型中的物理邏輯和 ROI 計算 100% 精準真實，請直接在 React 組件內實現以下算法：

### **1\. 儲蓄與差額動態計算**

const handleCompleteCooking \= (recipeCost) \=\> {  
  // 模擬外送便當平均一餐 $260 元 (含外送與溢價)  
  const averageDeliveryCost \= 260;   
  const currentSavings \= averageDeliveryCost \- recipeCost;  
    
  // 更新累計省錢與願望進度  
  setSavedAmount(prev \=\> {  
    const nextSaved \= prev \+ currentSavings;  
    // 當 savedAmount \>= targetAmount 時，觸發「圓夢解鎖」動畫  
    return nextSaved;  
  });  
    
  // 累計健康減量 (大約估算值)  
  setRoiData(prev \=\> ({  
    totalSaved: prev.totalSaved \+ currentSavings,  
    sodiumReduced: prev.sodiumReduced \+ 850, // 平均每餐減少 850mg 鈉攝入  
    fatReduced: prev.fatReduced \+ 22 // 平均每餐減少 22g 壞油脂  
  }));  
};

### **2\. 滲透壓去水計時器邏輯**

const startOsmosisTimer \= (durationSeconds) \=\> {  
  setTimerSeconds(durationSeconds);  
  setTimerActive(true);  
  const interval \= setInterval(() \=\> {  
    setTimerSeconds(prev \=\> {  
      if (prev \<= 1\) {  
        clearInterval(interval);  
        setTimerActive(false);  
        // Fallback: 播放 HTML5 Audio 提示音（如內置 beep 聲）  
        try {  
          const audioCtx \= new (window.AudioContext || window.webkitAudioContext)();  
          const oscillator \= audioCtx.createOscillator();  
          oscillator.connect(audioCtx.destination);  
          oscillator.start();  
          setTimeout(() \=\> oscillator.stop(), 500);  
        } catch(e) {}  
        return 0;  
      }  
      return prev \- 1;  
    });  
  }, 1000);  
};

## **5\. UI/UX 頁面跳轉邏輯線 (UX Flow Map)**

由於 MVP 建議在**單一 Page 內以 switch(activeTab)** 切換，跳轉邏輯應極度直覺：  
                    ┌────────────────────────┐  
                    │  Home (Fridge SandBox) │ 🛡️ 科學分裝 ➔ 壽命延長至 21 天  
                    └──────────┬─────────────┘  
                               │  
       ┌───────────────────────┼───────────────────────┐  
       ▼                       ▼                       ▼  
┌──────────────┐       ┌──────────────┐       ┌──────────────┐  
│ Shopping Tab │       │ Cooking Tab  │       │   ROI Tab    │  
│ 矩陣採買規格  │       │ 橫屏烹飪大字 │       │ 圓夢進度條與 │  
│ ➔ 買齊一鍵入庫│       │ ➔ 覆熱中心溫度│       │ 外送阻斷器   │  
└──────────────┘       └──────────────┘       └──────────────┘

1. **先進先出引導**：冰箱首頁紅/黃色即期食材 ➔ 點擊直接推薦對應自適應食譜 ➔ 一鍵帶入烹飪 Tab（大字橫屏）。  
2. **阻斷器引導**：ROI 頁面點擊 \[啟動圓夢自煮\] ➔ 直接進入烹飪 Tab，並在右上角顯示當前這餐將為平底鍋進度加分 \+$195。  
3. **Plan B 歸零**：冰箱/ROI 頁面觸發 Plan B 週五清空 ➔ 播放 100% 消耗歸零動畫 ➔ 冰箱庫存安全重設。