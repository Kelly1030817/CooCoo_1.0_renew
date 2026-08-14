import express from 'express';
import { analyzeRestock } from '../../controllers/shopping.controller.js';
import { aiLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/v1/ai/restock-analysis
router.post('/restock-analysis', aiLimiter, analyzeRestock);

export default router;
