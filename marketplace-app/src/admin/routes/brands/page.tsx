import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Heading, Button, Input, Label, Text } from "@medusajs/ui"
import { useState } from "react"
import { Table } from "../../components/table"
import { Container } from "../../components/container"
import { TagSolid, PencilSquare, Trash } from "@medusajs/icons"
import { useBrands, useCreateBrand, Brand } from "../../hooks/api/brands"
import DrawerComponent from "../../components/drawer"

type BrandsResponse = {
  brands: Brand[]
  count: number
}

const BrandForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")

  const createBrand = useCreateBrand()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Name is required")
      return
    }

    try {
      await createBrand.mutateAsync({
        name: name.trim(),
        handle: handle.trim() || undefined,
        description: description.trim() || undefined,
      })
      setName("")
      setHandle("")
      setDescription("")
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to create brand")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4 p-4">
      <div>
        <Label htmlFor="brand-name">Brand Name *</Label>
        <Input
          id="brand-name"
          placeholder="Enter brand name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="brand-handle">Handle (URL slug)</Label>
        <Input
          id="brand-handle"
          placeholder="e.g., nike, adidas (auto-generated if empty)"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="brand-description">Description</Label>
        <Input
          id="brand-description"
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && <Text className="text-ui-fg-error">{error}</Text>}

      <Button type="submit" disabled={createBrand.isPending}>
        {createBrand.isPending ? "Creating..." : "Create Brand"}
      </Button>
    </form>
  )
}

const BrandsPage = () => {
  const [currentPage, setCurrentPage] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const { brands, count, isLoading, refetch } = useBrands()

  const columns = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "handle",
      label: "Handle",
      render: (value: string) => (
        <Text className="text-ui-fg-subtle">{value}</Text>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (value: string | null) => (
        <Text className="text-ui-fg-subtle">{value || "-"}</Text>
      ),
    },
  ]

  const handleBrandCreated = () => {
    refetch()
    setRefreshKey((k) => k + 1)
  }

  const actions = brands.map((brand) => [
    {
      icon: <PencilSquare />,
      label: "Edit",
      onClick: () => {
        alert("Edit functionality coming soon")
      },
    },
    {
      icon: <Trash />,
      label: "Delete",
      onClick: async () => {
        if (confirm(`Are you sure you want to delete "${brand.name}"?`)) {
          try {
            await fetch(`/admin/brands/${brand.id}`, {
              method: "DELETE",
              credentials: "include",
            })
            refetch()
          } catch (error) {
            alert("Failed to delete brand")
          }
        }
      },
    },
  ])

  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Brands</Heading>
        <DrawerComponent
          title="Add New Brand"
          content={<BrandForm onSuccess={handleBrandCreated} />}
          triggerText="Add Brand"
        />
      </div>

      {isLoading ? (
        <div className="px-6 py-4">
          <Text>Loading brands...</Text>
        </div>
      ) : brands.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Text className="text-ui-fg-muted">
            No brands yet. Create your first brand to get started.
          </Text>
        </div>
      ) : (
        <Table
          columns={columns}
          data={brands}
          pageSize={10}
          count={count}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          actions={actions}
        />
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Brands",
  icon: TagSolid,
})

export default BrandsPage
