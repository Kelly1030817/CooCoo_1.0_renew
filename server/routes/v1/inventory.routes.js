import express from 'express';
import { getInventory, addInventoryItem } from '../../controllers/inventory.controller.js';
import { validate } from '../../middleware/validate.js';
import { addInventorySchema } from '../../validators/inventory.validator.js';

const router = express.Router();

router.get('/', getInventory);
router.post('/', validate(addInventorySchema), addInventoryItem);

export default router;
