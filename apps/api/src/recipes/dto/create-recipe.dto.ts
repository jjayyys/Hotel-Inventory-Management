import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateRecipeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  skuId!: string;

  @ApiProperty({ minimum: 0.001, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantityPerServing!: number;

  @ApiProperty({ maxLength: 30 })
  @IsString()
  @MaxLength(30)
  unit!: string;
}
