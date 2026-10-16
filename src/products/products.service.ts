import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';
import {
  paginatedResponse,
  successResponse,
} from '../common/helpers/response.helper.js';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductDto) {
    const { id, name, page, limit } = query;
    const where: Prisma.ProductWhereInput = {
      ...(id !== undefined && { id }),
      ...(name && { name: { contains: name.trim() } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
        orderBy: { id: 'asc' }, // wajib urutan
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return paginatedResponse(
      'Produk berhasil diambil',
      data,
      total,
      page,
      limit,
    );
  }

  async create(dto: CreateProductDto) {
    const data = await this.prisma.product.create({
      data: dto,
      include: { category: true },
    });
    return successResponse('produk berhasil dibuat', data);
  }

  async update(id: number, dto: UpdateProductDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Tidak ada data yang diperbarui');
    }
    const data = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
    return successResponse('produk berhasil diperbarui', data);
  }

  async remove(id: number) {
    try {
      const data = await this.prisma.product.delete({
        where: { id },
      });
      return successResponse('produk berhasil dihapus', data);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException('Kategori tidak ditemukan');
      }
      throw e;
    }
  }
}
