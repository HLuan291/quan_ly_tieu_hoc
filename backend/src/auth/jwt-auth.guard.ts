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
    private readonly JwtService: JwtService,
    private readonly Prisma: PrismaService,
  ) {}

  async canActivate(
    Context: ExecutionContext,
  ): Promise<boolean> {
    const Request =
      Context
        .switchToHttp()
        .getRequest<RequestCoNguoiDung>();

    const Authorization =
      Request.headers.Authorization;

    if (!Authorization) {
      throw new UnauthorizedException(
        'Chưa cung cấp Token đăng nhập',
      );
    }

    const [LoaiToken, Token] =
      Authorization.split(' ');

    if (
      LoaiToken !== 'Bearer' ||
      !Token
    ) {
      throw new UnauthorizedException(
        'Token không hợp lệ',
      );
    }

    try {
      const Payload =
        await this.JwtService
          .verifyAsync<JwtPayload>(
            Token,
          );

      if (
        !Number.isInteger(
          Payload.sub,
        ) ||
        Payload.sub <= 0
      ) {
        throw new UnauthorizedException(
          'Token không hợp lệ',
        );
      }

      const TaiKhoan =
        await this.Prisma.tai_khoan.findUnique({
          where: {
            id:
              Payload.sub,
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

      Request.nguoi_dung = {
        sub:
          TaiKhoan.id,

        vai_tro:
          TaiKhoan.vai_tro,

        phai_doi_mat_khau:
          TaiKhoan.phai_doi_mat_khau,
      };

      const DuongDan =
        Request.originalUrl
          .split('?')[0]
          .replace(/\/+$/, '');

      const LaApiDoiMatKhau =
        Request.method === 'POST' &&
        DuongDan ===
          '/auth/doi-mat-khau';

      if (
        TaiKhoan.phai_doi_mat_khau &&
        !LaApiDoiMatKhau
      ) {
        throw new ForbiddenException(
          'Bạn phải đổi mật khẩu trước khi sử dụng hệ thống',
        );
      }

      return true;
    } catch (Error) {
      if (
        Error instanceof
          ForbiddenException ||
        Error instanceof
          UnauthorizedException
      ) {
        throw Error;
      }

      throw new UnauthorizedException(
        'Token không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}
