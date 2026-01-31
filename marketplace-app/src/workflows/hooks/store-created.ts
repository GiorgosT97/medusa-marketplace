import { createStoreWorkflow, StoreAddressInput } from "../create-store";
import { STORE_ADDRESS_MODULE } from "../../modules/store-address";
import StoreAddressModuleService from "../../modules/store-address/service";

createStoreWorkflow.hooks.storeCreated(
  async ({ storeId, address }, { container }) => {
    // Only create address if address data was provided
    if (!address) {
      return;
    }

    const typedAddress = address as StoreAddressInput;

    // Validate required fields
    if (!typedAddress.address_1 || !typedAddress.city || !typedAddress.postal_code || !typedAddress.country_code) {
      console.warn(`Skipping address creation for store ${storeId}: missing required fields`);
      return;
    }

    try {
      const storeAddressService: StoreAddressModuleService = container.resolve(STORE_ADDRESS_MODULE);

      await storeAddressService.createStoreAddresses({
        store_id: storeId,
        address_1: typedAddress.address_1,
        address_2: typedAddress.address_2 || null,
        city: typedAddress.city,
        postal_code: typedAddress.postal_code,
        province: typedAddress.province || null,
        country_code: typedAddress.country_code,
        phone: typedAddress.phone || null,
      });

      console.log(`Store address created for store ${storeId}`);
    } catch (error) {
      console.error(`Failed to create store address for store ${storeId}:`, error);
    }
  }
);
