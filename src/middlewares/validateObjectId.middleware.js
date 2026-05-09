import mongoose from 'mongoose';

/**
 * Validates that `req.params.id` is a well-formed MongoDB ObjectId.
 * Returns 400 immediately if the format is invalid.
 */
export function validateObjectId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      error: { message: 'Invalid id format' },
    });
  }

  next();
}
