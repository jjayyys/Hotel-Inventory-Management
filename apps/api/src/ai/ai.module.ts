import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { AiProviderOrchestratorService } from './providers/ai-provider-orchestrator.service';
import { OllamaProvider } from './providers/ollama.provider';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    GeminiProvider,
    {
      provide: 'AI_PROVIDER_GEMINI',
      inject: [GeminiProvider],
      useFactory: (provider: GeminiProvider) => provider,
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
        'AI_PROVIDER_GEMINI',
        'AI_PROVIDER_OLLAMA_QWEN',
        'AI_PROVIDER_OLLAMA_LLAMA',
      ],
      useFactory: (
        configService: ConfigService,
        geminiProvider: GeminiProvider,
        ollamaQwenProvider: OllamaProvider,
        ollamaLlamaProvider: OllamaProvider,
      ) =>
        new AiProviderOrchestratorService(
          configService,
          geminiProvider,
          ollamaQwenProvider,
          ollamaLlamaProvider,
        ),
    },
  ],
  exports: [AiService],
})
export class AiModule {}
