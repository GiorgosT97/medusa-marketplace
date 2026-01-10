import { FetchError } from "@medusajs/js-sdk"
import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { sdk } from "../../lib/config"
import { queryKeysFactory } from "../../lib/query-key-factory"

export type Brand = {
  id: string
  name: string
  handle: string
  logo_url: string | null
  description: string | null
}

type BrandsResponse = {
  brands: Brand[]
  count: number
  limit: number
  offset: number
}

type BrandResponse = {
  brand: Brand
}

const BRANDS_QUERY_KEY = "brands" as const
const brandsQueryKeys = {
  ...queryKeysFactory(BRANDS_QUERY_KEY),
  list: (query?: Record<string, any>) => [BRANDS_QUERY_KEY, "list", query],
  productBrand: (productId: string) => [BRANDS_QUERY_KEY, "product", productId],
}

export const useBrands = (
  query?: Record<string, any>,
  options?: UseQueryOptions<BrandsResponse, FetchError, BrandsResponse, QueryKey>
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      const response = await fetch(`/admin/brands?${new URLSearchParams(query || {})}`, {
        credentials: "include",
      })
      return response.json()
    },
    queryKey: brandsQueryKeys.list(query),
    ...options,
  })

  return {
    brands: data?.brands || [],
    count: data?.count || 0,
    ...rest,
  }
}

export const useProductBrand = (
  productId: string,
  options?: UseQueryOptions<{ brand: Brand | null }, FetchError, { brand: Brand | null }, QueryKey>
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      const response = await fetch(`/admin/products/${productId}/brand`, {
        credentials: "include",
      })
      return response.json()
    },
    queryKey: brandsQueryKeys.productBrand(productId),
    enabled: !!productId,
    ...options,
  })

  return {
    brand: data?.brand || null,
    ...rest,
  }
}

export const useCreateBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; handle?: string; logo_url?: string; description?: string }) => {
      const response = await fetch("/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create brand")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRANDS_QUERY_KEY] })
    },
  })
}

export const useSetProductBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, brandId }: { productId: string; brandId: string }) => {
      const response = await fetch(`/admin/products/${productId}/brand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ brand_id: brandId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to set brand")
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.productBrand(variables.productId) })
    },
  })
}

export const useRemoveProductBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/admin/products/${productId}/brand`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to remove brand")
      }
      return response.json()
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.productBrand(productId) })
    },
  })
}
