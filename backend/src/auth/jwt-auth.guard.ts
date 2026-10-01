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

interface JwtPayload {
  sub: number;
  vai_tro: string;
  phai_doi_mat_khau?: boolean;
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
      const payload =
        await this.jwtService
          .verifyAsync<JwtPayload>(
            token,
          );

      if (
        !Number.isInteger(
          payload.sub,
        ) ||
        payload.sub <= 0
      ) {
        throw new UnauthorizedException(
          'Token không hợp lệ',
        );
      }

      const taiKhoan =
        await this.prisma.tai_khoan.findUnique({
          where: {
            id:
              payload.sub,
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

      request.nguoi_dung = {
        sub:
          taiKhoan.id,

        vai_tro:
          taiKhoan.vai_tro,

        phai_doi_mat_khau:
          taiKhoan.phai_doi_mat_khau,
      };

      const laApiDoiMatKhau =
        request.method === 'POST' &&
        request.path ===
          '/auth/doi-mat-khau';

      if (
        taiKhoan.phai_doi_mat_khau &&
        !laApiDoiMatKhau
      ) {
        throw new ForbiddenException(
          'Bạn phải đổi mật khẩu trước khi sử dụng hệ thống',
        );
      }

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
