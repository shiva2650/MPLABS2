import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes.js';
import { authenticateToken } from './server/auth.js';
import { syncFromGovernmentConnector } from './server/dataIngestion.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global token authentication middleware
  app.use(authenticateToken);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'MPLADS AI Integrity & Monitoring System (Enterprise Backend)',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api', apiRouter);

  // Schedule periodic connector sync (every 6 hours)
  setInterval(() => {
    syncFromGovernmentConnector().catch(err => {
      console.warn('[Scheduler] Automated connector sync note:', err?.message);
    });
  }, 6 * 60 * 60 * 1000);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MPLADS Server] Live and running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[MPLADS Server] Startup error:', err);
  process.exit(1);
});
