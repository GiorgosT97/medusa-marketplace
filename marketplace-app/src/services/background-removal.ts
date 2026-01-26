import { removeBackground, Config } from "@imgly/background-removal-node"
import sharp from "sharp"

export interface BackgroundRemovalResult {
  buffer: Buffer
  mimeType: string
}

// Configuration for background removal
// Uses "small" model for faster processing on VPS with limited resources
const bgRemovalConfig: Config = {
  model: "medium", // Options: "small" (faster) or "medium" (better quality)
  output: {
    format: "image/png", // PNG to preserve transparency
    quality: 1,
  },
}

/**
 * Removes the background from an image and replaces it with white.
 * Uses @imgly/background-removal-node for AI-based background removal
 * and sharp for image processing.
 *
 * @param imageBuffer - The input image as a Buffer
 * @param mimeType - The MIME type of the input image
 * @returns The processed image with white background
 */
export async function removeImageBackground(
  imageBuffer: Buffer,
  mimeType: string
): Promise<BackgroundRemovalResult> {
  // Convert buffer to Blob for the background removal library
  // Create a Uint8Array view for proper type compatibility
  const uint8Array = new Uint8Array(imageBuffer)
  const blob = new Blob([uint8Array], { type: mimeType })

  // Remove background - returns a Blob with transparent background
  const resultBlob = await removeBackground(blob, bgRemovalConfig)

  // Convert Blob back to Buffer
  const resultArrayBuffer = await resultBlob.arrayBuffer()
  const transparentBuffer = Buffer.from(resultArrayBuffer)

  // Use sharp to add white background
  const processedBuffer = await sharp(transparentBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // White background
    .jpeg({ quality: 90 }) // Convert to JPEG for smaller file size
    .toBuffer()

  return {
    buffer: processedBuffer,
    mimeType: "image/jpeg",
  }
}

/**
 * Checks if the given MIME type is a supported image type for background removal
 */
export function isSupportedImageType(mimeType: string): boolean {
  const supportedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]
  return supportedTypes.includes(mimeType.toLowerCase())
}
