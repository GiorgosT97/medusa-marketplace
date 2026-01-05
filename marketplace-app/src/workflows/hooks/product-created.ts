import { createProductsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import { StoreDTO } from "@medusajs/framework/types";
import { linkProductToStoreWorkflow } from "../link-product-to-store";
import { createProductPriceListPricesWorkflow } from "../create-product-price-list-prices";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

createProductsWorkflow.hooks.productsCreated(
  async ({ products }, { container }) => {
    console.log("HOOK productsCreated", products);

    const currentStore = container.resolve("currentStore") as Pick<StoreDTO, 'id'>;
    await Promise.all(
      products.map(({ id }) =>
        linkProductToStoreWorkflow(container).run({
          input: {
            productId: id,
            storeId: currentStore.id,
          },
        })
      )
    );

    if (process.env.IS_CHANNEL_PRICING_ENABLED) {
      await createProductPriceListPricesWorkflow(container).run({
        input: {
          products,
          storeId: currentStore.id,
        },
      });
    }

    // Auto-set thumbnail from first image if not already set
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    for (const product of products) {
      try {
        const { data: [productWithImages] } = await query.graph({
          entity: "product",
          fields: ["id", "thumbnail", "images.url"],
          filters: { id: product.id },
        });

        if (!productWithImages.thumbnail && productWithImages.images?.length > 0) {
          console.log(`Auto-setting thumbnail for product ${product.id} from first image`);
          await updateProductsWorkflow(container).run({
            input: {
              products: [{
                id: product.id,
                thumbnail: productWithImages.images[0].url,
              }]
            }
          });
        }
      } catch (error) {
        console.error(`Failed to auto-set thumbnail for product ${product.id}:`, error);
      }
    }
  }
);
