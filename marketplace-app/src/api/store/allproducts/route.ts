// src/api/store/products/route.ts
import type { Request, Response } from "express"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const asArray = (v: unknown) => (Array.isArray(v) ? v : v ? [v] : undefined)

export const GET = async (req: Request, res: Response) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const take = Math.min(Number(req.query.limit ?? 12), 100) // you can still accept ?limit= from the UI
  const skip = Number(req.query.offset ?? 0)

  const q = (req.query.q as string) || undefined
  const id = asArray(req.query.id)
  const collection_id = asArray(req.query.collection_id)
  const category_id = asArray(req.query.category_id)
  const sales_channel_id = asArray(req.query.sales_channel_id)

  const filters: Record<string, any> = {}
  if (q) filters.q = q
  if (id) filters.id = id
  if (collection_id) filters.collection_id = collection_id
  if (category_id) filters.category_id = category_id
  if (sales_channel_id) filters.sales_channel_id = sales_channel_id

  const { data, metadata } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "thumbnail",
      "images.*",
      // your custom link: include the store in one shot
      "store.id",
      "store.name",
      "store.metadata",
      "created_at",
      "variants.*",
      "variants.options.*",
      "variants.prices.*", 
    ],
    filters,
    pagination: {
      take,
      skip,
      order: { created_at: "DESC" }, // latest first
    },
  })

  res.json({
    products: data,
    count: metadata?.count ?? data.length,
    limit: take,
    offset: skip,
  })
}
