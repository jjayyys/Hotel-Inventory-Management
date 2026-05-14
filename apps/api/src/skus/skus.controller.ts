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
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkusService } from './skus.service';

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
];

@ApiTags('SKUs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('skus')
export class SkusController {
  constructor(private readonly skusService: SkusService) {}

  @ApiOperation({ summary: 'Create an inventory SKU' })
  @Roles(...WRITE_ROLES)
  @Post()
  create(@Body() dto: CreateSkuDto) {
    return this.skusService.create(dto);
  }

  @ApiOperation({ summary: 'List SKUs' })
  @ApiQuery({
    name: 'hotelId',
    required: false,
    description: 'Optional hotel scope filter',
  })
  @Roles(...READ_ROLES)
  @Get()
  findAll(@Query('hotelId') hotelId?: string) {
    return this.skusService.findAll(hotelId);
  }

  @ApiOperation({ summary: 'Get an SKU by id' })
  @Roles(...READ_ROLES)
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.skusService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an SKU' })
  @Roles(...WRITE_ROLES)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSkuDto,
  ) {
    return this.skusService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete an SKU' })
  @Roles(...WRITE_ROLES)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.skusService.remove(id);
  }
}
