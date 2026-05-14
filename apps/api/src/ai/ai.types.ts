export type RecommendationExplanationContext = {
  recommendationId: string;
  recommendationDate: string;
  skuCode: string;
  skuName: string;
  category: string | null;
  unit: string;
  supplierName: string | null;
  currentStock: number;
  reorderPoint: number;
  recommendedQuantity: number;
  eoqValue: number;
  estimatedDaysOfCover: number;
  riskLevel: string;
  safetyStock: number;
  minimumStock: number;
  shelfLifeDays: number;
  leadTimeDays: number;
  recentWasteQuantity: number;
};

export type AiGenerationRequest = {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number;
};

export type AiGenerationResponse = {
  provider: string;
  text: string;
};
