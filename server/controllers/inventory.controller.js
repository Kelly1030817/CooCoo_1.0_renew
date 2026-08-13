import * as inventoryService from '../services/inventory.service.js';

export const getInventory = async (req, res) => {
    try {
        const data = await inventoryService.getAllInventory();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
    }
};

export const addInventoryItem = async (req, res) => {
    try {
        const item = await inventoryService.addInventoryItem(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add inventory item' });
    }
};
