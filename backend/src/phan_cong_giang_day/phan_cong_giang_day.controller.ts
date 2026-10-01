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
  PhanCongGiangDayService,
} from './phan_cong_giang_day.service';

import {
  CapNhatMonHocDto,
  CapNhatMonHocKhoiDto,
  GanMonHocChoKhoiDto,
  KetThucPhanCongDto,
  PhanCongGvcnDto,
  PhanCongMonHocDto,
  TaoMonHocDto,
} from './phan_cong_giang_day.dto';

interface RequestCoNguoiDung
  extends Request {
  nguoi_dung?: {
    sub: number;
    vai_tro: string;
    phai_doi_mat_khau: boolean;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('phan_cong_giang_day')
export class PhanCongGiangDayController {
  constructor(
    private readonly service:
      PhanCongGiangDayService,
  ) {}

  private layNguoiDung(
    request: RequestCoNguoiDung,
  ) {
    if (!request.nguoi_dung) {
      throw new ForbiddenException(
        'Không xác định được người dùng',
      );
    }

    return request.nguoi_dung;
  }

  private kiemTraAdmin(
    request: RequestCoNguoiDung,
  ) {
    const nguoiDung =
      this.layNguoiDung(request);

    if (
      nguoiDung.vai_tro !==
      'ADMIN'
    ) {
      throw new ForbiddenException(
        'Chỉ Admin được thực hiện chức năng này',
      );
    }
  }

  private chuyenQuerySoNguyenDuong(
    giaTri: string | undefined,
    tenTruong: string,
  ): number | undefined {
    if (
      giaTri === undefined ||
      giaTri.trim() === ''
    ) {
      return undefined;
    }

    const so =
      Number(giaTri);

    if (
      !Number.isInteger(so) ||
      so <= 0
    ) {
      throw new BadRequestException(
        `${tenTruong} không hợp lệ`,
      );
    }

    return so;
  }

  // ==================================================
  // MÔN HỌC
  // ==================================================

  @Post('mon_hoc')
  taoMonHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: TaoMonHocDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service.taoMonHoc(
      body,
    );
  }

  @Get('mon_hoc')
  layDanhSachMonHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Query('tu_khoa')
    tuKhoa?: string,

    @Query('trang_thai')
    trangThai?: string,
  ) {
    this.layNguoiDung(request);

    return this.service
      .layDanhSachMonHoc(
        tuKhoa,
        trangThai,
      );
  }

  @Patch('mon_hoc/:id')
  capNhatMonHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: CapNhatMonHocDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service.capNhatMonHoc(
      id,
      body,
    );
  }

  // ==================================================
  // MÔN HỌC - KHỐI
  // ==================================================

  @Post('mon_hoc_khoi')
  ganMonHocChoKhoi(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: GanMonHocChoKhoiDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .ganMonHocChoKhoi(body);
  }

  @Get('mon_hoc_khoi')
  layDanhSachMonHocKhoi(
    @Req()
    request: RequestCoNguoiDung,

    @Query('khoi_id')
    khoiId?: string,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .layDanhSachMonHocKhoi(
        this.chuyenQuerySoNguyenDuong(
          khoiId,
          'Khối',
        ),
      );
  }

  @Patch('mon_hoc_khoi/:id')
  capNhatMonHocKhoi(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: CapNhatMonHocKhoiDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .capNhatMonHocKhoi(
        id,
        body,
      );
  }

  // ==================================================
  // PHÂN CÔNG
  // ==================================================

  @Post('phan_cong/gvcn')
  phanCongGvcn(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: PhanCongGvcnDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .phanCongGvcn(body);
  }

  @Post('phan_cong/mon_hoc')
  phanCongMonHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: PhanCongMonHocDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .phanCongMonHoc(body);
  }

  @Get('phan_cong')
  layDanhSachPhanCong(
    @Req()
    request: RequestCoNguoiDung,

    @Query('lop_hoc_id')
    lopHocId?: string,

    @Query('giao_vien_id')
    giaoVienId?: string,

    @Query('loai_phan_cong')
    loaiPhanCong?: string,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .layDanhSachPhanCong(
        this.chuyenQuerySoNguyenDuong(
          lopHocId,
          'Lớp học',
        ),

        this.chuyenQuerySoNguyenDuong(
          giaoVienId,
          'Giáo viên',
        ),

        loaiPhanCong,
      );
  }

  @Get('phan_cong/cua_toi')
  layPhanCongCuaToi(
    @Req()
    request: RequestCoNguoiDung,
  ) {
    const nguoiDung =
      this.layNguoiDung(request);

    if (
      nguoiDung.vai_tro !==
      'GIAO_VIEN'
    ) {
      throw new ForbiddenException(
        'Chỉ giáo viên được sử dụng chức năng này',
      );
    }

    return this.service
      .layPhanCongCuaToi(
        nguoiDung.sub,
      );
  }

  @Patch(
    'phan_cong/:id/ket_thuc',
  )
  ketThucPhanCong(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: KetThucPhanCongDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .ketThucPhanCong(
        id,
        body,
      );
  }
}