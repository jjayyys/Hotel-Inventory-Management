import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ScenarioType } from '@prisma/client';

export class CreateSimulationScenarioDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  scenarioType: ScenarioType;

  @IsObject()
  @IsNotEmpty()
  parameters: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsNumber()
  @IsOptional()
  daysWindow?: number;
}
