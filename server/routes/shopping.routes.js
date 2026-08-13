import express from 'express';
import { analyzeShoppingAssistant, analyzeRestock } from '../controllers/shopping.controller.js';

const router = express.Router();

router.post('/shopping-assistant', analyzeShoppingAssistant);
router.post('/restock-analysis', analyzeRestock);

export default router;
