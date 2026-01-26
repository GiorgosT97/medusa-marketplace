import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { uploadFilesWorkflow } from "@medusajs/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import {
  removeImageBackground,
  isSupportedImageType,
} from "../../../services/background-removal"

interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  buffer: Buffer
  size: number
}

/**
 * POST /admin/uploads
 *
 * Custom upload handler that removes backgrounds from images
 * before uploading them. Non-image files are uploaded as-is.
 */
export const POST = async (
  req: MedusaRequest & { files?: MulterFile[] },
  res: MedusaResponse
) => {
  const input = req.files

  if (!input?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No files were uploaded"
    )
  }

  // Process each file
  const processedFiles = await Promise.all(
    input.map(async (file) => {
      // Check if this is an image that should have background removed
      if (isSupportedImageType(file.mimetype)) {
        try {
          console.log(`Processing background removal for: ${file.originalname}`)

          const { buffer, mimeType } = await removeImageBackground(
            file.buffer,
            file.mimetype
          )

          // Generate new filename with .jpg extension
          const baseName = file.originalname.replace(/\.[^/.]+$/, "")
          const newFilename = `${baseName}.jpg`

          console.log(`Background removed successfully for: ${file.originalname}`)

          return {
            filename: newFilename,
            mimeType: mimeType,
            content: buffer.toString("base64"),
            access: "public" as const,
          }
        } catch (error) {
          console.error(
            `Background removal failed for ${file.originalname}:`,
            error
          )
          // Fall back to original file if background removal fails
          return {
            filename: file.originalname,
            mimeType: file.mimetype,
            content: file.buffer.toString("base64"),
            access: "public" as const,
          }
        }
      }

      // Non-image files are uploaded as-is
      return {
        filename: file.originalname,
        mimeType: file.mimetype,
        content: file.buffer.toString("base64"),
        access: "public" as const,
      }
    })
  )

  // Upload all processed files
  const { result } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: processedFiles,
    },
  })

  res.status(200).json({ files: result })
}
