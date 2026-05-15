import { Supplier } from "@/types/api";
import { apiRequest } from "./api-client";

export function fetchSuppliers(hotelId?: string) {
  const params = new URLSearchParams();

  if (hotelId) {
    params.set("hotelId", hotelId);
  }

  const query = params.toString();
  return apiRequest<Supplier[]>(`/suppliers${query ? `?${query}` : ""}`);
}
