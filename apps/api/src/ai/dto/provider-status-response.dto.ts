export class ProviderStatusResponseDto {
  provider!: string;
  model!: string | null;
  configured!: boolean;
  reachable!: boolean;
  modelAvailable!: boolean;
  healthy!: boolean;
  latencyMs!: number | null;
  checkedAt!: string;
  message!: string;
}
