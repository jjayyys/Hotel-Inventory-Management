import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  hotelId!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  defaultLeadTimeDays!: number;
}
