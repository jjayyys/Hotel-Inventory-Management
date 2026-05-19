import { IsString, IsOptional } from 'class-validator';

export class QuerySimulationScenariosDto {
  @IsString()
  @IsOptional()
  hotelId?: string;
}
