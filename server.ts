import express from 'express';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './server/routes.js';
import { authenticateToken } from './server/auth.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Determine production vs development:
  // Bundled dist/server.cjs or NODE_ENV === 'production' runs static production mode
  const isBundled = (typeof __filename !== 'undefined' && __filename.includes('dist')) ||
                    (typeof process.argv[1] === 'string' && (process.argv[1].includes('dist') || process.argv[1].endsWith('.cjs')));
  const isProduction = process.env.NODE_ENV === 'production' || isBundled;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global token authentication middleware (populates req.user if valid bearer token present)
  app.use(authenticateToken);

  // Cloud Run and GCP Load Balancer health check endpoints
  app.get(['/api/health', '/health', '/healthz'], (req, res) => {
    res.json({
      status: 'ok',
      service: 'MPLADS AI Integrity & Monitoring System',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes mounted first
  app.use('/api', apiRouter);

  // Fallback 404 for unmatched API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Vite middleware for development vs static bundle serving in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : fs.existsSync(path.join(currentDir, 'index.html'))
        ? currentDir
        : path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application bundle index.html not found. Ensure "npm run build" completed.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MPLADS Server] Live and running at http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });

  // Graceful shutdown on Cloud Run container SIGTERM
  process.on('SIGTERM', () => {
    console.log('[MPLADS Server] SIGTERM signal received: closing HTTP server');
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('[MPLADS Server] Startup error:', err);
  process.exit(1);
});

