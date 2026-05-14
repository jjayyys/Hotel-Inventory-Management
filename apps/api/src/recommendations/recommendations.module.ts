import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ReplenishmentModule } from '../replenishment/replenishment.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [AiModule, ReplenishmentModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
