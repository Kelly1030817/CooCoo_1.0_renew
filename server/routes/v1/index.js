import express from 'express';
import healthRoutes    from './health.routes.js';
import inventoryRoutes from './inventory.routes.js';
import recipeRoutes    from './recipe.routes.js';
import shoppingRoutes  from './shopping.routes.js';
import aiRoutes        from './ai.routes.js';

const router = express.Router();

/**
 * V1 API Routes
 *
 * Base prefix: /api/v1
 *
 * GET  /api/v1/health
 * GET  /api/v1/inventory
 * POST /api/v1/inventory
 * POST /api/v1/recipes/generate
 * POST /api/v1/recipes/generate-stream
 * POST /api/v1/shopping/assistant
 * POST /api/v1/shopping/restock-analysis  (deprecated alias kept in legacy)
 * POST /api/v1/ai/restock-analysis
 */
router.use('/health',    healthRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/recipes',   recipeRoutes);
router.use('/shopping',  shoppingRoutes);
router.use('/ai',        aiRoutes);

export default router;
