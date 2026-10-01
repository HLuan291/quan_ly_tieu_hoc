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

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { GiaoVienService } from './giao_vien.service';

import type {
  DuLieuCapNhatGiaoVien,
  DuLieuTaoGiaoVien,
} from './giao_vien.service';


interface RequestCoNguoiDung extends Request {
  nguoi_dung?: {
    sub: number;
    vai_tro: string;
    phai_doi_mat_khau: boolean;
  };
  // =========================================
  // CHỨC NĂNG 3: CẬP NHẬT GIÁO VIÊN
  // PATCH /giao_vien/:id
  // =========================================

  @UseGuards(JwtAuthGuard)
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
    if (
      request.nguoi_dung?.vai_tro !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Chỉ Admin được cập nhật giáo viên',
      );
    }

    return this.giaoVienService.capNhatGiaoVien(
      id,
      body,
    );
  }


  // =========================================
  // CHỨC NĂNG 4: CẤP LẠI MẬT KHẨU GIÁO VIÊN
  // POST /giao_vien/:id/cap_lai_mat_khau
  // =========================================

  @UseGuards(JwtAuthGuard)
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
    if (
      request.nguoi_dung?.vai_tro !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Chỉ Admin được cấp lại mật khẩu giáo viên',
      );
    }

    return this.giaoVienService.capLaiMatKhauGiaoVien(
      id,
    );
  }


}


@Controller('giao_vien')
export class GiaoVienController {

  constructor(
    private readonly giaoVienService: GiaoVienService,
  ) {}


  // =========================================
  // CHỨC NĂNG 1: THÊM GIÁO VIÊN
  // POST /giao_vien
  // =========================================

  @UseGuards(JwtAuthGuard)
  @Post()
  taoGiaoVien(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: DuLieuTaoGiaoVien,
  ) {

    if (
      request.nguoi_dung?.vai_tro !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Chỉ Admin được thêm giáo viên',
      );
    }

    return this.giaoVienService.taoGiaoVien(
      body,
    );
  }


  // =========================================
  // CHỨC NĂNG 2: XEM / TÌM DANH SÁCH GIÁO VIÊN
  // GET /giao_vien
  // =========================================

  @UseGuards(JwtAuthGuard)
  @Get()
  layDanhSachGiaoVien(
    @Req()
    request: RequestCoNguoiDung,

    @Query('tu_khoa')
    tuKhoa?: string,

    @Query('trang_thai')
    trangThai?: string,
  ) {

    if (
      request.nguoi_dung?.vai_tro !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Chỉ Admin được xem danh sách giáo viên',
      );
    }

    return this.giaoVienService.layDanhSachGiaoVien(
      tuKhoa,
      trangThai,
    );
  }

}