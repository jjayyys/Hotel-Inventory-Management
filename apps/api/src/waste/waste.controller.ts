import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateWasteLogDto } from './dto/create-waste-log.dto';
import { UpdateWasteLogDto } from './dto/update-waste-log.dto';
import { WasteService } from './waste.service';

const READ_ROLES = [
  UserRole.admin,
  UserRole.inventory_manager,
  UserRole.purchasing_staff,
  UserRole.kitchen_manager,
  UserRole.analyst,
];

const WRITE_ROLES = [
  UserRole.admin,
  UserRole.inventory_manager,
  UserRole.purchasing_staff,
  UserRole.kitchen_manager,
];

@ApiTags('Waste')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('waste')
export class WasteController {
  constructor(private readonly wasteService: WasteService) {}

  @ApiOperation({ summary: 'Create a waste log entry' })
  @Roles(...WRITE_ROLES)
  @Post()
  create(@Body() dto: CreateWasteLogDto) {
    return this.wasteService.create(dto);
  }

  @ApiOperation({ summary: 'List waste logs' })
  @ApiQuery({
    name: 'skuId',
    required: false,
    description: 'Optional SKU filter',
  })
  @Roles(...READ_ROLES)
  @Get()
  findAll(@Query('skuId') skuId?: string) {
    return this.wasteService.findAll(skuId);
  }

  @ApiOperation({ summary: 'Get a waste log by id' })
  @Roles(...READ_ROLES)
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.wasteService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a waste log' })
  @Roles(...WRITE_ROLES)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWasteLogDto,
  ) {
    return this.wasteService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a waste log' })
  @Roles(...WRITE_ROLES)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.wasteService.remove(id);
  }
}
