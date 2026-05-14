import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/utils/prisma-error.util';
import { CreateWasteLogDto } from './dto/create-waste-log.dto';
import { UpdateWasteLogDto } from './dto/update-waste-log.dto';

@Injectable()
export class WasteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWasteLogDto) {
    await this.ensureSkuExists(dto.skuId);

    try {
      return await this.prisma.wasteLog.create({
        data: {
          sku_id: dto.skuId,
          quantity: dto.quantity,
          unit: dto.unit,
          waste_reason: dto.wasteReason,
          estimated_cost: dto.estimatedCost,
          waste_date: dto.wasteDate,
          notes: dto.notes,
        },
        include: {
          sku: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey: 'The waste log references an invalid SKU.',
      });
    }
  }

  findAll(skuId?: string) {
    return this.prisma.wasteLog.findMany({
      where: skuId ? { sku_id: skuId } : undefined,
      include: {
        sku: true,
      },
      orderBy: [{ waste_date: 'desc' }, { created_at: 'desc' }],
    });
  }

  async findOne(id: string) {
    const wasteLog = await this.prisma.wasteLog.findUnique({
      where: { id },
      include: {
        sku: true,
      },
    });

    if (!wasteLog) {
      throw new NotFoundException(`Waste log ${id} was not found.`);
    }

    return wasteLog;
  }

  async update(id: string, dto: UpdateWasteLogDto) {
    await this.findOne(id);

    if (dto.skuId) {
      await this.ensureSkuExists(dto.skuId);
    }

    try {
      return await this.prisma.wasteLog.update({
        where: { id },
        data: {
          sku_id: dto.skuId,
          quantity: dto.quantity,
          unit: dto.unit,
          waste_reason: dto.wasteReason,
          estimated_cost: dto.estimatedCost,
          waste_date: dto.wasteDate,
          notes: dto.notes,
        },
        include: {
          sku: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey: 'The waste log references an invalid SKU.',
        notFound: `Waste log ${id} was not found.`,
      });
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.prisma.wasteLog.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey:
          'This waste log cannot be deleted because dependent records still reference it.',
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
}
