import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  AiGenerationRequest,
  AiGenerationResponse,
  AiProviderError,
  AiProviderStatus,
} from '../ai.types';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { withTimeout } from '../utils/timeout.util';

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly providerName = 'gemini';

  constructor(private readonly configService: ConfigService) {}

  async generate(request: AiGenerationRequest): Promise<AiGenerationResponse> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const model = this.configService.get<string>('GEMINI_MODEL');

    if (!apiKey || !model || apiKey.startsWith('replace-with-')) {
      throw new AiProviderError(
        this.providerName,
        'Gemini provider is not configured.',
        false,
      );
    }

    try {
      const client = this.createClient(apiKey);
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents: request.userPrompt,
          config: {
            systemInstruction: request.systemPrompt,
            maxOutputTokens: 240,
          },
        }),
        request.timeoutMs,
        'Gemini request timed out.',
      );
      const text = response.text?.trim();

      if (!text) {
        throw new AiProviderError(
          this.providerName,
          'Gemini returned an empty explanation.',
          false,
        );
      }

      return {
        provider: this.providerName,
        text,
      };
    } catch (error) {
      throw this.toProviderError(error, 'Gemini request failed.');
    }
  }

  async getStatus(timeoutMs: number): Promise<AiProviderStatus> {
    const checkedAt = new Date().toISOString();
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const model = this.configService.get<string>('GEMINI_MODEL') ?? null;

    if (!apiKey || !model || apiKey.startsWith('replace-with-')) {
      return {
        provider: this.providerName,
        model,
        configured: false,
        reachable: false,
        modelAvailable: false,
        healthy: false,
        latencyMs: null,
        checkedAt,
        message: 'Gemini provider is not configured.',
      };
    }

    const startedAt = Date.now();

    try {
      const client = this.createClient(apiKey);
      await withTimeout(
        client.models.get({ model }),
        timeoutMs,
        'Gemini health check timed out.',
      );

      return {
        provider: this.providerName,
        model,
        configured: true,
        reachable: true,
        modelAvailable: true,
        healthy: true,
        latencyMs: Date.now() - startedAt,
        checkedAt,
        message: 'Gemini model is reachable and available.',
      };
    } catch (error) {
      const providerError = this.toProviderError(
        error,
        'Gemini health check failed.',
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

  private createClient(apiKey: string) {
    return new GoogleGenAI({ apiKey });
  }

  private toProviderError(error: unknown, fallbackMessage: string) {
    if (error instanceof AiProviderError) {
      return error;
    }

    const statusCode = this.extractStatusCode(error);
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : fallbackMessage;

    return new AiProviderError(
      this.providerName,
      message,
      this.isRetryable(statusCode, message),
      statusCode,
    );
  }

  private extractStatusCode(error: unknown) {
    const candidate =
      typeof error === 'object' && error !== null
        ? ((error as Record<string, unknown>).status ??
          (error as Record<string, unknown>).code)
        : undefined;

    return typeof candidate === 'number' ? candidate : undefined;
  }

  private isRetryable(statusCode: number | undefined, message: string) {
    if (statusCode && [408, 429, 500, 502, 503, 504].includes(statusCode)) {
      return true;
    }

    return /timed out|timeout|temporar|overloaded|network|fetch/i.test(message);
  }
}
