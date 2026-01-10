import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Link } from "@medusajs/framework/modules-sdk"
import { BRAND_MODULE } from "../../../modules/brand"

type LinkProductToBrandStepInput = {
  productId: string
  brandId: string
}

export const linkProductToBrandStep = createStep(
  "link-product-to-brand",
  async (
    { productId, brandId }: LinkProductToBrandStepInput,
    { container }
  ) => {
    const link: Link = container.resolve(ContainerRegistrationKeys.LINK)

    const linkArray = await link.create({
      [Modules.PRODUCT]: {
        product_id: productId,
      },
      [BRAND_MODULE]: {
        brand_id: brandId,
      },
    })

    return new StepResponse(linkArray, {
      productId,
      brandId,
    })
  },
  async ({ productId, brandId }, { container }) => {
    const link: Link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.dismiss({
      [Modules.PRODUCT]: {
        product_id: productId,
      },
      [BRAND_MODULE]: {
        brand_id: brandId,
      },
    })
  }
)
