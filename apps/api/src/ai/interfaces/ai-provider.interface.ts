import { AiGenerationRequest, AiGenerationResponse } from '../ai.types';

export interface AiProvider {
  readonly providerName: string;
  generate(request: AiGenerationRequest): Promise<AiGenerationResponse>;
}
