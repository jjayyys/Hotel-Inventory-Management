import {
  Recommendation,
  RecommendationRecalculationResponse,
} from "@/types/api";
import { apiRequest } from "./api-client";

export interface RecommendationExplanationResponse {
  recommendationId: string;
  provider:
    | "gemini"
    | "ollama_qwen"
    | "ollama_llama"
    | "rule-based-fallback"
    | "cached";
  explanation: string;
  cached: boolean;
  fallback: boolean;
}

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

export function generateRecommendationExplanation(
  recommendationId: string,
  refresh = false,
) {
  const params = new URLSearchParams();
  if (refresh) {
    params.set("refresh", "true");
  }

  const query = params.toString();
  return apiRequest<RecommendationExplanationResponse>(
    `/recommendations/${recommendationId}/explanation${query ? `?${query}` : ""}`,
    {
      method: "POST",
    },
  );
}
