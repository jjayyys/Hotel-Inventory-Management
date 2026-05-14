import { RiskLevel } from '@prisma/client';
import {
  DailyDemandPoint,
  ReplenishmentCalculationInput,
  ReplenishmentCalculationResult,
} from './replenishment.types';

export function round(value: number, decimals: number) {
  return Number(value.toFixed(decimals));
}

export function calculateAverageDailyDemand(
  totalDemand: number,
  daysWindow: number,
) {
  if (daysWindow <= 0) {
    return 0;
  }

  return round(totalDemand / daysWindow, 3);
}

export function calculateDemandVariability(dailyDemand: number[]) {
  if (dailyDemand.length === 0) {
    return 0;
  }

  const average =
    dailyDemand.reduce((sum, value) => sum + value, 0) / dailyDemand.length;
  const variance =
    dailyDemand.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    dailyDemand.length;

  return round(Math.sqrt(variance), 3);
}

export function calculateSeasonalityFactor(points: DailyDemandPoint[]) {
  if (points.length === 0) {
    return 1;
  }

  const weekend = points.filter((point) => {
    const day = point.date.getUTCDay();
    return day === 5 || day === 6;
  });
  const weekdays = points.filter((point) => {
    const day = point.date.getUTCDay();
    return day !== 5 && day !== 6;
  });

  if (weekend.length === 0 || weekdays.length === 0) {
    return 1;
  }

  const weekendAverage =
    weekend.reduce((sum, point) => sum + point.demand, 0) / weekend.length;
  const weekdayAverage =
    weekdays.reduce((sum, point) => sum + point.demand, 0) / weekdays.length;

  if (weekdayAverage <= 0) {
    return 1;
  }

  return round(weekendAverage / weekdayAverage, 3);
}

export function calculateReorderPoint(
  averageDailyDemand: number,
  leadTimeDays: number,
  safetyStock: number,
) {
  return round(averageDailyDemand * leadTimeDays + safetyStock, 3);
}

export function calculateEconomicOrderQuantity(
  averageDailyDemand: number,
  orderCost: number,
  holdingCostPerUnit: number,
) {
  if (averageDailyDemand <= 0 || orderCost <= 0 || holdingCostPerUnit <= 0) {
    return 0;
  }

  const annualDemand = averageDailyDemand * 365;
  return round(
    Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit),
    3,
  );
}

export function calculateEstimatedDaysOfCover(
  currentStock: number,
  averageDailyDemand: number,
) {
  if (averageDailyDemand <= 0) {
    return currentStock > 0 ? 999.99 : 0;
  }

  return round(currentStock / averageDailyDemand, 2);
}

export function calculateShelfLifeCapQuantity(
  averageDailyDemand: number,
  shelfLifeDays: number,
  currentStock: number,
) {
  if (averageDailyDemand <= 0 || shelfLifeDays <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return round(
    Math.max(0, averageDailyDemand * shelfLifeDays - currentStock),
    3,
  );
}

export function calculateRecommendedQuantity(
  currentStock: number,
  reorderPoint: number,
  eoqValue: number,
  minimumStock: number,
  shelfLifeCapQuantity: number,
) {
  if (currentStock >= reorderPoint) {
    return 0;
  }

  const rawRecommendation = Math.max(eoqValue, minimumStock);

  if (!Number.isFinite(shelfLifeCapQuantity)) {
    return round(rawRecommendation, 3);
  }

  return round(
    Math.max(0, Math.min(rawRecommendation, shelfLifeCapQuantity)),
    3,
  );
}

export function determineRiskLevel(
  input: ReplenishmentCalculationInput,
  reorderPoint: number,
  estimatedDaysOfCover: number,
  recommendedQuantity: number,
  shelfLifeCapQuantity: number,
) {
  const overstockRisk =
    Number.isFinite(shelfLifeCapQuantity) &&
    Math.max(
      calculateEconomicOrderQuantity(
        input.averageDailyDemand,
        input.orderCost,
        input.holdingCostPerUnit,
      ),
      input.minimumStock,
    ) > shelfLifeCapQuantity;

  if (
    input.averageDailyDemand > 0 &&
    (input.currentStock <= 0 || estimatedDaysOfCover < input.leadTimeDays * 0.5)
  ) {
    return RiskLevel.critical;
  }

  if (
    input.averageDailyDemand > 0 &&
    (input.currentStock < reorderPoint || recommendedQuantity > 0)
  ) {
    return overstockRisk ? RiskLevel.critical : RiskLevel.high;
  }

  if (
    overstockRisk ||
    input.recentWasteQuantity >= input.averageDailyDemand * 2 ||
    (input.averageDailyDemand > 0 &&
      estimatedDaysOfCover > input.shelfLifeDays * 0.9)
  ) {
    return RiskLevel.medium;
  }

  return RiskLevel.low;
}

export function calculateReplenishmentMetrics(
  input: ReplenishmentCalculationInput,
): ReplenishmentCalculationResult {
  const reorderPoint = calculateReorderPoint(
    input.averageDailyDemand,
    input.leadTimeDays,
    input.safetyStock,
  );
  const eoqValue = calculateEconomicOrderQuantity(
    input.averageDailyDemand,
    input.orderCost,
    input.holdingCostPerUnit,
  );
  const estimatedDaysOfCover = calculateEstimatedDaysOfCover(
    input.currentStock,
    input.averageDailyDemand,
  );
  const shelfLifeCapQuantity = calculateShelfLifeCapQuantity(
    input.averageDailyDemand,
    input.shelfLifeDays,
    input.currentStock,
  );
  const recommendedQuantity = calculateRecommendedQuantity(
    input.currentStock,
    reorderPoint,
    eoqValue,
    input.minimumStock,
    shelfLifeCapQuantity,
  );
  const riskLevel = determineRiskLevel(
    input,
    reorderPoint,
    estimatedDaysOfCover,
    recommendedQuantity,
    shelfLifeCapQuantity,
  );

  return {
    skuId: input.skuId,
    hotelId: input.hotelId,
    skuCode: input.skuCode,
    skuName: input.skuName,
    unit: input.unit,
    averageDailyDemand: input.averageDailyDemand,
    demandVariability: input.demandVariability,
    seasonalityFactor: input.seasonalityFactor,
    currentStock: input.currentStock,
    reorderPoint,
    recommendedQuantity,
    eoqValue,
    estimatedDaysOfCover,
    leadTimeDays: input.leadTimeDays,
    safetyStock: input.safetyStock,
    minimumStock: input.minimumStock,
    recentWasteQuantity: input.recentWasteQuantity,
    riskLevel,
    shelfLifeCapQuantity: Number.isFinite(shelfLifeCapQuantity)
      ? shelfLifeCapQuantity
      : 0,
    overstockRisk:
      Number.isFinite(shelfLifeCapQuantity) &&
      Math.max(eoqValue, input.minimumStock) > shelfLifeCapQuantity,
  };
}
