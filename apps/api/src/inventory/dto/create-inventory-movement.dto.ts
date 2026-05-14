import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferenceType, MovementType } from '@prisma/client';
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

export class CreateInventoryMovementDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  skuId!: string;

  @ApiProperty({ enum: MovementType })
  @IsEnum(MovementType)
  movementType!: MovementType;

  @ApiProperty({ minimum: 0.001, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;

  @ApiProperty({ enum: ReferenceType })
  @IsEnum(ReferenceType)
  referenceType!: ReferenceType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  movementDate!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
