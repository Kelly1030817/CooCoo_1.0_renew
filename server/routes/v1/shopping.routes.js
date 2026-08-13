import express from 'express';
import { analyzeShoppingAssistant, analyzeRestock } from '../../controllers/shopping.controller.js';
import { validate } from '../../middleware/validate.js';
import { shoppingAssistantSchema } from '../../validators/shopping.validator.js';
import { aiLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.post('/assistant', aiLimiter, validate(shoppingAssistantSchema), analyzeShoppingAssistant);
router.post('/restock-analysis', aiLimiter, analyzeRestock);

export default router;
