// src/api/store/products/route.ts
import type { Request, Response } from "express"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import productBrandLink from "../../../links/product-brand"

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
  const brand_id = asArray(req.query.brand_id)

  const filters: Record<string, any> = {}
  if (q) filters.q = q
  if (id) filters.id = id
  if (collection_id) filters.collection_id = collection_id
  if (category_id) filters.category_id = category_id
  if (sales_channel_id) filters.sales_channel_id = sales_channel_id

  // If filtering by brand, first get product IDs from the link table
  if (brand_id?.length) {
    try {
      const { data: linkData } = await query.graph({
        entity: productBrandLink.entryPoint,
        fields: ["product_id"],
        filters: { brand_id: brand_id },
      })

      const productIds = linkData.map((link: any) => link.product_id)

      if (productIds.length === 0) {
        // No products for this brand
        return res.json({
          products: [],
          count: 0,
          limit: take,
          offset: skip,
        })
      }

      // Add product IDs to filter
      if (filters.id) {
        // Intersect with existing id filter
        filters.id = filters.id.filter((existingId: string) => productIds.includes(existingId))
      } else {
        filters.id = productIds
      }
    } catch (error) {
      console.error("Error fetching brand products:", error)
      return res.json({
        products: [],
        count: 0,
        limit: take,
        offset: skip,
      })
    }
  }

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
      // include brand info
      "brand.id",
      "brand.name",
      "brand.handle",
      "brand.logo_url",
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
