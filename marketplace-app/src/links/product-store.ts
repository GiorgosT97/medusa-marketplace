import ProductModule from "@medusajs/medusa/product";
import StoreModule from "@medusajs/medusa/store";
import { defineLink, ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Request, Response } from "express"
import productStoreLink from "../links/product-store";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  StoreModule.linkable.store,
);

export async function getProductStore(req: Request, res: Response) {
  const productId = req.params.productId;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Query the product including its store link
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "store.*"],
    filters: { id: productId },
  });

  if (!products?.length) {
    return res.json({ store: null });
  }

  // Assuming the link is stored as store_link on the product
  const storeId = products[0].store?.id;
  const storeName = products[0].store?.name;
  if (!storeId) {
    return res.json({ store: null });
  }

  const { data: storeData } = await query.graph({
    entity: "store",
    fields: ["id", "name", "metadata.*"],
    filters: { id: storeId, name: storeName },
  });

  res.json({ store: storeData[0] || null });
}

/**
 * GET /store/:storeId/products helper
 * Returns products linked to a store (with store + variant pricing included)
 */
export async function getStoreProducts(req: MedusaRequest, res: MedusaResponse) {
  const storeId = req.params?.storeId as string
  if (!storeId) return res.status(400).json({ message: "Missing :storeId" })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const take = Math.min(Number(req.query.limit ?? 24), 100)
  const skip = Number(req.query.offset ?? 0)

  const { data, metadata } = await query.graph({
    // IMPORTANT: use the link's entry point and fetch nested product fields
    entity: productStoreLink.entryPoint,
    fields: [
      "product.id",
      "product.title",
      "product.handle",
      "product.thumbnail",
      "product.variants.id",
      "product.variants.prices.amount",
      "product.variants.prices.currency_code",
      // "store.id",
      // "store.name",
      "store.*",
      "store.metadata.*",
    ],
    filters: { store_id: storeId },
    pagination: { take, skip },
  })

  // data is an array of link rows: { product: {...}, store: {...}, product_id, store_id }
  return res.json({
    products: data,
    count: metadata?.count ?? data.length,
    limit: take,
    offset: skip,
  })
}