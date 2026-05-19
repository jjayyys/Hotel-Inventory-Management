import { Injectable, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReplenishmentService } from '../replenishment/replenishment.service';
import { BulkRecalculateRecommendationsDto } from './dto/bulk-recalculate-recommendations.dto';
import { GenerateRecommendationExplanationDto } from './dto/generate-recommendation-explanation.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { RecalculateRecommendationsDto } from './dto/recalculate-recommendations.dto';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly replenishmentService: ReplenishmentService,
  ) {}

  async recalculate(dto: RecalculateRecommendationsDto) {
    const daysWindow = dto.daysWindow ?? 30;
    const { calculationWindow, results } =
      await this.replenishmentService.calculateHotelRecommendations(
        dto.hotelId,
        daysWindow,
      );
    const skuIds = results.map((result) => result.skuId);

    await this.prisma.$transaction(async (tx) => {
      await tx.demandForecast.deleteMany({
        where: {
          sku_id: { in: skuIds },
          forecast_period_start: calculationWindow.forecastStart,
          forecast_period_end: calculationWindow.forecastEnd,
        },
      });
      await tx.replenishmentRecommendation.deleteMany({
        where: {
          sku_id: { in: skuIds },
          recommendation_date: calculationWindow.historyEnd,
        },
      });
      await tx.demandForecast.createMany({
        data: results.map((result) => ({
          sku_id: result.skuId,
          forecast_period_start: calculationWindow.forecastStart,
          forecast_period_end: calculationWindow.forecastEnd,
          average_daily_demand: result.averageDailyDemand,
          demand_variability: result.demandVariability,
          seasonality_factor: result.seasonalityFactor,
        })),
      });
      await tx.replenishmentRecommendation.createMany({
        data: results.map((result) => ({
          sku_id: result.skuId,
          recommendation_date: calculationWindow.historyEnd,
          current_stock: result.currentStock,
          reorder_point: result.reorderPoint,
          recommended_quantity: result.recommendedQuantity,
          eoq_value: result.eoqValue,
          estimated_days_of_cover: result.estimatedDaysOfCover,
          risk_level: result.riskLevel,
          explanation: null,
        })),
      });
    });

    return {
      hotelId: dto.hotelId,
      daysWindow,
      historyWindow: {
        start: calculationWindow.historyStart,
        end: calculationWindow.historyEnd,
      },
      forecastWindow: {
        start: calculationWindow.forecastStart,
        end: calculationWindow.forecastEnd,
      },
      recommendationsGenerated: results.length,
      recommendations: results,
    };
  }

  findAll(query: QueryRecommendationsDto) {
    return this.prisma.replenishmentRecommendation.findMany({
      where: {
        ...(query.skuId ? { sku_id: query.skuId } : {}),
        ...(query.recommendationDate
          ? { recommendation_date: new Date(query.recommendationDate) }
          : {}),
        ...(query.hotelId
          ? {
              sku: {
                hotel_id: query.hotelId,
              },
            }
          : {}),
      },
      include: {
        sku: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: [{ recommendation_date: 'desc' }, { created_at: 'desc' }],
    });
  }

  async generateExplanation(
    id: string,
    options: GenerateRecommendationExplanationDto,
  ) {
    const recommendation =
      await this.prisma.replenishmentRecommendation.findUnique({
        where: { id },
        include: {
          sku: {
            include: {
              supplier: true,
              supplier_lead_times: true,
            },
          },
        },
      });

    if (!recommendation) {
      throw new NotFoundException(`Recommendation ${id} was not found.`);
    }

    if (recommendation.explanation && !options.refresh) {
      return {
        recommendationId: recommendation.id,
        provider: 'cached',
        explanation: recommendation.explanation,
        cached: true,
        fallback: false,
      };
    }

    const thirtyDaysAgo = new Date(recommendation.recommendation_date);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    const wasteAggregate = await this.prisma.wasteLog.aggregate({
      where: {
        sku_id: recommendation.sku_id,
        waste_date: {
          gte: thirtyDaysAgo,
          lte: recommendation.recommendation_date,
        },
      },
      _sum: {
        quantity: true,
      },
    });
    const leadTimeDays =
      recommendation.sku.supplier_lead_times.find(
        (leadTime) => leadTime.sku_id === recommendation.sku_id,
      )?.average_lead_time_days ??
      recommendation.sku.supplier.default_lead_time_days;
    const explanationResponse =
      await this.aiService.generateRecommendationExplanation({
        recommendationId: recommendation.id,
        recommendationDate: recommendation.recommendation_date
          .toISOString()
          .slice(0, 10),
        skuCode: recommendation.sku.sku_code,
        skuName: recommendation.sku.name,
        category: recommendation.sku.category,
        unit: recommendation.sku.unit,
        supplierName: recommendation.sku.supplier?.name ?? null,
        currentStock: Number(recommendation.current_stock),
        reorderPoint: Number(recommendation.reorder_point),
        recommendedQuantity: Number(recommendation.recommended_quantity),
        eoqValue: Number(recommendation.eoq_value),
        estimatedDaysOfCover: Number(recommendation.estimated_days_of_cover),
        riskLevel: recommendation.risk_level,
        safetyStock: Number(recommendation.sku.safety_stock),
        minimumStock: Number(recommendation.sku.minimum_stock),
        shelfLifeDays: recommendation.sku.shelf_life_days,
        leadTimeDays,
        recentWasteQuantity: Number(wasteAggregate._sum.quantity ?? 0),
      });

    await this.prisma.replenishmentRecommendation.update({
      where: { id },
      data: {
        explanation: explanationResponse.text,
      },
    });

    return {
      recommendationId: recommendation.id,
      provider: explanationResponse.provider,
      explanation: explanationResponse.text,
      cached: false,
      fallback: explanationResponse.fallback,
    };
  }

  async findById(id: string) {
    const recommendation =
      await this.prisma.replenishmentRecommendation.findUnique({
        where: { id },
        include: {
          sku: {
            include: {
              supplier: true,
              supplier_lead_times: true,
            },
          },
        },
      });

    if (!recommendation) {
      throw new NotFoundException(`Recommendation ${id} was not found.`);
    }

    return recommendation;
  }

  async bulkRecalculate(dto: BulkRecalculateRecommendationsDto) {
    const daysWindow = dto.daysWindow ?? 30;
    const results: Record<string, unknown> = {};

    for (const hotelId of dto.hotelIds) {
      try {
        const result = await this.recalculate({
          hotelId,
          daysWindow,
        });
        results[hotelId] = {
          status: 'success',
          data: result,
        };
      } catch (error) {
        results[hotelId] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return {
      daysWindow,
      hotelCount: dto.hotelIds.length,
      results,
    };
  }

  private buildRuleBasedFallback(
    recommendation: {
      current_stock: number | { toNumber(): number };
      reorder_point: number | { toNumber(): number };
      recommended_quantity: number | { toNumber(): number };
      eoq_value: number | { toNumber(): number };
      estimated_days_of_cover: number | { toNumber(): number };
      sku: {
        unit: string;
        shelf_life_days: number;
        safety_stock: number | { toNumber(): number };
      };
    },
    recentWaste: number,
    leadTimeDays: number,
  ): string {
    const currentStock = this.toNumber(recommendation.current_stock);
    const reorderPoint = this.toNumber(recommendation.reorder_point);
    const recommendedQuantity = this.toNumber(
      recommendation.recommended_quantity,
    );
    const eoqValue = this.toNumber(recommendation.eoq_value);
    const daysOfCover = this.toNumber(recommendation.estimated_days_of_cover);
    const safetyStock = this.toNumber(recommendation.sku.safety_stock);

    const reorderSignal =
      currentStock < reorderPoint
        ? `Current stock (${currentStock}) is below the reorder point (${reorderPoint}), so the system recommends ordering ${recommendedQuantity} ${recommendation.sku.unit}.`
        : `Current stock (${currentStock}) is above the reorder point (${reorderPoint}), so no immediate reorder is recommended.`;

    const wasteSignal =
      recentWaste > 0
        ? `Recent waste of ${recentWaste} ${recommendation.sku.unit} suggests added shelf-life pressure.`
        : 'Recent waste is low, so waste pressure is limited in the latest cycle.';

    const coverSignal =
      daysOfCover <= leadTimeDays
        ? `Estimated cover is only ${daysOfCover.toFixed(1)} days against a ${leadTimeDays}-day lead time, creating supply risk.`
        : `Estimated cover is ${daysOfCover.toFixed(1)} days with a ${leadTimeDays}-day lead time.`;

    return `${reorderSignal} ${coverSignal} Safety stock is set at ${safetyStock} ${recommendation.sku.unit} and EOQ is ${eoqValue.toFixed(2)} ${recommendation.sku.unit}. ${wasteSignal}`;
  }

  private toNumber(value: number | { toNumber(): number }): number {
    return typeof value === 'number' ? value : value.toNumber();
  }
}
