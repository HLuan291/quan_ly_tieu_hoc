import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async dangNhap(
    tenDangNhapHoacSoDienThoai: string,
    matKhau: string,
  ) {
    // Kiểm tra dữ liệu gửi lên
    if (!tenDangNhapHoacSoDienThoai || !matKhau) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ thông tin đăng nhập',
      );
    }

    const giaTriDangNhap =
      tenDangNhapHoacSoDienThoai.trim();

    // Tìm bằng tên đăng nhập hoặc số điện thoại
    const taiKhoan =
      await this.prisma.tai_khoan.findFirst({
        where: {
          OR: [
            {
              ten_dang_nhap: giaTriDangNhap,
            },
            {
              so_dien_thoai: giaTriDangNhap,
            },
          ],
        },
      });

    // Không tìm thấy tài khoản
    if (!taiKhoan) {
      throw new UnauthorizedException(
        'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng',
      );
    }

    // Phụ huynh chỉ đăng nhập bằng số điện thoại
    if (
      taiKhoan.vai_tro === 'PHU_HUYNH' &&
      giaTriDangNhap !== taiKhoan.so_dien_thoai
    ) {
      throw new UnauthorizedException(
        'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng',
      );
    }

    // Kiểm tra trạng thái tài khoản
    if (taiKhoan.trang_thai !== 'HOAT_DONG') {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa',
      );
    }

    // Kiểm tra mật khẩu bằng Argon2
    const matKhauDung = await argon2.verify(
      taiKhoan.mat_khau_bam,
      matKhau,
    );

    if (!matKhauDung) {
      throw new UnauthorizedException(
        'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng',
      );
    }

    // Dữ liệu đưa vào JWT
    const payload = {
      sub: taiKhoan.id,
      vai_tro: taiKhoan.vai_tro,
    };

    // Ghi nhận lần đăng nhập gần nhất
    await this.prisma.tai_khoan.update({
      where: {
        id: taiKhoan.id,
      },

      data: {
        lan_dang_nhap_cuoi: new Date(),
      },
    });

    // Trả kết quả cho frontend
    return {
      access_token:
        await this.jwtService.signAsync(payload),

      tai_khoan: {
        id: taiKhoan.id,

        ten_dang_nhap:
          taiKhoan.ten_dang_nhap,

        so_dien_thoai:
          taiKhoan.so_dien_thoai,

        vai_tro:
          taiKhoan.vai_tro,

        phai_doi_mat_khau:
          taiKhoan.phai_doi_mat_khau,
      },
    };
  }

  async doiMatKhau(
    taiKhoanId: number,
    matKhauCu: string,
    matKhauMoi: string,
  ) {
    if (!matKhauCu || !matKhauMoi) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ mật khẩu',
      );
    }

    if (matKhauMoi.length < 8) {
      throw new BadRequestException(
        'Mật khẩu mới phải có ít nhất 8 ký tự',
      );
    }

    // Tìm tài khoản đang đăng nhập
    const taiKhoan =
      await this.prisma.tai_khoan.findUnique({
        where: {
          id: taiKhoanId,
        },
      });

    if (!taiKhoan) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại',
      );
    }

    if (taiKhoan.trang_thai !== 'HOAT_DONG') {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa',
      );
    }

    // Kiểm tra mật khẩu hiện tại
    const matKhauCuDung =
      await argon2.verify(
        taiKhoan.mat_khau_bam,
        matKhauCu,
      );

    if (!matKhauCuDung) {
      throw new BadRequestException(
        'Mật khẩu hiện tại không đúng',
      );
    }

    // Không cho dùng lại mật khẩu hiện tại
    const trungMatKhauCu =
      await argon2.verify(
        taiKhoan.mat_khau_bam,
        matKhauMoi,
      );

    if (trungMatKhauCu) {
      throw new BadRequestException(
        'Mật khẩu mới phải khác mật khẩu hiện tại',
      );
    }

    // Băm mật khẩu mới
    const matKhauBamMoi =
      await argon2.hash(matKhauMoi);

    // Cập nhật database
    await this.prisma.tai_khoan.update({
      where: {
        id: taiKhoanId,
      },

      data: {
        mat_khau_bam: matKhauBamMoi,

        phai_doi_mat_khau: false,

        ngay_doi_mat_khau: new Date(),
      },
    });

    return {
      thong_bao:
        'Đổi mật khẩu thành công',

      phai_doi_mat_khau: false,
    };
  }
}