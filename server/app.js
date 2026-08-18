import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import v1Routes from './routes/v1/index.js';
import legacyRoutes from './routes/legacy/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Static file serving (React webapp build or root fallback)
const reactDistPath = path.join(__dirname, '../coocoo-webapp/dist');
if (fs.existsSync(reactDistPath)) {
    console.log('Serving React webapp build from:', reactDistPath);
    app.use(express.static(reactDistPath));
} else {
    app.use(express.static(path.join(__dirname, '../')));
}

// V1 API — canonical, versioned, fully-featured (Zod validation + rate limiting)
app.use('/api/v1', v1Routes);

// Legacy API — backward-compatible aliases for existing frontends (no breaking changes)
app.use('/api', legacyRoutes);

// Root endpoint — Service status & API directory
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'CooCoo Backend API Server',
        status: 'online',
        version: '1.0.0',
        endpoints: {
            health: '/api/v1/health',
            inventory: '/api/v1/inventory',
            recipes: '/api/v1/recipes/generate',
            shopping: '/api/v1/shopping/assistant'
        },
        marketingSite: 'https://coocoo-marketing.vercel.app'
    });
});

app.use(errorHandler);

export default app;
