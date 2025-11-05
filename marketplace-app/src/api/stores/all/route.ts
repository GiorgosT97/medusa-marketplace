// src/api/store/products/route.ts
import type { Request, Response } from "express"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: Request, res: Response) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const take = Math.min(Number(req.query.limit ?? 12), 100)
  const skip = Number(req.query.offset ?? 0)

  const q = (req.query.q as string) || undefined

  const filters: Record<string, any> = {}
  if (q) filters.q = q

  const { data, metadata } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "name",
    ],
    filters,
    pagination: {
      take,
      skip,
      order: { created_at: "DESC" },
    },
  })

  res.json({
    stores: data,
    count: metadata?.count ?? data.length,
    limit: take,
    offset: skip,
  })
}
