import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../../../../modules/brand"
import BrandModuleService from "../../../../modules/brand/service"

// GET /admin/brands/:id - Get a single brand
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "brand",
    fields: ["id", "name", "handle", "logo_url", "description"],
    filters: { id },
  })

  if (!data.length) {
    return res.status(404).json({ message: "Brand not found" })
  }

  res.json({ brand: data[0] })
}

// POST /admin/brands/:id - Update a brand
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const brandService: BrandModuleService = req.scope.resolve(BRAND_MODULE)

  const { name, handle, logo_url, description } = req.body as {
    name?: string
    handle?: string
    logo_url?: string
    description?: string
  }

  const updateData: Record<string, any> = {}
  if (name !== undefined) updateData.name = name
  if (handle !== undefined) updateData.handle = handle
  if (logo_url !== undefined) updateData.logo_url = logo_url
  if (description !== undefined) updateData.description = description

  try {
    const brand = await brandService.updateBrands(id, updateData)
    res.json({ brand })
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return res.status(404).json({ message: "Brand not found" })
    }
    if (error.message?.includes("unique")) {
      return res.status(400).json({ message: "A brand with this handle already exists" })
    }
    throw error
  }
}

// DELETE /admin/brands/:id - Delete a brand
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const brandService: BrandModuleService = req.scope.resolve(BRAND_MODULE)

  try {
    await brandService.deleteBrands(id)
    res.status(200).json({ id, deleted: true })
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return res.status(404).json({ message: "Brand not found" })
    }
    throw error
  }
}
