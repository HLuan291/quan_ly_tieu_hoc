import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async kiemTraDatabase() {
    const soTaiKhoan = await this.prisma.tai_khoan.count();

    return {
      ket_noi_database: 'THANH_CONG',
      bang_kiem_tra: 'tai_khoan',
      so_ban_ghi: soTaiKhoan,
    };
  }
}