import * as geminiClient from '../clients/gemini.client.js';
import { cleanJsonResponse } from '../utils/response.js';
import { getShoppingAssistantPrompt, getRestockAnalysisPrompt } from '../prompts/shopping.prompt.js';

export const analyzeShoppingAssistant = async (message, mode, image, inventory, shoppingList, conversation) => {
    const hasImage = Boolean(image && image.data);
    const invSummary = (inventory || []).map(i => `${i.name} (剩${i.qty}${i.unit})`).join("、") || "目前冰箱無記載庫存";

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

        const responseText = await geminiClient.generateText(promptContent);
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
    const invItems = inventory || [];

    try {
        const invStr = invItems.map(i => `${i.name}(數量:${i.qty}${i.unit},剩餘:${i.daysLeft}天)`).join("； ");
        const prompt = getRestockAnalysisPrompt(invStr);

        const responseText = await geminiClient.generateText(prompt);
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
