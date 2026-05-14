import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaError } from '../common/utils/prisma-error.util';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    await this.ensureHotelExists(dto.hotelId);

    try {
      return await this.prisma.supplier.create({
        data: {
          hotel_id: dto.hotelId,
          name: dto.name,
          contact_name: dto.contactName,
          contact_email: dto.contactEmail,
          contact_phone: dto.contactPhone,
          default_lead_time_days: dto.defaultLeadTimeDays,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey: 'The supplier references an invalid hotel.',
      });
    }
  }

  findAll(hotelId?: string) {
    return this.prisma.supplier.findMany({
      where: hotelId ? { hotel_id: hotelId } : undefined,
      orderBy: [{ name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} was not found.`);
    }

    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);

    if (dto.hotelId) {
      await this.ensureHotelExists(dto.hotelId);
    }

    try {
      return await this.prisma.supplier.update({
        where: { id },
        data: {
          hotel_id: dto.hotelId,
          name: dto.name,
          contact_name: dto.contactName,
          contact_email: dto.contactEmail,
          contact_phone: dto.contactPhone,
          default_lead_time_days: dto.defaultLeadTimeDays,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey: 'The supplier references an invalid hotel.',
        notFound: `Supplier ${id} was not found.`,
      });
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.prisma.supplier.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, {
        foreignKey:
          'This supplier cannot be deleted because other records still depend on it.',
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
}
