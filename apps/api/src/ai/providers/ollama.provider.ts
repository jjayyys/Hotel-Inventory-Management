import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiGenerationRequest, AiGenerationResponse } from '../ai.types';
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
      throw new Error(`${this.providerName} is not configured.`);
    }

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
      throw new Error(
        `${this.providerName} responded with status ${response.status}.`,
      );
    }

    const body = (await response.json()) as {
      message?: {
        content?: string;
      };
    };
    const text = body.message?.content?.trim();

    if (!text) {
      throw new Error(`${this.providerName} returned an empty explanation.`);
    }

    return {
      provider: this.providerName,
      text,
    };
  }
}
