import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DemandForecastsController } from './demand-forecasts.controller';
import { DemandForecastsService } from './demand-forecasts.service';

@Module({
  imports: [PrismaModule],
  controllers: [DemandForecastsController],
  providers: [DemandForecastsService],
  exports: [DemandForecastsService],
})
export class DemandForecastsModule {}
