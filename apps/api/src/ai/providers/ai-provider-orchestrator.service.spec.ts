import { ConfigService } from '@nestjs/config';
import {
  AiGenerationRequest,
  AiProviderError,
  AiProviderStatus,
} from '../ai.types';
import type { AiProvider } from '../interfaces/ai-provider.interface';
import { AiProviderOrchestratorService } from './ai-provider-orchestrator.service';

function createStatus(provider: string): AiProviderStatus {
  return {
    provider,
    model: provider,
    configured: true,
    reachable: true,
    modelAvailable: true,
    healthy: true,
    latencyMs: 5,
    checkedAt: '2026-05-15T00:00:00.000Z',
    message: 'ok',
  };
}

function createProvider(
  providerName: string,
  options?: {
    generate?: jest.Mock;
    getStatus?: jest.Mock;
  },
): AiProvider {
  return {
    providerName,
    generate: options?.generate ?? jest.fn(),
    getStatus:
      options?.getStatus ?? jest.fn().mockResolvedValue(createStatus(providerName)),
  };
}

describe('AiProviderOrchestratorService', () => {
  const request: AiGenerationRequest = {
    systemPrompt: 'system',
    userPrompt: 'user',
    timeoutMs: 1000,
  };

  function createConfigService(overrides?: Record<string, unknown>) {
    return {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          AI_PROVIDER_ORDER: 'gemini,ollama-qwen,ollama-llama',
          AI_ALLOW_FALLBACK: true,
          AI_RETRY_ATTEMPTS: '2',
          AI_RETRY_DELAY_MS: '0',
          AI_HEALTH_TIMEOUT_MS: '5000',
          ...overrides,
        };

        return key in values ? values[key] : defaultValue;
      }),
    } as unknown as ConfigService;
  }

  it('uses the first successful provider in order', async () => {
    const gemini = createProvider('gemini', {
      generate: jest.fn().mockResolvedValue({
        provider: 'gemini',
        text: 'from gemini',
      }),
    });
    const qwen = createProvider('ollama-qwen');
    const llama = createProvider('ollama-llama');
    const service = new AiProviderOrchestratorService(
      createConfigService(),
      gemini,
      qwen,
      llama,
    );

    await expect(service.generateWithFallback(request)).resolves.toEqual({
      provider: 'gemini',
      text: 'from gemini',
    });
    expect(gemini.generate).toHaveBeenCalledTimes(1);
    expect(qwen.generate).not.toHaveBeenCalled();
  });

  it('falls back to the next provider when the first one fails', async () => {
    const gemini = createProvider('gemini', {
      generate: jest
        .fn()
        .mockRejectedValue(
          new AiProviderError('gemini', 'Gemini unavailable.', false),
        ),
    });
    const qwen = createProvider('ollama-qwen', {
      generate: jest.fn().mockResolvedValue({
        provider: 'ollama-qwen',
        text: 'from qwen',
      }),
    });
    const llama = createProvider('ollama-llama');
    const service = new AiProviderOrchestratorService(
      createConfigService(),
      gemini,
      qwen,
      llama,
    );

    await expect(service.generateWithFallback(request)).resolves.toEqual({
      provider: 'ollama-qwen',
      text: 'from qwen',
    });
    expect(gemini.generate).toHaveBeenCalledTimes(1);
    expect(qwen.generate).toHaveBeenCalledTimes(1);
  });

  it('does not continue to fallback providers when fallback is disabled', async () => {
    const gemini = createProvider('gemini', {
      generate: jest
        .fn()
        .mockRejectedValue(
          new AiProviderError('gemini', 'Gemini unavailable.', false),
        ),
    });
    const qwen = createProvider('ollama-qwen');
    const llama = createProvider('ollama-llama');
    const service = new AiProviderOrchestratorService(
      createConfigService({ AI_ALLOW_FALLBACK: false }),
      gemini,
      qwen,
      llama,
    );

    await expect(service.generateWithFallback(request)).rejects.toThrow(
      'All AI providers failed.',
    );
    expect(qwen.generate).not.toHaveBeenCalled();
    expect(llama.generate).not.toHaveBeenCalled();
  });

  it('retries transient provider failures before succeeding', async () => {
    const gemini = createProvider('gemini', {
      generate: jest
        .fn()
        .mockRejectedValueOnce(
          new AiProviderError('gemini', 'Gemini request timed out.', true),
        )
        .mockResolvedValueOnce({
          provider: 'gemini',
          text: 'recovered',
        }),
    });
    const qwen = createProvider('ollama-qwen');
    const llama = createProvider('ollama-llama');
    const service = new AiProviderOrchestratorService(
      createConfigService({ AI_RETRY_ATTEMPTS: '2', AI_RETRY_DELAY_MS: '0' }),
      gemini,
      qwen,
      llama,
    );

    await expect(service.generateWithFallback(request)).resolves.toEqual({
      provider: 'gemini',
      text: 'recovered',
    });
    expect(gemini.generate).toHaveBeenCalledTimes(2);
    expect(qwen.generate).not.toHaveBeenCalled();
  });

  it('returns provider status summary in configured order', async () => {
    const gemini = createProvider('gemini');
    const qwen = createProvider('ollama-qwen', {
      getStatus: jest.fn().mockResolvedValue({
        ...createStatus('ollama-qwen'),
        healthy: false,
        modelAvailable: false,
        message: 'model missing',
      }),
    });
    const llama = createProvider('ollama-llama');
    const service = new AiProviderOrchestratorService(
      createConfigService(),
      gemini,
      qwen,
      llama,
    );

    const result = await service.getProviderStatusSummary();

    expect(result.providerOrder).toEqual([
      'gemini',
      'ollama-qwen',
      'ollama-llama',
    ]);
    expect(result.retryAttempts).toBe(2);
    expect(result.anyHealthy).toBe(true);
    expect(result.allHealthy).toBe(false);
    expect(result.providers[1].message).toBe('model missing');
  });
});
