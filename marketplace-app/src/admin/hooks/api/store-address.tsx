import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface StoreAddress {
  id: string
  store_id: string
  address_1: string
  address_2: string | null
  city: string
  postal_code: string
  province: string | null
  country_code: string
  phone: string | null
}

export interface StoreAddressInput {
  address_1: string
  address_2?: string
  city: string
  postal_code: string
  province?: string
  country_code: string
  phone?: string
}

const STORE_ADDRESS_QUERY_KEY = "store-address"

export const useStoreAddress = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: [STORE_ADDRESS_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch("/admin/store-address", {
        credentials: "include",
      })
      return response.json()
    },
  })

  return {
    storeAddress: data?.store_address ?? null,
    isLoading,
    error,
  }
}

export const useSaveStoreAddress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: StoreAddressInput) => {
      const response = await fetch("/admin/store-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to save address")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STORE_ADDRESS_QUERY_KEY] })
    },
  })
}
