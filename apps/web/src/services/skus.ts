import { Recipe, Sku } from "@/types/api";
import { apiRequest } from "./api-client";

export function fetchSkus(hotelId?: string) {
  const params = new URLSearchParams();

  if (hotelId) {
    params.set("hotelId", hotelId);
  }

  const query = params.toString();
  return apiRequest<Sku[]>(`/skus${query ? `?${query}` : ""}`);
}

export function fetchSku(id: string) {
  return apiRequest<Sku>(`/skus/${id}`);
}

export function fetchRecipesBySku(skuId: string) {
  return apiRequest<Recipe[]>(`/recipes?skuId=${skuId}`);
}
