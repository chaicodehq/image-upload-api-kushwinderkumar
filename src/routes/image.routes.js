import { Router } from 'express';
import {
  uploadImage,
  listImages,
  getImage,
  downloadImage,
  downloadThumbnail,
  deleteImage,
} from '../controllers/image.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { validateObjectId } from '../middlewares/validateObjectId.middleware.js';

const router = Router();

// ── Image routes ──────────────────────────────────────────────────────────────

/** Upload a new image (multipart/form-data, field name: "image") */
router.post('/', upload.single('image'), uploadImage);

/** List all images with pagination, filtering, and sorting */
router.get('/', listImages);

/** Get metadata for a single image */
router.get('/:id', validateObjectId, getImage);

/** Download the original full-resolution image */
router.get('/:id/download', validateObjectId, downloadImage);

/** Download the 200×200 JPEG thumbnail */
router.get('/:id/thumbnail', validateObjectId, downloadThumbnail);

/** Delete an image and its associated files */
router.delete('/:id', validateObjectId, deleteImage);

export default router;
