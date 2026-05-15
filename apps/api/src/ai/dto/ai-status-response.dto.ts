import { ProviderStatusResponseDto } from './provider-status-response.dto';

export class AiStatusResponseDto {
  providerOrder!: string[];
  fallbackEnabled!: boolean;
  timeoutMs!: number;
  retryAttempts!: number;
  allHealthy!: boolean;
  anyHealthy!: boolean;
  providers!: ProviderStatusResponseDto[];
}
