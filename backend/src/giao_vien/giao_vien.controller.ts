import {
  Body,
  Controller,
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
    private readonly giaoVienService:
      GiaoVienService,
  ) {}


  private kiemTraAdmin(
    request: RequestCoNguoiDung,
  ) {
    if (
      request.nguoi_dung?.vai_tro !==
      'ADMIN'
    ) {
      throw new ForbiddenException(
        'Chỉ Admin được thực hiện chức năng này',
      );
    }
  }


  // =========================================
  // 1. THÊM GIÁO VIÊN
  // POST /giao_vien
  // =========================================

  @Post()
  taoGiaoVien(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: DuLieuTaoGiaoVien,
  ) {
    this.kiemTraAdmin(
      request,
    );

    return this.giaoVienService
      .taoGiaoVien(
        body,
      );
  }


  // =========================================
  // 2. XEM / TÌM DANH SÁCH GIÁO VIÊN
  // GET /giao_vien
  // =========================================

  @Get()
  layDanhSachGiaoVien(
    @Req()
    request: RequestCoNguoiDung,

    @Query('tu_khoa')
    tuKhoa?: string,

    @Query('trang_thai')
    trangThai?: string,
  ) {
    this.kiemTraAdmin(
      request,
    );

    return this.giaoVienService
      .layDanhSachGiaoVien(
        tuKhoa,
        trangThai,
      );
  }


  // =========================================
  // 3. CẬP NHẬT GIÁO VIÊN
  // PATCH /giao_vien/:id
  // =========================================

  @Patch(':id')
  capNhatGiaoVien(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: DuLieuCapNhatGiaoVien,
  ) {
    this.kiemTraAdmin(
      request,
    );

    return this.giaoVienService
      .capNhatGiaoVien(
        id,
        body,
      );
  }


  // =========================================
  // 4. CẤP LẠI MẬT KHẨU GIÁO VIÊN
  // POST /giao_vien/:id/cap_lai_mat_khau
  // =========================================

  @Post(':id/cap_lai_mat_khau')
  capLaiMatKhauGiaoVien(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    this.kiemTraAdmin(
      request,
    );

    return this.giaoVienService
      .capLaiMatKhauGiaoVien(
        id,
      );
  }
}
