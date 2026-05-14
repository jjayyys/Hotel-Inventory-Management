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
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';

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
  UserRole.kitchen_manager,
];

@ApiTags('Recipes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @ApiOperation({ summary: 'Create a recipe ingredient mapping' })
  @Roles(...WRITE_ROLES)
  @Post()
  create(@Body() dto: CreateRecipeDto) {
    return this.recipesService.create(dto);
  }

  @ApiOperation({ summary: 'List recipe ingredient mappings' })
  @ApiQuery({
    name: 'menuItemId',
    required: false,
    description: 'Optional menu item filter',
  })
  @ApiQuery({
    name: 'skuId',
    required: false,
    description: 'Optional SKU filter',
  })
  @Roles(...READ_ROLES)
  @Get()
  findAll(
    @Query('menuItemId') menuItemId?: string,
    @Query('skuId') skuId?: string,
  ) {
    return this.recipesService.findAll(menuItemId, skuId);
  }

  @ApiOperation({ summary: 'Get a recipe by id' })
  @Roles(...READ_ROLES)
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.recipesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a recipe' })
  @Roles(...WRITE_ROLES)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a recipe' })
  @Roles(...WRITE_ROLES)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.recipesService.remove(id);
  }
}
