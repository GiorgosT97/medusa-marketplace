import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getProductStore } from "../../../../links/product-store"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log(req.params)
  await getProductStore(req, res)
}