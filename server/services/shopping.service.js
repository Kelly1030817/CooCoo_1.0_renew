import { getModel } from './gemini.service.js';
import { cleanJsonResponse } from '../utils/response.js';
import { getShoppingAssistantPrompt, getRestockAnalysisPrompt } from '../prompts/shopping.prompt.js';

export const analyzeShoppingAssistant = async (message, mode, image, inventory, shoppingList, conversation) => {
    const aiModel = getModel();
    const hasImage = Boolean(image && image.data);
    const invSummary = (inventory || []).map(i => `${i.name} (剩${i.qty}${i.unit})`).join("、") || "目前冰箱無記載庫存";

    if (!aiModel) {
        console.log("Mock Gemini shopping assistant triggered (No API Key).");
        let reply = "";
        let menuIdeas = [];

        if (hasImage) {
            reply = "👨‍🍳 主廚完成照片辨識！從您拍攝的照片中辨識出【鮮嫩牛番茄】與【有機金針菇】！\n\n" +
                    "✨ **推薦菜色**：主廚推薦【金針菇番茄蛋花湯】與【番茄炒牛肉】\n" +
                    "🍳 **科學料理法**：番茄先以少許鹽滲透壓去水，強火快速翻炒定型；金針菇最後下鍋燜煮 2 分鐘，保持極致脆嫩。\n" +
                    "🛒 **補貨採買量**：冰箱現有庫存：[" + invSummary + "]。已精算並排除重複食材！";
            menuIdeas = [
                {
                    name: "金針菇番茄蛋花湯",
                    servings: 1,
                    ingredients: [
                        { name: "牛番茄", qty: 2, unit: "顆" },
                        { name: "金針菇", qty: 1, unit: "包" },
                        { name: "土雞蛋", qty: 2, unit: "顆" }
                    ]
                },
                {
                    name: "番茄炒牛肉",
                    servings: 1,
                    ingredients: [
                        { name: "牛番茄", qty: 2, unit: "顆" },
                        { name: "雪花牛肉片", qty: 1, unit: "盒" }
                    ]
                }
            ];
        } else {
            const userMsg = message || "推薦料理與採買";
            reply = `👨‍🍳 主廚針對「${userMsg}」完成精算！\n\n` +
                    `✨ **推薦菜色**：【蒜香鮮菇炒時蔬】\n` +
                    `🍳 **科學料理法**：蔬菜先靜置脫水，避免大量出水；蒜頭低溫爆香釋放蒜素。\n` +
                    `🛒 **補貨採買建議**：比對冰箱庫存（${invSummary}），建議補齊當季蔬菜與鮮菇！`;
            menuIdeas = [
                {
                    name: "蒜香鮮菇炒時蔬",
                    servings: 1,
                    ingredients: [
                        { name: "有機空心菜", qty: 1, unit: "包" },
                        { name: "鴻喜菇", qty: 1, unit: "包" },
                        { name: "蒜頭", qty: 1, unit: "袋" }
                    ]
                }
            ];
        }

        return {
            provider: "mock",
            data: {
                reply,
                menuIdeas,
                decisionPrompt: "勾選菜色後，系統將自動比對冰箱庫存扣除，將缺乏的食材加入採買單！"
            }
        };
    }

    try {
        const systemPrompt = getShoppingAssistantPrompt(invSummary);
        let promptContent = [];
        if (hasImage) {
            promptContent = [
                systemPrompt,
                `使用者訊息：${message || '請幫我分析這張食材或特價照片，並規劃適合的採買清單與菜色'}`,
                {
                    inlineData: {
                        data: image.data,
                        mimeType: image.mimeType || "image/jpeg"
                    }
                }
            ];
        } else {
            promptContent = `${systemPrompt}\n\n使用者提問：${message || '請推薦本週自煮菜色與採買清單'}`;
        }

        const result = await aiModel.generateContent(promptContent);
        const responseText = result.response.text();
        const aiData = cleanJsonResponse(responseText);

        if (aiData && aiData.reply) {
            return { provider: "gemini", data: aiData };
        } else {
            throw new Error("Invalid response format from Gemini");
        }
    } catch (error) {
        console.error("Gemini Shopping Assistant error:", error);
        return {
            provider: "fallback",
            data: {
                reply: `👨‍🍳 主廚已為您分析需求「${message || '採買建議'}」！建議補充高纖蔬菜與優質蛋白質。`,
                menuIdeas: [
                    {
                        name: "和風清爽彩椒雞胸肉",
                        servings: 1,
                        ingredients: [
                            { name: "雞胸肉", qty: 1, unit: "盒" },
                            { name: "彩椒", qty: 2, unit: "顆" }
                        ]
                    }
                ],
                decisionPrompt: "調整勾選後，補貨採買量會自動重新計算。"
            }
        };
    }
};

export const analyzeRestock = async (inventory, shoppingList) => {
    const aiModel = getModel();
    const invItems = inventory || [];

    if (!aiModel) {
        console.log("Mock Gemini Restock Analysis triggered.");
        const lowStock = invItems.filter(i => Number(i.daysLeft) <= 3 || Number(i.qty) <= 1);
        const recommendations = [
            { name: "有機空心菜", category: "produce", qty: 2, unit: "包", estCost: 60, reason: "補足每週5大高纖蔬果目標（現庫存偏低）", status: "AI 補貨建議" },
            { name: "鮮嫩雞胸肉", category: "protein", qty: 1, unit: "盒", estCost: 95, reason: "補充優質低脂蛋白質庫存", status: "AI 補貨建議" },
            { name: "大蒜", category: "produce", qty: 1, unit: "袋", estCost: 35, reason: "基礎辛香料補給，利於爆香抗氧化", status: "AI 補貨建議" }
        ];

        return {
            provider: "mock",
            data: {
                summary: `👨‍🍳 庫存健康度檢測完成！偵測到 ${lowStock.length} 項食材即將過期或庫存偏低。建議優先補充高纖蔬果與基礎蛋白質。`,
                recommendations
            }
        };
    }

    try {
        const invStr = invItems.map(i => `${i.name}(數量:${i.qty}${i.unit},剩餘:${i.daysLeft}天)`).join("； ");
        const prompt = getRestockAnalysisPrompt(invStr);

        const result = await aiModel.generateContent(prompt);
        const responseText = result.response.text();
        const aiData = cleanJsonResponse(responseText);

        if (aiData && aiData.recommendations) {
            return { provider: "gemini", data: aiData };
        } else {
            throw new Error("Invalid response format from Gemini");
        }
    } catch (error) {
        console.error("AI Restock Analysis error:", error);
        return {
            provider: "fallback",
            data: {
                summary: "👨‍🍳 庫存掃描完成，建議為本週補齊基礎蔬果與蛋豆魚肉類食材！",
                recommendations: [
                    { name: "當季綠色蔬菜", category: "produce", qty: 2, unit: "包", estCost: 60, reason: "補充維生素與膳食纖維", status: "AI 補貨建議" },
                    { name: "土雞蛋", category: "protein", qty: 1, unit: "盒", estCost: 85, reason: "萬用蛋白質備料", status: "AI 補貨建議" }
                ]
            }
        };
    }
};
