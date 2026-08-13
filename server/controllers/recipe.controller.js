import * as recipeService from '../services/recipe.service.js';

export const generateRecipe = async (req, res) => {
    try {
        const { ingredients, style, excludeTitle } = req.body;
        const result = await recipeService.generateRecipe(ingredients, style, excludeTitle);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate recipe' });
    }
};

export const generateRecipeStream = async (req, res) => {
    try {
        const { ingredients, style, excludeTitle } = req.body;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        await recipeService.generateRecipeStream(ingredients, style, excludeTitle, res);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate recipe stream' });
    }
};
