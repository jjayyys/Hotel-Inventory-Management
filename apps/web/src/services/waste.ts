import { WasteLog } from "@/types/api";
import { apiRequest } from "./api-client";

export function fetchWasteLogs(skuId?: string) {
  const params = new URLSearchParams();

  if (skuId) {
    params.set("skuId", skuId);
  }

  const query = params.toString();
  return apiRequest<WasteLog[]>(`/waste${query ? `?${query}` : ""}`);
}
