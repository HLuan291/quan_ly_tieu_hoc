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
} from './diem_danh_nghi_hoc.service';

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
    private readonly service:
      DiemDanhNghiHocService,
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

  private kiemTraGiaoVien(
    request: RequestCoNguoiDung,
  ) {
    const nguoiDung =
      this.layNguoiDung(request);

    if (
      nguoiDung.vai_tro !==
      'GIAO_VIEN'
    ) {
      throw new ForbiddenException(
        'Chỉ giáo viên được thực hiện chức năng này',
      );
    }

    return nguoiDung;
  }

  private kiemTraPhuHuynh(
    request: RequestCoNguoiDung,
  ) {
    const nguoiDung =
      this.layNguoiDung(request);

    if (
      nguoiDung.vai_tro !==
      'PHU_HUYNH'
    ) {
      throw new ForbiddenException(
        'Chỉ phụ huynh được thực hiện chức năng này',
      );
    }

    return nguoiDung;
  }

  // ==================================================
  // ĐIỂM DANH
  // ==================================================

  @Get('lop_chu_nhiem_cua_toi')
  layLopChuNhiemCuaToi(
    @Req()
    request: RequestCoNguoiDung,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .layLopChuNhiemCuaToi(
        nguoiDung.sub,
      );
  }

  @Get('diem_danh')
  laySoDiemDanh(
    @Req()
    request: RequestCoNguoiDung,

    @Query('lop_hoc_id')
    lopHocId: string,

    @Query('ngay_hoc')
    ngayHoc: string,

    @Query('buoi_hoc')
    buoiHoc: string,
  ) {
    const nguoiDung =
      this.layNguoiDung(
        request,
      );

    if (
      !lopHocId ||
      !ngayHoc ||
      !buoiHoc
    ) {
      throw new BadRequestException(
        'Thiếu thông tin lớp, ngày học hoặc buổi học',
      );
    }

    const lopHocIdSo =
      Number(lopHocId);

    if (
      !Number.isInteger(
        lopHocIdSo,
      ) ||
      lopHocIdSo <= 0
    ) {
      throw new BadRequestException(
        'Lớp học không hợp lệ',
      );
    }

    return this.service
      .laySoDiemDanh(
        nguoiDung.sub,
        nguoiDung.vai_tro,
        lopHocIdSo,
        ngayHoc,
        buoiHoc,
      );
  }

  @Post('diem_danh')
  diemDanhHangLoat(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: DiemDanhHangLoatDto,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .diemDanhHangLoat(
        nguoiDung.sub,
        body,
      );
  }

  @Get(
    'diem_danh/con/:hoc_sinh_id',
  )
  layDiemDanhCuaCon(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    hocSinhId: number,

    @Query('tu_ngay')
    tuNgay?: string,

    @Query('den_ngay')
    denNgay?: string,
  ) {
    const nguoiDung =
      this.kiemTraPhuHuynh(
        request,
      );

    return this.service
      .layDiemDanhCuaCon(
        nguoiDung.sub,
        hocSinhId,
        tuNgay,
        denNgay,
      );
  }

  // ==================================================
  // ĐƠN XIN NGHỈ
  // ==================================================

  @Post('don_xin_nghi')
  taoDonXinNghi(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: TaoDonXinNghiDto,
  ) {
    const nguoiDung =
      this.kiemTraPhuHuynh(
        request,
      );

    return this.service
      .taoDonXinNghi(
        nguoiDung.sub,
        body,
      );
  }

  @Get('don_xin_nghi/cua_toi')
  layDonXinNghiCuaToi(
    @Req()
    request: RequestCoNguoiDung,
  ) {
    const nguoiDung =
      this.kiemTraPhuHuynh(
        request,
      );

    return this.service
      .layDonXinNghiCuaToi(
        nguoiDung.sub,
      );
  }

  @Get(
    'don_xin_nghi/lop/:lop_hoc_id',
  )
  layDonXinNghiCuaLop(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'lop_hoc_id',
      ParseIntPipe,
    )
    lopHocId: number,

    @Query('trang_thai')
    trangThai?: string,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .layDonXinNghiCuaLop(
        nguoiDung.sub,
        lopHocId,
        trangThai,
      );
  }

  @Patch(
    'don_xin_nghi/:id/xu_ly',
  )
  xuLyDonXinNghi(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: XuLyDonXinNghiDto,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .xuLyDonXinNghi(
        nguoiDung.sub,
        id,
        body,
      );
  }
}