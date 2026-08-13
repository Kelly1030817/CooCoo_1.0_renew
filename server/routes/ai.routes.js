import express from 'express';
import { analyzeRestock } from '../controllers/shopping.controller.js';

const router = express.Router();

router.post('/ai-restock-analysis', analyzeRestock);

export default router;
