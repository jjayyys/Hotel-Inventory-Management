/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReplenishmentService } from '../replenishment/replenishment.service';
import { CreateSimulationScenarioDto } from './dto/create-simulation-scenario.dto';
import { QuerySimulationScenariosDto } from './dto/query-simulation-scenarios.dto';
import { round } from '../replenishment/replenishment-calculator';
import { ScenarioType } from '@prisma/client';

@Injectable()
export class SimulationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly replenishmentService: ReplenishmentService,
  ) {}

  async createScenario(dto: CreateSimulationScenarioDto) {
    const daysWindow = dto.daysWindow ?? 30;
    const now = new Date();

    // Calculate baseline and projection windows
    const baselineStart = new Date(now);
    baselineStart.setDate(baselineStart.getDate() - daysWindow);

    const projectionEnd = new Date(now);
    projectionEnd.setDate(projectionEnd.getDate() + daysWindow);

    const scenario = await this.prisma.simulationRun.create({
      data: {
        hotel_id: dto.hotelId,
        name: dto.name,
        scenario_type: dto.scenarioType,
        input_parameters: dto.parameters,
        result_summary: {},
      },
    });

    return scenario;
  }

  async findAll(query: QuerySimulationScenariosDto) {
    const where: Record<string, unknown> = {};

    if (query.hotelId) {
      where.hotel_id = query.hotelId;
    }

    return this.prisma.simulationRun.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string) {
    const scenario = await this.prisma.simulationRun.findUnique({
      where: { id },
    });

    if (!scenario) {
      throw new NotFoundException(`Simulation scenario ${id} not found`);
    }

    return scenario;
  }

  async runSimulation(scenarioId: string) {
    const scenario = await this.findById(scenarioId);

    // Get baseline metrics for the hotel

    const baselineRecommendations =
      await this.replenishmentService.calculateHotelRecommendations(
        scenario.hotel_id,
        30,
      );

    // Apply scenario parameters to calculate projected metrics
    const projectedRecommendations = this.applyScenarioParameters(
      baselineRecommendations.results,
      scenario.scenario_type,
      (scenario.input_parameters as Record<string, any>) || {},
    );

    // Calculate variances

    const results = baselineRecommendations.results.map((baseline: any) => {
      const projected = projectedRecommendations.find(
        (p: any) => p.skuId === baseline.skuId,
      );

      if (!projected) {
        throw new Error(
          `Projected metrics not found for SKU ${baseline.skuId}`,
        );
      }

      return {
        scenarioId,

        skuId: baseline.skuId as string,

        skuCode: baseline.skuCode as string,

        skuName: baseline.skuName as string,
        baselineMetrics: {
          averageDailyDemand: baseline.averageDailyDemand as number,

          recommendedQuantity: baseline.recommendedQuantity as number,

          eoqValue: baseline.eoqValue as number,

          estimatedDaysOfCover: baseline.estimatedDaysOfCover as number,

          riskLevel: baseline.riskLevel as string,
        },
        projectedMetrics: {
          averageDailyDemand: projected.averageDailyDemand as number,

          recommendedQuantity: projected.recommendedQuantity as number,

          eoqValue: projected.eoqValue as number,

          estimatedDaysOfCover: projected.estimatedDaysOfCover as number,

          riskLevel: projected.riskLevel as string,
        },
        variance: {
          demandChange:
            baseline.averageDailyDemand === 0 || !baseline.averageDailyDemand
              ? 0
              : round(
                  ((projected.averageDailyDemand - baseline.averageDailyDemand) /
                    baseline.averageDailyDemand) *
                    100,
                  2,
                ),
          quantityChange:
            baseline.recommendedQuantity === 0 || !baseline.recommendedQuantity
              ? 0
              : round(
                  ((projected.recommendedQuantity - baseline.recommendedQuantity) /
                    baseline.recommendedQuantity) *
                    100,
                  2,
                ),
          eoqChange:
            baseline.eoqValue === 0 || !baseline.eoqValue
              ? 0
              : round(
                  ((projected.eoqValue - baseline.eoqValue) / baseline.eoqValue) *
                    100,
                  2,
                ),
          daysOfCoverChange: round(
            projected.estimatedDaysOfCover - baseline.estimatedDaysOfCover,
            2,
          ),
          riskUpgrade:
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.riskLevelToNumber(projected.riskLevel) >
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.riskLevelToNumber(baseline.riskLevel),
        },
      };
    });

    // Update scenario with result summary
    await this.prisma.simulationRun.update({
      where: { id: scenarioId },
      data: {
        result_summary: {
          skusAffected: results.length,
          riskUpgrades: results.filter((r) => r.variance.riskUpgrade).length,
          avgQuantityChange: round(
            results.reduce((sum, r) => sum + r.variance.quantityChange, 0) /
              results.length,
            2,
          ),
        },
      },
    });

    return {
      scenarioId,

      hotelId: scenario.hotel_id,

      scenarioName: scenario.name,
      projectionStart: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      projectionEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      skusAffected: results.length,

      results,
    };
  }

  /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment */

  private applyScenarioParameters(
    baselineResults: any[],
    scenarioType: ScenarioType,
    parameters: Record<string, any>,
  ): any[] {
    return baselineResults.map((baseline) => {
      let demandMultiplier = 1;
      let leadTimeMultiplier = 1;
      let safetyStockMultiplier = 1;

      // Apply scenario-specific adjustments
      switch (scenarioType) {
        case ScenarioType.occupancy_change:
          demandMultiplier =
            1 + (parameters.occupancyPercentageChange || 0) / 100;
          break;

        case ScenarioType.lead_time_change:
          leadTimeMultiplier =
            1 + (parameters.leadTimeDaysChange || 0) / baseline.leadTimeDays;
          safetyStockMultiplier = 1.15; // Increase safety stock on longer lead times
          break;

        case ScenarioType.seasonal_shift:
          demandMultiplier = parameters.seasonalityFactor || 1;
          break;

        case ScenarioType.supplier_delay:
          leadTimeMultiplier =
            1 + (parameters.delayDays || 0) / baseline.leadTimeDays;
          safetyStockMultiplier = 1.25; // Significantly increase safety stock
          break;

        case ScenarioType.demand_spike:
          demandMultiplier = 1 + (parameters.demandSpikePercentage || 0) / 100;
          safetyStockMultiplier = 1.1;
          break;
      }

      // Recalculate metrics with adjusted parameters

      const projectedAverageDailyDemand =
        baseline.averageDailyDemand * demandMultiplier;
      const projectedLeadTimeDays = baseline.leadTimeDays * leadTimeMultiplier;
      const projectedSafetyStock = baseline.safetyStock * safetyStockMultiplier;

      // Recalculate replenishment metrics with projections
      const orderCost = baseline.orderCost || 50;
      const holdingCost = baseline.holdingCost || 1.5;

      const projectedEoq = Math.sqrt(
        (2 * projectedAverageDailyDemand * 365 * orderCost) / holdingCost,
      );

      const projectedReorderPoint =
        projectedAverageDailyDemand * projectedLeadTimeDays +
        projectedSafetyStock;

      let projectedRecommendedQuantity = 0;

      if (baseline.currentStock < projectedReorderPoint) {
        projectedRecommendedQuantity =
          Math.ceil(
            (projectedReorderPoint - baseline.currentStock) / projectedEoq,
          ) * projectedEoq;
      }

      const projectedDaysOfCover =
        baseline.currentStock / projectedAverageDailyDemand;

      // Determine risk level
      let projectedRiskLevel = 'low';
      if (projectedDaysOfCover < projectedLeadTimeDays)
        projectedRiskLevel = 'critical';
      else if (projectedDaysOfCover < projectedReorderPoint / 2)
        projectedRiskLevel = 'high';
      else if (projectedDaysOfCover < projectedReorderPoint)
        projectedRiskLevel = 'medium';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...baseline,
        averageDailyDemand: round(projectedAverageDailyDemand, 2),
        eoqValue: round(projectedEoq, 2),
        recommendedQuantity: round(projectedRecommendedQuantity, 2),
        estimatedDaysOfCover: round(projectedDaysOfCover, 2),
        riskLevel: projectedRiskLevel as 'low' | 'medium' | 'high' | 'critical',
      };
    });
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment */

  private riskLevelToNumber(
    risk: 'low' | 'medium' | 'high' | 'critical',
  ): number {
    switch (risk) {
      case 'low':
        return 1;
      case 'medium':
        return 2;
      case 'high':
        return 3;
      case 'critical':
        return 4;
    }
  }

  async deleteScenario(id: string) {
    await this.findById(id);
    return this.prisma.simulationRun.delete({
      where: { id },
    });
  }
}
