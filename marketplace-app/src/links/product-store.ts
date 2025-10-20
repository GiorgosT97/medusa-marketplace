import ProductModule from "@medusajs/medusa/product";
import StoreModule from "@medusajs/medusa/store";
import { defineLink } from "@medusajs/framework/utils";
import { Request, Response } from "express"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default defineLink(
  ProductModule.linkable.product,
  StoreModule.linkable.store
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
    fields: ["id", "name"],
    filters: { id: storeId, name: storeName },
  });

  res.json({ store: storeData[0] || null });
}
