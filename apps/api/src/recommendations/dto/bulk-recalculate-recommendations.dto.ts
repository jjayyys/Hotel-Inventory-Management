import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class BulkRecalculateRecommendationsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Array of hotel IDs to recalculate recommendations for',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  hotelIds!: string[];

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
