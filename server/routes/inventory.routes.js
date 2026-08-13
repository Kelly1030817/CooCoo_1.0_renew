import express from 'express';
import { getInventory, addInventoryItem } from '../controllers/inventory.controller.js';

const router = express.Router();

router.get('/inventory', getInventory);
router.post('/inventory', addInventoryItem);

export default router;
