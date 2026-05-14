import { Module } from '@nestjs/common';
import { ReplenishmentService } from './replenishment.service';

@Module({
  providers: [ReplenishmentService],
  exports: [ReplenishmentService],
})
export class ReplenishmentModule {}
