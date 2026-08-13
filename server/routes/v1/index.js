import express from 'express';
import healthRoutes from './health.routes.js';
import inventoryRoutes from './inventory.routes.js';
import recipeRoutes from './recipe.routes.js';
import shoppingRoutes from './shopping.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/recipes', recipeRoutes);
router.use('/shopping', shoppingRoutes);

export default router;
