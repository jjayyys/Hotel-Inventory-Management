import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

type PrismaErrorMessages = {
  conflict?: string;
  foreignKey?: string;
  notFound?: string;
  default?: string;
};

export function handlePrismaError(
  error: unknown,
  messages: PrismaErrorMessages = {},
): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new ConflictException(
          messages.conflict ?? 'A unique constraint would be violated.',
        );
      case 'P2003':
        throw new BadRequestException(
          messages.foreignKey ?? 'A related record was not found.',
        );
      case 'P2025':
        throw new BadRequestException(
          messages.notFound ?? 'The requested record could not be found.',
        );
      default:
        throw new InternalServerErrorException(
          messages.default ?? 'A database error occurred.',
        );
    }
  }

  throw error;
}
