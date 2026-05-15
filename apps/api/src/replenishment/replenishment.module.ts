import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReplenishmentController } from './replenishment.controller';
import { ReplenishmentService } from './replenishment.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReplenishmentController],
  providers: [ReplenishmentService],
  exports: [ReplenishmentService],
})
export class ReplenishmentModule {}
