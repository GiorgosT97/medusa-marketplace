import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../../../../../modules/brand"
import productBrandLink from "../../../../../links/product-brand"

// GET /admin/products/:id/brand - Get product's brand
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: productId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data } = await query.graph({
      entity: productBrandLink.entryPoint,
      fields: ["brand.*"],
      filters: { product_id: productId },
    })

    const brand = data?.[0]?.brand || null
    res.json({ brand })
  } catch (error) {
    res.json({ brand: null })
  }
}

// POST /admin/products/:id/brand - Set product's brand
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: productId } = req.params
  const { brand_id: brandId } = req.body as { brand_id: string }

  if (!brandId) {
    return res.status(400).json({ message: "brand_id is required" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  // First, check if product already has a brand link and remove it
  try {
    const { data: existingLinks } = await query.graph({
      entity: productBrandLink.entryPoint,
      fields: ["brand_id"],
      filters: { product_id: productId },
    })

    if (existingLinks?.length) {
      // Remove existing brand links using RemoteLink delete (not dismiss which is soft delete)
      for (const existingLink of existingLinks) {
        try {
          await remoteLink.delete({
            [Modules.PRODUCT]: {
              product_id: productId,
            },
            [BRAND_MODULE]: {
              brand_id: existingLink.brand_id,
            },
          })
        } catch (deleteError) {
          console.log("Error deleting link, trying dismiss:", deleteError)
          // Fallback to dismiss
          await remoteLink.dismiss({
            [Modules.PRODUCT]: {
              product_id: productId,
            },
            [BRAND_MODULE]: {
              brand_id: existingLink.brand_id,
            },
          })
        }
      }
    }
  } catch (error) {
    console.log("No existing link or error removing:", error)
    // Continue anyway - will try to create
  }

  // Create new brand link
  try {
    await remoteLink.create({
      [Modules.PRODUCT]: {
        product_id: productId,
      },
      [BRAND_MODULE]: {
        brand_id: brandId,
      },
    })

    res.json({ success: true, brand: { id: brandId } })
  } catch (error: any) {
    console.error("Error creating brand link:", error)
    res.status(400).json({ message: error.message || "Failed to set brand" })
  }
}

// DELETE /admin/products/:id/brand - Remove product's brand
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: productId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  try {
    const { data: existingLinks } = await query.graph({
      entity: productBrandLink.entryPoint,
      fields: ["brand_id"],
      filters: { product_id: productId },
    })

    if (existingLinks?.length) {
      for (const existingLink of existingLinks) {
        try {
          await remoteLink.delete({
            [Modules.PRODUCT]: {
              product_id: productId,
            },
            [BRAND_MODULE]: {
              brand_id: existingLink.brand_id,
            },
          })
        } catch (deleteError) {
          // Try dismiss as fallback
          await remoteLink.dismiss({
            [Modules.PRODUCT]: {
              product_id: productId,
            },
            [BRAND_MODULE]: {
              brand_id: existingLink.brand_id,
            },
          })
        }
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error("Error removing brand:", error)
    res.json({ success: true })
  }
}
