import {
  AiGenerationRequest,
  AiGenerationResponse,
  AiProviderStatus,
} from '../ai.types';

export interface AiProvider {
  readonly providerName: string;
  generate(request: AiGenerationRequest): Promise<AiGenerationResponse>;
  getStatus(timeoutMs: number): Promise<AiProviderStatus>;
}
