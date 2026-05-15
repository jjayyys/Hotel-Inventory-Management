import {
  InventoryBatch,
  Recommendation,
  RecommendationCalculation,
  Recipe,
  Sku,
  Supplier,
  WasteLog,
} from "./api";

export type DashboardDataset = {
  hotelId: string;
  suppliers: Supplier[];
  skus: Sku[];
  recommendations: Recommendation[];
  latestRecommendationDate: string | null;
  latestRecommendations: Recommendation[];
  wasteLogs: WasteLog[];
  inventoryBatches: InventoryBatch[];
  recipes: Recipe[];
};

export type DashboardMetrics = {
  totalSkus: number;
  totalSuppliers: number;
  totalRecommendations: number;
  criticalAlerts: number;
  reorderAlerts: number;
  wasteEvents: number;
  wasteCost: number;
  lowStockSkus: number;
};

export type WasteTrendPoint = {
  label: string;
  quantity: number;
  estimatedCost: number;
};

export type RecommendationRiskPoint = {
  label: string;
  count: number;
};

export type StockCoveragePoint = {
  skuCode: string;
  daysOfCover: number;
  reorderPoint: number;
};

export type RecalculationResult = RecommendationCalculation[];
