import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AiStatusResponseDto } from './dto/ai-status-response.dto';
import { AiService } from './ai.service';

const READ_ROLES = [
  UserRole.admin,
  UserRole.inventory_manager,
  UserRole.purchasing_staff,
  UserRole.kitchen_manager,
  UserRole.analyst,
];

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({
    summary: 'Check hosted and local AI provider status and model availability',
  })
  @ApiOkResponse({ type: AiStatusResponseDto })
  @Roles(...READ_ROLES)
  @Get('status')
  getStatus() {
    return this.aiService.getProviderStatusSummary();
  }
}
