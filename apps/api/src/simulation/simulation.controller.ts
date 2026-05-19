import {
  Body,
  Controller,
  Delete,
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
import { CreateSimulationScenarioDto } from './dto/create-simulation-scenario.dto';
import { QuerySimulationScenariosDto } from './dto/query-simulation-scenarios.dto';
import { SimulationService } from './simulation.service';

const READ_ROLES = [
  UserRole.admin,
  UserRole.inventory_manager,
  UserRole.purchasing_staff,
  UserRole.analyst,
];

const WRITE_ROLES = [
  UserRole.admin,
  UserRole.inventory_manager,
  UserRole.purchasing_staff,
];

@ApiTags('Simulation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @ApiOperation({
    summary: 'Create a new simulation scenario',
    description:
      'Create a what-if scenario to model different operational conditions and their impact on inventory recommendations.',
  })
  @Roles(...WRITE_ROLES)
  @Post('scenarios')
  createScenario(@Body() dto: CreateSimulationScenarioDto) {
    return this.simulationService.createScenario(dto);
  }

  @ApiOperation({
    summary: 'List simulation scenarios',
  })
  @Roles(...READ_ROLES)
  @Get('scenarios')
  findAll(@Query() query: QuerySimulationScenariosDto) {
    return this.simulationService.findAll(query);
  }

  @ApiOperation({
    summary: 'Get a simulation scenario by ID',
  })
  @Roles(...READ_ROLES)
  @Get('scenarios/:id')
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.simulationService.findById(id);
  }

  @ApiOperation({
    summary: 'Run a simulation scenario',
    description:
      'Execute a scenario and calculate projected metrics and variance from baseline.',
  })
  @Roles(...WRITE_ROLES)
  @Post('scenarios/:id/run')
  runSimulation(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.simulationService.runSimulation(id);
  }

  @ApiOperation({
    summary: 'Delete a simulation scenario',
  })
  @Roles(...WRITE_ROLES)
  @Delete('scenarios/:id')
  deleteScenario(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.simulationService.deleteScenario(id);
  }
}
