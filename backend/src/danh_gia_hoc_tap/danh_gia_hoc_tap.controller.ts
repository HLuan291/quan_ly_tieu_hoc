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
    private readonly Service:
      DanhGiaHocTapService,
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

    return NguoiDung;
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
  // ADMIN - CẤU HÌNH ĐÁNH GIÁ
  // ==================================================

  @Post('dot_danh_gia')
  TaoDotDanhGia(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: TaoDotDanhGiaDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .TaoDotDanhGia(Body);
  }

  @Get('dot_danh_gia')
  LayDanhSachDotDanhGia(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('nam_hoc_id')
    NamHocId?: string,
  ) {
    this.LayNguoiDung(Request);

    return this.Service
      .LayDanhSachDotDanhGia(
        this.ChuyenQuerySoNguyenDuong(
          NamHocId,
          'Năm học',
        ),
      );
  }

  @Post('cau_hinh_danh_gia_mon')
  TaoCauHinhDanhGiaMon(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: TaoCauHinhDanhGiaMonDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .TaoCauHinhDanhGiaMon(
        Body,
      );
  }

  @Get('cau_hinh_danh_gia_mon')
  LayCauHinhDanhGiaMon(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('dot_danh_gia_id')
    DotDanhGiaId?: string,

    @Query('khoi_id')
    KhoiId?: string,
  ) {
    this.LayNguoiDung(Request);

    return this.Service
      .LayCauHinhDanhGiaMon(
        this.ChuyenQuerySoNguyenDuong(
          DotDanhGiaId,
          'Đợt đánh giá',
        ),

        this.ChuyenQuerySoNguyenDuong(
          KhoiId,
          'Khối',
        ),
      );
  }

  @Post('cau_hinh_diem')
  TaoCauHinhDiem(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: TaoCauHinhDiemDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .TaoCauHinhDiem(Body);
  }

  @Get('cau_hinh_diem')
  LayCauHinhDiem(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('dot_danh_gia_id')
    DotDanhGiaId?: string,

    @Query('khoi_id')
    KhoiId?: string,

    @Query('mon_hoc_id')
    MonHocId?: string,
  ) {
    this.LayNguoiDung(Request);

    return this.Service
      .LayCauHinhDiem(
        this.ChuyenQuerySoNguyenDuong(
          DotDanhGiaId,
          'Đợt đánh giá',
        ),

        this.ChuyenQuerySoNguyenDuong(
          KhoiId,
          'Khối',
        ),

        this.ChuyenQuerySoNguyenDuong(
          MonHocId,
          'Môn học',
        ),
      );
  }

  @Post('tieu_chi_danh_gia')
  TaoTieuChiDanhGia(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: TaoTieuChiDanhGiaDto,
  ) {
    this.KiemTraAdmin(Request);

    return this.Service
      .TaoTieuChiDanhGia(Body);
  }

  @Get('tieu_chi_danh_gia')
  LayDanhSachTieuChi(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('nhom_danh_gia')
    nhomDanhGia?: string,
  ) {
    this.LayNguoiDung(Request);

    return this.Service
      .LayDanhSachTieuChi(
        nhomDanhGia,
      );
  }

  // ==================================================
  // GIÁO VIÊN
  // ==================================================

  @Get(
    'lop/:lop_hoc_id/hoc_sinh',
  )
  LayHocSinhDeDanhGia(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'lop_hoc_id',
      ParseIntPipe,
    )
    lopHocId: number,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .LayHocSinhDeDanhGia(
        NguoiDung.sub,
        lopHocId,
      );
  }

  @Put('ket_qua_mon_hoc')
  CapNhatKetQuaMonHoc(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: CapNhatKetQuaMonHocDto,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .CapNhatKetQuaMonHoc(
        NguoiDung.sub,
        Body,
      );
  }

  @Post('diem_dinh_ky')
  NhapDiemDinhKy(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: NhapDiemDinhKyDto,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .NhapDiemDinhKy(
        NguoiDung.sub,
        Body,
      );
  }

  @Post(
    'diem_dinh_ky/:Id/kiem_tra_lai',
  )
  NhapDiemKiemTraLai(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: NhapDiemKiemTraLaiDto,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .NhapDiemKiemTraLai(
        NguoiDung.sub,
        Id,
        Body,
      );
  }

  @Put('nang_luc_pham_chat')
  CapNhatNangLucPhamChat(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: CapNhatNangLucPhamChatDto,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .CapNhatNangLucPhamChat(
        NguoiDung.sub,
        Body,
      );
  }

  @Put('tong_ket_giao_duc')
  CapNhatTongKetGiaoDuc(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: CapNhatTongKetGiaoDucDto,
  ) {
    const NguoiDung =
      this.KiemTraGiaoVien(
        Request,
      );

    return this.Service
      .CapNhatTongKetGiaoDuc(
        NguoiDung.sub,
        Body,
      );
  }

  // ==================================================
  // XEM KẾT QUẢ
  // ADMIN / GV
  // ==================================================

  @Get(
    'hoc_sinh/:hoc_sinh_id/dot/:dot_danh_gia_id',
  )
  LayKetQuaHocSinhTheoDot(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    HocSinhId: number,

    @Param(
      'dot_danh_gia_id',
      ParseIntPipe,
    )
    DotDanhGiaId: number,
  ) {
    const NguoiDung =
      this.LayNguoiDung(
        Request,
      );

    if (
      ![
        'ADMIN',
        'GIAO_VIEN',
      ].includes(
        NguoiDung.vai_tro,
      )
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền sử dụng chức năng này',
      );
    }

    return this.Service
      .LayKetQuaHocSinhTheoDotChoNhanVien(
        NguoiDung.sub,
        NguoiDung.vai_tro,
        HocSinhId,
        DotDanhGiaId,
      );
  }

  // ==================================================
  // PHỤ HUYNH
  // ==================================================

  @Get(
    'con/:hoc_sinh_id/dot/:dot_danh_gia_id',
  )
  LayKetQuaCuaCon(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    HocSinhId: number,

    @Param(
      'dot_danh_gia_id',
      ParseIntPipe,
    )
    DotDanhGiaId: number,
  ) {
    const NguoiDung =
      this.KiemTraPhuHuynh(
        Request,
      );

    return this.Service
      .LayKetQuaCuaCon(
        NguoiDung.sub,
        HocSinhId,
        DotDanhGiaId,
      );
  }
  @Get('bang_danh_gia')
  LayBangDanhGia(
    @Req() Request: RequestCoNguoiDung,
    @Query('lop_hoc_id') LopHocId?: string,
    @Query('dot_danh_gia_id') DotId?: string,
    @Query('mon_hoc_id') MonHocId?: string,
  ) {
    const NguoiDung = this.LayNguoiDung(Request);
    const Lop = this.ChuyenQuerySoNguyenDuong(LopHocId, 'Lớp');
    const Dot = this.ChuyenQuerySoNguyenDuong(DotId, 'Đợt đánh giá');
    if (!Lop || !Dot) throw new BadRequestException('Cần chọn lớp và đợt đánh giá');
    return this.Service.LayBangDanhGia(NguoiDung.sub, NguoiDung.vai_tro, Lop, Dot, this.ChuyenQuerySoNguyenDuong(MonHocId, 'Môn học'));
  }

  @Get('thong_ke_danh_gia')
  LayThongKeDanhGia(
    @Req() Request: RequestCoNguoiDung,
    @Query('dot_danh_gia_id') DotId?: string,
    @Query('khoi_id') KhoiId?: string,
    @Query('lop_hoc_id') LopHocId?: string,
  ) {
    const NguoiDung = this.LayNguoiDung(Request);
    const Dot = this.ChuyenQuerySoNguyenDuong(DotId, 'Đợt đánh giá');
    if (!Dot) throw new BadRequestException('Cần chọn đợt đánh giá');
    return this.Service.LayThongKeDanhGia(NguoiDung.sub, NguoiDung.vai_tro, Dot,
      this.ChuyenQuerySoNguyenDuong(KhoiId, 'Khối'), this.ChuyenQuerySoNguyenDuong(LopHocId, 'Lớp'));
  }
}
