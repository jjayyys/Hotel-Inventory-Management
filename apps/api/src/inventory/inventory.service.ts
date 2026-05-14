import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/utils/prisma-error.util';
import { CreateInventoryBatchDto } from './dto/create-inventory-batch.dto';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { UpdateInventoryBatchDto } from './dto/update-inventory-batch.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createBatch(dto: CreateInventoryBatchDto) {
    await this.ensureSkuExists(dto.skuId);
    this.validateInventoryBatchQuantities(
      dto.receivedQuantity,
      dto.remainingQuantity,
    );
    this.validateDateOrder(dto.receivedDate, dto.expiryDate, 'Expiry date');

    try {
      return await this.prisma.inventoryBatch.create({
        data: {
          sku_id: dto.skuId,
          received_quantity: dto.receivedQuantity,
          remaining_quantity: dto.remainingQuantity,
          received_date: dto.receivedDate,
          expiry_date: dto.expiryDate,
          unit_cost: dto.unitCost,
        },
        include: {
          sku: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey: 'The inventory batch references an invalid SKU.',
      });
    }
  }

  findAllBatches(skuId?: string) {
    return this.prisma.inventoryBatch.findMany({
      where: skuId ? { sku_id: skuId } : undefined,
      include: {
        sku: true,
      },
      orderBy: [{ received_date: 'desc' }, { created_at: 'desc' }],
    });
  }

  async findBatchById(id: string) {
    const batch = await this.prisma.inventoryBatch.findUnique({
      where: { id },
      include: {
        sku: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(`Inventory batch ${id} was not found.`);
    }

    return batch;
  }

  async updateBatch(id: string, dto: UpdateInventoryBatchDto) {
    const existingBatch = await this.findBatchById(id);
    const receivedQuantity =
      dto.receivedQuantity ?? Number(existingBatch.received_quantity);
    const remainingQuantity =
      dto.remainingQuantity ?? Number(existingBatch.remaining_quantity);
    const receivedDate =
      dto.receivedDate ?? existingBatch.received_date.toISOString();
    const expiryDate =
      dto.expiryDate ?? existingBatch.expiry_date.toISOString();

    if (dto.skuId) {
      await this.ensureSkuExists(dto.skuId);
    }

    this.validateInventoryBatchQuantities(receivedQuantity, remainingQuantity);
    this.validateDateOrder(receivedDate, expiryDate, 'Expiry date');

    try {
      return await this.prisma.inventoryBatch.update({
        where: { id },
        data: {
          sku_id: dto.skuId,
          received_quantity: dto.receivedQuantity,
          remaining_quantity: dto.remainingQuantity,
          received_date: dto.receivedDate,
          expiry_date: dto.expiryDate,
          unit_cost: dto.unitCost,
        },
        include: {
          sku: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey: 'The inventory batch references an invalid SKU.',
        notFound: `Inventory batch ${id} was not found.`,
      });
    }
  }

  async removeBatch(id: string) {
    await this.findBatchById(id);

    try {
      await this.prisma.inventoryBatch.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey:
          'This inventory batch cannot be deleted because dependent records still reference it.',
      });
    }
  }

  async createMovement(dto: CreateInventoryMovementDto) {
    await this.ensureSkuExists(dto.skuId);

    try {
      return await this.prisma.inventoryMovement.create({
        data: {
          sku_id: dto.skuId,
          movement_type: dto.movementType,
          quantity: dto.quantity,
          reference_type: dto.referenceType,
          reference_id: dto.referenceId,
          movement_date: dto.movementDate,
          notes: dto.notes,
        },
        include: {
          sku: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey: 'The inventory movement references an invalid SKU.',
      });
    }
  }

  findAllMovements(skuId?: string) {
    return this.prisma.inventoryMovement.findMany({
      where: skuId ? { sku_id: skuId } : undefined,
      include: {
        sku: true,
      },
      orderBy: [{ movement_date: 'desc' }, { created_at: 'desc' }],
    });
  }

  async findMovementById(id: string) {
    const movement = await this.prisma.inventoryMovement.findUnique({
      where: { id },
      include: {
        sku: true,
      },
    });

    if (!movement) {
      throw new NotFoundException(`Inventory movement ${id} was not found.`);
    }

    return movement;
  }

  async updateMovement(id: string, dto: UpdateInventoryMovementDto) {
    await this.findMovementById(id);

    if (dto.skuId) {
      await this.ensureSkuExists(dto.skuId);
    }

    try {
      return await this.prisma.inventoryMovement.update({
        where: { id },
        data: {
          sku_id: dto.skuId,
          movement_type: dto.movementType,
          quantity: dto.quantity,
          reference_type: dto.referenceType,
          reference_id: dto.referenceId,
          movement_date: dto.movementDate,
          notes: dto.notes,
        },
        include: {
          sku: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey: 'The inventory movement references an invalid SKU.',
        notFound: `Inventory movement ${id} was not found.`,
      });
    }
  }

  async removeMovement(id: string) {
    await this.findMovementById(id);

    try {
      await this.prisma.inventoryMovement.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey:
          'This inventory movement cannot be deleted because dependent records still reference it.',
      });
    }
  }

  private async ensureSkuExists(skuId: string) {
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      select: { id: true },
    });

    if (!sku) {
      throw new BadRequestException(`SKU ${skuId} does not exist.`);
    }
  }

  private validateInventoryBatchQuantities(
    receivedQuantity: number,
    remainingQuantity: number,
  ) {
    if (remainingQuantity > receivedQuantity) {
      throw new BadRequestException(
        'Remaining quantity cannot exceed received quantity.',
      );
    }
  }

  private validateDateOrder(
    startDate: string,
    endDate: string,
    endLabel: string,
  ) {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException(
        `${endLabel} must be on or after the start date.`,
      );
    }
  }
}
