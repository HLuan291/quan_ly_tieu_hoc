import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type {
  Request,
} from 'express';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import {
  GiaoVienService,
} from './giao_vien.service';

import { CapLaiMatKhauGiaoVienDto } from './giao_vien.dto';

import type {
  DuLieuCapNhatGiaoVien,
  DuLieuTaoGiaoVien,
} from './giao_vien.service';

interface RequestCoNguoiDung
  extends Request {
  nguoi_dung?: {
    sub: number;
    vai_tro: string;
    phai_doi_mat_khau: boolean;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('giao_vien')
export class GiaoVienController {
  constructor(
    private readonly GiaoVienService:
      GiaoVienService,
  ) {}

  private KiemTraAdmin(
    Request: RequestCoNguoiDung,
  ) {
    if (
      Request.nguoi_dung?.vai_tro !==
      'ADMIN'
    ) {
      throw new ForbiddenException(
        'Chỉ Admin được thực hiện chức năng này',
      );
    }
  }

  @Post()
  TaoGiaoVien(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: DuLieuTaoGiaoVien,
  ) {
    this.KiemTraAdmin(
      Request,
    );

    return this.GiaoVienService
      .TaoGiaoVien(
        Body,
      );
  }

  @Get()
  LayDanhSachGiaoVien(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('tu_khoa')
    TuKhoa?: string,

    @Query('trang_thai')
    TrangThai?: string,
  ) {
    this.KiemTraAdmin(
      Request,
    );

    return this.GiaoVienService
      .LayDanhSachGiaoVien(
        TuKhoa,
        TrangThai,
      );
  }

  private TaiKhoanGiaoVien(Request: RequestCoNguoiDung) {
    if (Request.nguoi_dung?.vai_tro !== 'GIAO_VIEN') {
      throw new ForbiddenException('Chỉ giáo viên được sử dụng hồ sơ cá nhân');
    }
    return Request.nguoi_dung.sub;
  }

  @Get('me')
  LayHoSoCuaToi(@Req() Request: RequestCoNguoiDung) {
    return this.GiaoVienService.LayHoSoCuaToi(this.TaiKhoanGiaoVien(Request));
  }

  @Patch('me')
  CapNhatHoSoCuaToi(@Req() Request: RequestCoNguoiDung, @Body() Body: DuLieuCapNhatGiaoVien) {
    return this.GiaoVienService.CapNhatHoSoCuaToi(this.TaiKhoanGiaoVien(Request), Body);
  }

  @Patch(':id')
  CapNhatGiaoVien(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: DuLieuCapNhatGiaoVien,
  ) {
    this.KiemTraAdmin(
      Request,
    );

    return this.GiaoVienService
      .CapNhatGiaoVien(
        Id,
        Body,
      );
  }

  @Post(':id/cap_lai_mat_khau')
  CapLaiMatKhauGiaoVien(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapLaiMatKhauGiaoVienDto,
  ) {
    this.KiemTraAdmin(
      Request,
    );

    return this.GiaoVienService
      .CapLaiMatKhauGiaoVien(
        Id,
        Body.mat_khau_moi,
      );
  }
  @Delete(':id')
  XoaGiaoVien(@Req() Request: RequestCoNguoiDung, @Param('id', ParseIntPipe) Id: number) {
    this.KiemTraAdmin(Request);
    return this.GiaoVienService.XoaGiaoVien(Id);
  }
}