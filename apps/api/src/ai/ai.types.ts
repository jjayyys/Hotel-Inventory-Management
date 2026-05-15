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

export class AiProviderError extends Error {
  constructor(
    readonly provider: string,
    message: string,
    readonly retryable: boolean,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export type AiGenerationRequest = {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number;
};

export type AiGenerationResponse = {
  provider: string;
  text: string;
};

export type AiProviderStatus = {
  provider: string;
  model: string | null;
  configured: boolean;
  reachable: boolean;
  modelAvailable: boolean;
  healthy: boolean;
  latencyMs: number | null;
  checkedAt: string;
  message: string;
};

export type AiProviderStatusSummary = {
  providerOrder: string[];
  fallbackEnabled: boolean;
  timeoutMs: number;
  retryAttempts: number;
  providers: AiProviderStatus[];
  allHealthy: boolean;
  anyHealthy: boolean;
};
