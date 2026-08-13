import express from 'express';
import { generateRecipe, generateRecipeStream } from '../controllers/recipe.controller.js';

const router = express.Router();

// Legacy backward compatible routes
router.post('/generate-recipe', generateRecipe);
router.post('/generate-recipe-stream', generateRecipeStream);

export default router;
