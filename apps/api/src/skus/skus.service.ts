import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/utils/prisma-error.util';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

@Injectable()
export class SkusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSkuDto) {
    await this.ensureHotelExists(dto.hotelId);
    const supplier = await this.ensureSupplierExists(dto.supplierId);

    if (supplier.hotel_id !== dto.hotelId) {
      throw new BadRequestException(
        'The selected supplier does not belong to the provided hotel.',
      );
    }

    try {
      return await this.prisma.sku.create({
        data: {
          hotel_id: dto.hotelId,
          supplier_id: dto.supplierId,
          sku_code: dto.skuCode,
          name: dto.name,
          category: dto.category,
          unit: dto.unit,
          unit_cost: dto.unitCost,
          holding_cost_per_unit: dto.holdingCostPerUnit,
          order_cost: dto.orderCost,
          shelf_life_days: dto.shelfLifeDays,
          safety_stock: dto.safetyStock,
          minimum_stock: dto.minimumStock,
          is_active: dto.isActive ?? true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        conflict: `SKU code ${dto.skuCode} already exists for this hotel.`,
        foreignKey: 'The SKU references an invalid hotel or supplier.',
      });
    }
  }

  findAll(hotelId?: string) {
    return this.prisma.sku.findMany({
      where: hotelId ? { hotel_id: hotelId } : undefined,
      include: {
        supplier: true,
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const sku = await this.prisma.sku.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });

    if (!sku) {
      throw new NotFoundException(`SKU ${id} was not found.`);
    }

    return sku;
  }

  async update(id: string, dto: UpdateSkuDto) {
    const existingSku = await this.findOne(id);
    const targetHotelId = dto.hotelId ?? existingSku.hotel_id;
    const targetSupplierId = dto.supplierId ?? existingSku.supplier_id;

    if (dto.hotelId) {
      await this.ensureHotelExists(dto.hotelId);
    }

    if (dto.supplierId) {
      const supplier = await this.ensureSupplierExists(dto.supplierId);

      if (supplier.hotel_id !== targetHotelId) {
        throw new BadRequestException(
          'The selected supplier does not belong to the provided hotel.',
        );
      }
    } else if (dto.hotelId) {
      const supplier = await this.ensureSupplierExists(targetSupplierId);

      if (supplier.hotel_id !== targetHotelId) {
        throw new BadRequestException(
          'The current supplier does not belong to the updated hotel.',
        );
      }
    }

    try {
      return await this.prisma.sku.update({
        where: { id },
        data: {
          hotel_id: dto.hotelId,
          supplier_id: dto.supplierId,
          sku_code: dto.skuCode,
          name: dto.name,
          category: dto.category,
          unit: dto.unit,
          unit_cost: dto.unitCost,
          holding_cost_per_unit: dto.holdingCostPerUnit,
          order_cost: dto.orderCost,
          shelf_life_days: dto.shelfLifeDays,
          safety_stock: dto.safetyStock,
          minimum_stock: dto.minimumStock,
          is_active: dto.isActive,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        conflict: 'The requested SKU update would violate a uniqueness rule.',
        foreignKey: 'The SKU references an invalid hotel or supplier.',
        notFound: `SKU ${id} was not found.`,
      });
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.prisma.sku.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey:
          'This SKU cannot be deleted because dependent records still reference it.',
      });
    }
  }

  private async ensureHotelExists(hotelId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true },
    });

    if (!hotel) {
      throw new BadRequestException(`Hotel ${hotelId} does not exist.`);
    }
  }

  private async ensureSupplierExists(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, hotel_id: true },
    });

    if (!supplier) {
      throw new BadRequestException(`Supplier ${supplierId} does not exist.`);
    }

    return supplier;
  }
}
