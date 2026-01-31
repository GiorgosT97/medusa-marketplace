import { model } from "@medusajs/framework/utils"

const StoreAddress = model.define("store_address", {
  id: model.id().primaryKey(),
  store_id: model.text().unique(), // One address per store
  address_1: model.text(), // Street address line 1
  address_2: model.text().nullable(), // Street address line 2 (optional)
  city: model.text(),
  postal_code: model.text(),
  province: model.text().nullable(), // State/Province (optional)
  country_code: model.text(), // ISO country code (e.g., "gr", "de")
  phone: model.text().nullable(), // Business phone
})

export default StoreAddress
