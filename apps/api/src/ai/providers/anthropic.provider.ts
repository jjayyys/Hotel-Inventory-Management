import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiGenerationRequest, AiGenerationResponse } from '../ai.types';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { withTimeout } from '../utils/timeout.util';

@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly providerName = 'anthropic';

  constructor(private readonly configService: ConfigService) {}

  async generate(request: AiGenerationRequest): Promise<AiGenerationResponse> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    const model = this.configService.get<string>('ANTHROPIC_MODEL');

    if (!apiKey || !model || apiKey.startsWith('replace-with-')) {
      throw new Error('Anthropic provider is not configured.');
    }

    const client = new Anthropic({ apiKey });
    const response = await withTimeout(
      client.messages.create({
        model,
        max_tokens: 240,
        system: request.systemPrompt,
        messages: [{ role: 'user', content: request.userPrompt }],
      }),
      request.timeoutMs,
      'Anthropic request timed out.',
    );
    const text = response.content
      .filter((item) => item.type === 'text')
      .map((item) => item.text.trim())
      .join(' ')
      .trim();

    if (!text) {
      throw new Error('Anthropic returned an empty explanation.');
    }

    return {
      provider: this.providerName,
      text,
    };
  }
}
