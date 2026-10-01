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
    private readonly authService: AuthService,
  ) {}

  // Đăng nhập
  @Post('login')
  dangNhap(
    @Body()
    body: {
      ten_dang_nhap_hoac_so_dien_thoai: string;
      mat_khau: string;
    },
  ) {
    return this.authService.dangNhap(
      body.ten_dang_nhap_hoac_so_dien_thoai,
      body.mat_khau,
    );
  }

  // Đổi mật khẩu
  @UseGuards(JwtAuthGuard)
  @Post('doi-mat-khau')
  doiMatKhau(
    @Req() request: RequestCoNguoiDung,

    @Body()
    body: {
      mat_khau_cu: string;
      mat_khau_moi: string;
    },
  ) {
    const taiKhoanId =
      request.nguoi_dung?.sub;

    if (!taiKhoanId) {
      throw new BadRequestException(
        'Không xác định được tài khoản',
      );
    }

    return this.authService.doiMatKhau(
      taiKhoanId,
      body.mat_khau_cu,
      body.mat_khau_moi,
    );
  }
}