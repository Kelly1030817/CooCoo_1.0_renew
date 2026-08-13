import express from 'express';
import { generateRecipe, generateRecipeStream } from '../../controllers/recipe.controller.js';
import { validate } from '../../middleware/validate.js';
import { generateRecipeSchema } from '../../validators/recipe.validator.js';
import { aiLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.post('/generate', aiLimiter, validate(generateRecipeSchema), generateRecipe);
router.post('/generate-stream', aiLimiter, validate(generateRecipeSchema), generateRecipeStream);

export default router;
