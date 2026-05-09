import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

/**
 * Generates a 200×200 JPEG thumbnail for the given image.
 *
 * @param {string} filename - Original filename (e.g., "1704067200000-abc123.png")
 * @returns {Promise<string>} Thumbnail filename (e.g., "thumb-1704067200000-abc123.jpg")
 *
 * @example
 * const thumbName = await generateThumbnail('photo.png');
 * // Returns: "thumb-photo.jpg"
 * // Creates: uploads/thumbnails/thumb-photo.jpg
 */
export async function generateThumbnail(filename) {
  // Construct input path
  const inputPath = path.join(UPLOADS_DIR, filename);

  // Create thumbnail name: "thumb-{basename}.jpg"
  const baseName = filename.replace(/\.\w+$/, ''); // strip extension
  const thumbnailName = `thumb-${baseName}.jpg`;

  // Construct output path
  const outputPath = path.join(THUMBNAILS_DIR, thumbnailName);

  // Resize and convert to JPEG
  await sharp(inputPath)
    .resize(200, 200, {
      fit: 'inside', // maintain aspect ratio
      withoutEnlargement: true, // don't upscale small images
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  return thumbnailName;
}

/**
 * Extracts width and height from an image file.
 *
 * @param {string} filepath - Absolute path to the image
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 *
 * @example
 * const { width, height } = await getImageDimensions('/path/to/image.jpg');
 * // Returns: { width: 1920, height: 1080 }
 */
export async function getImageDimensions(filepath) {
  const metadata = await sharp(filepath).metadata();

  return {
    width: metadata.width,
    height: metadata.height,
  };
}
