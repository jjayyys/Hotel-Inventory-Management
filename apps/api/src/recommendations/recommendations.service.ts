import { Injectable, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReplenishmentService } from '../replenishment/replenishment.service';
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
}
