import { RiskLevel } from '@prisma/client';

export type DailyDemandPoint = {
  date: Date;
  demand: number;
};

export type ReplenishmentCalculationInput = {
  skuId: string;
  hotelId: string;
  skuCode: string;
  skuName: string;
  unit: string;
  averageDailyDemand: number;
  demandVariability: number;
  seasonalityFactor: number;
  currentStock: number;
  leadTimeDays: number;
  safetyStock: number;
  minimumStock: number;
  orderCost: number;
  holdingCostPerUnit: number;
  shelfLifeDays: number;
  recentWasteQuantity: number;
};

export type ReplenishmentCalculationResult = {
  skuId: string;
  hotelId: string;
  skuCode: string;
  skuName: string;
  unit: string;
  averageDailyDemand: number;
  demandVariability: number;
  seasonalityFactor: number;
  currentStock: number;
  reorderPoint: number;
  recommendedQuantity: number;
  eoqValue: number;
  estimatedDaysOfCover: number;
  leadTimeDays: number;
  safetyStock: number;
  minimumStock: number;
  recentWasteQuantity: number;
  riskLevel: RiskLevel;
  shelfLifeCapQuantity: number;
  overstockRisk: boolean;
};
