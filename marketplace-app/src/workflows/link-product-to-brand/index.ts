import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { linkProductToBrandStep } from "./steps/link-product-to-brand"

export type LinkProductToBrandInput = {
  productId: string
  brandId: string
}

export const linkProductToBrandWorkflow = createWorkflow(
  "link-product-to-brand",
  (input: LinkProductToBrandInput) => {
    const productBrandLinkArray = linkProductToBrandStep({
      productId: input.productId,
      brandId: input.brandId,
    })

    return new WorkflowResponse({
      productBrandLinkArray,
      brand: { id: input.brandId },
    })
  }
)
