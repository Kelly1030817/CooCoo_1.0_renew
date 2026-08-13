import express from 'express';
import { analyzeShoppingAssistant } from '../services/shopping.service.js';

const router = express.Router();

router.post('/shopping-assistant', async (req, res) => {
    const { message, mode, image, inventory, shoppingList, conversation } = req.body;
    const result = await analyzeShoppingAssistant(message, mode, image, inventory, shoppingList, conversation);
    res.json({ success: true, ...result });
});

export default router;
