import { RiskLevel } from '@prisma/client';
import {
  calculateEconomicOrderQuantity,
  calculateReorderPoint,
  calculateReplenishmentMetrics,
} from './replenishment-calculator';

describe('replenishment-calculator', () => {
  it('calculates EOQ deterministically from known inputs', () => {
    expect(calculateEconomicOrderQuantity(10, 80, 5)).toBe(341.76);
  });

  it('calculates reorder point from demand, lead time, and safety stock', () => {
    expect(calculateReorderPoint(4.5, 3, 12)).toBe(25.5);
  });

  it('caps recommended quantity when shelf life would create overstock risk', () => {
    const result = calculateReplenishmentMetrics({
      skuId: 'sku-1',
      hotelId: 'hotel-1',
      skuCode: 'LET-ROM',
      skuName: 'Romaine Lettuce',
      unit: 'kg',
      averageDailyDemand: 2,
      demandVariability: 0.4,
      seasonalityFactor: 1.1,
      currentStock: 1,
      leadTimeDays: 2,
      safetyStock: 2,
      minimumStock: 6,
      orderCost: 60,
      holdingCostPerUnit: 4,
      shelfLifeDays: 2,
      recentWasteQuantity: 3,
    });

    expect(result.recommendedQuantity).toBe(3);
    expect(result.overstockRisk).toBe(true);
    expect(result.riskLevel).toBe(RiskLevel.critical);
  });

  it('returns zero recommendation when stock is already above reorder point', () => {
    const result = calculateReplenishmentMetrics({
      skuId: 'sku-2',
      hotelId: 'hotel-1',
      skuCode: 'RIC-JAS',
      skuName: 'Jasmine Rice',
      unit: 'kg',
      averageDailyDemand: 1.5,
      demandVariability: 0.2,
      seasonalityFactor: 1,
      currentStock: 30,
      leadTimeDays: 4,
      safetyStock: 5,
      minimumStock: 10,
      orderCost: 40,
      holdingCostPerUnit: 2,
      shelfLifeDays: 120,
      recentWasteQuantity: 0,
    });

    expect(result.recommendedQuantity).toBe(0);
    expect(result.riskLevel).toBe(RiskLevel.low);
  });
});
