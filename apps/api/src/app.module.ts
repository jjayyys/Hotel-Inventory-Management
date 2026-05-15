import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HotelsModule } from './hotels/hotels.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SkusModule } from './skus/skus.module';
import { InventoryModule } from './inventory/inventory.module';
import { RecipesModule } from './recipes/recipes.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WasteModule } from './waste/waste.module';
import { ReplenishmentModule } from './replenishment/replenishment.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { DemandForecastsModule } from './demand-forecasts/demand-forecasts.module';
import { SimulationModule } from './simulation/simulation.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HotelsModule,
    SuppliersModule,
    SkusModule,
    InventoryModule,
    RecipesModule,
    TransactionsModule,
    WasteModule,
    ReplenishmentModule,
    RecommendationsModule,
    DemandForecastsModule,
    SimulationModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
