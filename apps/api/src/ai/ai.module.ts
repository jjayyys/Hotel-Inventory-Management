import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { AiProviderOrchestratorService } from './providers/ai-provider-orchestrator.service';
import { OllamaProvider } from './providers/ollama.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    AnthropicProvider,
    {
      provide: 'AI_PROVIDER_ANTHROPIC',
      inject: [AnthropicProvider],
      useFactory: (provider: AnthropicProvider) => provider,
    },
    {
      provide: 'AI_PROVIDER_OLLAMA_QWEN',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new OllamaProvider(configService, 'ollama-qwen'),
    },
    {
      provide: 'AI_PROVIDER_OLLAMA_LLAMA',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new OllamaProvider(configService, 'ollama-llama'),
    },
    {
      provide: AiProviderOrchestratorService,
      inject: [
        ConfigService,
        'AI_PROVIDER_ANTHROPIC',
        'AI_PROVIDER_OLLAMA_QWEN',
        'AI_PROVIDER_OLLAMA_LLAMA',
      ],
      useFactory: (
        configService: ConfigService,
        anthropicProvider: AnthropicProvider,
        ollamaQwenProvider: OllamaProvider,
        ollamaLlamaProvider: OllamaProvider,
      ) =>
        new AiProviderOrchestratorService(
          configService,
          anthropicProvider,
          ollamaQwenProvider,
          ollamaLlamaProvider,
        ),
    },
  ],
  exports: [AiService],
})
export class AiModule {}
