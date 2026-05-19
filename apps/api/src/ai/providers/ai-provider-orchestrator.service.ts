import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiGenerationRequest,
  AiGenerationResponse,
  AiProviderError,
  AiProviderStatus,
  AiProviderStatusSummary,
} from '../ai.types';
import type { AiProvider } from '../interfaces/ai-provider.interface';
import { sleep } from '../utils/sleep.util';

@Injectable()
export class AiProviderOrchestratorService {
  private readonly logger = new Logger(AiProviderOrchestratorService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('AI_PROVIDER_GEMINI')
    private readonly geminiProvider: AiProvider,
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
      [this.geminiProvider.providerName, this.geminiProvider],
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
        return await this.generateWithRetry(provider, request);
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

  async getProviderStatusSummary(): Promise<AiProviderStatusSummary> {
    const timeoutMs = this.getHealthTimeoutMs();
    const providerOrder = this.getProviderOrder();
    const providerMap = new Map<string, AiProvider>([
      [this.geminiProvider.providerName, this.geminiProvider],
      [this.ollamaQwenProvider.providerName, this.ollamaQwenProvider],
      [this.ollamaLlamaProvider.providerName, this.ollamaLlamaProvider],
    ]);
    const statuses: AiProviderStatus[] = [];

    for (const providerName of providerOrder) {
      const provider = providerMap.get(providerName);

      if (!provider) {
        statuses.push({
          provider: providerName,
          model: null,
          configured: false,
          reachable: false,
          modelAvailable: false,
          healthy: false,
          latencyMs: null,
          checkedAt: new Date().toISOString(),
          message: `Provider ${providerName} is not registered.`,
        });
        continue;
      }

      statuses.push(await provider.getStatus(timeoutMs));
    }

    return {
      providerOrder,
      fallbackEnabled: this.isFallbackEnabled(),
      timeoutMs,
      retryAttempts: this.getRetryAttempts(),
      providers: statuses,
      allHealthy: statuses.every((status) => status.healthy),
      anyHealthy: statuses.some((status) => status.healthy),
    };
  }

  private getProviderOrder() {
    return (
      this.configService
        .get<string>('AI_PROVIDER_ORDER', 'gemini,ollama-qwen,ollama-llama')
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean) ?? ['gemini', 'ollama-qwen', 'ollama-llama']
    );
  }

  private async generateWithRetry(
    provider: AiProvider,
    request: AiGenerationRequest,
  ) {
    const attempts = this.getRetryAttempts();
    const delayMs = this.getRetryDelayMs();
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await provider.generate(request);
      } catch (error) {
        const providerError = this.normalizeProviderError(
          provider.providerName,
          error,
        );
        lastError = providerError;

        if (!providerError.retryable || attempt === attempts) {
          throw providerError;
        }

        this.logger.warn(
          `Retrying AI provider ${provider.providerName} after attempt ${attempt} failed: ${providerError.message}`,
        );
        await sleep(delayMs);
      }
    }

    throw this.normalizeProviderError(provider.providerName, lastError);
  }

  private normalizeProviderError(providerName: string, error: unknown) {
    if (error instanceof AiProviderError) {
      return error;
    }

    const message =
      error instanceof Error ? error.message : 'Unknown provider failure.';
    const retryable = /timed out|timeout|temporar|network|fetch/i.test(message);

    return new AiProviderError(providerName, message, retryable);
  }

  private isFallbackEnabled() {
    return this.configService.get<boolean>('AI_ALLOW_FALLBACK', true);
  }

  private getRetryAttempts() {
    const rawValue = Number(
      this.configService.get<string>('AI_RETRY_ATTEMPTS', '2'),
    );

    return Number.isFinite(rawValue) && rawValue > 0 ? Math.floor(rawValue) : 1;
  }

  private getRetryDelayMs() {
    const rawValue = Number(
      this.configService.get<string>('AI_RETRY_DELAY_MS', '250'),
    );

    return Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : 0;
  }

  private getHealthTimeoutMs() {
    const rawValue = Number(
      this.configService.get<string>('AI_HEALTH_TIMEOUT_MS', '5000'),
    );

    return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 5000;
  }
}
