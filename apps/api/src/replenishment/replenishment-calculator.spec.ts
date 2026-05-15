import { RiskLevel } from '@prisma/client';
import {
  calculateAverageDailyDemand,
  calculateDemandVariability,
  calculateEconomicOrderQuantity,
  calculateEstimatedDaysOfCover,
  calculateReorderPoint,
  calculateReplenishmentMetrics,
  calculateSeasonalityFactor,
  calculateShelfLifeCapQuantity,
  determineRiskLevel,
} from './replenishment-calculator';

describe('replenishment-calculator', () => {
  // ===== EOQ Tests =====
  it('calculates EOQ deterministically from known inputs', () => {
    expect(calculateEconomicOrderQuantity(10, 80, 5)).toBe(341.76);
  });

  it('returns zero EOQ when demand is zero', () => {
    expect(calculateEconomicOrderQuantity(0, 80, 5)).toBe(0);
  });

  it('returns zero EOQ when order cost is zero', () => {
    expect(calculateEconomicOrderQuantity(10, 0, 5)).toBe(0);
  });

  it('returns zero EOQ when holding cost is zero', () => {
    expect(calculateEconomicOrderQuantity(10, 80, 0)).toBe(0);
  });

  it('calculates larger EOQ for higher demand', () => {
    const low = calculateEconomicOrderQuantity(5, 80, 5);
    const high = calculateEconomicOrderQuantity(20, 80, 5);
    expect(high).toBeGreaterThan(low);
  });

  // ===== Reorder Point Tests =====
  it('calculates reorder point from demand, lead time, and safety stock', () => {
    expect(calculateReorderPoint(4.5, 3, 12)).toBe(25.5);
  });

  it('returns zero reorder point when all inputs are zero', () => {
    expect(calculateReorderPoint(0, 0, 0)).toBe(0);
  });

  it('increases reorder point with higher lead time', () => {
    const short = calculateReorderPoint(2, 2, 5);
    const long = calculateReorderPoint(2, 5, 5);
    expect(long).toBeGreaterThan(short);
  });

  // ===== Daily Demand Tests =====
  it('calculates average daily demand correctly', () => {
    expect(calculateAverageDailyDemand(100, 10)).toBe(10);
  });

  it('calculates average daily demand with decimals', () => {
    expect(calculateAverageDailyDemand(100, 30)).toBe(3.333);
  });

  it('returns zero average daily demand when total demand is zero', () => {
    expect(calculateAverageDailyDemand(0, 30)).toBe(0);
  });

  // ===== Demand Variability Tests =====
  it('calculates demand variability (standard deviation)', () => {
    const daily = [5, 5, 5, 5, 5];
    expect(calculateDemandVariability(daily)).toBe(0);
  });

  it('calculates variability for varied demand pattern', () => {
    const daily = [1, 2, 3, 4, 5];
    const variability = calculateDemandVariability(daily);
    expect(variability).toBeGreaterThan(0);
    expect(variability).toBeLessThan(2);
  });

  it('returns zero variability for empty demand array', () => {
    expect(calculateDemandVariability([])).toBe(0);
  });

  // ===== Seasonality Factor Tests =====
  it('returns 1 for empty demand points', () => {
    expect(calculateSeasonalityFactor([])).toBe(1);
  });

  it('returns 1 when all points have same demand', () => {
    const points = [
      { date: new Date('2024-01-01'), demand: 5 },
      { date: new Date('2024-01-02'), demand: 5 },
      { date: new Date('2024-01-03'), demand: 5 },
    ];
    expect(calculateSeasonalityFactor(points)).toBe(1);
  });

  it('detects higher weekend demand', () => {
    const points = [
      // Monday
      { date: new Date('2024-01-01'), demand: 10 },
      // Friday
      { date: new Date('2024-01-05'), demand: 15 },
      // Saturday
      { date: new Date('2024-01-06'), demand: 25 },
    ];
    const factor = calculateSeasonalityFactor(points);
    expect(factor).toBeGreaterThan(1);
  });

  // ===== Days of Cover Tests =====
  it('calculates estimated days of cover', () => {
    expect(calculateEstimatedDaysOfCover(30, 10)).toBe(3);
  });

  it('returns 999.99 days of cover when demand is zero and stock > 0', () => {
    expect(calculateEstimatedDaysOfCover(10, 0)).toBe(999.99);
  });

  it('returns zero days of cover when stock is zero', () => {
    expect(calculateEstimatedDaysOfCover(0, 10)).toBe(0);
  });

  // ===== Shelf Life Capacity Tests =====
  it('calculates shelf life capacity constraint', () => {
    expect(calculateShelfLifeCapQuantity(2, 10, 5)).toBe(15);
  });

  it('returns infinity shelf life capacity when shelf life is zero', () => {
    expect(calculateShelfLifeCapQuantity(2, 0, 5)).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns zero shelf life capacity when demand would be met by current stock', () => {
    const result = calculateShelfLifeCapQuantity(2, 10, 25);
    expect(result).toBe(0);
  });

  // ===== Full Replenishment Metrics Tests =====
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

  it('returns critical risk when stock is critically low', () => {
    const result = calculateReplenishmentMetrics({
      skuId: 'sku-3',
      hotelId: 'hotel-1',
      skuCode: 'SOY-SAU',
      skuName: 'Soy Sauce',
      unit: 'liters',
      averageDailyDemand: 0.5,
      demandVariability: 0.1,
      seasonalityFactor: 1,
      currentStock: 0,
      leadTimeDays: 7,
      safetyStock: 2,
      minimumStock: 1,
      orderCost: 30,
      holdingCostPerUnit: 1,
      shelfLifeDays: 365,
      recentWasteQuantity: 0,
    });

    expect(result.riskLevel).toBe(RiskLevel.critical);
  });

  it('returns high risk when stock is below reorder point', () => {
    const result = calculateReplenishmentMetrics({
      skuId: 'sku-4',
      hotelId: 'hotel-1',
      skuCode: 'OIL-OLI',
      skuName: 'Olive Oil',
      unit: 'liters',
      averageDailyDemand: 0.2,
      demandVariability: 0.05,
      seasonalityFactor: 1,
      currentStock: 0.5,
      leadTimeDays: 5,
      safetyStock: 1,
      minimumStock: 2,
      orderCost: 50,
      holdingCostPerUnit: 3,
      shelfLifeDays: 180,
      recentWasteQuantity: 0.1,
    });

    expect(result.riskLevel).toBe(RiskLevel.high);
  });

  it('returns medium risk when shelf life creates overstock pressure', () => {
    const result = calculateReplenishmentMetrics({
      skuId: 'sku-5',
      hotelId: 'hotel-1',
      skuCode: 'TOM-FRE',
      skuName: 'Fresh Tomatoes',
      unit: 'kg',
      averageDailyDemand: 3,
      demandVariability: 0.8,
      seasonalityFactor: 1.2,
      currentStock: 15,
      leadTimeDays: 2,
      safetyStock: 3,
      minimumStock: 5,
      orderCost: 25,
      holdingCostPerUnit: 5,
      shelfLifeDays: 3,
      recentWasteQuantity: 2,
    });

    expect(result.riskLevel).toBe(RiskLevel.medium);
  });

  it('produces deterministic results for identical inputs', () => {
    const input = {
      skuId: 'sku-6',
      hotelId: 'hotel-1',
      skuCode: 'CHI-BRE',
      skuName: 'Chicken Breast',
      unit: 'kg',
      averageDailyDemand: 5,
      demandVariability: 0.5,
      seasonalityFactor: 1.1,
      currentStock: 10,
      leadTimeDays: 3,
      safetyStock: 5,
      minimumStock: 8,
      orderCost: 70,
      holdingCostPerUnit: 6,
      shelfLifeDays: 5,
      recentWasteQuantity: 1,
    };

    const result1 = calculateReplenishmentMetrics(input);
    const result2 = calculateReplenishmentMetrics(input);

    expect(result1).toEqual(result2);
  });

  it('all decimal outputs have correct precision', () => {
    const result = calculateReplenishmentMetrics({
      skuId: 'sku-7',
      hotelId: 'hotel-1',
      skuCode: 'VEG-CAR',
      skuName: 'Carrots',
      unit: 'kg',
      averageDailyDemand: 2.333,
      demandVariability: 0.567,
      seasonalityFactor: 1.089,
      currentStock: 12.456,
      leadTimeDays: 3,
      safetyStock: 4.789,
      minimumStock: 6.234,
      orderCost: 45.67,
      holdingCostPerUnit: 3.21,
      shelfLifeDays: 10,
      recentWasteQuantity: 0.567,
    });

    expect(result.averageDailyDemand).toBe(2.333);
    expect(result.demandVariability).toBe(0.567);
    expect(result.seasonalityFactor).toBe(1.089);
  });
});
