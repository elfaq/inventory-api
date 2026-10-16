import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService], // buat instance-nya (cukup satu untuk seluruh app)
  exports: [PrismaService], // izinkan module lain memakainya
})
export class PrismaModule {}
