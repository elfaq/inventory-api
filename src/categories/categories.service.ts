import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { QueryCategoryDto } from './dto/query-category.dto.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import {
  paginatedResponse,
  successResponse,
} from '../common/helpers/response.helper.js';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // get data
  async findAll(query: QueryCategoryDto) {
    const { id, name, page, limit } = query;
    const where: Prisma.CategoryWhereInput = {
      ...(id !== undefined && { id }),
      ...(name && { name: { contains: name.trim() } }),
    };

    // Dua query dalam satu transaction agar data dan total konsisten
    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' }, // wajib: tanpa urutan, isi halaman bisa acak
      }),
      this.prisma.category.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return paginatedResponse(
      'kategori berhasil diambil',
      data,
      total,
      page,
      limit,
    );
  }

  // create data
  async create(dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: dto,
    });
    return successResponse('kategori berhasil ditambahkan', category);
  }

  // update
  async update(id: number, dto: UpdateCategoryDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Tidak ada data untuk diupdate');
    }
    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'kategori berhasil diupdate',
      data: updatedCategory,
    };
  }

  async remove(id: number) {
    try {
      const data = await this.prisma.category.delete({
        where: { id },
      });

      return successResponse('kategori berhasil dihapus', data);
    } catch (e) {
      // Pesan khusus: pesan generik P2003 dari filter kurang jelas untuk kasus delete
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'Kategori tidak bisa dihapus karena masih digunakan oleh produk',
        );
      }
      throw e; // P2025 dan lainnya tetap ditangani filter global
    }
  }
}
