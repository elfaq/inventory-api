import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existUser) throw new BadRequestException('Email sudah terdaftar');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });

    const payload = { sub: user.id, name: user.name, email: user.email };

    const token = await this.jwtService.signAsync(payload);
    return {
      message: 'User berhasil dibuat',
      data: {
        ...payload,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('User tidak terdaftar');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new BadRequestException('Password salah');

    const payload = { sub: user.id, name: user.name, email: user.email };
    const token = await this.jwtService.signAsync(payload);
    return {
      message: 'Login berhasil',
      data: {
        ...payload,
        token,
      },
    };
  }
}
