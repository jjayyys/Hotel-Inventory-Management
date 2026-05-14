import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GenerateRecommendationExplanationDto } from './dto/generate-recommendation-explanation.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { RecalculateRecommendationsDto } from './dto/recalculate-recommendations.dto';
import { RecommendationsService } from './recommendations.service';

const READ_ROLES = [
  UserRole.admin,
  UserRole.inventory_manager,
  UserRole.purchasing_staff,
  UserRole.kitchen_manager,
  UserRole.analyst,
];

const RECALCULATE_ROLES = [
  UserRole.admin,
  UserRole.inventory_manager,
  UserRole.purchasing_staff,
];

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @ApiOperation({
    summary: 'Recalculate deterministic recommendations for a hotel',
  })
  @Roles(...RECALCULATE_ROLES)
  @Post('recalculate')
  recalculate(@Body() dto: RecalculateRecommendationsDto) {
    return this.recommendationsService.recalculate(dto);
  }

  @ApiOperation({ summary: 'List persisted replenishment recommendations' })
  @Roles(...READ_ROLES)
  @Get()
  findAll(@Query() query: QueryRecommendationsDto) {
    return this.recommendationsService.findAll(query);
  }

  @ApiOperation({
    summary: 'Generate or refresh an AI explanation for one recommendation',
  })
  @Roles(...READ_ROLES)
  @Post(':id/explanation')
  generateExplanation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: GenerateRecommendationExplanationDto,
  ) {
    return this.recommendationsService.generateExplanation(id, query);
  }
}
