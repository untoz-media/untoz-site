import express, { type NextFunction, type Request, type Response } from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import analytics from '../api/public/analytics.js';
import audit from '../api/public/audit.js';
import bootstrap from '../api/public/bootstrap.js';
import config from '../api/public/config.js';
import health from '../api/public/health.js';
import me from '../api/public/me.js';
import publish from '../api/public/publish.js';
import team from '../api/public/team.js';
import upload from '../api/public/upload.js';

type ApiHandler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

const app = express();
const port = Number(process.env.PORT || 3000);
const moduleDir = dirname(fileURLToPath(import.meta.url));
const siteDist = process.env.SITE_DIST_DIR
  ? resolve(process.env.SITE_DIST_DIR)
  : resolve(moduleDir, '../../../../dist');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '16mb' }));

function adapt(handler: ApiHandler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    } catch (error) {
      next(error);
    }
  };
}

app.all('/api/public/analytics', adapt(analytics));
app.all('/api/public/audit', adapt(audit));
app.all('/api/public/bootstrap', adapt(bootstrap));
app.all('/api/public/config', adapt(config));
app.all('/api/public/health', adapt(health));
app.all('/api/public/me', adapt(me));
app.all('/api/public/publish', adapt(publish));
app.all('/api/public/team', adapt(team));
app.all('/api/public/upload', adapt(upload));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use(express.static(siteDist, { extensions: ['html'], index: 'index.html' }));

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  res.status(404).sendFile(join(siteDist, '404.html'), error => {
    if (error) next(error);
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[untoz]', error);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Untoz running on port ${port}`);
  console.log(`Serving public site from ${siteDist}`);
});
