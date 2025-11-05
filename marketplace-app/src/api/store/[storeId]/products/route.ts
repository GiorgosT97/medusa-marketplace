import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getStoreProducts } from "../../../../links/product-store"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return getStoreProducts(req, res)
}