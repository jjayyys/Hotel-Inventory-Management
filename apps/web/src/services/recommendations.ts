import {
  Recommendation,
  RecommendationRecalculationResponse,
} from "@/types/api";
import { apiRequest } from "./api-client";

export function fetchRecommendations(hotelId?: string) {
  const params = new URLSearchParams();

  if (hotelId) {
    params.set("hotelId", hotelId);
  }

  const query = params.toString();
  return apiRequest<Recommendation[]>(
    `/recommendations${query ? `?${query}` : ""}`,
  );
}

export function recalculateRecommendations(
  hotelId: string,
  daysWindow = 30,
) {
  return apiRequest<RecommendationRecalculationResponse>(
    "/recommendations/recalculate",
    {
      method: "POST",
      body: JSON.stringify({ hotelId, daysWindow }),
    },
  );
}
