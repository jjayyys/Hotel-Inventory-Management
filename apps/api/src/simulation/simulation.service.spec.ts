/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReplenishmentService } from '../replenishment/replenishment.service';
import { SimulationService } from './simulation.service';
import { ScenarioType } from '@prisma/client';

describe('SimulationService', () => {
  let service: SimulationService;

  const mockPrismaService = {
    simulationRun: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockReplenishmentService = {
    calculateHotelRecommendations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ReplenishmentService,
          useValue: mockReplenishmentService,
        },
      ],
    }).compile();

    service = module.get<SimulationService>(SimulationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createScenario', () => {
    it('should create a new scenario', async () => {
      const dto = {
        name: 'Test Scenario',
        description: 'Test Description',
        scenarioType: ScenarioType.occupancy_change,
        parameters: { occupancyPercentageChange: 20 },
        hotelId: 'hotel-123',
      };

      const createdScenario = {
        id: 'scenario-123',
        hotel_id: dto.hotelId,
        name: dto.name,
        scenario_type: dto.scenarioType,
        input_parameters: dto.parameters,
        result_summary: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.simulationRun.create.mockResolvedValue(createdScenario);

      const result = await service.createScenario(dto);

      expect(result).toEqual(createdScenario);
      expect(mockPrismaService.simulationRun.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hotel_id: dto.hotelId,
          name: dto.name,
          scenario_type: dto.scenarioType,
          input_parameters: dto.parameters,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return all scenarios for a hotel', async () => {
      const hotelId = 'hotel-123';
      const scenarios = [
        {
          id: 'scenario-1',
          hotel_id: hotelId,
          name: 'Scenario 1',
          scenario_type: ScenarioType.occupancy_change,
          input_parameters: {},
          result_summary: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPrismaService.simulationRun.findMany.mockResolvedValue(scenarios);

      const result = await service.findAll({ hotelId });

      expect(result).toEqual(scenarios);
      expect(mockPrismaService.simulationRun.findMany).toHaveBeenCalledWith({
        where: { hotel_id: hotelId },
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return a scenario by ID', async () => {
      const scenarioId = 'scenario-123';
      const scenario = {
        id: scenarioId,
        hotel_id: 'hotel-123',
        name: 'Test Scenario',
        scenario_type: ScenarioType.occupancy_change,
        input_parameters: {},
        result_summary: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.simulationRun.findUnique.mockResolvedValue(scenario);

      const result = await service.findById(scenarioId);

      expect(result).toEqual(scenario);
      expect(mockPrismaService.simulationRun.findUnique).toHaveBeenCalledWith({
        where: { id: scenarioId },
      });
    });

    it('should throw NotFoundException when scenario not found', async () => {
      const scenarioId = 'nonexistent-id';

      mockPrismaService.simulationRun.findUnique.mockResolvedValue(null);

      await expect(service.findById(scenarioId)).rejects.toThrow(
        'Simulation scenario nonexistent-id not found',
      );
    });
  });

  describe('runSimulation', () => {
    it('should run a simulation and return results', async () => {
      const scenarioId = 'scenario-123';
      const scenario = {
        id: scenarioId,
        hotel_id: 'hotel-123',
        name: 'Test Scenario',
        scenario_type: ScenarioType.occupancy_change,
        input_parameters: { occupancyPercentageChange: 20 },
        result_summary: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      const baselineResult = {
        skuId: 'sku-1',
        skuCode: 'SKU-001',
        skuName: 'Test SKU',
        averageDailyDemand: 10,
        recommendedQuantity: 100,
        eoqValue: 50,
        estimatedDaysOfCover: 10,
        riskLevel: 'low' as const,
        leadTimeDays: 3,
        safetyStock: 15,
        orderCost: 50,
        holdingCost: 1.5,
        currentStock: 100,
      };

      mockPrismaService.simulationRun.findUnique.mockResolvedValue(scenario);

      mockReplenishmentService.calculateHotelRecommendations.mockResolvedValue({
        calculationWindow: {
          historyStart: new Date(),
          historyEnd: new Date(),
          forecastStart: new Date(),
          forecastEnd: new Date(),
        },
        results: [baselineResult],
      });

      mockPrismaService.simulationRun.update.mockResolvedValue(scenario);

      const result = await service.runSimulation(scenarioId);

      expect(result.scenarioId).toEqual(scenarioId);
      expect(result.hotelId).toEqual('hotel-123');
      expect(result.results.length).toBeGreaterThan(0);
      expect(mockPrismaService.simulationRun.update).toHaveBeenCalled();
    });
  });

  describe('deleteScenario', () => {
    it('should delete a scenario', async () => {
      const scenarioId = 'scenario-123';
      const scenario = {
        id: scenarioId,
        hotel_id: 'hotel-123',
        name: 'Test Scenario',
        scenario_type: ScenarioType.occupancy_change,
        input_parameters: {},
        result_summary: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.simulationRun.findUnique.mockResolvedValue(scenario);
      mockPrismaService.simulationRun.delete.mockResolvedValue(scenario);

      const result = await service.deleteScenario(scenarioId);

      expect(result).toEqual(scenario);
      expect(mockPrismaService.simulationRun.delete).toHaveBeenCalledWith({
        where: { id: scenarioId },
      });
    });
  });
});
