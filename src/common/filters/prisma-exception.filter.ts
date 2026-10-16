import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

const PRISMA_ERROR_MAP: Record<
  string,
  { status: HttpStatus; message: string }
> = {
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'Data dengan nilai tersebut sudah ada',
  },
  P2003: {
    status: HttpStatus.CONFLICT,
    message:
      'Relasi data tidak valid: data terkait tidak ditemukan atau masih digunakan',
  },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Data tidak ditemukan' },
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const mapped = PRISMA_ERROR_MAP[exception.code];

    if (!mapped) {
      // Detail asli hanya untuk log server, jangan dikirim ke client
      this.logger.error(
        `${exception.code}: ${exception.message}`,
        exception.stack,
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Terjadi kesalahan pada server',
      });
    }

    return res.status(mapped.status).json({
      statusCode: mapped.status,
      message: mapped.message,
    });
  }
}
