import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { STORE_ADDRESS_MODULE } from "../../../../modules/store-address"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { storeId } = req.params

  const storeAddressService = req.scope.resolve(STORE_ADDRESS_MODULE)

  const addresses = await storeAddressService.listStoreAddresses({
    store_id: storeId,
  })

  res.json({ store_address: addresses?.[0] ?? null })
}
