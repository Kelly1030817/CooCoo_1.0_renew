import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import healthRoutes from './routes/health.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import recipeRoutes from './routes/recipe.routes.js';
import shoppingRoutes from './routes/shopping.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

const reactDistPath = path.join(__dirname, '../coocoo-webapp/dist');
if (fs.existsSync(reactDistPath)) {
    console.log("Serving React webapp build from:", reactDistPath);
    app.use(express.static(reactDistPath));
} else {
    app.use(express.static(path.join(__dirname, '../')));
}

app.use('/api', healthRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', recipeRoutes);
app.use('/api', shoppingRoutes);
app.use('/api', aiRoutes);

app.use(errorHandler);

export default app;
