import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ExecArgs } from "@medusajs/framework/types";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Script to fix missing thumbnails for existing products
 * Run with: npx medusa exec ./src/scripts/fix-thumbnails.ts
 */
export default async function fixThumbnails({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info("Starting thumbnail fix script...");

  try {
    // Get all products with their images
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "thumbnail", "images.url"],
    });

    logger.info(`Found ${products.length} products to check`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      if (product.thumbnail) {
        logger.info(`✓ Product "${product.title}" already has thumbnail - skipping`);
        skippedCount++;
        continue;
      }

      if (!product.images || product.images.length === 0) {
        logger.warn(`⚠ Product "${product.title}" has no images - skipping`);
        skippedCount++;
        continue;
      }

      try {
        logger.info(`→ Setting thumbnail for "${product.title}" (${product.id})`);
        await updateProductsWorkflow(container).run({
          input: {
            products: [{
              id: product.id,
              thumbnail: product.images[0].url,
            }]
          }
        });
        logger.info(`✓ Thumbnail set to: ${product.images[0].url}`);
        fixedCount++;
      } catch (error) {
        logger.error(`✗ Failed to set thumbnail for "${product.title}":`, error);
        errorCount++;
      }
    }

    logger.info("\n=== Summary ===");
    logger.info(`Total products: ${products.length}`);
    logger.info(`Fixed: ${fixedCount}`);
    logger.info(`Skipped: ${skippedCount}`);
    logger.info(`Errors: ${errorCount}`);
    logger.info("===============\n");

    if (errorCount > 0) {
      logger.warn("Some thumbnails failed to update. Check errors above.");
    } else {
      logger.info("All thumbnails processed successfully!");
    }
  } catch (error) {
    logger.error("Fatal error in thumbnail fix script:", error);
    throw error;
  }
}
