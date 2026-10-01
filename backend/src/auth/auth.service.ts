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
    if (!tenDangNhapHoacSoDienThoai || !matKhau) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ thông tin đăng nhập',
      );
    }

    const giaTriDangNhap =
      tenDangNhapHoacSoDienThoai.trim();

    const taiKhoan =
      await this.prisma.tai_khoan.findFirst({
        where: {
          OR: [
            {
              ten_dang_nhap:
                giaTriDangNhap,
            },
            {
              so_dien_thoai:
                giaTriDangNhap,
            },
          ],
        },
      });

    if (!taiKhoan) {
      throw new UnauthorizedException(
        'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng',
      );
    }

    if (
      taiKhoan.vai_tro === 'PHU_HUYNH' &&
      giaTriDangNhap !==
        taiKhoan.so_dien_thoai
    ) {
      throw new UnauthorizedException(
        'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng',
      );
    }

    if (
      taiKhoan.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa',
      );
    }

    const matKhauDung =
      await argon2.verify(
        taiKhoan.mat_khau_bam,
        matKhau,
      );

    if (!matKhauDung) {
      throw new UnauthorizedException(
        'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng',
      );
    }

    const payload = {
      sub:
        taiKhoan.id,

      vai_tro:
        taiKhoan.vai_tro,

      phai_doi_mat_khau:
        taiKhoan.phai_doi_mat_khau,
    };

    await this.prisma.tai_khoan.update({
      where: {
        id:
          taiKhoan.id,
      },

      data: {
        lan_dang_nhap_cuoi:
          new Date(),
      },
    });

    return {
      access_token:
        await this.jwtService.signAsync(
          payload,
        ),

      tai_khoan: {
        id:
          taiKhoan.id,

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

    const taiKhoan =
      await this.prisma.tai_khoan.findUnique({
        where: {
          id:
            taiKhoanId,
        },
      });

    if (!taiKhoan) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại',
      );
    }

    if (
      taiKhoan.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa',
      );
    }

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

    const matKhauBamMoi =
      await argon2.hash(
        matKhauMoi,
      );

    await this.prisma.tai_khoan.update({
      where: {
        id:
          taiKhoanId,
      },

      data: {
        mat_khau_bam:
          matKhauBamMoi,

        phai_doi_mat_khau:
          false,

        ngay_doi_mat_khau:
          new Date(),
      },
    });

    const payloadMoi = {
      sub:
        taiKhoan.id,

      vai_tro:
        taiKhoan.vai_tro,

      phai_doi_mat_khau:
        false,
    };

    return {
      thong_bao:
        'Đổi mật khẩu thành công',

      access_token:
        await this.jwtService.signAsync(
          payloadMoi,
        ),

      phai_doi_mat_khau:
        false,
    };
  }
}
