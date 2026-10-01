import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';

interface RequestCoNguoiDung extends Request {
  nguoi_dung?: {
    sub: number;
    vai_tro: string;
    phai_doi_mat_khau: boolean;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest<RequestCoNguoiDung>();

    const authorization =
      request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Chưa cung cấp token đăng nhập',
      );
    }

    const [loaiToken, token] =
      authorization.split(' ');

    if (
      loaiToken !== 'Bearer' ||
      !token
    ) {
      throw new UnauthorizedException(
        'Token không hợp lệ',
      );
    }

    try {
      // Kiểm tra chữ ký và hạn JWT
      const payload =
        await this.jwtService.verifyAsync<{
          sub: number;
          vai_tro: string;
        }>(token);

      // Kiểm tra tài khoản vẫn còn tồn tại
      const taiKhoan =
        await this.prisma.tai_khoan.findUnique({
          where: {
            id: payload.sub,
          },
        });

      if (!taiKhoan) {
        throw new UnauthorizedException(
          'Tài khoản không tồn tại',
        );
      }

      // Token cũ không được tiếp tục dùng
      // nếu tài khoản đã bị khóa
      if (
        taiKhoan.trang_thai !==
        'HOAT_DONG'
      ) {
        throw new ForbiddenException(
          'Tài khoản đã bị khóa',
        );
      }

      // Gắn thông tin người đang đăng nhập
      // vào request hiện tại
      request.nguoi_dung = {
        sub: taiKhoan.id,

        vai_tro:
          taiKhoan.vai_tro,

        phai_doi_mat_khau:
          taiKhoan.phai_doi_mat_khau,
      };

      return true;
    } catch (error) {
      if (
        error instanceof
          ForbiddenException ||
        error instanceof
          UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException(
        'Token không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}