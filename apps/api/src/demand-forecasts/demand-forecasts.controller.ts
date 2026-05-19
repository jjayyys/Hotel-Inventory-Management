import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DemandForecastsService } from './demand-forecasts.service';
import { QueryDemandForecastsDto } from './dto/query-demand-forecasts.dto';

const READ_ROLES = [
  UserRole.admin,
  UserRole.inventory_manager,
  UserRole.purchasing_staff,
  UserRole.kitchen_manager,
  UserRole.analyst,
];

@ApiTags('Demand Forecasts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('demand-forecasts')
export class DemandForecastsController {
  constructor(
    private readonly demandForecastsService: DemandForecastsService,
  ) {}

  @ApiOperation({
    summary:
      'List demand forecasts with optional filtering by SKU, hotel, or period',
  })
  @Roles(...READ_ROLES)
  @Get()
  findAll(@Query() query: QueryDemandForecastsDto) {
    return this.demandForecastsService.findAll(query);
  }
}
