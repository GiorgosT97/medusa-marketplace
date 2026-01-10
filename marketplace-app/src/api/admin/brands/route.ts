import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../../../modules/brand"
import BrandModuleService from "../../../modules/brand/service"

// GET /admin/brands - List all brands
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const take = Math.min(Number(req.query.limit ?? 100), 200)
  const skip = Number(req.query.offset ?? 0)
  const q = req.query.q as string | undefined

  const filters: Record<string, any> = {}
  if (q) {
    filters.q = q
  }

  const { data, metadata } = await query.graph({
    entity: "brand",
    fields: ["id", "name", "handle", "logo_url", "description"],
    filters,
    pagination: {
      take,
      skip,
      order: { name: "ASC" },
    },
  })

  res.json({
    brands: data,
    count: metadata?.count ?? data.length,
    limit: take,
    offset: skip,
  })
}

// POST /admin/brands - Create a new brand
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const brandService: BrandModuleService = req.scope.resolve(BRAND_MODULE)

  const { name, handle, logo_url, description } = req.body as {
    name: string
    handle?: string
    logo_url?: string
    description?: string
  }

  if (!name) {
    return res.status(400).json({ message: "Name is required" })
  }

  // Generate handle from name if not provided
  const brandHandle = handle || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  try {
    const brand = await brandService.createBrands({
      name,
      handle: brandHandle,
      logo_url: logo_url || null,
      description: description || null,
    })

    res.status(201).json({ brand })
  } catch (error: any) {
    if (error.message?.includes("unique")) {
      return res.status(400).json({ message: "A brand with this handle already exists" })
    }
    throw error
  }
}
