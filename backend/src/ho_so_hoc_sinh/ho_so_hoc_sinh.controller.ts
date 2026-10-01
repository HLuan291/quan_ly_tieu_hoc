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
    private readonly hoSoHocSinhService:
      HoSoHocSinhService,
  ) {}


  private layNguoiDung(
    request: RequestCoNguoiDung,
  ): NguoiDungJwt {

    if (
      !request.nguoi_dung
    ) {
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
      this.layNguoiDung(
        request,
      );


    if (
      nguoiDung.vai_tro !==
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
  taoHocSinh(
    @Req()
    request: RequestCoNguoiDung,

    @Body()
    body: TaoHocSinhKemPhuHuynhDto,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .taoHocSinhKemPhuHuynh(
        body,
      );
  }


  // GET /ho_so_hoc_sinh/hoc_sinh
  // Admin / GV / PH đều dùng
  // nhưng Service tự giới hạn dữ liệu

  @UseGuards(JwtAuthGuard)
  @Get('hoc_sinh')
  layDanhSachHocSinh(
    @Req()
    request: RequestCoNguoiDung,

    @Query('tu_khoa')
    tuKhoa?: string,

    @Query('trang_thai')
    trangThai?: string,
  ) {

    return this.hoSoHocSinhService
      .layDanhSachHocSinh(
        this.layNguoiDung(
          request,
        ),
        tuKhoa,
        trangThai,
      );
  }


  // GET /ho_so_hoc_sinh/hoc_sinh/:id

  @UseGuards(JwtAuthGuard)
  @Get('hoc_sinh/:id')
  layChiTietHocSinh(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {

    return this.hoSoHocSinhService
      .layChiTietHocSinh(
        this.layNguoiDung(
          request,
        ),
        id,
      );
  }


  // PATCH /ho_so_hoc_sinh/hoc_sinh/:id

  @UseGuards(JwtAuthGuard)
  @Patch('hoc_sinh/:id')
  capNhatHocSinh(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: CapNhatHocSinhDto,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .capNhatHocSinh(
        id,
        body,
      );
  }


  // PATCH /ho_so_hoc_sinh/hoc_sinh/:id/trang_thai

  @UseGuards(JwtAuthGuard)
  @Patch(
    'hoc_sinh/:id/trang_thai',
  )
  capNhatTrangThaiHocSinh(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: CapNhatTrangThaiHocSinhDto,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .capNhatTrangThaiHocSinh(
        id,
        body,
      );
  }


  // PATCH /ho_so_hoc_sinh/hoc_sinh/:id/suc_khoe

  @UseGuards(JwtAuthGuard)
  @Patch(
    'hoc_sinh/:id/suc_khoe',
  )
  capNhatSucKhoeHocSinh(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: CapNhatSucKhoeHocSinhDto,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .capNhatSucKhoeHocSinh(
        id,
        body,
      );
  }


  // ==================================================
  // PHỤ HUYNH
  // ==================================================


  // GET /ho_so_hoc_sinh/phu_huynh
  // Admin dùng để tìm PH đã có

  @UseGuards(JwtAuthGuard)
  @Get('phu_huynh')
  layDanhSachPhuHuynh(
    @Req()
    request: RequestCoNguoiDung,

    @Query('tu_khoa')
    tuKhoa?: string,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .layDanhSachPhuHuynh(
        tuKhoa,
      );
  }


  // Lưu ý route "me" đặt trước ":id"

  @UseGuards(JwtAuthGuard)
  @Get('phu_huynh/me')
  layPhuHuynhCuaToi(
    @Req()
    request: RequestCoNguoiDung,
  ) {

    const nguoiDung =
      this.layNguoiDung(
        request,
      );


    if (
      nguoiDung.vai_tro !==
      'PHU_HUYNH'
    ) {
      throw new ForbiddenException(
        'Chỉ phụ huynh được sử dụng chức năng này',
      );
    }


    return this.hoSoHocSinhService
      .layPhuHuynhCuaToi(
        nguoiDung.sub,
      );
  }


  // GET /ho_so_hoc_sinh/phu_huynh/:id

  @UseGuards(JwtAuthGuard)
  @Get('phu_huynh/:id')
  layChiTietPhuHuynh(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .layChiTietPhuHuynh(
        id,
      );
  }


  // PATCH /ho_so_hoc_sinh/phu_huynh/:id

  @UseGuards(JwtAuthGuard)
  @Patch('phu_huynh/:id')
  capNhatPhuHuynh(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: CapNhatPhuHuynhDto,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .capNhatPhuHuynh(
        id,
        body,
      );
  }


  // POST /ho_so_hoc_sinh/phu_huynh/:id/tao_tai_khoan

  @UseGuards(JwtAuthGuard)
  @Post(
    'phu_huynh/:id/tao_tai_khoan',
  )
  taoTaiKhoanPhuHuynh(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .taoTaiKhoanPhuHuynh(
        id,
      );
  }


  // POST /ho_so_hoc_sinh/phu_huynh/:id/cap_lai_mat_khau

  @UseGuards(JwtAuthGuard)
  @Post(
    'phu_huynh/:id/cap_lai_mat_khau',
  )
  capLaiMatKhauPhuHuynh(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .capLaiMatKhauPhuHuynh(
        id,
      );
  }


  // ==================================================
  // LIÊN KẾT HS - PH
  // ==================================================


  // POST /ho_so_hoc_sinh/hoc_sinh/:id/phu_huynh

  @UseGuards(JwtAuthGuard)
  @Post(
    'hoc_sinh/:id/phu_huynh',
  )
  themPhuHuynhVaoHocSinh(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'id',
      ParseIntPipe,
    )
    hocSinhId: number,

    @Body()
    body: ThongTinPhuHuynhDto,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .themPhuHuynhVaoHocSinh(
        hocSinhId,
        body,
      );
  }


  // PATCH .../phu_huynh/:phu_huynh_id/moi_quan_he

  @UseGuards(JwtAuthGuard)
  @Patch(
    'hoc_sinh/:hoc_sinh_id/phu_huynh/:phu_huynh_id/moi_quan_he',
  )
  capNhatMoiQuanHe(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    hocSinhId: number,

    @Param(
      'phu_huynh_id',
      ParseIntPipe,
    )
    phuHuynhId: number,

    @Body()
    body: CapNhatMoiQuanHeDto,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .capNhatMoiQuanHe(
        hocSinhId,
        phuHuynhId,
        body,
      );
  }


  // DELETE liên kết nhập sai
  // Không xóa hồ sơ PH

  @UseGuards(JwtAuthGuard)
  @Delete(
    'hoc_sinh/:hoc_sinh_id/phu_huynh/:phu_huynh_id',
  )
  huyLienKet(
    @Req()
    request: RequestCoNguoiDung,

    @Param(
      'hoc_sinh_id',
      ParseIntPipe,
    )
    hocSinhId: number,

    @Param(
      'phu_huynh_id',
      ParseIntPipe,
    )
    phuHuynhId: number,
  ) {

    this.kiemTraAdmin(
      request,
    );

    return this.hoSoHocSinhService
      .huyLienKetPhuHuynhHocSinh(
        hocSinhId,
        phuHuynhId,
      );
  }
}