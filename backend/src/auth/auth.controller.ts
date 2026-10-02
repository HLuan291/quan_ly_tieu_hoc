import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestCoNguoiDung extends Request {
  nguoi_dung?: {
    sub: number;
    vai_tro: string;
    phai_doi_mat_khau: boolean;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly AuthService: AuthService,
  ) {}

  // Đăng nhập
  @Post('login')
  DangNhap(
    @Body()
    Body: {
      ten_dang_nhap_hoac_so_dien_thoai: string;
      mat_khau: string;
    },
  ) {
    return this.AuthService.DangNhap(
      Body.ten_dang_nhap_hoac_so_dien_thoai,
      Body.mat_khau,
    );
  }

  // Đổi mật khẩu
  @UseGuards(JwtAuthGuard)
  @Post('doi-mat-khau')
  DoiMatKhau(
    @Req() Request: RequestCoNguoiDung,

    @Body()
    Body: {
      mat_khau_cu: string;
      mat_khau_moi: string;
    },
  ) {
    const TaiKhoanId =
      Request.nguoi_dung?.sub;

    if (!TaiKhoanId) {
      throw new BadRequestException(
        'Không xác định được tài khoản',
      );
    }

    return this.AuthService.DoiMatKhau(
      TaiKhoanId,
      Body.mat_khau_cu,
      Body.mat_khau_moi,
    );
  }
}