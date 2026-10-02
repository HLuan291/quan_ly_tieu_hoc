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
  DiemDanhNghiHocService,
} from './diem_danh_nghi_hoc.Service';

import {
  DiemDanhHangLoatDto,
  TaoDonXinNghiDto,
  XuLyDonXinNghiDto,
} from './diem_danh_nghi_hoc.dto';

interface RequestCoNguoiDung
  extends Request {
  nguoi_dung?: {
    sub: number;
    vai_tro: string;
    phai_doi_mat_khau: boolean;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('diem_danh_nghi_hoc')
export class DiemDanhNghiHocController {
  constructor(
    private readonly Service:
      DiemDanhNghiHocService,
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

  private KiemTraGiaoVien(
    Request: RequestCoNguoiDung,
  ) {
    const NguoiDung =
      this.LayNguoiDung(Request);

    if (
      NguoiDung.vai_tro !==
      'GIAO_VIEN'
    ) {
      throw new ForbiddenException(
        'Chỉ giáo viên được thực hiện chức năng này',
      );
    }

    return NguoiDung;
  }

  private KiemTraPhuHuynh(
    Request: RequestCoNguoiDung,
  ) {
    const NguoiDung =
      this.LayNguoiDung(Request);

    if (
      NguoiDung.vai_tro !==
      'PHU_HUYNH'
    ) {
      throw new ForbiddenException(
        'Chỉ phụ huynh được thực hiện chức năng này',
      );
    }

    return NguoiDung;
  }

  // ==================================================
  // ĐIỂM DANH
  // ==================================================

  @Get('lop_chu_nhiem_cua_toi')
  LayLopChuNhiemCuaToi(
    @Req()
    Request: RequestCoNguoiDung,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .LayLopChuNhiemCuaToi(
        NguoiDung.sub,
      );
  }

  @Get('diem_danh')
  LaySoDiemDanh(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('lop_hoc_id')
    LopHocId: string,

    @Query('ngay_hoc')
    NgayHoc: string,

    @Query('buoi_hoc')
    BuoiHoc: string,
  ) {
    const NguoiDung =
      this.LayNguoiDung(
        Request,
      );

    if (
      !LopHocId ||
      !NgayHoc ||
      !BuoiHoc
    ) {
      throw new BadRequestException(
        'Thiếu thông tin lớp, ngày học hoặc buổi học',
      );
    }

    const LopHocIdSo =
      Number(LopHocId);

    if (
      !Number.isInteger(
        LopHocIdSo,
      ) ||
      LopHocIdSo <= 0
    ) {
      throw new BadRequestException(
        'Lớp học không hợp lệ',
      );
    }

    return this.Service
      .LaySoDiemDanh(
        NguoiDung.sub,
        NguoiDung.vai_tro,
        LopHocIdSo,
        NgayHoc,
        BuoiHoc,
      );
  }

  @Post('diem_danh')
  DiemDanhHangLoat(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: DiemDanhHangLoatDto,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .DiemDanhHangLoat(
        NguoiDung.sub,
        Body,
      );
  }

  @Get(
    'diem_danh/con/:hoc_sinh_id',
  )
  LayDiemDanhCuaCon(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    HocSinhId: number,

    @Query('tu_ngay')
    TuNgay?: string,

    @Query('den_ngay')
    DenNgay?: string,
  ) {
    const NguoiDung =
      this.KiemTraPhuHuynh(
        Request,
      );

    return this.Service
      .LayDiemDanhCuaCon(
        NguoiDung.sub,
        HocSinhId,
        TuNgay,
        DenNgay,
      );
  }

  // ==================================================
  // ĐƠN XIN NGHỈ
  // ==================================================

  @Post('don_xin_nghi')
  TaoDonXinNghi(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: TaoDonXinNghiDto,
  ) {
    const NguoiDung =
      this.KiemTraPhuHuynh(
        Request,
      );

    return this.Service
      .TaoDonXinNghi(
        NguoiDung.sub,
        Body,
      );
  }

  @Get('don_xin_nghi/cua_toi')
  LayDonXinNghiCuaToi(
    @Req()
    Request: RequestCoNguoiDung,
  ) {
    const NguoiDung =
      this.KiemTraPhuHuynh(
        Request,
      );

    return this.Service
      .LayDonXinNghiCuaToi(
        NguoiDung.sub,
      );
  }

  @Get(
    'don_xin_nghi/lop/:lop_hoc_id',
  )
  LayDonXinNghiCuaLop(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'lop_hoc_id',
      ParseIntPipe,
    )
    LopHocId: number,

    @Query('trang_thai')
    TrangThai?: string,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .LayDonXinNghiCuaLop(
        NguoiDung.sub,
        LopHocId,
        TrangThai,
      );
  }

  @Patch(
    'don_xin_nghi/:id/xu_ly',
  )
  XuLyDonXinNghi(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    Body: XuLyDonXinNghiDto,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .XuLyDonXinNghi(
        NguoiDung.sub,
        id,
        Body,
      );
  }
}