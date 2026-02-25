import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * On every server start, if STRIPE_API_KEY is configured, ensure that
 * pp_stripe_stripe is enabled on all regions. This is idempotent — regions
 * that already have Stripe are skipped.
 */
export default async function ensureStripeOnRegions(container: any) {
  if (!process.env.STRIPE_API_KEY) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  let regions: any[]
  try {
    const { data } = await query.graph({
      entity: "region",
      fields: ["id", "name", "payment_providers.id"],
    })
    regions = data
  } catch (err: any) {
    logger.warn(`[stripe-loader] Could not fetch regions: ${err?.message}`)
    return
  }

  for (const region of regions) {
    const existingIds: string[] = (region.payment_providers ?? []).map(
      (p: any) => p.id
    )

    if (existingIds.includes("pp_stripe_stripe")) {
      continue
    }

    try {
      await updateRegionsWorkflow(container).run({
        input: {
          selector: { id: region.id },
          update: {
            payment_providers: [...existingIds, "pp_stripe_stripe"],
          },
        },
      })
      logger.info(
        `[stripe-loader] Stripe payment provider added to region "${region.name}"`
      )
    } catch (err: any) {
      logger.warn(
        `[stripe-loader] Could not add Stripe to region "${region.name}": ${err?.message}`
      )
    }
  }
}
