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
  ToChucLopHocService,
} from './to_chuc_lop_hoc.service';

import {
  CapNhatLopHocDto,
  CapNhatNamHocDto,
  CapNhatXepLopDto,
  TaoLopHocDto,
  TaoNamHocDto,
  XepHocSinhVaoLopDto,
} from './to_chuc_lop_hoc.dto';

interface RequestCoNguoiDung
  extends Request {
  nguoi_dung?: {
    sub: number;
    vai_tro: string;
    phai_doi_mat_khau: boolean;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('to_chuc_lop_hoc')
export class ToChucLopHocController {
  constructor(
    private readonly service:
      ToChucLopHocService,
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
  // NĂM HỌC
  // =========================================

  @Post('nam_hoc')
  taoNamHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: TaoNamHocDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service.taoNamHoc(
      body,
    );
  }

  @Get('nam_hoc')
  layDanhSachNamHoc(
    @Req()
    request: RequestCoNguoiDung,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .layDanhSachNamHoc();
  }

  @Patch('nam_hoc/:id')
  capNhatNamHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: CapNhatNamHocDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service.capNhatNamHoc(
      id,
      body,
    );
  }

  // =========================================
  // KHỐI
  // =========================================

  @Get('khoi')
  layDanhSachKhoi(
    @Req()
    request: RequestCoNguoiDung,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .layDanhSachKhoi();
  }

  // =========================================
  // LỚP
  // =========================================

  @Post('lop_hoc')
  taoLopHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: TaoLopHocDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service.taoLopHoc(
      body,
    );
  }

  @Get('lop_hoc')
  layDanhSachLopHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Query('nam_hoc_id')
    namHocId?: string,

    @Query('khoi_id')
    khoiId?: string,

    @Query('tu_khoa')
    tuKhoa?: string,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .layDanhSachLopHoc(
        namHocId
          ? Number(namHocId)
          : undefined,

        khoiId
          ? Number(khoiId)
          : undefined,

        tuKhoa,
      );
  }

  @Get('lop_hoc/:id')
  layChiTietLopHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .layChiTietLopHoc(id);
  }

  @Patch('lop_hoc/:id')
  capNhatLopHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: CapNhatLopHocDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .capNhatLopHoc(
        id,
        body,
      );
  }

  // =========================================
  // XẾP LỚP
  // =========================================

  @Get('hoc_sinh_chua_xep_lop')
  layHocSinhChuaXepLop(
    @Req()
    request: RequestCoNguoiDung,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .layHocSinhChuaXepLop();
  }

  @Post('xep_lop')
  xepHocSinhVaoLop(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: XepHocSinhVaoLopDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .xepHocSinhVaoLop(body);
  }

  @Get(
    'xep_lop/hoc_sinh/:hoc_sinh_id',
  )
  layLichSuXepLop(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    hocSinhId: number,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .layLichSuXepLopHocSinh(
        hocSinhId,
      );
  }

  @Patch('xep_lop/:id')
  capNhatXepLop(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: CapNhatXepLopDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .capNhatXepLop(
        id,
        body,
      );
  }
}