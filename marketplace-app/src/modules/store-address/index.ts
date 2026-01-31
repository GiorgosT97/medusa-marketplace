import StoreAddressModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const STORE_ADDRESS_MODULE = "storeAddress"

export default Module(STORE_ADDRESS_MODULE, {
  service: StoreAddressModuleService,
})
