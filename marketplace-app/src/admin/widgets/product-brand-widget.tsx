import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Select, Button, Input, Label, Text } from "@medusajs/ui"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useState } from "react"
import {
  useBrands,
  useProductBrand,
  useSetProductBrand,
  useCreateBrand,
  useRemoveProductBrand,
} from "../hooks/api/brands"

const ProductBrandWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const productId = data.id
  const [showNewBrandForm, setShowNewBrandForm] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")

  const { brands, isLoading: brandsLoading } = useBrands()
  const { brand: currentBrand, isLoading: brandLoading } = useProductBrand(productId)
  const setProductBrand = useSetProductBrand()
  const createBrand = useCreateBrand()
  const removeProductBrand = useRemoveProductBrand()

  const handleBrandChange = async (brandId: string) => {
    if (brandId === "__new__") {
      setShowNewBrandForm(true)
      return
    }
    if (brandId === "__none__") {
      await removeProductBrand.mutateAsync(productId)
      return
    }
    await setProductBrand.mutateAsync({ productId, brandId })
  }

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return
    try {
      const result = await createBrand.mutateAsync({ name: newBrandName.trim() })
      if (result.brand?.id) {
        await setProductBrand.mutateAsync({ productId, brandId: result.brand.id })
      }
      setNewBrandName("")
      setShowNewBrandForm(false)
    } catch (error) {
      console.error("Failed to create brand:", error)
    }
  }

  if (brandsLoading || brandLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Brand</Heading>
        </div>
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted">Loading...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Brand</Heading>
      </div>
      <div className="px-6 py-4">
        {showNewBrandForm ? (
          <div className="flex flex-col gap-y-4">
            <div>
              <Label htmlFor="new-brand-name">New Brand Name</Label>
              <Input
                id="new-brand-name"
                placeholder="Enter brand name..."
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
              />
            </div>
            <div className="flex gap-x-2">
              <Button
                variant="primary"
                size="small"
                onClick={handleCreateBrand}
                disabled={!newBrandName.trim() || createBrand.isPending}
              >
                {createBrand.isPending ? "Creating..." : "Create & Assign"}
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setShowNewBrandForm(false)
                  setNewBrandName("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="brand-select">Select Brand</Label>
            <Select
              value={currentBrand?.id || "__none__"}
              onValueChange={handleBrandChange}
              disabled={setProductBrand.isPending || removeProductBrand.isPending}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select a brand..." />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="__none__">
                  <span className="text-ui-fg-muted">No brand</span>
                </Select.Item>
                {brands.map((brand) => (
                  <Select.Item key={brand.id} value={brand.id}>
                    {brand.name}
                  </Select.Item>
                ))}
                <Select.Item value="__new__">
                  <span className="text-ui-fg-interactive">+ Add new brand</span>
                </Select.Item>
              </Select.Content>
            </Select>
            {currentBrand && (
              <Text className="text-ui-fg-subtle text-small">
                Current: {currentBrand.name}
              </Text>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductBrandWidget
