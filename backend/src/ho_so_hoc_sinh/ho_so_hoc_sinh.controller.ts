import {
  Body,
  Controller,
  Delete,
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
  HoSoHocSinhService,
} from './ho_so_hoc_sinh.service';

import type {
  NguoiDungJwt,
} from './ho_so_hoc_sinh.service';

import {
  CapNhatHocSinhDto,
  CapNhatMoiQuanHeDto,
  CapNhatPhuHuynhDto,
  CapNhatSucKhoeHocSinhDto,
  CapNhatTrangThaiHocSinhDto,
  TaoHocSinhKemPhuHuynhDto,
  ThongTinPhuHuynhDto,
} from './ho_so_hoc_sinh.dto';


interface RequestCoNguoiDung
  extends Request {

  nguoi_dung?: NguoiDungJwt;
}


@Controller('ho_so_hoc_sinh')
export class HoSoHocSinhController {

  constructor(
    private readonly HoSoHocSinhService:
      HoSoHocSinhService,
  ) {}


  private LayNguoiDung(
    Request: RequestCoNguoiDung,
  ): NguoiDungJwt {

    if (
      !Request.nguoi_dung
    ) {
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
      this.LayNguoiDung(
        Request,
      );


    if (
      NguoiDung.vai_tro !==
      'ADMIN'
    ) {
      throw new ForbiddenException(
        'Chỉ Admin được thực hiện chức năng này',
      );
    }
  }


  // ==================================================
  // HỌC SINH
  // ==================================================


  // POST /ho_so_hoc_sinh/hoc_sinh

  @UseGuards(JwtAuthGuard)
  @Post('hoc_sinh')
  TaoHocSinh(
    @Req()
    Request: RequestCoNguoiDung,

    @Body()
    Body: TaoHocSinhKemPhuHuynhDto,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .TaoHocSinhKemPhuHuynh(
        Body,
      );
  }


  // GET /ho_so_hoc_sinh/hoc_sinh
  // Admin / GV / PH đều dùng
  // nhưng Service tự giới hạn dữ liệu

  @UseGuards(JwtAuthGuard)
  @Get('hoc_sinh')
  LayDanhSachHocSinh(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('tu_khoa')
    TuKhoa?: string,

    @Query('trang_thai')
    TrangThai?: string,
  ) {

    return this.HoSoHocSinhService
      .LayDanhSachHocSinh(
        this.LayNguoiDung(
          Request,
        ),
        TuKhoa,
        TrangThai,
      );
  }


  // GET /ho_so_hoc_sinh/hoc_sinh/:Id

  @UseGuards(JwtAuthGuard)
  @Get('hoc_sinh/:Id')
  LayChiTietHocSinh(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,
  ) {

    return this.HoSoHocSinhService
      .LayChiTietHocSinh(
        this.LayNguoiDung(
          Request,
        ),
        Id,
      );
  }


  // PATCH /ho_so_hoc_sinh/hoc_sinh/:Id

  @UseGuards(JwtAuthGuard)
  @Patch('hoc_sinh/:Id')
  CapNhatHocSinh(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapNhatHocSinhDto,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .CapNhatHocSinh(
        Id,
        Body,
      );
  }


  // PATCH /ho_so_hoc_sinh/hoc_sinh/:Id/trang_thai

  @UseGuards(JwtAuthGuard)
  @Patch(
    'hoc_sinh/:Id/trang_thai',
  )
  CapNhatTrangThaiHocSinh(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapNhatTrangThaiHocSinhDto,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .CapNhatTrangThaiHocSinh(
        Id,
        Body,
      );
  }


  // PATCH /ho_so_hoc_sinh/hoc_sinh/:Id/suc_khoe

  @UseGuards(JwtAuthGuard)
  @Patch(
    'hoc_sinh/:Id/suc_khoe',
  )
  CapNhatSucKhoeHocSinh(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapNhatSucKhoeHocSinhDto,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .CapNhatSucKhoeHocSinh(
        Id,
        Body,
      );
  }


  // ==================================================
  // PHỤ HUYNH
  // ==================================================


  // GET /ho_so_hoc_sinh/phu_huynh
  // Admin dùng để tìm PH đã có

  @UseGuards(JwtAuthGuard)
  @Get('phu_huynh')
  LayDanhSachPhuHuynh(
    @Req()
    Request: RequestCoNguoiDung,

    @Query('tu_khoa')
    TuKhoa?: string,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .LayDanhSachPhuHuynh(
        TuKhoa,
      );
  }


  // Lưu ý route "me" đặt trước ":Id"

  @UseGuards(JwtAuthGuard)
  @Get('phu_huynh/me')
  LayPhuHuynhCuaToi(
    @Req()
    Request: RequestCoNguoiDung,
  ) {

    const NguoiDung =
      this.LayNguoiDung(
        Request,
      );


    if (
      NguoiDung.vai_tro !==
      'PHU_HUYNH'
    ) {
      throw new ForbiddenException(
        'Chỉ phụ huynh được sử dụng chức năng này',
      );
    }


    return this.HoSoHocSinhService
      .LayPhuHuynhCuaToi(
        NguoiDung.sub,
      );
  }


  // GET /ho_so_hoc_sinh/phu_huynh/:Id

  @UseGuards(JwtAuthGuard)
  @Get('phu_huynh/:Id')
  LayChiTietPhuHuynh(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .LayChiTietPhuHuynh(
        Id,
      );
  }


  // PATCH /ho_so_hoc_sinh/phu_huynh/:Id

  @UseGuards(JwtAuthGuard)
  @Patch('phu_huynh/:Id')
  CapNhatPhuHuynh(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,

    @Body()
    Body: CapNhatPhuHuynhDto,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .CapNhatPhuHuynh(
        Id,
        Body,
      );
  }


  // POST /ho_so_hoc_sinh/phu_huynh/:Id/tao_tai_khoan

  @UseGuards(JwtAuthGuard)
  @Post(
    'phu_huynh/:Id/tao_tai_khoan',
  )
  TaoTaiKhoanPhuHuynh(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .TaoTaiKhoanPhuHuynh(
        Id,
      );
  }


  // POST /ho_so_hoc_sinh/phu_huynh/:Id/cap_lai_mat_khau

  @UseGuards(JwtAuthGuard)
  @Post(
    'phu_huynh/:Id/cap_lai_mat_khau',
  )
  CapLaiMatKhauPhuHuynh(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    Id: number,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .CapLaiMatKhauPhuHuynh(
        Id,
      );
  }


  // ==================================================
  // LIÊN KẾT HS - PH
  // ==================================================


  // POST /ho_so_hoc_sinh/hoc_sinh/:Id/phu_huynh

  @UseGuards(JwtAuthGuard)
  @Post(
    'hoc_sinh/:Id/phu_huynh',
  )
  ThemPhuHuynhVaoHocSinh(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'Id',
      ParseIntPipe,
    )
    HocSinhId: number,

    @Body()
    Body: ThongTinPhuHuynhDto,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .ThemPhuHuynhVaoHocSinh(
        HocSinhId,
        Body,
      );
  }


  // PATCH .../phu_huynh/:phu_huynh_id/moi_quan_he

  @UseGuards(JwtAuthGuard)
  @Patch(
    'hoc_sinh/:hoc_sinh_id/phu_huynh/:phu_huynh_id/moi_quan_he',
  )
  CapNhatMoiQuanHe(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    HocSinhId: number,

    @Param(
      'phu_huynh_id',
      ParseIntPipe,
    )
    PhuHuynhId: number,

    @Body()
    Body: CapNhatMoiQuanHeDto,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .CapNhatMoiQuanHe(
        HocSinhId,
        PhuHuynhId,
        Body,
      );
  }


  // DELETE liên kết nhập sai
  // Không xóa hồ sơ PH

  @UseGuards(JwtAuthGuard)
  @Delete(
    'hoc_sinh/:hoc_sinh_id/phu_huynh/:phu_huynh_id',
  )
  HuyLienKet(
    @Req()
    Request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    HocSinhId: number,

    @Param(
      'phu_huynh_id',
      ParseIntPipe,
    )
    PhuHuynhId: number,
  ) {

    this.KiemTraAdmin(
      Request,
    );

    return this.HoSoHocSinhService
      .HuyLienKetPhuHuynhHocSinh(
        HocSinhId,
        PhuHuynhId,
      );
  }
}