import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiGenerationRequest,
  AiGenerationResponse,
  AiProviderError,
  AiProviderStatus,
} from '../ai.types';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { withTimeout } from '../utils/timeout.util';

type OllamaProviderVariant = 'ollama-qwen' | 'ollama-llama';

@Injectable()
export class OllamaProvider implements AiProvider {
  constructor(
    private readonly configService: ConfigService,
    readonly providerName: OllamaProviderVariant,
  ) {}

  async generate(request: AiGenerationRequest): Promise<AiGenerationResponse> {
    const baseUrl = this.configService.get<string>('OLLAMA_BASE_URL');
    const model =
      this.providerName === 'ollama-qwen'
        ? this.configService.get<string>('OLLAMA_QWEN_MODEL')
        : this.configService.get<string>('OLLAMA_LLAMA_MODEL');

    if (!baseUrl || !model) {
      throw new AiProviderError(
        this.providerName,
        `${this.providerName} is not configured.`,
        false,
      );
    }

    try {
      const response = await withTimeout(
        fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              { role: 'system', content: request.systemPrompt },
              { role: 'user', content: request.userPrompt },
            ],
          }),
        }),
        request.timeoutMs,
        `${this.providerName} request timed out.`,
      );

      if (!response.ok) {
        throw new AiProviderError(
          this.providerName,
          `${this.providerName} responded with status ${response.status}.`,
          [408, 429, 500, 502, 503, 504].includes(response.status),
          response.status,
        );
      }

      const body = (await response.json()) as {
        message?: {
          content?: string;
        };
      };
      const text = body.message?.content?.trim();

      if (!text) {
        throw new AiProviderError(
          this.providerName,
          `${this.providerName} returned an empty explanation.`,
          false,
        );
      }

      return {
        provider: this.providerName,
        text,
      };
    } catch (error) {
      throw this.toProviderError(error, `${this.providerName} request failed.`);
    }
  }

  async getStatus(timeoutMs: number): Promise<AiProviderStatus> {
    const checkedAt = new Date().toISOString();
    const baseUrl = this.configService.get<string>('OLLAMA_BASE_URL');
    const model = this.getConfiguredModel() ?? null;

    if (!baseUrl || !model) {
      return {
        provider: this.providerName,
        model,
        configured: false,
        reachable: false,
        modelAvailable: false,
        healthy: false,
        latencyMs: null,
        checkedAt,
        message: `${this.providerName} is not configured.`,
      };
    }

    const startedAt = Date.now();

    try {
      const response = await withTimeout(
        fetch(`${baseUrl}/api/tags`),
        timeoutMs,
        `${this.providerName} health check timed out.`,
      );

      if (!response.ok) {
        return {
          provider: this.providerName,
          model,
          configured: true,
          reachable: false,
          modelAvailable: false,
          healthy: false,
          latencyMs: Date.now() - startedAt,
          checkedAt,
          message: `${this.providerName} health check returned status ${response.status}.`,
        };
      }

      const body = (await response.json()) as {
        models?: Array<{
          name?: string;
        }>;
      };
      const availableModels =
        body.models?.map((item) => item.name?.trim()).filter(Boolean) ?? [];
      const modelAvailable = availableModels.includes(model);

      return {
        provider: this.providerName,
        model,
        configured: true,
        reachable: true,
        modelAvailable,
        healthy: modelAvailable,
        latencyMs: Date.now() - startedAt,
        checkedAt,
        message: modelAvailable
          ? `${model} is available in Ollama.`
          : `${model} is not available in Ollama. Pulled models: ${availableModels.join(', ') || 'none'}.`,
      };
    } catch (error) {
      const providerError = this.toProviderError(
        error,
        `${this.providerName} health check failed.`,
      );

      return {
        provider: this.providerName,
        model,
        configured: true,
        reachable: false,
        modelAvailable: false,
        healthy: false,
        latencyMs: Date.now() - startedAt,
        checkedAt,
        message: providerError.message,
      };
    }
  }

  private getConfiguredModel() {
    return this.providerName === 'ollama-qwen'
      ? this.configService.get<string>('OLLAMA_QWEN_MODEL')
      : this.configService.get<string>('OLLAMA_LLAMA_MODEL');
  }

  private toProviderError(error: unknown, fallbackMessage: string) {
    if (error instanceof AiProviderError) {
      return error;
    }

    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : fallbackMessage;

    return new AiProviderError(
      this.providerName,
      message,
      /timed out|timeout|temporar|network|fetch/i.test(message),
    );
  }
}
