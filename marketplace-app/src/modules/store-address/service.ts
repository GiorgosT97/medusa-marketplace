import { MedusaService } from "@medusajs/framework/utils"
import StoreAddress from "./models/store-address"

class StoreAddressModuleService extends MedusaService({
  StoreAddress,
}) {}

export default StoreAddressModuleService
