import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WasteReason } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWasteLogDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  skuId!: string;

  @ApiProperty({ minimum: 0.001, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;

  @ApiProperty({ maxLength: 30 })
  @IsString()
  @MaxLength(30)
  unit!: string;

  @ApiProperty({ enum: WasteReason })
  @IsEnum(WasteReason)
  wasteReason!: WasteReason;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedCost!: number;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  wasteDate!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
