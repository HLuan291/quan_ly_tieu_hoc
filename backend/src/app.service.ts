import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly Prisma:
      PrismaService,
  ) {}

  GetHello(): string {
    return 'Hello World!';
  }

  async KiemTraDatabase() {
    const SoTaiKhoan =
      await this.Prisma.tai_khoan.count();

    return {
      ket_noi_database:
        'THANH_CONG',

      bang_kiem_tra:
        'tai_khoan',

      so_ban_ghi:
        SoTaiKhoan,
    };
  }
}
