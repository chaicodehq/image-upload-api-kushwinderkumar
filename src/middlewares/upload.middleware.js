import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the uploads directory */
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

/** MIME types accepted by the API */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// ── Storage ───────────────────────────────────────────────────────────────────

/**
 * Disk storage configuration.
 * Files are saved to uploads/ with a collision-safe name:
 *   {timestamp}-{4-byte-hex}.{original-extension}
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(4).toString('hex');
    const uniqueName = `${Date.now()}-${randomHex}${ext}`;
    cb(null, uniqueName);
  },
});

// ── File filter ───────────────────────────────────────────────────────────────

/**
 * Rejects any file whose MIME type is not in the allow-list.
 */
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'),
      false
    );
  }
};

// ── Multer instance ───────────────────────────────────────────────────────────

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});
