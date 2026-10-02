import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
  DanhGiaHocTapService,
} from './danh_gia_hoc_tap.service';

import {
  CapNhatKetQuaMonHocDto,
  CapNhatNangLucPhamChatDto,
  CapNhatTongKetGiaoDucDto,
  NhapDiemDinhKyDto,
  NhapDiemKiemTraLaiDto,
  TaoCauHinhDanhGiaMonDto,
  TaoCauHinhDiemDto,
  TaoDotDanhGiaDto,
  TaoTieuChiDanhGiaDto,
} from './danh_gia_hoc_tap.dto';

interface RequestCoNguoiDung
  extends Request {
  nguoi_dung?: {
    sub: number;
    vai_tro: string;
    phai_doi_mat_khau: boolean;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('danh_gia_hoc_tap')
export class DanhGiaHocTapController {
  constructor(
    private readonly service:
      DanhGiaHocTapService,
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

    return nguoiDung;
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
  // ADMIN - CẤU HÌNH ĐÁNH GIÁ
  // ==================================================

  @Post('dot_danh_gia')
  taoDotDanhGia(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: TaoDotDanhGiaDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .taoDotDanhGia(body);
  }

  @Get('dot_danh_gia')
  layDanhSachDotDanhGia(
    @Req()
    request: RequestCoNguoiDung,

    @Query('nam_hoc_id')
    namHocId?: string,
  ) {
    this.layNguoiDung(request);

    return this.service
      .layDanhSachDotDanhGia(
        this.chuyenQuerySoNguyenDuong(
          namHocId,
          'Năm học',
        ),
      );
  }

  @Post('cau_hinh_danh_gia_mon')
  taoCauHinhDanhGiaMon(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: TaoCauHinhDanhGiaMonDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .taoCauHinhDanhGiaMon(
        body,
      );
  }

  @Get('cau_hinh_danh_gia_mon')
  layCauHinhDanhGiaMon(
    @Req()
    request: RequestCoNguoiDung,

    @Query('dot_danh_gia_id')
    dotDanhGiaId?: string,

    @Query('khoi_id')
    khoiId?: string,
  ) {
    this.layNguoiDung(request);

    return this.service
      .layCauHinhDanhGiaMon(
        this.chuyenQuerySoNguyenDuong(
          dotDanhGiaId,
          'Đợt đánh giá',
        ),

        this.chuyenQuerySoNguyenDuong(
          khoiId,
          'Khối',
        ),
      );
  }

  @Post('cau_hinh_diem')
  taoCauHinhDiem(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: TaoCauHinhDiemDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .taoCauHinhDiem(body);
  }

  @Get('cau_hinh_diem')
  layCauHinhDiem(
    @Req()
    request: RequestCoNguoiDung,

    @Query('dot_danh_gia_id')
    dotDanhGiaId?: string,

    @Query('khoi_id')
    khoiId?: string,

    @Query('mon_hoc_id')
    monHocId?: string,
  ) {
    this.layNguoiDung(request);

    return this.service
      .layCauHinhDiem(
        this.chuyenQuerySoNguyenDuong(
          dotDanhGiaId,
          'Đợt đánh giá',
        ),

        this.chuyenQuerySoNguyenDuong(
          khoiId,
          'Khối',
        ),

        this.chuyenQuerySoNguyenDuong(
          monHocId,
          'Môn học',
        ),
      );
  }

  @Post('tieu_chi_danh_gia')
  taoTieuChiDanhGia(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: TaoTieuChiDanhGiaDto,
  ) {
    this.kiemTraAdmin(request);

    return this.service
      .taoTieuChiDanhGia(body);
  }

  @Get('tieu_chi_danh_gia')
  layDanhSachTieuChi(
    @Req()
    request: RequestCoNguoiDung,

    @Query('nhom_danh_gia')
    nhomDanhGia?: string,
  ) {
    this.layNguoiDung(request);

    return this.service
      .layDanhSachTieuChi(
        nhomDanhGia,
      );
  }

  // ==================================================
  // GIÁO VIÊN
  // ==================================================

  @Get(
    'lop/:lop_hoc_id/hoc_sinh',
  )
  layHocSinhDeDanhGia(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'lop_hoc_id',
      ParseIntPipe,
    )
    lopHocId: number,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .layHocSinhDeDanhGia(
        nguoiDung.sub,
        lopHocId,
      );
  }

  @Put('ket_qua_mon_hoc')
  capNhatKetQuaMonHoc(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: CapNhatKetQuaMonHocDto,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .capNhatKetQuaMonHoc(
        nguoiDung.sub,
        body,
      );
  }

  @Post('diem_dinh_ky')
  nhapDiemDinhKy(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: NhapDiemDinhKyDto,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .nhapDiemDinhKy(
        nguoiDung.sub,
        body,
      );
  }

  @Post(
    'diem_dinh_ky/:id/kiem_tra_lai',
  )
  nhapDiemKiemTraLai(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: NhapDiemKiemTraLaiDto,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .nhapDiemKiemTraLai(
        nguoiDung.sub,
        id,
        body,
      );
  }

  @Put('nang_luc_pham_chat')
  capNhatNangLucPhamChat(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: CapNhatNangLucPhamChatDto,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .capNhatNangLucPhamChat(
        nguoiDung.sub,
        body,
      );
  }

  @Put('tong_ket_giao_duc')
  capNhatTongKetGiaoDuc(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: CapNhatTongKetGiaoDucDto,
  ) {
    const nguoiDung =
      this.kiemTraGiaoVien(
        request,
      );

    return this.service
      .capNhatTongKetGiaoDuc(
        nguoiDung.sub,
        body,
      );
  }

  // ==================================================
  // XEM KẾT QUẢ
  // ADMIN / GV
  // ==================================================

  @Get(
    'hoc_sinh/:hoc_sinh_id/dot/:dot_danh_gia_id',
  )
  layKetQuaHocSinhTheoDot(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    hocSinhId: number,

    @Param(
      'dot_danh_gia_id',
      ParseIntPipe,
    )
    dotDanhGiaId: number,
  ) {
    const nguoiDung =
      this.layNguoiDung(
        request,
      );

    if (
      ![
        'ADMIN',
        'GIAO_VIEN',
      ].includes(
        nguoiDung.vai_tro,
      )
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền sử dụng chức năng này',
      );
    }

    return this.service
      .layKetQuaHocSinhTheoDotChoNhanVien(
        nguoiDung.sub,
        nguoiDung.vai_tro,
        hocSinhId,
        dotDanhGiaId,
      );
  }

  // ==================================================
  // PHỤ HUYNH
  // ==================================================

  @Get(
    'con/:hoc_sinh_id/dot/:dot_danh_gia_id',
  )
  layKetQuaCuaCon(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    hocSinhId: number,

    @Param(
      'dot_danh_gia_id',
      ParseIntPipe,
    )
    dotDanhGiaId: number,
  ) {
    const nguoiDung =
      this.kiemTraPhuHuynh(
        request,
      );

    return this.service
      .layKetQuaCuaCon(
        nguoiDung.sub,
        hocSinhId,
        dotDanhGiaId,
      );
  }
}