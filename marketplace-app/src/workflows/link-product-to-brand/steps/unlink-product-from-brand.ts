import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Link } from "@medusajs/framework/modules-sdk"
import { BRAND_MODULE } from "../../../modules/brand"

type UnlinkProductFromBrandStepInput = {
  productId: string
  brandId: string
}

export const unlinkProductFromBrandStep = createStep(
  "unlink-product-from-brand",
  async (
    { productId, brandId }: UnlinkProductFromBrandStepInput,
    { container }
  ) => {
    const link: Link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.dismiss({
      [Modules.PRODUCT]: {
        product_id: productId,
      },
      [BRAND_MODULE]: {
        brand_id: brandId,
      },
    })

    return new StepResponse({ productId, brandId })
  }
)
