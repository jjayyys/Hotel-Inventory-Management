import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSkuDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  hotelId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  supplierId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  skuCode!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ maxLength: 30 })
  @IsString()
  @MaxLength(30)
  unit!: string;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  holdingCostPerUnit!: number;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  orderCost!: number;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shelfLifeDays!: number;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  safetyStock!: number;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minimumStock!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
