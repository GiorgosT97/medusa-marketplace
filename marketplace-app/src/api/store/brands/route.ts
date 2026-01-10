import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const take = Math.min(Number(req.query.limit ?? 100), 200)
  const skip = Number(req.query.offset ?? 0)
  const handle = req.query.handle as string | undefined

  const filters: Record<string, any> = {}
  if (handle) {
    filters.handle = handle
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
