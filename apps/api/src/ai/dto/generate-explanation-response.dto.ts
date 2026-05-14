export class GenerateExplanationResponseDto {
  recommendationId!: string;
  provider!: string;
  explanation!: string;
  cached!: boolean;
  fallback!: boolean;
}
