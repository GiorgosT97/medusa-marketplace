import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { STORE_ADDRESS_MODULE } from "../../../../modules/store-address"
import StoreAddressModuleService from "../../../../modules/store-address/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { storeId } = req.params

  const storeAddressService = req.scope.resolve<StoreAddressModuleService>(STORE_ADDRESS_MODULE)

  const addresses = await storeAddressService.listStoreAddresses({
    store_id: storeId,
  })

  res.json({ store_address: addresses?.[0] ?? null })
}
