import { InventoryBatch, InventoryMovement } from "@/types/api";
import { apiRequest } from "./api-client";

export function fetchInventoryBatches(skuId?: string) {
  const params = new URLSearchParams();

  if (skuId) {
    params.set("skuId", skuId);
  }

  const query = params.toString();
  return apiRequest<InventoryBatch[]>(
    `/inventory/batches${query ? `?${query}` : ""}`,
  );
}

export function fetchInventoryMovements(skuId?: string) {
  const params = new URLSearchParams();

  if (skuId) {
    params.set("skuId", skuId);
  }

  const query = params.toString();
  return apiRequest<InventoryMovement[]>(
    `/inventory/movements${query ? `?${query}` : ""}`,
  );
}
