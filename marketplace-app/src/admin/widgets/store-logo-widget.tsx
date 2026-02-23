import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text, toast } from "@medusajs/ui"
import { useRef, useState } from "react"
import { useStoreLogo, useSaveStoreLogo, uploadStoreLogo } from "../hooks/api/store-logo"

const StorLogoWidget = () => {
  const { logoUrl, isLoading } = useStoreLogo()
  const saveLogo = useSaveStoreLogo()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const url = await uploadStoreLogo(file)
      await saveLogo.mutateAsync(url)
      setPreview(null)
      toast.success("Success", { description: "Store logo updated" })
    } catch (error: any) {
      setPreview(null)
      toast.error("Error", {
        description: error.message || "Failed to upload logo",
      })
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const currentLogo = preview ?? logoUrl

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Store Logo</Heading>
        <Button
          variant="secondary"
          size="small"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isLoading}
        >
          {uploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-muted">Loading...</Text>
        ) : currentLogo ? (
          <div className="flex items-center gap-x-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-ui-border-base bg-ui-bg-subtle">
              <img
                src={currentLogo}
                alt="Store logo"
                className="h-full w-full object-cover"
              />
            </div>
            {uploading && (
              <Text className="text-ui-fg-muted text-sm">
                Processing (background removal)…
              </Text>
            )}
          </div>
        ) : (
          <Text className="text-ui-fg-muted">
            No logo set. Upload an image to display your store's logo.
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StorLogoWidget
