import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReplenishmentService } from './replenishment.service';

const READ_ROLES = [
  UserRole.admin,
  UserRole.inventory_manager,
  UserRole.purchasing_staff,
  UserRole.kitchen_manager,
  UserRole.analyst,
];

@ApiTags('Replenishment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('replenishment')
export class ReplenishmentController {
  constructor(private readonly replenishmentService: ReplenishmentService) {}

  @ApiOperation({
    summary: 'Get current replenishment metrics for a hotel',
    description:
      'Returns deterministic replenishment calculations (EOQ, ROP, reorder point, etc.) for all active SKUs in a hotel.',
  })
  @Roles(...READ_ROLES)
  @Get(':hotelId')
  async getHotelMetrics(
    @Param('hotelId', new ParseUUIDPipe()) hotelId: string,
  ) {
    const { calculationWindow, results } =
      await this.replenishmentService.calculateHotelRecommendations(
        hotelId,
        30,
      );

    return {
      hotelId,
      calculationWindow,
      metrics: results,
      count: results.length,
    };
  }
}
