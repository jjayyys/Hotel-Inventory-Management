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
import { CreateInventoryBatchDto } from './dto/create-inventory-batch.dto';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { UpdateInventoryBatchDto } from './dto/update-inventory-batch.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';
import { InventoryService } from './inventory.service';

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

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Create an inventory batch' })
  @Roles(...WRITE_ROLES)
  @Post('batches')
  createBatch(@Body() dto: CreateInventoryBatchDto) {
    return this.inventoryService.createBatch(dto);
  }

  @ApiOperation({ summary: 'List inventory batches' })
  @ApiQuery({
    name: 'skuId',
    required: false,
    description: 'Optional SKU filter',
  })
  @Roles(...READ_ROLES)
  @Get('batches')
  findAllBatches(@Query('skuId') skuId?: string) {
    return this.inventoryService.findAllBatches(skuId);
  }

  @ApiOperation({ summary: 'Get an inventory batch by id' })
  @Roles(...READ_ROLES)
  @Get('batches/:id')
  findBatchById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.findBatchById(id);
  }

  @ApiOperation({ summary: 'Update an inventory batch' })
  @Roles(...WRITE_ROLES)
  @Patch('batches/:id')
  updateBatch(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateInventoryBatchDto,
  ) {
    return this.inventoryService.updateBatch(id, dto);
  }

  @ApiOperation({ summary: 'Delete an inventory batch' })
  @Roles(...WRITE_ROLES)
  @Delete('batches/:id')
  removeBatch(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.removeBatch(id);
  }

  @ApiOperation({ summary: 'Create an inventory movement' })
  @Roles(...WRITE_ROLES)
  @Post('movements')
  createMovement(@Body() dto: CreateInventoryMovementDto) {
    return this.inventoryService.createMovement(dto);
  }

  @ApiOperation({ summary: 'List inventory movements' })
  @ApiQuery({
    name: 'skuId',
    required: false,
    description: 'Optional SKU filter',
  })
  @Roles(...READ_ROLES)
  @Get('movements')
  findAllMovements(@Query('skuId') skuId?: string) {
    return this.inventoryService.findAllMovements(skuId);
  }

  @ApiOperation({ summary: 'Get an inventory movement by id' })
  @Roles(...READ_ROLES)
  @Get('movements/:id')
  findMovementById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.findMovementById(id);
  }

  @ApiOperation({ summary: 'Update an inventory movement' })
  @Roles(...WRITE_ROLES)
  @Patch('movements/:id')
  updateMovement(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateInventoryMovementDto,
  ) {
    return this.inventoryService.updateMovement(id, dto);
  }

  @ApiOperation({ summary: 'Delete an inventory movement' })
  @Roles(...WRITE_ROLES)
  @Delete('movements/:id')
  removeMovement(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.removeMovement(id);
  }
}
