import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import imageRoutes from './routes/image.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/notFound.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates and configures the Express application.
 *
 * Responsibilities:
 *  - Parse JSON bodies
 *  - Ensure uploads/ and uploads/thumbnails/ directories exist
 *  - Expose GET /health for liveness checks
 *  - Mount image API routes at /api/images
 *  - Handle 404s and global errors
 *
 * @returns {import('express').Application}
 */
export function createApp() {
  const app = express();

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json());

  // ── Ensure upload directories exist ─────────────────────────────────────────
  const uploadsDir = path.join(__dirname, '../uploads');
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // ── API routes ───────────────────────────────────────────────────────────────
  app.use('/api/images', imageRoutes);

  // ── 404 handler (must come after all routes) ─────────────────────────────────
  app.use(notFound);

  // ── Global error handler (must be last) ──────────────────────────────────────
  app.use(errorHandler);

  return app;
}
