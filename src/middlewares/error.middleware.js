/**
 * Global error-handling middleware.
 * Must be registered LAST in the Express middleware chain.
 *
 * Handles (in priority order):
 *  1. Multer file-size limit exceeded
 *  2. Multer invalid file type
 *  3. Mongoose validation errors
 *  4. Mongoose duplicate-key errors
 *  5. Everything else (generic 500)
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // ── Multer: file too large ─────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: { message: 'File size exceeds 5MB limit' },
    });
  }

  // ── Multer: unsupported file type ──────────────────────────────────────────
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: { message: err.message },
    });
  }

  // ── Mongoose: schema validation failure ───────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');

    return res.status(400).json({
      error: { message: messages },
    });
  }

  // ── Mongoose: duplicate unique key ────────────────────────────────────────
  if (err.code === 11000) {
    return res.status(409).json({
      error: { message: 'Resource already exists' },
    });
  }

  // ── Default: unexpected server error ──────────────────────────────────────
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  return res.status(status).json({
    error: { message },
  });
}
