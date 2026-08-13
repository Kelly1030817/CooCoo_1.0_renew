import { getModel } from './gemini.service.js';
import { cleanJsonResponse } from '../utils/response.js';
import { getRecipeSystemPrompt } from '../prompts/recipe.prompt.js';

export const generateRecipe = async (ingredients, style, excludeTitle) => {
    const aiModel = getModel();
    const ingredientsList = ingredients.join("、");
    const styleName = style || "自煮家常";

    const systemPrompt = getRecipeSystemPrompt(ingredientsList, styleName);
    let userPrompt = `食材清單：${ingredientsList}\n料理風格：${styleName}`;
    if (excludeTitle) {
        userPrompt += `\n請避免推薦與「${excludeTitle}」相同或高度相似的菜色，請提供另外一個完全不同的食譜選項。`;
    }

    if (!aiModel) {
        console.log("Mock Gemini response triggered (No API Key).");
        return {
            provider: "mock",
            data: {
                title: `${styleName}風味【${ingredients[0]}】物理學自煮料理`,
                style: styleName,
                prepTime: "15 分鐘",
                estCost: "NT$ 55",
                scientificPrinciple: "【物理學熱平衡與比熱容】：利用食材的高比熱容在加蓋鍋體內形成溫和熱流，使核心溫度平緩上升，避免蛋白質過度緊縮流失組織液，達到鮮嫩口感。",
                steps: [
                    `處理食材 ${ingredients[0]}，若有水分請先用紙巾吸乾。`,
                    ingredients[1] ? `將 ${ingredients[1]} 切細絲，加入少許鹽靜置 3 分鐘，利用滲透壓排乾多餘水分。` : `將食材預備完成，裝入方形規格收納盒備用。`,
                    "起油鍋，大火快速翻炒食材 2 分鐘，隨即加入調味料並關火加蓋，利用餘溫熱平衡慢熟 3 分鐘，出鍋。"
                ],
                ingredientsNeeded: ingredients.map(name => ({ name, qty: 1, unit: "份" }))
            }
        };
    }

    try {
        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        const result = await aiModel.generateContent(prompt);
        const responseText = result.response.text();
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
    const aiModel = getModel();
    const ingredientsList = ingredients.join("、");
    const styleName = style || "自煮家常";

    const systemPrompt = getRecipeSystemPrompt(ingredientsList, styleName);
    let userPrompt = `食材清單：${ingredientsList}\n料理風格：${styleName}`;
    if (excludeTitle) {
        userPrompt += `\n請避免推薦與「${excludeTitle}」相同或高度相似的菜色，請提供另外一個完全不同的食譜選項。`;
    }

    if (!aiModel) {
        const mockData = {
            title: `${styleName}風味【${ingredients[0]}】物理學自煮料理`,
            style: styleName,
            prepTime: "15 分鐘",
            estCost: "NT$ 55",
            scientificPrinciple: "【物理學熱平衡與比熱容】：利用食材的高比熱容在加蓋鍋體內形成溫和熱流，使核心溫度平緩上升，避免蛋白質過度緊縮流失組織液，達到鮮嫩口感。",
            steps: [
                `處理食材 ${ingredients[0]}，若有水分請先用紙巾吸乾。`,
                ingredients[1] ? `將 ${ingredients[1]} 切細絲，加入少許鹽靜置 3 分鐘，利用滲透壓排乾多餘水分。` : `將食材預備完成，裝入方形規格收納盒備用。`,
                "起油鍋，大火快速翻炒食材 2 分鐘，隨即加入調味料並關火加蓋，利用餘溫熱平衡慢熟 3 分鐘，出鍋。"
            ],
            ingredientsNeeded: ingredients.map(name => ({ name, qty: 1, unit: "份" }))
        };

        const jsonString = JSON.stringify(mockData, null, 2);
        const chunkSize = Math.ceil(jsonString.length / 4);
        for (let i = 0; i < jsonString.length; i += chunkSize) {
            const chunk = jsonString.slice(i, i + chunkSize);
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
            await new Promise(r => setTimeout(r, 120));
        }
        res.write(`data: ${JSON.stringify({ type: 'complete', data: mockData })}\n\n`);
        return res.end();
    }

    try {
        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        const responseStream = await aiModel.generateContentStream(prompt);
        let fullText = "";

        for await (const chunk of responseStream.stream) {
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
