import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { STORE_ADDRESS_MODULE } from "../../../modules/store-address"
import StoreAddressModuleService from "../../../modules/store-address/service"

// GET /admin/store-address - Get the current store's address
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const storeAddressService: StoreAddressModuleService = req.scope.resolve(STORE_ADDRESS_MODULE)
  const currentStore = req.scope.resolve("currentStore") as { id: string }

  if (!currentStore?.id) {
    return res.status(400).json({ message: "No store context found" })
  }

  try {
    const addresses = await storeAddressService.listStoreAddresses({
      store_id: currentStore.id,
    })

    res.json({
      store_address: addresses[0] || null,
    })
  } catch (error) {
    console.error("Error fetching store address:", error)
    res.status(500).json({ message: "Failed to fetch store address" })
  }
}

// POST /admin/store-address - Create or update the current store's address
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const storeAddressService: StoreAddressModuleService = req.scope.resolve(STORE_ADDRESS_MODULE)
  const currentStore = req.scope.resolve("currentStore") as { id: string }

  if (!currentStore?.id) {
    return res.status(400).json({ message: "No store context found" })
  }

  const {
    address_1,
    address_2,
    city,
    postal_code,
    province,
    country_code,
    phone,
  } = req.body as {
    address_1: string
    address_2?: string
    city: string
    postal_code: string
    province?: string
    country_code: string
    phone?: string
  }

  // Validate required fields
  if (!address_1 || !city || !postal_code || !country_code) {
    return res.status(400).json({
      message: "address_1, city, postal_code, and country_code are required",
    })
  }

  try {
    // Check if address already exists for this store
    const existingAddresses = await storeAddressService.listStoreAddresses({
      store_id: currentStore.id,
    })

    let storeAddress

    if (existingAddresses.length > 0) {
      // Update existing address
      storeAddress = await storeAddressService.updateStoreAddresses({
        selector: { id: existingAddresses[0].id },
        data: {
          address_1,
          address_2: address_2 || null,
          city,
          postal_code,
          province: province || null,
          country_code,
          phone: phone || null,
        },
      })
    } else {
      // Create new address
      storeAddress = await storeAddressService.createStoreAddresses({
        store_id: currentStore.id,
        address_1,
        address_2: address_2 || null,
        city,
        postal_code,
        province: province || null,
        country_code,
        phone: phone || null,
      })
    }

    res.status(existingAddresses.length > 0 ? 200 : 201).json({
      store_address: storeAddress,
    })
  } catch (error: any) {
    console.error("Error saving store address:", error)
    res.status(500).json({ message: "Failed to save store address" })
  }
}
