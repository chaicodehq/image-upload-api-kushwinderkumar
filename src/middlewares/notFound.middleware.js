/**
 * Catch-all 404 handler for unmatched routes.
 * Must be registered AFTER all route definitions.
 */
export function notFound(req, res) {
  res.status(404).json({
    error: { message: 'Route not found' },
  });
}
