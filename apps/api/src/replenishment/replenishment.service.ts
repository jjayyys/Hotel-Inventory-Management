import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateAverageDailyDemand,
  calculateDemandVariability,
  calculateReplenishmentMetrics,
  calculateSeasonalityFactor,
  round,
} from './replenishment-calculator';
import {
  DailyDemandPoint,
  ReplenishmentCalculationResult,
} from './replenishment.types';

type CalculationWindow = {
  historyStart: Date;
  historyEnd: Date;
  forecastStart: Date;
  forecastEnd: Date;
};

@Injectable()
export class ReplenishmentService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateHotelRecommendations(
    hotelId: string,
    daysWindow = 30,
  ): Promise<{
    calculationWindow: CalculationWindow;
    results: ReplenishmentCalculationResult[];
  }> {
    if (daysWindow < 1) {
      throw new BadRequestException('daysWindow must be at least 1.');
    }

    const calculationWindow = this.createCalculationWindow(daysWindow);
    const activeSkus = await this.prisma.sku.findMany({
      where: {
        hotel_id: hotelId,
        is_active: true,
      },
      include: {
        supplier: true,
        supplier_lead_times: true,
        inventory_batches: {
          select: {
            remaining_quantity: true,
          },
        },
      },
      orderBy: [{ sku_code: 'asc' }],
    });

    if (activeSkus.length === 0) {
      throw new BadRequestException(
        `No active SKUs were found for hotel ${hotelId}.`,
      );
    }

    const skuIds = activeSkus.map((sku) => sku.id);
    const recipes = await this.prisma.recipe.findMany({
      where: {
        sku_id: { in: skuIds },
      },
      select: {
        menu_item_id: true,
        sku_id: true,
        quantity_per_serving: true,
      },
    });
    const posTransactions = await this.prisma.posTransaction.findMany({
      where: {
        hotel_id: hotelId,
        transaction_date: {
          gte: calculationWindow.historyStart,
          lte: calculationWindow.historyEnd,
        },
      },
      select: {
        menu_item_id: true,
        quantity_sold: true,
        transaction_date: true,
      },
    });
    const wasteLogs = await this.prisma.wasteLog.findMany({
      where: {
        sku_id: { in: skuIds },
        waste_date: {
          gte: calculationWindow.historyStart,
          lte: calculationWindow.historyEnd,
        },
      },
      select: {
        sku_id: true,
        quantity: true,
      },
    });

    const recipesByMenuItem = new Map<
      string,
      Array<{ skuId: string; quantityPerServing: number }>
    >();

    for (const recipe of recipes) {
      const existing = recipesByMenuItem.get(recipe.menu_item_id) ?? [];
      existing.push({
        skuId: recipe.sku_id,
        quantityPerServing: Number(recipe.quantity_per_serving),
      });
      recipesByMenuItem.set(recipe.menu_item_id, existing);
    }

    const dailyDemandBySku = new Map<string, Map<string, number>>();

    for (const transaction of posTransactions) {
      const matchingRecipes =
        recipesByMenuItem.get(transaction.menu_item_id) ?? [];
      const dateKey = this.toDateKey(transaction.transaction_date);

      for (const recipe of matchingRecipes) {
        const usage =
          transaction.quantity_sold * Number(recipe.quantityPerServing);
        const skuUsageByDate = dailyDemandBySku.get(recipe.skuId) ?? new Map();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const current = skuUsageByDate.get(dateKey) ?? 0;
        skuUsageByDate.set(dateKey, current + usage);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        dailyDemandBySku.set(recipe.skuId, skuUsageByDate);
      }
    }

    const wasteBySku = new Map<string, number>();

    for (const wasteLog of wasteLogs) {
      wasteBySku.set(
        wasteLog.sku_id,
        (wasteBySku.get(wasteLog.sku_id) ?? 0) + Number(wasteLog.quantity),
      );
    }

    const results = activeSkus.map((sku) => {
      const skuDailyUsage: Map<string, number> =
        dailyDemandBySku.get(sku.id) ?? new Map<string, number>();
      const dailyPoints: DailyDemandPoint[] = this.buildDailyDemandPoints(
        calculationWindow.historyStart,
        daysWindow,
        skuDailyUsage,
      );
      const dailyDemandValues = dailyPoints.map((point) =>
        round(point.demand, 3),
      );
      const totalDemand = round(
        dailyDemandValues.reduce((sum, value) => sum + value, 0),
        3,
      );
      const averageDailyDemand = calculateAverageDailyDemand(
        totalDemand,
        daysWindow,
      );
      const demandVariability = calculateDemandVariability(dailyDemandValues);
      const seasonalityFactor = calculateSeasonalityFactor(dailyPoints);
      const currentStock = round(
        sku.inventory_batches.reduce(
          (sum, batch) => sum + Number(batch.remaining_quantity),
          0,
        ),
        3,
      );
      const supplierLeadTime =
        sku.supplier_lead_times.find((leadTime) => leadTime.sku_id === sku.id)
          ?.average_lead_time_days ?? sku.supplier.default_lead_time_days;
      const recentWasteQuantity = round(wasteBySku.get(sku.id) ?? 0, 3);

      return calculateReplenishmentMetrics({
        skuId: sku.id,
        hotelId: sku.hotel_id,
        skuCode: sku.sku_code,
        skuName: sku.name,
        unit: sku.unit,
        averageDailyDemand,
        demandVariability,
        seasonalityFactor,
        currentStock,
        leadTimeDays: supplierLeadTime,
        safetyStock: Number(sku.safety_stock),
        minimumStock: Number(sku.minimum_stock),
        orderCost: Number(sku.order_cost),
        holdingCostPerUnit: Number(sku.holding_cost_per_unit),
        shelfLifeDays: sku.shelf_life_days,
        recentWasteQuantity,
      });
    });

    return {
      calculationWindow,
      results,
    };
  }

  private createCalculationWindow(daysWindow: number): CalculationWindow {
    const historyEnd = this.atNoonUtc(0);
    const historyStart = this.atNoonUtc(-(daysWindow - 1));
    const forecastStart = this.atNoonUtc(1);
    const forecastEnd = this.atNoonUtc(daysWindow);

    return {
      historyStart,
      historyEnd,
      forecastStart,
      forecastEnd,
    };
  }

  private buildDailyDemandPoints(
    historyStart: Date,
    daysWindow: number,
    usageByDate: Map<string, number>,
  ) {
    return Array.from({ length: daysWindow }, (_, index) => {
      const pointDate = new Date(historyStart);
      pointDate.setUTCDate(historyStart.getUTCDate() + index);
      const dateKey = this.toDateKey(pointDate);

      return {
        date: pointDate,
        demand: round(usageByDate.get(dateKey) ?? 0, 3),
      };
    });
  }

  private toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private atNoonUtc(daysOffset: number) {
    const date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + daysOffset);
    return date;
  }
}
