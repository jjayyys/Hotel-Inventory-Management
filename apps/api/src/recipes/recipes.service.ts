import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/utils/prisma-error.util';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecipeDto) {
    const menuItem = await this.ensureMenuItemExists(dto.menuItemId);
    const sku = await this.ensureSkuExists(dto.skuId);

    if (menuItem.hotel_id !== sku.hotel_id) {
      throw new BadRequestException(
        'Recipe menu item and SKU must belong to the same hotel.',
      );
    }

    try {
      return await this.prisma.recipe.create({
        data: {
          menu_item_id: dto.menuItemId,
          sku_id: dto.skuId,
          quantity_per_serving: dto.quantityPerServing,
          unit: dto.unit,
        },
        include: {
          menu_item: true,
          sku: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        conflict:
          'A recipe entry already exists for this menu item and ingredient pair.',
        foreignKey: 'The recipe references an invalid menu item or SKU.',
      });
    }
  }

  findAll(menuItemId?: string, skuId?: string) {
    return this.prisma.recipe.findMany({
      where: {
        ...(menuItemId ? { menu_item_id: menuItemId } : {}),
        ...(skuId ? { sku_id: skuId } : {}),
      },
      include: {
        menu_item: true,
        sku: true,
      },
      orderBy: [{ created_at: 'desc' }],
    });
  }

  async findOne(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        menu_item: true,
        sku: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe ${id} was not found.`);
    }

    return recipe;
  }

  async update(id: string, dto: UpdateRecipeDto) {
    const existingRecipe = await this.findOne(id);
    const menuItemId = dto.menuItemId ?? existingRecipe.menu_item_id;
    const skuId = dto.skuId ?? existingRecipe.sku_id;
    const menuItem = await this.ensureMenuItemExists(menuItemId);
    const sku = await this.ensureSkuExists(skuId);

    if (menuItem.hotel_id !== sku.hotel_id) {
      throw new BadRequestException(
        'Recipe menu item and SKU must belong to the same hotel.',
      );
    }

    try {
      return await this.prisma.recipe.update({
        where: { id },
        data: {
          menu_item_id: dto.menuItemId,
          sku_id: dto.skuId,
          quantity_per_serving: dto.quantityPerServing,
          unit: dto.unit,
        },
        include: {
          menu_item: true,
          sku: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        conflict:
          'The requested recipe update would duplicate an existing ingredient mapping.',
        foreignKey: 'The recipe references an invalid menu item or SKU.',
        notFound: `Recipe ${id} was not found.`,
      });
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.prisma.recipe.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey:
          'This recipe cannot be deleted because dependent records still reference it.',
      });
    }
  }

  private async ensureMenuItemExists(menuItemId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { id: true, hotel_id: true },
    });

    if (!menuItem) {
      throw new BadRequestException(`Menu item ${menuItemId} does not exist.`);
    }

    return menuItem;
  }

  private async ensureSkuExists(skuId: string) {
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      select: { id: true, hotel_id: true },
    });

    if (!sku) {
      throw new BadRequestException(`SKU ${skuId} does not exist.`);
    }

    return sku;
  }
}
