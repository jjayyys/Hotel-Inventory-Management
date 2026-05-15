import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { ReplenishmentService } from './replenishment.service';

describe('ReplenishmentService', () => {
  let service: ReplenishmentService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplenishmentService,
        {
          provide: PrismaService,
          useValue: {
            sku: {
              findMany: jest.fn(),
            },
            recipe: {
              findMany: jest.fn(),
            },
            posTransaction: {
              findMany: jest.fn(),
            },
            wasteLog: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReplenishmentService>(ReplenishmentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws BadRequestException when daysWindow is less than 1', async () => {
    await expect(
      service.calculateHotelRecommendations('hotel-123', 0),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when no active SKUs found', async () => {
    jest.spyOn(prisma.sku, 'findMany').mockResolvedValueOnce([]);

    await expect(
      service.calculateHotelRecommendations('hotel-123', 30),
    ).rejects.toThrow(BadRequestException);
  });

  it('calculates replenishment for single hotel with no transactions', async () => {
    const mockSku = {
      id: 'sku-1',
      hotel_id: 'hotel-1',
      sku_code: 'TEST-001',
      name: 'Test Item',
      unit: 'kg',
      category: 'Vegetables',
      is_active: true,
      supplier_id: 'supplier-1',
      safety_stock: new Decimal('5'),
      minimum_stock: new Decimal('10'),
      order_cost: new Decimal('50'),
      holding_cost_per_unit: new Decimal('2'),
      shelf_life_days: 14,
      supplier: {
        id: 'supplier-1',
        default_lead_time_days: 3,
      },
      supplier_lead_times: [],
      inventory_batches: [
        {
          remaining_quantity: new Decimal('20'),
        },
      ],
    };

    jest.spyOn(prisma.sku, 'findMany').mockResolvedValueOnce([mockSku]);
    jest.spyOn(prisma.recipe, 'findMany').mockResolvedValueOnce([]);
    jest.spyOn(prisma.posTransaction, 'findMany').mockResolvedValueOnce([]);
    jest.spyOn(prisma.wasteLog, 'findMany').mockResolvedValueOnce([]);

    const result = await service.calculateHotelRecommendations('hotel-1', 30);

    expect(result.results).toHaveLength(1);
    expect(result.results[0].skuId).toBe('sku-1');
    expect(result.results[0].currentStock).toBe(20);
    expect(result.results[0].averageDailyDemand).toBe(0);
  });

  it('produces consistent results across multiple calls', async () => {
    const mockSku = {
      id: 'sku-1',
      hotel_id: 'hotel-1',
      sku_code: 'TEST-001',
      name: 'Test Item',
      unit: 'kg',
      category: 'Vegetables',
      is_active: true,
      supplier_id: 'supplier-1',
      safety_stock: new Decimal('5'),
      minimum_stock: new Decimal('10'),
      order_cost: new Decimal('50'),
      holding_cost_per_unit: new Decimal('2'),
      shelf_life_days: 14,
      supplier: {
        id: 'supplier-1',
        default_lead_time_days: 3,
      },
      supplier_lead_times: [],
      inventory_batches: [
        {
          remaining_quantity: new Decimal('20'),
        },
      ],
    };

    jest
      .spyOn(prisma.sku, 'findMany')
      .mockResolvedValue([mockSku] as never);
    jest.spyOn(prisma.recipe, 'findMany').mockResolvedValue([] as never);
    jest
      .spyOn(prisma.posTransaction, 'findMany')
      .mockResolvedValue([] as never);
    jest.spyOn(prisma.wasteLog, 'findMany').mockResolvedValue([] as never);

    const result1 = await service.calculateHotelRecommendations('hotel-1', 30);
    const result2 = await service.calculateHotelRecommendations('hotel-1', 30);

    expect(result1.results).toEqual(result2.results);
  });
});
