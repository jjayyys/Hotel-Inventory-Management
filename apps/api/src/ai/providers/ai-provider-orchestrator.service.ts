import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiGenerationRequest, AiGenerationResponse } from '../ai.types';
import type { AiProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class AiProviderOrchestratorService {
  private readonly logger = new Logger(AiProviderOrchestratorService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('AI_PROVIDER_ANTHROPIC')
    private readonly anthropicProvider: AiProvider,
    @Inject('AI_PROVIDER_OLLAMA_QWEN')
    private readonly ollamaQwenProvider: AiProvider,
    @Inject('AI_PROVIDER_OLLAMA_LLAMA')
    private readonly ollamaLlamaProvider: AiProvider,
  ) {}

  async generateWithFallback(
    request: AiGenerationRequest,
  ): Promise<AiGenerationResponse> {
    const providerOrder = this.getProviderOrder();
    const providerMap = new Map<string, AiProvider>([
      [this.anthropicProvider.providerName, this.anthropicProvider],
      [this.ollamaQwenProvider.providerName, this.ollamaQwenProvider],
      [this.ollamaLlamaProvider.providerName, this.ollamaLlamaProvider],
    ]);
    const errors: string[] = [];

    for (const providerName of providerOrder) {
      const provider = providerMap.get(providerName);

      if (!provider) {
        errors.push(`Provider ${providerName} is not registered.`);
        continue;
      }

      try {
        return await provider.generate(request);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown provider failure.';
        errors.push(`${providerName}: ${message}`);
        this.logger.warn(`AI provider ${providerName} failed: ${message}`);
      }

      if (!this.configService.get<boolean>('AI_ALLOW_FALLBACK')) {
        break;
      }
    }

    throw new Error(
      `All AI providers failed. ${errors.length > 0 ? errors.join(' | ') : ''}`.trim(),
    );
  }

  private getProviderOrder() {
    return (
      this.configService
        .get<string>('AI_PROVIDER_ORDER', 'anthropic,ollama-qwen,ollama-llama')
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean) ?? ['anthropic', 'ollama-qwen', 'ollama-llama']
    );
  }
}
