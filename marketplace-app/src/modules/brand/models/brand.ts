import { model } from "@medusajs/framework/utils"

const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
  handle: model.text().unique(),
  logo_url: model.text().nullable(),
  description: model.text().nullable(),
})

export default Brand
