import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateInventoryBatchDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  skuId!: string;

  @ApiProperty({ minimum: 0.001, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  receivedQuantity!: number;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  remainingQuantity!: number;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  receivedDate!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  expiryDate!: string;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;
}
