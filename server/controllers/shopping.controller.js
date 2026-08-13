import * as shoppingService from '../services/shopping.service.js';

export const analyzeShoppingAssistant = async (req, res) => {
    try {
        const { message, mode, image, inventory, shoppingList, conversation } = req.body;
        const result = await shoppingService.analyzeShoppingAssistant(message, mode, image, inventory, shoppingList, conversation);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to analyze shopping assistant' });
    }
};

export const analyzeRestock = async (req, res) => {
    try {
        const { inventory, shoppingList } = req.body;
        const result = await shoppingService.analyzeRestock(inventory, shoppingList);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to analyze restock' });
    }
};
