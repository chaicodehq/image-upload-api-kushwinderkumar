import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Image } from '../models/image.model.js';
import { generateThumbnail, getImageDimensions } from '../utils/thumbnail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the uploads directory */
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/** Absolute path to the thumbnails sub-directory */
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Silently deletes a file from disk.
 * Ignores ENOENT (file already gone); re-throws any other error.
 *
 * @param {string} filepath - Absolute path to the file
 */
async function safeUnlink(filepath) {
  try {
    await fs.promises.unlink(filepath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/images
 * Accepts a multipart upload, generates a thumbnail, and persists metadata.
 *
 * @returns {201} Image metadata document
 * @returns {400} No file uploaded
 */
export async function uploadImage(req, res, next) {
  try {
    // Multer places the file info on req.file
    if (!req.file) {
      return res.status(400).json({
        error: { message: 'No file uploaded' },
      });
    }

    const { filename, originalname, mimetype, size } = req.file;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Extract pixel dimensions from the saved file
    const { width, height } = await getImageDimensions(filepath);

    // Generate 200×200 JPEG thumbnail
    const thumbnailFilename = await generateThumbnail(filename);

    // Parse optional comma-separated tags
    const tags = req.body.tags
      ? req.body.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Persist metadata to MongoDB
    const image = await Image.create({
      originalName: originalname,
      filename,
      mimetype,
      size,
      width,
      height,
      thumbnailFilename,
      description: req.body.description || '',
      tags,
    });

    return res.status(201).json(image);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/images
 * Returns a paginated, filterable, sortable list of image metadata.
 *
 * Query params:
 *   page      {number}  default 1
 *   limit     {number}  default 10, max 50
 *   search    {string}  full-text search in originalName + description
 *   mimetype  {string}  exact mimetype filter
 *   sortBy    {string}  field to sort on (default: uploadDate)
 *   sortOrder {string}  "asc" | "desc" (default: "desc")
 *
 * @returns {200} { data: Image[], meta: { total, page, limit, pages, totalSize } }
 */
export async function listImages(req, res, next) {
  try {
    // ── Parse query parameters ───────────────────────────────────────────────
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, mimetype, sortBy = 'uploadDate', sortOrder = 'desc' } = req.query;

    // ── Build filter ─────────────────────────────────────────────────────────
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (mimetype) {
      query.mimetype = mimetype;
    }

    // ── Pagination maths ─────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const total = await Image.countDocuments(query);
    const pages = total === 0 ? 0 : Math.ceil(total / limit);

    // ── Fetch page ───────────────────────────────────────────────────────────
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const images = await Image.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit);

    // ── Aggregate total size across ALL matching documents ───────────────────
    const sizeAgg = await Image.aggregate([
      { $match: query },
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);

    const totalSize = sizeAgg.length > 0 ? sizeAgg[0].totalSize : 0;

    return res.status(200).json({
      data: images,
      meta: { total, page, limit, pages, totalSize },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/images/:id
 * Returns the metadata document for a single image.
 *
 * @returns {200} Image metadata
 * @returns {404} Image not found
 */
export async function getImage(req, res, next) {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        error: { message: 'Image not found' },
      });
    }

    return res.status(200).json(image);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/images/:id/download
 * Streams the original image file to the client.
 *
 * @returns {200} Binary image data with Content-Type and Content-Disposition headers
 * @returns {404} Image not found / file missing from disk
 */
export async function downloadImage(req, res, next) {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        error: { message: 'Image not found' },
      });
    }

    const filepath = path.join(UPLOADS_DIR, image.filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        error: { message: 'File not found' },
      });
    }

    res.setHeader('Content-Type', image.mimetype);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${image.originalName}"`
    );

    return res.sendFile(filepath);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/images/:id/thumbnail
 * Streams the 200×200 JPEG thumbnail to the client.
 *
 * @returns {200} JPEG thumbnail binary
 * @returns {404} Image not found / thumbnail missing from disk
 */
export async function downloadThumbnail(req, res, next) {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        error: { message: 'Image not found' },
      });
    }

    const thumbnailPath = path.join(THUMBNAILS_DIR, image.thumbnailFilename);

    if (!fs.existsSync(thumbnailPath)) {
      return res.status(404).json({
        error: { message: 'File not found' },
      });
    }

    res.setHeader('Content-Type', 'image/jpeg');

    return res.sendFile(thumbnailPath);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/images/:id
 * Removes the original file, thumbnail, and metadata document.
 * Gracefully handles missing files (ENOENT is silently ignored).
 *
 * @returns {204} No content
 * @returns {404} Image not found
 */
export async function deleteImage(req, res, next) {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        error: { message: 'Image not found' },
      });
    }

    // Delete original file (ignore if already gone)
    await safeUnlink(path.join(UPLOADS_DIR, image.filename));

    // Delete thumbnail (ignore if already gone)
    await safeUnlink(path.join(THUMBNAILS_DIR, image.thumbnailFilename));

    // Remove metadata from database
    await Image.findByIdAndDelete(req.params.id);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
