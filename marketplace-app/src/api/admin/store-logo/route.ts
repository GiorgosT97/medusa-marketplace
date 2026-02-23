import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { IStoreModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// GET /admin/store-logo — returns current logo_url from store metadata
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const currentStore = req.scope.resolve("currentStore") as { id: string } | null

  if (!currentStore?.id) {
    return res.status(400).json({ message: "No store context found" })
  }

  const storeService = req.scope.resolve<IStoreModuleService>(Modules.STORE)
  const [store] = await storeService.listStores({ id: [currentStore.id] })

  res.json({ logo_url: (store?.metadata as any)?.logo_url ?? null })
}

// POST /admin/store-logo — updates store metadata.logo_url
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const currentStore = req.scope.resolve("currentStore") as { id: string } | null

  if (!currentStore?.id) {
    return res.status(400).json({ message: "No store context found" })
  }

  const { logo_url } = req.body as { logo_url: string }

  if (!logo_url) {
    return res.status(400).json({ message: "logo_url is required" })
  }

  const storeService = req.scope.resolve<IStoreModuleService>(Modules.STORE)
  const [store] = await storeService.listStores({ id: [currentStore.id] })

  await storeService.updateStores(currentStore.id, {
    metadata: {
      ...((store?.metadata as Record<string, any>) ?? {}),
      logo_url,
    },
  })

  res.json({ success: true, logo_url })
}
