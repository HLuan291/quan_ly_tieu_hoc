import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service';
import { TaoDauPhien } from './phien_dang_nhap';

@Injectable()
export class AuthService {
  constructor(
    private readonly Prisma: PrismaService,
    private readonly JwtService: JwtService,
  ) {}

  async DangNhap(
    TenDangNhapHoacSoDienThoai: string,
    MatKhau: string,
  ) {
    if (typeof TenDangNhapHoacSoDienThoai !== 'string' || !TenDangNhapHoacSoDienThoai.trim() || typeof MatKhau !== 'string' || !MatKhau) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ thông tin đăng nhập',
      );
    }

    const GiaTriDangNhap =
      TenDangNhapHoacSoDienThoai.trim();

    const TaiKhoan =
      await this.Prisma.tai_khoan.findFirst({
        where: {
          OR: [
            {
              ten_dang_nhap:
                GiaTriDangNhap,
            },
            {
              so_dien_thoai:
                GiaTriDangNhap,
            },
          ],
        },
      });

    if (!TaiKhoan) {
      throw new UnauthorizedException(
        'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng',
      );
    }

    if (
      TaiKhoan.vai_tro === 'PHU_HUYNH' &&
      GiaTriDangNhap !==
        TaiKhoan.so_dien_thoai
    ) {
      throw new UnauthorizedException(
        'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng',
      );
    }

    if (
      TaiKhoan.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa',
      );
    }

    const MatKhauDung =
      await argon2.verify(
        TaiKhoan.mat_khau_bam,
        MatKhau,
      );

    if (!MatKhauDung) {
      throw new UnauthorizedException(
        'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng',
      );
    }

    const Payload = {
      phien_mat_khau: TaoDauPhien(TaiKhoan.mat_khau_bam),
      sub:
        TaiKhoan.id,

      vai_tro:
        TaiKhoan.vai_tro,

      phai_doi_mat_khau:
        TaiKhoan.phai_doi_mat_khau,
    };

    await this.Prisma.tai_khoan.update({
      where: {
        id:
          TaiKhoan.id,
      },

      data: {
        lan_dang_nhap_cuoi:
          new Date(),
      },
    });

    return {
      access_token:
        await this.JwtService.signAsync(
          Payload,
        ),

      tai_khoan: {
        id:
          TaiKhoan.id,

        ten_dang_nhap:
          TaiKhoan.ten_dang_nhap,

        so_dien_thoai:
          TaiKhoan.so_dien_thoai,

        vai_tro:
          TaiKhoan.vai_tro,

        phai_doi_mat_khau:
          TaiKhoan.phai_doi_mat_khau,
      },
    };
  }

  async DoiMatKhau(
    TaiKhoanId: number,
    MatKhauCu: string,
    MatKhauMoi: string,
  ) {
    if (typeof MatKhauCu !== 'string' || !MatKhauCu || typeof MatKhauMoi !== 'string' || !MatKhauMoi) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ mật khẩu',
      );
    }

    if (MatKhauMoi.length < 8) {
      throw new BadRequestException(
        'Mật khẩu mới phải có ít nhất 8 ký tự',
      );
    }

    const TaiKhoan =
      await this.Prisma.tai_khoan.findUnique({
        where: {
          id:
            TaiKhoanId,
        },
      });

    if (!TaiKhoan) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại',
      );
    }

    if (
      TaiKhoan.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa',
      );
    }

    const MatKhauCuDung =
      await argon2.verify(
        TaiKhoan.mat_khau_bam,
        MatKhauCu,
      );

    if (!MatKhauCuDung) {
      throw new BadRequestException(
        'Mật khẩu hiện tại không đúng',
      );
    }

    const TrungMatKhauCu =
      await argon2.verify(
        TaiKhoan.mat_khau_bam,
        MatKhauMoi,
      );

    if (TrungMatKhauCu) {
      throw new BadRequestException(
        'Mật khẩu mới phải khác mật khẩu hiện tại',
      );
    }

    const MatKhauBamMoi =
      await argon2.hash(
        MatKhauMoi,
      );

    await this.Prisma.tai_khoan.update({
      where: {
        id:
          TaiKhoanId,
      },

      data: {
        mat_khau_bam:
          MatKhauBamMoi,

        phai_doi_mat_khau:
          false,

        ngay_doi_mat_khau:
          new Date(),
      },
    });

    const PayloadMoi = {
      phien_mat_khau: TaoDauPhien(MatKhauBamMoi),
      sub:
        TaiKhoan.id,

      vai_tro:
        TaiKhoan.vai_tro,

      phai_doi_mat_khau:
        false,
    };

    return {
      thong_bao:
        'Đổi mật khẩu thành công',

      access_token:
        await this.JwtService.signAsync(
          PayloadMoi,
        ),

      phai_doi_mat_khau:
        false,
    };
  }
}
