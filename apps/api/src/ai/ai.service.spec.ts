import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiProviderOrchestratorService } from './providers/ai-provider-orchestrator.service';

describe('AiService', () => {
  let aiService: AiService;
  const orchestrator = {
    generateWithFallback: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'AI_ENABLED') {
        return true;
      }

      if (key === 'AI_TIMEOUT_MS') {
        return '15000';
      }

      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: AiProviderOrchestratorService,
          useValue: orchestrator,
        },
      ],
    }).compile();

    aiService = module.get<AiService>(AiService);
  });

  it('uses provider output when generation succeeds', async () => {
    orchestrator.generateWithFallback.mockResolvedValue({
      provider: 'gemini',
      text: 'Stock is below the reorder point and lead time pressure is rising.',
    });

    const result = await aiService.generateRecommendationExplanation({
      recommendationId: 'rec-1',
      recommendationDate: '2026-05-14',
      skuCode: 'RIC-JAS',
      skuName: 'Jasmine Rice',
      category: 'pantry',
      unit: 'kg',
      supplierName: 'Pantry Supply',
      currentStock: 12,
      reorderPoint: 22,
      recommendedQuantity: 40,
      eoqValue: 52,
      estimatedDaysOfCover: 2.4,
      riskLevel: 'high',
      safetyStock: 8,
      minimumStock: 10,
      shelfLifeDays: 365,
      leadTimeDays: 4,
      recentWasteQuantity: 0,
    });

    expect(result).toEqual({
      provider: 'gemini',
      text: 'Stock is below the reorder point and lead time pressure is rising.',
      fallback: false,
    });
  });

  it('falls back to a rule-based explanation when providers fail', async () => {
    orchestrator.generateWithFallback.mockRejectedValue(
      new Error('All AI providers failed.'),
    );

    const result = await aiService.generateRecommendationExplanation({
      recommendationId: 'rec-2',
      recommendationDate: '2026-05-14',
      skuCode: 'LET-ROM',
      skuName: 'Romaine Lettuce',
      category: 'vegetable',
      unit: 'kg',
      supplierName: 'Green Valley Produce',
      currentStock: 4,
      reorderPoint: 9,
      recommendedQuantity: 3,
      eoqValue: 12,
      estimatedDaysOfCover: 1.5,
      riskLevel: 'critical',
      safetyStock: 6,
      minimumStock: 8,
      shelfLifeDays: 3,
      leadTimeDays: 2,
      recentWasteQuantity: 1.4,
    });

    expect(result.provider).toBe('rule-based-fallback');
    expect(result.fallback).toBe(true);
    expect(result.text).toContain('Current stock is below the reorder point');
  });
});
