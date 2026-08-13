import express from 'express';
import { generateRecipe, generateRecipeStream } from '../services/recipe.service.js';

const router = express.Router();

router.post('/generate-recipe', async (req, res) => {
    const { ingredients, style, excludeTitle } = req.body;
    if (!ingredients || ingredients.length === 0) {
        return res.status(400).json({ success: false, message: "At least one ingredient is required." });
    }

    const result = await generateRecipe(ingredients, style, excludeTitle);
    res.json({ success: true, ...result });
});

router.post('/generate-recipe-stream', async (req, res) => {
    const { ingredients, style, excludeTitle } = req.body;
    if (!ingredients || ingredients.length === 0) {
        return res.status(400).json({ success: false, message: "At least one ingredient is required." });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await generateRecipeStream(ingredients, style, excludeTitle, res);
});

export default router;
