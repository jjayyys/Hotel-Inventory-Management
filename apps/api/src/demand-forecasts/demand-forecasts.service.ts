import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryDemandForecastsDto } from './dto/query-demand-forecasts.dto';

@Injectable()
export class DemandForecastsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryDemandForecastsDto) {
    return this.prisma.demandForecast.findMany({
      where: {
        ...(query.skuId ? { sku_id: query.skuId } : {}),
        ...(query.forecastPeriodStart
          ? { forecast_period_start: new Date(query.forecastPeriodStart) }
          : {}),
        ...(query.forecastPeriodEnd
          ? { forecast_period_end: new Date(query.forecastPeriodEnd) }
          : {}),
        ...(query.hotelId
          ? {
              sku: {
                hotel_id: query.hotelId,
              },
            }
          : {}),
      },
      include: {
        sku: {
          select: {
            id: true,
            hotel_id: true,
            sku_code: true,
            name: true,
            unit: true,
            category: true,
          },
        },
      },
      orderBy: [
        { forecast_period_start: 'desc' },
        { sku_id: 'asc' },
        { created_at: 'desc' },
      ],
    });
  }
}
