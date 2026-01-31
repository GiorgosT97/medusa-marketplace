import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Label, Text, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useStoreAddress, useSaveStoreAddress, StoreAddressInput } from "../hooks/api/store-address"

const StoreAddressWidget = () => {
  const { storeAddress, isLoading } = useStoreAddress()
  const saveAddress = useSaveStoreAddress()

  const [address1, setAddress1] = useState("")
  const [address2, setAddress2] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [province, setProvince] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [phone, setPhone] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // Load existing address data
  useEffect(() => {
    if (storeAddress) {
      setAddress1(storeAddress.address_1 || "")
      setAddress2(storeAddress.address_2 || "")
      setCity(storeAddress.city || "")
      setPostalCode(storeAddress.postal_code || "")
      setProvince(storeAddress.province || "")
      setCountryCode(storeAddress.country_code || "")
      setPhone(storeAddress.phone || "")
    }
  }, [storeAddress])

  const handleSave = async () => {
    if (!address1 || !city || !postalCode || !countryCode) {
      toast.error("Error", {
        description: "Please fill in all required fields (Address, City, Postal Code, Country Code)",
      })
      return
    }

    try {
      const input: StoreAddressInput = {
        address_1: address1,
        address_2: address2 || undefined,
        city,
        postal_code: postalCode,
        province: province || undefined,
        country_code: countryCode.toLowerCase(),
        phone: phone || undefined,
      }

      await saveAddress.mutateAsync(input)
      toast.success("Success", {
        description: "Store address saved successfully",
      })
      setIsEditing(false)
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to save address",
      })
    }
  }

  const handleCancel = () => {
    // Reset to original values
    if (storeAddress) {
      setAddress1(storeAddress.address_1 || "")
      setAddress2(storeAddress.address_2 || "")
      setCity(storeAddress.city || "")
      setPostalCode(storeAddress.postal_code || "")
      setProvince(storeAddress.province || "")
      setCountryCode(storeAddress.country_code || "")
      setPhone(storeAddress.phone || "")
    } else {
      setAddress1("")
      setAddress2("")
      setCity("")
      setPostalCode("")
      setProvince("")
      setCountryCode("")
      setPhone("")
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Store Address</Heading>
        </div>
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Loading...</Text>
        </div>
      </Container>
    )
  }

  const hasAddress = storeAddress !== null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Store Address</Heading>
        {!isEditing && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsEditing(true)}
          >
            {hasAddress ? "Edit" : "Add Address"}
          </Button>
        )}
      </div>

      <div className="px-6 py-4">
        {isEditing ? (
          <div className="flex flex-col gap-y-4">
            <div>
              <Label htmlFor="address1">Street Address *</Label>
              <Input
                id="address1"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <Label htmlFor="address2">Address Line 2</Label>
              <Input
                id="address2"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="Apt, Suite, Floor (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Athens"
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="10431"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="province">Province/State</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Attica (optional)"
                />
              </div>
              <div>
                <Label htmlFor="countryCode">Country Code *</Label>
                <Input
                  id="countryCode"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toLowerCase())}
                  placeholder="gr"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Business Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+30 210 1234567 (optional)"
              />
            </div>
            <div className="flex gap-x-2 pt-2">
              <Button
                variant="primary"
                size="small"
                onClick={handleSave}
                disabled={saveAddress.isPending}
              >
                {saveAddress.isPending ? "Saving..." : "Save Address"}
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleCancel}
                disabled={saveAddress.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : hasAddress ? (
          <div className="flex flex-col gap-y-1">
            <Text>{storeAddress.address_1}</Text>
            {storeAddress.address_2 && <Text>{storeAddress.address_2}</Text>}
            <Text>
              {storeAddress.city}, {storeAddress.postal_code}
            </Text>
            {storeAddress.province && <Text>{storeAddress.province}</Text>}
            <Text className="uppercase">{storeAddress.country_code}</Text>
            {storeAddress.phone && (
              <Text className="text-ui-fg-subtle mt-2">{storeAddress.phone}</Text>
            )}
          </div>
        ) : (
          <Text className="text-ui-fg-muted">
            No address set. Click "Add Address" to add your store location.
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StoreAddressWidget
