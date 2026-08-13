import express from 'express';
import { analyzeRestock } from '../services/shopping.service.js';

const router = express.Router();

router.post('/ai-restock-analysis', async (req, res) => {
    const { inventory, shoppingList } = req.body;
    const result = await analyzeRestock(inventory, shoppingList);
    res.json({ success: true, ...result });
});

export default router;
