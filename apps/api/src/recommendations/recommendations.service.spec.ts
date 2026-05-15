import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { RiskLevel } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReplenishmentService } from '../replenishment/replenishment.service';
import { RecommendationsService } from './recommendations.service';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let prisma: PrismaService;
  let replenishment: ReplenishmentService;
  let aiService: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: PrismaService,
          useValue: {
            replenishmentRecommendation: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              createMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            demandForecast: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
            wasteLog: {
              aggregate: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: ReplenishmentService,
          useValue: {
            calculateHotelRecommendations: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            generateRecommendationExplanation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    prisma = module.get<PrismaService>(PrismaService);
    replenishment = module.get<ReplenishmentService>(ReplenishmentService);
    aiService = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('returns a recommendation by ID', async () => {
      const mockRecommendation = {
        id: 'rec-1',
        sku_id: 'sku-1',
        recommendation_date: new Date(),
        current_stock: new Decimal('20'),
        reorder_point: new Decimal('15'),
        recommended_quantity: new Decimal('50'),
        eoq_value: new Decimal('45.5'),
        estimated_days_of_cover: new Decimal('10'),
        risk_level: RiskLevel.low,
        explanation: 'Test explanation',
        created_at: new Date(),
        sku: {
          id: 'sku-1',
          supplier: { id: 'sup-1', default_lead_time_days: 3 },
          supplier_lead_times: [],
        },
      };

      jest
        .spyOn(prisma.replenishmentRecommendation, 'findUnique')
        .mockResolvedValueOnce(mockRecommendation as never);

      const result = await service.findById('rec-1');

      expect(result).toEqual(mockRecommendation);
      expect(
        prisma.replenishmentRecommendation.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        include: expect.any(Object),
      });
    });

    it('throws NotFoundException when recommendation does not exist', async () => {
      jest
        .spyOn(prisma.replenishmentRecommendation, 'findUnique')
        .mockResolvedValueOnce(null as never);

      await expect(service.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkRecalculate', () => {
    it('recalculates recommendations for multiple hotels', async () => {
      const mockCalcResult = {
        calculationWindow: {
          historyStart: new Date(),
          historyEnd: new Date(),
          forecastStart: new Date(),
          forecastEnd: new Date(),
        },
        results: [
          {
            skuId: 'sku-1',
            hotelId: 'hotel-1',
            skuCode: 'TEST-001',
            skuName: 'Test',
            unit: 'kg',
            averageDailyDemand: 5,
            demandVariability: 0.5,
            seasonalityFactor: 1,
            currentStock: 20,
            reorderPoint: 15,
            recommendedQuantity: 50,
            eoqValue: 45.5,
            estimatedDaysOfCover: 4,
            leadTimeDays: 3,
            safetyStock: 5,
            minimumStock: 10,
            recentWasteQuantity: 1,
            riskLevel: RiskLevel.low,
            shelfLifeCapQuantity: Number.POSITIVE_INFINITY,
            overstockRisk: false,
          },
        ],
      };

      jest
        .spyOn(replenishment, 'calculateHotelRecommendations')
        .mockResolvedValue(mockCalcResult as never);

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (fn) => fn(prisma));

      jest
        .spyOn(prisma.demandForecast, 'deleteMany')
        .mockResolvedValueOnce({ count: 0 } as never);
      jest
        .spyOn(prisma.replenishmentRecommendation, 'deleteMany')
        .mockResolvedValueOnce({ count: 0 } as never);
      jest
        .spyOn(prisma.demandForecast, 'createMany')
        .mockResolvedValueOnce({ count: 1 } as never);
      jest
        .spyOn(prisma.replenishmentRecommendation, 'createMany')
        .mockResolvedValueOnce({ count: 1 } as never);

      const result = await service.bulkRecalculate({
        hotelIds: ['hotel-1', 'hotel-2'],
        daysWindow: 30,
      });

      expect(result.hotelCount).toBe(2);
      expect(result.results['hotel-1'].status).toBe('success');
    });

    it('handles errors gracefully in bulk recalculation', async () => {
      jest
        .spyOn(replenishment, 'calculateHotelRecommendations')
        .mockRejectedValueOnce(new Error('No SKUs found'));

      const result = await service.bulkRecalculate({
        hotelIds: ['hotel-1'],
      });

      expect(result.results['hotel-1'].status).toBe('error');
      expect(result.results['hotel-1'].error).toContain('No SKUs found');
    });
  });

  describe('findAll', () => {
    it('returns all recommendations', async () => {
      const mockRecs = [
        {
          id: 'rec-1',
          sku_id: 'sku-1',
          recommendation_date: new Date(),
          current_stock: new Decimal('20'),
          reorder_point: new Decimal('15'),
          recommended_quantity: new Decimal('50'),
          eoq_value: new Decimal('45.5'),
          estimated_days_of_cover: new Decimal('4'),
          risk_level: RiskLevel.low,
          explanation: null,
          created_at: new Date(),
          sku: { supplier: null },
        },
      ];

      jest
        .spyOn(prisma.replenishmentRecommendation, 'findMany')
        .mockResolvedValueOnce(mockRecs as never);

      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(
        prisma.replenishmentRecommendation.findMany,
      ).toHaveBeenCalled();
    });

    it('filters recommendations by hotelId', async () => {
      jest
        .spyOn(prisma.replenishmentRecommendation, 'findMany')
        .mockResolvedValueOnce([] as never);

      await service.findAll({ hotelId: 'hotel-1' });

      expect(
        prisma.replenishmentRecommendation.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sku: {
              hotel_id: 'hotel-1',
            },
          }),
        }),
      );
    });
  });
});
