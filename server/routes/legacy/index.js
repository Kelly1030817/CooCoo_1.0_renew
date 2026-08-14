import express from 'express';
import { healthCheck } from '../../controllers/health.controller.js';
import { getInventory, addInventoryItem } from '../../controllers/inventory.controller.js';
import { generateRecipe, generateRecipeStream } from '../../controllers/recipe.controller.js';
import { analyzeShoppingAssistant, analyzeRestock } from '../../controllers/shopping.controller.js';

/**
 * Legacy Route Aliases
 *
 * These routes preserve backward compatibility with the existing frontend (coocoo-webapp).
 * All handlers are the same controllers used by /api/v1, so behavior is identical.
 *
 * Do NOT add new features here — new endpoints go into routes/v1/ only.
 */

const router = express.Router();

router.get('/health',                 healthCheck);
router.get('/inventory',              getInventory);
router.post('/inventory',             addInventoryItem);
router.post('/generate-recipe',       generateRecipe);
router.post('/generate-recipe-stream',generateRecipeStream);
router.post('/shopping-assistant',    analyzeShoppingAssistant);
router.post('/ai-restock-analysis',   analyzeRestock);

export default router;
