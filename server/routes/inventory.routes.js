import express from 'express';
import { getInventory, addInventoryItem } from '../services/inventory.service.js';

const router = express.Router();

router.get('/inventory', (req, res) => {
    res.json({ success: true, data: getInventory() });
});

router.post('/inventory', (req, res) => {
    const { name, chamber, qty, unit, daysLeft, boxSize } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required." });
    
    const newItem = addInventoryItem(req.body);
    res.status(201).json({ success: true, data: newItem });
});

export default router;
