import {
  BadRequestException,
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
    private readonly Service:
      ToChucLopHocService,
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

  private ChuyenQuerySoNguyenDuong(
    GiaTri: string | undefined,
    TenTruong: string,
  ): number | undefined {
    if (
      GiaTri === undefined ||
      GiaTri.trim() === ''
    ) {
      return undefined;
    }

    const So =
      Number(GiaTri);

    if (
      !Number.isInteger(So) ||
      So <= 0
    ) {
      throw new BadRequestException(
        `${TenTruong} không hợp lệ`,
      );
    }

    return So;
  }

  // =========================================
  // NĂM HỌC
  // =========================================

  @Post('nam_hoc')
  TaoNamHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: TaoNamHocDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service.TaoNamHoc(
      Body,
    );
  }

  @Get('nam_hoc')
  LayDanhSachNamHoc(
    @Req()
    Request: RequestCoNguoiDung,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .LayDanhSachNamHoc();
  }

  @Patch('nam_hoc/:Id')
  CapNhatNamHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapNhatNamHocDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service.CapNhatNamHoc(
      Id,
      Body,
    );
  }

  // =========================================
  // KHỐI
  // =========================================

  @Get('khoi')
  LayDanhSachKhoi(
    @Req()
    Request: RequestCoNguoiDung,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .LayDanhSachKhoi();
  }

  // =========================================
  // LỚP
  // =========================================

  @Post('lop_hoc')
  TaoLopHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: TaoLopHocDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service.TaoLopHoc(
      Body,
    );
  }

  @Get('lop_hoc')
  LayDanhSachLopHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('nam_hoc_id')
    NamHocId?: string,

    @Query('khoi_id')
    KhoiId?: string,

    @Query('tu_khoa')
    TuKhoa?: string,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .LayDanhSachLopHoc(
        this.ChuyenQuerySoNguyenDuong(
          NamHocId,
          'Năm học',
        ),

        this.ChuyenQuerySoNguyenDuong(
          KhoiId,
          'Khối',
        ),

        TuKhoa,
      );
  }

  @Get('lop_hoc/:Id')
  LayChiTietLopHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .LayChiTietLopHoc(Id);
  }

  @Patch('lop_hoc/:Id')
  CapNhatLopHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapNhatLopHocDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .CapNhatLopHoc(
        Id,
        Body,
      );
  }

  // =========================================
  // XẾP LỚP
  // =========================================

  @Get('hoc_sinh_chua_xep_lop')
  LayHocSinhChuaXepLop(
    @Req()
    Request: RequestCoNguoiDung,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .LayHocSinhChuaXepLop();
  }

  @Post('xep_lop')
  XepHocSinhVaoLop(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: XepHocSinhVaoLopDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .XepHocSinhVaoLop(Body);
  }

  @Get(
    'xep_lop/hoc_sinh/:hoc_sinh_id',
  )
  LayLichSuXepLop(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    HocSinhId: number,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .layLichSuXepLopHocSinh(
        HocSinhId,
      );
  }

  @Patch('xep_lop/:Id')
  CapNhatXepLop(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapNhatXepLopDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .CapNhatXepLop(
        Id,
        Body,
      );
  }
}