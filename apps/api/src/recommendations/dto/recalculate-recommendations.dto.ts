import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RecalculateRecommendationsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  hotelId!: string;

  @ApiPropertyOptional({
    default: 30,
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  daysWindow?: number;
}
