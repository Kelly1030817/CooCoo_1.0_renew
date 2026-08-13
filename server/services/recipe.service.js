import * as geminiClient from '../clients/gemini.client.js';
import { cleanJsonResponse } from '../utils/response.js';
import { getRecipeSystemPrompt } from '../prompts/recipe.prompt.js';

export const generateRecipe = async (ingredients, style, excludeTitle) => {
    const ingredientsList = ingredients.join("、");
    const styleName = style || "自煮家常";

    const systemPrompt = getRecipeSystemPrompt(ingredientsList, styleName);
    let userPrompt = `食材清單：${ingredientsList}\n料理風格：${styleName}`;
    if (excludeTitle) {
        userPrompt += `\n請避免推薦與「${excludeTitle}」相同或高度相似的菜色，請提供另外一個完全不同的食譜選項。`;
    }

    try {
        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        const responseText = await geminiClient.generateText(prompt);
        const recipeData = cleanJsonResponse(responseText);
        
        if (recipeData && recipeData.title) {
            return { provider: "gemini", data: recipeData };
        } else {
            throw new Error("Invalid JSON structure from Gemini");
        }
    } catch (error) {
        console.error("Gemini API execution error, switching to backup dynamic mock:", error);
        return {
            provider: "fallback_mock",
            data: {
                title: `${styleName}【${ingredients[0]}】熱平衡科學自煮`,
                style: styleName,
                prepTime: "15 分鐘",
                estCost: "NT$ 50",
                scientificPrinciple: "【滲透壓與高比熱容】：先以極少許鹽促進表面水分排出，再以鍋蓋密封熱力傳導，保持食材營養與最佳口感。",
                steps: [
                    `將 ${ingredients[0]} 洗淨切塊備用。`,
                    ingredients[1] ? `將 ${ingredients[1]} 處理切片，下鍋前薄鹽去水。` : "平底鍋抹薄油預熱 30 秒。",
                    `放入食材大火爆香 1 分鐘後轉中小火，加入調味並關火蓋鍋燜 3 分鐘出鍋。`
                ],
                ingredientsNeeded: ingredients.map(name => ({ name, qty: 1, unit: "份" }))
            }
        };
    }
};

export const generateRecipeStream = async (ingredients, style, excludeTitle, res) => {
    const ingredientsList = ingredients.join("、");
    const styleName = style || "自煮家常";

    const systemPrompt = getRecipeSystemPrompt(ingredientsList, styleName);
    let userPrompt = `食材清單：${ingredientsList}\n料理風格：${styleName}`;
    if (excludeTitle) {
        userPrompt += `\n請避免推薦與「${excludeTitle}」相同或高度相似的菜色，請提供另外一個完全不同的食譜選項。`;
    }

    try {
        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        const stream = await geminiClient.generateStream(prompt);
        let fullText = "";

        for await (const chunk of stream) {
            const textChunk = chunk.text();
            fullText += textChunk;
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: textChunk })}\n\n`);
        }

        const recipeData = cleanJsonResponse(fullText);
        res.write(`data: ${JSON.stringify({ type: 'complete', data: recipeData || { title: `${styleName}自煮料理`, style: styleName, prepTime: "15 分鐘", estCost: "NT$ 50", scientificPrinciple: "物理熱力學原理控溫", steps: [fullText] } })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Gemini stream generation error:", error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
};
