import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const STORE_LOGO_QUERY_KEY = "store-logo"

export const useStoreLogo = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: [STORE_LOGO_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch("/admin/store-logo", {
        credentials: "include",
      })
      return response.json()
    },
  })

  return {
    logoUrl: data?.logo_url ?? null,
    isLoading,
    error,
  }
}

export const useSaveStoreLogo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (logo_url: string) => {
      const response = await fetch("/admin/store-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ logo_url }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to save logo")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STORE_LOGO_QUERY_KEY] })
    },
  })
}

export const uploadStoreLogo = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("files", file)

  const response = await fetch("/admin/uploads", {
    method: "POST",
    credentials: "include",
    headers: { "x-skip-bg-removal": "true" },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to upload file")
  }

  const data = await response.json()
  const uploaded = data.files?.[0]
  if (!uploaded?.url) {
    throw new Error("Upload succeeded but no URL returned")
  }
  return uploaded.url
}
