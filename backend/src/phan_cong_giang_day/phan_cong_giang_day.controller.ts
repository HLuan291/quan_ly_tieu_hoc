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
    private readonly Service:
      PhanCongGiangDayService,
  ) {}

  private LayNguoiDung(
    Request: RequestCoNguoiDung,
  ) {
    if (!Request.nguoi_dung) {
      throw new ForbiddenException(
        'Không xác định được người dùng',
      );
    }

    return Request.nguoi_dung;
  }

  private KiemTraAdmin(
    Request: RequestCoNguoiDung,
  ) {
    const NguoiDung =
      this.LayNguoiDung(Request);

    if (
      NguoiDung.vai_tro !==
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

  // ==================================================
  // MÔN HỌC
  // ==================================================

  @Post('mon_hoc')
  TaoMonHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: TaoMonHocDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service.TaoMonHoc(
      Body,
    );
  }

  @Get('mon_hoc')
  LayDanhSachMonHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('tu_khoa')
    TuKhoa?: string,

    @Query('trang_thai')
    TrangThai?: string,
  ) {
    this.LayNguoiDung(Request);

    return this.Service
      .LayDanhSachMonHoc(
        TuKhoa,
        TrangThai,
      );
  }

  @Patch('mon_hoc/:Id')
  CapNhatMonHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapNhatMonHocDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service.CapNhatMonHoc(
      Id,
      Body,
    );
  }

  // ==================================================
  // MÔN HỌC - KHỐI
  // ==================================================

  @Post('mon_hoc_khoi')
  GanMonHocChoKhoi(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: GanMonHocChoKhoiDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .GanMonHocChoKhoi(Body);
  }

  @Get('mon_hoc_khoi')
  LayDanhSachMonHocKhoi(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('khoi_id')
    KhoiId?: string,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .LayDanhSachMonHocKhoi(
        this.ChuyenQuerySoNguyenDuong(
          KhoiId,
          'Khối',
        ),
      );
  }

  @Patch('mon_hoc_khoi/:Id')
  CapNhatMonHocKhoi(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapNhatMonHocKhoiDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .CapNhatMonHocKhoi(
        Id,
        Body,
      );
  }

  // ==================================================
  // PHÂN CÔNG
  // ==================================================

  @Post('phan_cong/gvcn')
  PhanCongGvcn(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: PhanCongGvcnDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .PhanCongGvcn(Body);
  }

  @Post('phan_cong/mon_hoc')
  PhanCongMonHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: PhanCongMonHocDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .PhanCongMonHoc(Body);
  }

  @Get('phan_cong')
  LayDanhSachPhanCong(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('lop_hoc_id')
    LopHocId?: string,

    @Query('giao_vien_id')
    GiaoVienId?: string,

    @Query('loai_phan_cong')
    LoaiPhanCong?: string,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .LayDanhSachPhanCong(
        this.ChuyenQuerySoNguyenDuong(
          LopHocId,
          'Lớp học',
        ),

        this.ChuyenQuerySoNguyenDuong(
          GiaoVienId,
          'Giáo viên',
        ),

        LoaiPhanCong,
      );
  }

  @Get('phan_cong/cua_toi')
  LayPhanCongCuaToi(
    @Req()
    Request: RequestCoNguoiDung,
  ) {
    const NguoiDung =
      this.LayNguoiDung(Request);

    if (
      NguoiDung.vai_tro !==
      'GIAO_VIEN'
    ) {
      throw new ForbiddenException(
        'Chỉ giáo viên được sử dụng chức năng này',
      );
    }

    return this.Service
      .LayPhanCongCuaToi(
        NguoiDung.sub,
      );
  }

  @Patch(
    'phan_cong/:Id/ket_thuc',
  )
  KetThucPhanCong(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: KetThucPhanCongDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .KetThucPhanCong(
        Id,
        Body,
      );
  }
}