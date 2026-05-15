import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiGenerationResponse,
  AiProviderStatusSummary,
  RecommendationExplanationContext,
} from './ai.types';
import { buildRecommendationExplanationPrompt } from './prompts/recommendation-explainer.prompt';
import { AiProviderOrchestratorService } from './providers/ai-provider-orchestrator.service';

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly orchestrator: AiProviderOrchestratorService,
  ) {}

  async generateRecommendationExplanation(
    context: RecommendationExplanationContext,
  ): Promise<AiGenerationResponse & { fallback: boolean }> {
    const fallbackText = this.buildRuleBasedFallback(context);

    if (!this.configService.get<boolean>('AI_ENABLED', true)) {
      return {
        provider: 'rule-based-fallback',
        text: fallbackText,
        fallback: true,
      };
    }

    const { systemPrompt, userPrompt } =
      buildRecommendationExplanationPrompt(context);
    const timeoutMs = Number(
      this.configService.get<string>('AI_TIMEOUT_MS', '15000'),
    );

    try {
      const response = await this.orchestrator.generateWithFallback({
        systemPrompt,
        userPrompt,
        timeoutMs,
      });

      return {
        ...response,
        fallback: false,
      };
    } catch {
      return {
        provider: 'rule-based-fallback',
        text: fallbackText,
        fallback: true,
      };
    }
  }

  getProviderStatusSummary(): Promise<AiProviderStatusSummary> {
    return this.orchestrator.getProviderStatusSummary();
  }

  private buildRuleBasedFallback(context: RecommendationExplanationContext) {
    const reorderSignal =
      context.currentStock < context.reorderPoint
        ? `Current stock is below the reorder point, so the system recommends ordering ${context.recommendedQuantity} ${context.unit}.`
        : 'Current stock is above the reorder point, so no immediate reorder is recommended.';
    const wasteSignal =
      context.recentWasteQuantity > 0
        ? `Recent waste of ${context.recentWasteQuantity} ${context.unit} suggests added shelf-life pressure.`
        : 'Recent waste is low, so waste pressure is limited in the latest cycle.';
    const coverSignal =
      context.estimatedDaysOfCover <= context.leadTimeDays
        ? `Estimated cover is only ${context.estimatedDaysOfCover} days against a ${context.leadTimeDays}-day lead time.`
        : `Estimated cover is ${context.estimatedDaysOfCover} days with a ${context.leadTimeDays}-day lead time.`;

    return `${reorderSignal} ${coverSignal} Safety stock is set at ${context.safetyStock} ${context.unit} and EOQ is ${context.eoqValue} ${context.unit}. ${wasteSignal}`;
  }
}
