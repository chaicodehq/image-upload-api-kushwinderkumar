import mongoose from 'mongoose';

/**
 * Image schema — stores metadata for every uploaded image.
 * Binary files live on disk; only filenames are persisted here.
 */
const imageSchema = new mongoose.Schema(
  {
    /** Original filename as provided by the client */
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    /** Unique filename generated at upload time (stored on disk) */
    filename: {
      type: String,
      required: true,
      unique: true,
    },

    /** MIME type — restricted to the three supported formats */
    mimetype: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/gif'],
    },

    /** File size in bytes — max 5 MB */
    size: {
      type: Number,
      required: true,
      min: 1,
      max: 5 * 1024 * 1024,
    },

    /** Original image width in pixels */
    width: {
      type: Number,
      required: true,
      min: 1,
    },

    /** Original image height in pixels */
    height: {
      type: Number,
      required: true,
      min: 1,
    },

    /** Filename of the generated 200×200 JPEG thumbnail */
    thumbnailFilename: {
      type: String,
      required: true,
    },

    /** Optional human-readable description */
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    /** Optional tags — maximum 10 per image */
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Cannot have more than 10 tags',
      },
    },

    /** When the image was uploaded */
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

/** Default sort order: newest first */
imageSchema.index({ uploadDate: -1 });

/** Efficient mimetype + date filtering */
imageSchema.index({ mimetype: 1, uploadDate: -1 });

/** Full-text search across name and description */
imageSchema.index({ originalName: 'text', description: 'text' });

// ── Model ─────────────────────────────────────────────────────────────────────

export const Image = mongoose.model('Image', imageSchema);
