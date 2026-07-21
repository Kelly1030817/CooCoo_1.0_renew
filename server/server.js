require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Initialize Gemini AI Client
const aiApiKey = process.env.GEMINI_API_KEY;
let aiModel = null;
if (aiApiKey && aiApiKey !== "" && aiApiKey !== "MOCK_GEMINI_KEY") {
    const genAI = new GoogleGenerativeAI(aiApiKey);
    aiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
}

// ----------------------------------------------------
// 1. MOCK DATA STORE (Representing Supabase in staging)
// ----------------------------------------------------
let mockInventory = [
    { id: "i1", name: "酪梨", chamber: "cold", qty: 1, unit: "顆", daysLeft: 0, boxSize: "S" },
    { id: "i2", name: "胡蘿蔔", chamber: "cold", qty: 3, unit: "條", daysLeft: 3, boxSize: "M" },
    { id: "i3", name: "起司", chamber: "cold", qty: 150, unit: "g", daysLeft: 4, boxSize: "S" }
];

// ----------------------------------------------------
// 2. BACKEND API ENDPOINTS
// ----------------------------------------------------

// GET /api/inventory - Fetch current inventory
app.get('/api/inventory', (req, res) => {
    res.json({ success: true, data: mockInventory });
});

// POST /api/inventory - Add new item
app.post('/api/inventory', (req, res) => {
    const { name, chamber, qty, unit, daysLeft, boxSize } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required." });
    
    // Auto-generate storage protocol based on name
    let storageProtocol = "方形收納管理：裝入規格化收納盒，先進先出，定期檢查保鮮期。";
    if (name.includes("菜") || name.includes("葉")) {
        storageProtocol = "微氣候維護：避免冷氣直吹。應採用微濕紙巾包裹，再裝入方形保鮮盒冷藏。";
    } else if (name.includes("肉") || name.includes("魚") || name.includes("海鮮")) {
        storageProtocol = "組織液阻斷：冷凍前必須以紙巾緊密包裹以吸附組織液，壓扁冷凍最大化表面積。";
    }
    
    const newItem = {
        id: "i_" + Date.now(),
        name, chamber, qty, unit, daysLeft, boxSize,
        storageProtocol,
        addedDate: new Date().toISOString().split("T")[0]
    };
    
    mockInventory.push(newItem);
    res.status(201).json({ success: true, data: newItem });
});

// POST /api/generate-recipe - AI Chef recipe generation with Gemini API
app.post('/api/generate-recipe', async (req, res) => {
    const { ingredients, excludeTitle } = req.body;
    if (!ingredients || ingredients.length === 0) {
        return res.status(400).json({ success: false, message: "At least one ingredient is required." });
    }

    const ingredientsList = ingredients.join("、");

    const systemPrompt = `你是一位專業的自煮管理AI大廚。請依據提供的食材清單，設計出一道簡單、美味的食譜。
你的設計必須符合以下科學自煮原則之一，並在食譜的「科學自煮物理原理」欄位中，詳細說明其熱力學或物理學原理：
1. 滲透壓脫水法 (Osmotic Dehydration)：蔬菜先灑鹽靜置5分鐘脫水，防止下鍋產生過多蒸汽降低鍋溫。
2. 熱平衡燜泡法 (Thermal Equilibrium)：肉類/雞肉大火煎封定型後，利用液體高比熱容關火密封加壓浸沒慢熟。
3. 一鍋到底疊加效應 + 澱粉醃製法 (Cornstarch Marination)：澱粉層保護蛋白質，高壓微環境保持軟嫩。
4. 組織液阻斷與冷凍扁平化技術：利用包覆紙巾阻斷 purge，扁平冷凍最大化熱傳導表面積以縮短70%解凍時間。

套房廚具與環境限制規範（極重要）：
* 廚具限制：使用者位於小套房，僅有「單口電磁爐/IH爐」、「平底鍋」、「小湯鍋」、「小電鍋」或「氣炸鍋/小烤箱」。絕對不得使用需要大火多口瓦斯爐、大型專業烤箱或深油炸鍋的繁複步驟。
* 油煙限制：必須為「低油煙」料理，避免大火爆炒或深油炸（Deep frying），以防套房內警報器響起或油煙無法散去。步驟需極簡、易上手，烹飪時間短。

食材限制規範：
* 請嚴格限制只能使用使用者選取的食材做為主食材。
* 鹽、糖、油、醬油、醋、水、胡椒、太白粉等基本廚房調味料可以預設使用，但絕對不得編造其他清單上沒有的主食材（例如：若食材清單中沒有吐司/麵包，食譜步驟中就不能要求使用吐司/麵包）。

請務必返回 JSON 格式，結構如下：
{
  "title": "食譜標題",
  "style": "本道料理的風格類型（例如：西式輕食、日式和風、中式家常、創意無國界）",
  "prepTime": "預估時間（如 15 分鐘）",
  "estCost": "估算成本（如 NT$ 60）",
  "scientificPrinciple": "詳細說明的物理/化學原理應用說明",
  "steps": [
    "步驟一描述...",
    "步驟二描述...",
    "步驟三描述..."
  ]
}`;

    let userPrompt = `食材清單：${ingredientsList}`;
    if (excludeTitle) {
        userPrompt += `\n請避免推薦與「${excludeTitle}」相同或高度相似的菜色，請提供另外一個完全不同的食譜選項。`;
    }

    // If Gemini client is not initialized, return a simulated mock AI response
    if (!aiModel) {
        console.log("Mock Gemini response triggered (No API Key).");
        return res.json({
            success: true,
            provider: "mock",
            data: {
                title: `${styleName}風味【${ingredients[0]}】物理學自煮料理`,
                prepTime: "15 分鐘",
                estCost: "NT$ 55",
                scientificPrinciple: "【物理學熱平衡與比熱容】：利用食材的高比熱容在加蓋鍋體內形成溫和熱流，使核心溫度平緩上升，避免蛋白質過度緊縮流失組織液，達到鮮嫩口感。",
                steps: [
                    `處理食材 ${ingredients[0]}，若有水分請先用紙巾吸乾。`,
                    ingredients[1] ? `將 ${ingredients[1]} 切細絲，加入少許鹽靜置 3 分鐘，利用滲透壓排乾多餘水分。` : `將食材預備完成，裝入方形規格收納盒備用。`,
                    "起油鍋，大火快速翻炒食材 2 分鐘，隨即加入調味料並關火加蓋，利用餘溫熱平衡慢熟 3 分鐘，出鍋。"
                ]
            }
        });
    }

    try {
        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        const result = await aiModel.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean JSON formatting prefixes/suffixes if Gemini adds them
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const recipeData = JSON.parse(cleanedText);
        
        res.json({ success: true, provider: "gemini", data: recipeData });
    } catch (error) {
        console.error("Gemini API execution error:", error);
        res.status(500).json({ success: false, message: "AI Recipe generation failed.", error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`CooCoo Backend prototype server running on http://localhost:${PORT}`);
});
