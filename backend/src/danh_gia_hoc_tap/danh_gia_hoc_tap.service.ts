import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service';

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

@Injectable()
export class DanhGiaHocTapService {
  constructor(
    private readonly Prisma: PrismaService,
  ) {}

  // ==================================================
  // HÀM DÙNG CHUNG
  // ==================================================

  private ChuyenNgay(
    GiaTri: string,
    tenTruong: string,
  ): Date {
    const Ngay = new Date(
      `${GiaTri}T00:00:00.000Z`,
    );

    if (Number.isNaN(Ngay.getTime())) {
      throw new BadRequestException(
        `${tenTruong} không hợp lệ`,
      );
    }

    return Ngay;
  }

  private async LayGiaoVienTuTaiKhoan(
    TaiKhoanId: number,
  ) {
    const GiaoVien =
      await this.Prisma.giao_vien.findUnique({
        where: {
          tai_khoan_id:
            TaiKhoanId,
        },
      });

    if (!GiaoVien) {
      throw new ForbiddenException(
        'Không tìm thấy hồ sơ giáo viên',
      );
    }

    return GiaoVien;
  }

  private async LayPhuHuynhTuTaiKhoan(
    TaiKhoanId: number,
  ) {
    const PhuHuynh =
      await this.Prisma.phu_huynh.findUnique({
        where: {
          tai_khoan_id:
            TaiKhoanId,
        },
      });

    if (!PhuHuynh) {
      throw new ForbiddenException(
        'Không tìm thấy hồ sơ phụ huynh',
      );
    }

    return PhuHuynh;
  }

  private KiemTraDiem(
    Diem: number,
  ) {
    if (
      !Number.isFinite(Diem) ||
      Diem < 0 ||
      Diem > 10
    ) {
      throw new BadRequestException(
        'Điểm phải nằm trong khoảng từ 0 đến 10',
      );
    }
  }

  // ==================================================
  // TÌM LỚP CỦA HỌC SINH TRONG NĂM HỌC
  // ==================================================

  private async LayLopHocSinhTrongNam(
    HocSinhId: number,
    namHocId: number,
  ) {
    const XepLop =
      await this.Prisma.xep_lop.findFirst({
        where: {
          hoc_sinh_id:
            HocSinhId,

          lop_hoc: {
            nam_hoc_id:
              namHocId,
          },
        },

        orderBy: {
          ngay_bat_dau:
            'desc',
        },

        include: {
          lop_hoc: {
            include: {
              khoi: true,
              nam_hoc: true,
            },
          },
        },
      });

    if (!XepLop) {
      throw new BadRequestException(
        'Học sinh chưa được xếp lớp trong năm học của đợt đánh giá',
      );
    }

    return XepLop;
  }

  // ==================================================
  // KIỂM TRA GV ĐƯỢC DẠY MÔN CỦA HS
  // ==================================================

  private async KiemTraQuyenDanhGiaMon(
    GiaoVienId: number,
    HocSinhId: number,
    MonHocId: number,
    DotDanhGiaId: number,
  ) {
    const Dot =
      await this.Prisma.dot_danh_gia.findUnique({
        where: {
          id:
            DotDanhGiaId,
        },
      });

    if (!Dot) {
      throw new NotFoundException(
        'Không tìm thấy đợt đánh giá',
      );
    }

    const XepLop =
      await this.LayLopHocSinhTrongNam(
        HocSinhId,
        Dot.nam_hoc_id,
      );

    const PhanCong =
      await this.Prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            giao_vien_id:
              GiaoVienId,

            lop_hoc_id:
              XepLop.lop_hoc_id,

            mon_hoc_id:
              MonHocId,
          },
        });

    if (!PhanCong) {
      throw new ForbiddenException(
        'Bạn không được phân công dạy môn này cho học sinh',
      );
    }

    return {
      Dot,
      XepLop,
      PhanCong,
    };
  }

  // ==================================================
  // KIỂM TRA GVCN CỦA HỌC SINH TRONG NĂM
  // ==================================================

  private async KiemTraQuyenGvcn(
    GiaoVienId: number,
    HocSinhId: number,
    DotDanhGiaId: number,
  ) {
    const Dot =
      await this.Prisma.dot_danh_gia.findUnique({
        where: {
          id:
            DotDanhGiaId,
        },
      });

    if (!Dot) {
      throw new NotFoundException(
        'Không tìm thấy đợt đánh giá',
      );
    }

    const XepLop =
      await this.LayLopHocSinhTrongNam(
        HocSinhId,
        Dot.nam_hoc_id,
      );

    const Gvcn =
      await this.Prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            giao_vien_id:
              GiaoVienId,

            lop_hoc_id:
              XepLop.lop_hoc_id,

            loai_phan_cong:
              'GVCN',

            mon_hoc_id:
              null,
          },
        });

    if (!Gvcn) {
      throw new ForbiddenException(
        'Bạn không phải giáo viên chủ nhiệm của học sinh này',
      );
    }

    return {
      Dot,
      XepLop,
      Gvcn,
    };
  }

  // ==================================================
  // 1. TẠO ĐỢT ĐÁNH GIÁ
  // ==================================================

  async TaoDotDanhGia(
    DuLieu: TaoDotDanhGiaDto,
  ) {
    const NamHoc =
      await this.Prisma.nam_hoc.findUnique({
        where: {
          id:
            DuLieu.nam_hoc_id,
        },
      });

    if (!NamHoc) {
      throw new NotFoundException(
        'Không tìm thấy năm học',
      );
    }

    const MaDot =
      DuLieu.ma_dot
        ?.trim()
        .toUpperCase();

    const TenDot =
      DuLieu.ten_dot?.trim();

    const HocKy =
      DuLieu.hoc_ky
        ?.trim()
        .toUpperCase();

    if (
      !MaDot ||
      !TenDot ||
      !HocKy
    ) {
      throw new BadRequestException(
        'Thông tin đợt đánh giá chưa đầy đủ',
      );
    }

    if (
      ![
        'GIUA_HK1',
        'CUOI_HK1',
        'GIUA_HK2',
        'CUOI_NAM',
      ].includes(MaDot)
    ) {
      throw new BadRequestException(
        'Mã đợt đánh giá không hợp lệ',
      );
    }

    if (
      !Number.isInteger(
        DuLieu.thu_tu,
      ) ||
      DuLieu.thu_tu <= 0
    ) {
      throw new BadRequestException(
        'Thứ tự đánh giá không hợp lệ',
      );
    }

    const TrungMa =
      await this.Prisma.dot_danh_gia.findFirst({
        where: {
          nam_hoc_id:
            DuLieu.nam_hoc_id,

          ma_dot:
            MaDot,
        },
      });

    if (TrungMa) {
      throw new ConflictException(
        'Đợt đánh giá đã tồn tại trong năm học',
      );
    }

    const TrungThuTu =
      await this.Prisma.dot_danh_gia.findFirst({
        where: {
          nam_hoc_id:
            DuLieu.nam_hoc_id,

          thu_tu:
            DuLieu.thu_tu,
        },
      });

    if (TrungThuTu) {
      throw new ConflictException(
        'Thứ tự đợt đánh giá đã tồn tại',
      );
    }

    const KetQua =
      await this.Prisma.dot_danh_gia.create({
        data: {
          nam_hoc_id:
            DuLieu.nam_hoc_id,

          ma_dot:
            MaDot,

          ten_dot:
            TenDot,

          hoc_ky:
            HocKy,

          thu_tu:
            DuLieu.thu_tu,
        },
      });

    return {
      thong_bao:
        'Tạo đợt đánh giá thành công',

      dot_danh_gia:
        KetQua,
    };
  }

  // ==================================================
  // 2. DANH SÁCH ĐỢT ĐÁNH GIÁ
  // ==================================================

  async LayDanhSachDotDanhGia(
    namHocId?: number,
  ) {
    return this.Prisma.dot_danh_gia.findMany({
      where: {
        ...(namHocId
          ? {
              nam_hoc_id:
                namHocId,
            }
          : {}),
      },

      orderBy: [
        {
          nam_hoc_id:
            'desc',
        },

        {
          thu_tu:
            'asc',
        },
      ],

      include: {
        nam_hoc: true,
      },
    });
  }

  // ==================================================
  // 3. CẤU HÌNH MÔN ĐƯỢC ĐÁNH GIÁ
  // ==================================================

  async TaoCauHinhDanhGiaMon(
    DuLieu: TaoCauHinhDanhGiaMonDto,
  ) {
    const [
      Dot,
      khoi,
      mon,
    ] = await Promise.all([
      this.Prisma.dot_danh_gia.findUnique({
        where: {
          id:
            DuLieu.dot_danh_gia_id,
        },
      }),

      this.Prisma.khoi.findUnique({
        where: {
          id:
            DuLieu.khoi_id,
        },
      }),

      this.Prisma.mon_hoc.findUnique({
        where: {
          id:
            DuLieu.mon_hoc_id,
        },
      }),
    ]);

    if (!Dot) {
      throw new NotFoundException(
        'Không tìm thấy đợt đánh giá',
      );
    }

    if (!khoi) {
      throw new NotFoundException(
        'Không tìm thấy khối',
      );
    }

    if (!mon) {
      throw new NotFoundException(
        'Không tìm thấy môn học',
      );
    }

    const MonKhoi =
      await this.Prisma.mon_hoc_khoi.findFirst({
        where: {
          khoi_id:
            DuLieu.khoi_id,

          mon_hoc_id:
            DuLieu.mon_hoc_id,
        },
      });

    if (!MonKhoi) {
      throw new BadRequestException(
        'Môn học không thuộc khối này',
      );
    }

    const Trung =
      await this.Prisma
        .cau_hinh_danh_gia_mon
        .findFirst({
          where: {
            dot_danh_gia_id:
              DuLieu.dot_danh_gia_id,

            khoi_id:
              DuLieu.khoi_id,

            mon_hoc_id:
              DuLieu.mon_hoc_id,
          },
        });

    if (Trung) {
      throw new ConflictException(
        'Cấu hình đánh giá môn đã tồn tại',
      );
    }

    const KetQua =
      await this.Prisma
        .cau_hinh_danh_gia_mon
        .create({
          data: {
            dot_danh_gia_id:
              DuLieu.dot_danh_gia_id,

            khoi_id:
              DuLieu.khoi_id,

            mon_hoc_id:
              DuLieu.mon_hoc_id,
          },

          include: {
            dot_danh_gia: true,
            khoi: true,
            mon_hoc: true,
          },
        });

    return {
      thong_bao:
        'Tạo cấu hình đánh giá môn thành công',

      cau_hinh:
        KetQua,
    };
  }

  // ==================================================
  // 4. DANH SÁCH CẤU HÌNH ĐÁNH GIÁ MÔN
  // ==================================================

  async LayCauHinhDanhGiaMon(
    DotDanhGiaId?: number,
    KhoiId?: number,
  ) {
    return this.Prisma
      .cau_hinh_danh_gia_mon
      .findMany({
        where: {
          ...(DotDanhGiaId
            ? {
                dot_danh_gia_id:
                  DotDanhGiaId,
              }
            : {}),

          ...(KhoiId
            ? {
                khoi_id:
                  KhoiId,
              }
            : {}),
        },

        include: {
          dot_danh_gia: true,
          khoi: true,
          mon_hoc: true,
        },

        orderBy: [
          {
            khoi_id:
              'asc',
          },

          {
            mon_hoc_id:
              'asc',
          },
        ],
      });
  }

  // ==================================================
  // 5. TẠO CẤU HÌNH ĐIỂM
  // ==================================================

  async TaoCauHinhDiem(
    DuLieu: TaoCauHinhDiemDto,
  ) {
    const CachNhap =
      DuLieu.cach_nhap
        ?.trim()
        .toUpperCase();

    if (
      ![
        'NHAP_TAY',
        'TU_TINH',
      ].includes(CachNhap)
    ) {
      throw new BadRequestException(
        'Cách nhập phải là NHAP_TAY hoặc TU_TINH',
      );
    }

    const MaLoaiDiem =
      DuLieu.ma_loai_diem
        ?.trim()
        .toUpperCase();

    const TenHienThi =
      DuLieu.ten_hien_thi?.trim();

    if (
      !MaLoaiDiem ||
      !TenHienThi
    ) {
      throw new BadRequestException(
        'Thông tin loại điểm chưa đầy đủ',
      );
    }

    const CauHinhMon =
      await this.Prisma
        .cau_hinh_danh_gia_mon
        .findFirst({
          where: {
            dot_danh_gia_id:
              DuLieu.dot_danh_gia_id,

            khoi_id:
              DuLieu.khoi_id,

            mon_hoc_id:
              DuLieu.mon_hoc_id,
          },
        });

    if (!CauHinhMon) {
      throw new BadRequestException(
        'Môn học chưa được cấu hình đánh giá cho khối và đợt này',
      );
    }

    const Trung =
      await this.Prisma.cau_hinh_diem.findFirst({
        where: {
          dot_danh_gia_id:
            DuLieu.dot_danh_gia_id,

          khoi_id:
            DuLieu.khoi_id,

          mon_hoc_id:
            DuLieu.mon_hoc_id,

          ma_loai_diem:
            MaLoaiDiem,
        },
      });

    if (Trung) {
      throw new ConflictException(
        'Loại điểm đã tồn tại',
      );
    }

    const KetQua =
      await this.Prisma.cau_hinh_diem.create({
        data: {
          dot_danh_gia_id:
            DuLieu.dot_danh_gia_id,

          khoi_id:
            DuLieu.khoi_id,

          mon_hoc_id:
            DuLieu.mon_hoc_id,

          ma_loai_diem:
            MaLoaiDiem,

          ten_hien_thi:
            TenHienThi,

          bat_buoc:
            DuLieu.bat_buoc ??
            true,

          thu_tu_hien_thi:
            DuLieu.thu_tu_hien_thi,

          cach_nhap:
            CachNhap,
        },

        include: {
          dot_danh_gia: true,
          khoi: true,
          mon_hoc: true,
        },
      });

    return {
      thong_bao:
        'Tạo cấu hình điểm thành công',

      cau_hinh_diem:
        KetQua,
    };
  }

  // ==================================================
  // 6. DANH SÁCH CẤU HÌNH ĐIỂM
  // ==================================================

  async LayCauHinhDiem(
    DotDanhGiaId?: number,
    KhoiId?: number,
    MonHocId?: number,
  ) {
    return this.Prisma.cau_hinh_diem.findMany({
      where: {
        ...(DotDanhGiaId
          ? {
              dot_danh_gia_id:
                DotDanhGiaId,
            }
          : {}),

        ...(KhoiId
          ? {
              khoi_id:
                KhoiId,
            }
          : {}),

        ...(MonHocId
          ? {
              mon_hoc_id:
                MonHocId,
            }
          : {}),
      },

      orderBy: {
        thu_tu_hien_thi:
          'asc',
      },

      include: {
        dot_danh_gia: true,
        khoi: true,
        mon_hoc: true,
      },
    });
  }

  // ==================================================
  // 7. TẠO TIÊU CHÍ NĂNG LỰC / PHẨM CHẤT
  // ==================================================

  async TaoTieuChiDanhGia(
    DuLieu: TaoTieuChiDanhGiaDto,
  ) {
    const MaTieuChi =
      DuLieu.ma_tieu_chi
        ?.trim()
        .toUpperCase();

    const TenTieuChi =
      DuLieu.ten_tieu_chi?.trim();

    const NhomDanhGia =
      DuLieu.nhom_danh_gia
        ?.trim()
        .toUpperCase();

    if (
      !MaTieuChi ||
      !TenTieuChi ||
      !NhomDanhGia
    ) {
      throw new BadRequestException(
        'Thông tin tiêu chí chưa đầy đủ',
      );
    }

    if (
      ![
        'NANG_LUC',
        'PHAM_CHAT',
      ].includes(NhomDanhGia)
    ) {
      throw new BadRequestException(
        'Nhóm đánh giá phải là NANG_LUC hoặc PHAM_CHAT',
      );
    }

    const Trung =
      await this.Prisma
        .tieu_chi_danh_gia
        .findUnique({
          where: {
            ma_tieu_chi:
              MaTieuChi,
          },
        });

    if (Trung) {
      throw new ConflictException(
        'Mã tiêu chí đã tồn tại',
      );
    }

    const KetQua =
      await this.Prisma
        .tieu_chi_danh_gia
        .create({
          data: {
            ma_tieu_chi:
              MaTieuChi,

            ten_tieu_chi:
              TenTieuChi,

            nhom_danh_gia:
              NhomDanhGia,

            thu_tu_hien_thi:
              DuLieu.thu_tu_hien_thi,
          },
        });

    return {
      thong_bao:
        'Tạo tiêu chí thành công',

      tieu_chi:
        KetQua,
    };
  }

  // ==================================================
  // 8. DANH SÁCH TIÊU CHÍ
  // ==================================================

  async LayDanhSachTieuChi(
    NhomDanhGia?: string,
  ) {
    return this.Prisma
      .tieu_chi_danh_gia
      .findMany({
        where: {
          trang_thai:
            'HOAT_DONG',

          ...(NhomDanhGia?.trim()
            ? {
                nhom_danh_gia:
                  NhomDanhGia
                    .trim()
                    .toUpperCase(),
              }
            : {}),
        },

        orderBy: {
          thu_tu_hien_thi:
            'asc',
        },
      });
  }

  // ==================================================
  // 9. GV NHẬP / CẬP NHẬT KẾT QUẢ MÔN HỌC
  // ==================================================

  async CapNhatKetQuaMonHoc(
    TaiKhoanId: number,
    DuLieu: CapNhatKetQuaMonHocDto,
  ) {
    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const {
      XepLop,
    } =
      await this.KiemTraQuyenDanhGiaMon(
        GiaoVien.id,
        DuLieu.hoc_sinh_id,
        DuLieu.mon_hoc_id,
        DuLieu.dot_danh_gia_id,
      );

    const MucDanhGia =
      DuLieu.muc_danh_gia?.trim();

    if (!MucDanhGia) {
      throw new BadRequestException(
        'Mức đánh giá không được để trống',
      );
    }

    const CauHinh =
      await this.Prisma
        .cau_hinh_danh_gia_mon
        .findFirst({
          where: {
            dot_danh_gia_id:
              DuLieu.dot_danh_gia_id,

            khoi_id:
              XepLop.lop_hoc.khoi_id,

            mon_hoc_id:
              DuLieu.mon_hoc_id,
          },
        });

    if (!CauHinh) {
      throw new BadRequestException(
        'Môn học chưa được cấu hình cho đợt đánh giá',
      );
    }

    const KetQuaCu =
      await this.Prisma.ket_qua_mon_hoc.findFirst({
        where: {
          hoc_sinh_id:
            DuLieu.hoc_sinh_id,

          mon_hoc_id:
            DuLieu.mon_hoc_id,

          dot_danh_gia_id:
            DuLieu.dot_danh_gia_id,
        },
      });

    if (KetQuaCu) {
      const KetQua =
        await this.Prisma.ket_qua_mon_hoc.update({
          where: {
            id:
              KetQuaCu.id,
          },

          data: {
            muc_danh_gia:
              MucDanhGia,

            nhan_xet:
              DuLieu.nhan_xet
                ?.trim() ||
              null,

            giao_vien_cap_nhat_id:
              GiaoVien.id,

            ngay_cap_nhat:
              new Date(),
          },
        });

      return {
        thong_bao:
          'Cập nhật kết quả môn học thành công',

        ket_qua:
          KetQua,
      };
    }

    const KetQua =
      await this.Prisma.ket_qua_mon_hoc.create({
        data: {
          hoc_sinh_id:
            DuLieu.hoc_sinh_id,

          mon_hoc_id:
            DuLieu.mon_hoc_id,

          dot_danh_gia_id:
            DuLieu.dot_danh_gia_id,

          muc_danh_gia:
            MucDanhGia,

          nhan_xet:
            DuLieu.nhan_xet
              ?.trim() ||
            null,

          giao_vien_cap_nhat_id:
            GiaoVien.id,
        },
      });

    return {
      thong_bao:
        'Nhập kết quả môn học thành công',

      ket_qua:
        KetQua,
    };
  }

  // ==================================================
  // 10. NHẬP ĐIỂM KTĐK LẦN ĐẦU
  // ==================================================

  async NhapDiemDinhKy(
    TaiKhoanId: number,
    DuLieu: NhapDiemDinhKyDto,
  ) {
    this.KiemTraDiem(
      DuLieu.diem,
    );

    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const CauHinh =
      await this.Prisma.cau_hinh_diem.findUnique({
        where: {
          id:
            DuLieu.cau_hinh_diem_id,
        },
      });

    if (!CauHinh) {
      throw new NotFoundException(
        'Không tìm thấy cấu hình điểm',
      );
    }

    if (
      CauHinh.cach_nhap !==
      'NHAP_TAY'
    ) {
      throw new BadRequestException(
        'Loại điểm này được hệ thống tự tính, không được nhập tay',
      );
    }

    const {
      XepLop,
    } =
      await this.KiemTraQuyenDanhGiaMon(
        GiaoVien.id,
        DuLieu.hoc_sinh_id,
        CauHinh.mon_hoc_id,
        CauHinh.dot_danh_gia_id,
      );

    if (
      CauHinh.khoi_id !==
      XepLop.lop_hoc.khoi_id
    ) {
      throw new BadRequestException(
        'Cấu hình điểm không thuộc khối của học sinh',
      );
    }

    const DaCo =
      await this.Prisma
        .diem_kiem_tra_dinh_ky
        .findFirst({
          where: {
            hoc_sinh_id:
              DuLieu.hoc_sinh_id,

            cau_hinh_diem_id:
              DuLieu.cau_hinh_diem_id,
          },
        });

    if (DaCo) {
      throw new ConflictException(
        'Điểm này đã tồn tại. Nếu kiểm tra lại hãy dùng chức năng nhập lần kiểm tra lại.',
      );
    }

    const NgayKiemTra =
      this.ChuyenNgay(
        DuLieu.ngay_kiem_tra,
        'Ngày kiểm tra',
      );

    const KetQua =
      await this.Prisma.$transaction(
        async (tx) => {
          const Diem =
            await tx.diem_kiem_tra_dinh_ky.create({
              data: {
                hoc_sinh_id:
                  DuLieu.hoc_sinh_id,

                cau_hinh_diem_id:
                  DuLieu.cau_hinh_diem_id,

                diem:
                  DuLieu.diem,

                giao_vien_cap_nhat_id:
                  GiaoVien.id,
              },
            });

          await tx.lan_kiem_tra_dinh_ky.create({
            data: {
              diem_kiem_tra_dinh_ky_id:
                Diem.id,

              lan_thu:
                1,

              diem:
                DuLieu.diem,

              ngay_kiem_tra:
                NgayKiemTra,

              giao_vien_nhap_id:
                GiaoVien.id,
            },
          });

          return Diem;
        },
      );

    await this.TinhLaiDiemTuTinh(
      DuLieu.hoc_sinh_id,
      CauHinh.dot_danh_gia_id,
      CauHinh.khoi_id,
      CauHinh.mon_hoc_id,
      GiaoVien.id,
    );

    return {
      thong_bao:
        'Nhập điểm định kỳ thành công',

      diem:
        KetQua,
    };
  }

  // ==================================================
  // 11. NHẬP LẦN KIỂM TRA LẠI
  // ==================================================

  async NhapDiemKiemTraLai(
    TaiKhoanId: number,
    DiemId: number,
    DuLieu: NhapDiemKiemTraLaiDto,
  ) {
    this.KiemTraDiem(
      DuLieu.diem,
    );

    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const DiemHienTai =
      await this.Prisma
        .diem_kiem_tra_dinh_ky
        .findUnique({
          where: {
            id:
              DiemId,
          },

          include: {
            cau_hinh_diem: true,

            lan_kiem_tra_dinh_ky: {
              orderBy: {
                lan_thu:
                  'desc',
              },

              take:
                1,
            },
          },
        });

    if (!DiemHienTai) {
      throw new NotFoundException(
        'Không tìm thấy điểm định kỳ',
      );
    }

    if (
      DiemHienTai.cau_hinh_diem.cach_nhap !==
      'NHAP_TAY'
    ) {
      throw new BadRequestException(
        'Loại điểm này được hệ thống tự tính, không được nhập kiểm tra lại',
      );
    }

    const {
      XepLop,
    } =
      await this.KiemTraQuyenDanhGiaMon(
        GiaoVien.id,
        DiemHienTai.hoc_sinh_id,
        DiemHienTai.cau_hinh_diem.mon_hoc_id,
        DiemHienTai.cau_hinh_diem.dot_danh_gia_id,
      );

    if (
      DiemHienTai.cau_hinh_diem.khoi_id !==
      XepLop.lop_hoc.khoi_id
    ) {
      throw new BadRequestException(
        'Cấu hình điểm không thuộc khối của học sinh',
      );
    }

    const LanCuoi =
      DiemHienTai
        .lan_kiem_tra_dinh_ky[0]
        ?.lan_thu ??
      0;

    const LanMoi =
      LanCuoi + 1;

    const NgayKiemTra =
      this.ChuyenNgay(
        DuLieu.ngay_kiem_tra,
        'Ngày kiểm tra',
      );

    const KetQua =
      await this.Prisma.$transaction(
        async (tx) => {
          const LanKiemTra =
            await tx.lan_kiem_tra_dinh_ky.create({
              data: {
                diem_kiem_tra_dinh_ky_id:
                  DiemId,

                lan_thu:
                  LanMoi,

                diem:
                  DuLieu.diem,

                ngay_kiem_tra:
                  NgayKiemTra,

                ly_do_kiem_tra_lai:
                  DuLieu.ly_do_kiem_tra_lai
                    ?.trim() ||
                  null,

                giao_vien_nhap_id:
                  GiaoVien.id,
              },
            });

          await tx.diem_kiem_tra_dinh_ky.update({
            where: {
              id:
                DiemId,
            },

            data: {
              // Điểm hiện hành = lần kiểm tra mới nhất
              diem:
                DuLieu.diem,

              giao_vien_cap_nhat_id:
                GiaoVien.id,

              ngay_cap_nhat:
                new Date(),
            },
          });

          return LanKiemTra;
        },
      );

    await this.TinhLaiDiemTuTinh(
      DiemHienTai.hoc_sinh_id,
      DiemHienTai.cau_hinh_diem.dot_danh_gia_id,
      DiemHienTai.cau_hinh_diem.khoi_id,
      DiemHienTai.cau_hinh_diem.mon_hoc_id,
      GiaoVien.id,
    );

    return {
      thong_bao:
        'Nhập lần kiểm tra lại thành công',

      lan_kiem_tra:
        KetQua,
    };
  }

  // ==================================================
  // 12. TÍNH ĐIỂM CÓ cach_nhap = TU_TINH
  //
  // Lấy Trung bình các thành phần NHAP_TAY
  // và làm tròn thành điểm hiện hành.
  // ==================================================

  private async TinhLaiDiemTuTinh(
    HocSinhId: number,
    DotDanhGiaId: number,
    KhoiId: number,
    MonHocId: number,
    GiaoVienId: number,
  ) {
    const CauHinhTuTinh =
      await this.Prisma.cau_hinh_diem.findMany({
        where: {
          dot_danh_gia_id:
            DotDanhGiaId,

          khoi_id:
            KhoiId,

          mon_hoc_id:
            MonHocId,

          cach_nhap:
            'TU_TINH',
        },
      });

    if (
      CauHinhTuTinh.length === 0
    ) {
      return;
    }

    const CauHinhNhapTay =
      await this.Prisma.cau_hinh_diem.findMany({
        where: {
          dot_danh_gia_id:
            DotDanhGiaId,

          khoi_id:
            KhoiId,

          mon_hoc_id:
            MonHocId,

          cach_nhap:
            'NHAP_TAY',
        },

        select: {
          id: true,
        },
      });

    const Ids =
      CauHinhNhapTay.map(
        (Item) =>
          Item.id,
      );

    if (Ids.length === 0) {
      return;
    }

    const DiemThanhPhan =
      await this.Prisma
        .diem_kiem_tra_dinh_ky
        .findMany({
          where: {
            hoc_sinh_id:
              HocSinhId,

            cau_hinh_diem_id: {
              in:
                Ids,
            },
          },

          select: {
            diem: true,
          },
        });

    if (
      DiemThanhPhan.length !==
      Ids.length
    ) {
      return;
    }

    const Tong =
      DiemThanhPhan.reduce(
        (GiaTri, Item) =>
          GiaTri +
          Number(Item.diem),
        0,
      );

    const DiemTuTinh =
      Math.round(
        Tong /
          DiemThanhPhan.length,
      );

    for (
      const CauHinh
      of CauHinhTuTinh
    ) {
      const DiemCu =
        await this.Prisma
          .diem_kiem_tra_dinh_ky
          .findFirst({
            where: {
              hoc_sinh_id:
                HocSinhId,

              cau_hinh_diem_id:
                CauHinh.id,
            },
          });

      if (DiemCu) {
        await this.Prisma
          .diem_kiem_tra_dinh_ky
          .update({
            where: {
              id:
                DiemCu.id,
            },

            data: {
              diem:
                DiemTuTinh,

              giao_vien_cap_nhat_id:
                GiaoVienId,

              ngay_cap_nhat:
                new Date(),
            },
          });
      } else {
        await this.Prisma
          .diem_kiem_tra_dinh_ky
          .create({
            data: {
              hoc_sinh_id:
                HocSinhId,

              cau_hinh_diem_id:
                CauHinh.id,

              diem:
                DiemTuTinh,

              giao_vien_cap_nhat_id:
                GiaoVienId,
            },
          });
      }
    }
  }

  // ==================================================
  // 13. ADMIN / GV XEM KẾT QUẢ CỦA HS THEO ĐỢT
  // GV chỉ được xem HS thuộc lớp mình được phân công
  // trong năm học của đợt đánh giá.
  // ==================================================

  async LayKetQuaHocSinhTheoDotChoNhanVien(
    TaiKhoanId: number,
    VaiTro: string,
    HocSinhId: number,
    DotDanhGiaId: number,
  ) {
    if (VaiTro === 'ADMIN') {
      return this.LayKetQuaHocSinhTheoDot(
        HocSinhId,
        DotDanhGiaId,
      );
    }

    if (VaiTro !== 'GIAO_VIEN') {
      throw new ForbiddenException(
        'Bạn không có quyền xem kết quả học sinh',
      );
    }

    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const Dot =
      await this.Prisma.dot_danh_gia.findUnique({
        where: {
          id:
            DotDanhGiaId,
        },

        select: {
          nam_hoc_id:
            true,
        },
      });

    if (!Dot) {
      throw new NotFoundException(
        'Không tìm thấy đợt đánh giá',
      );
    }

    const XepLop =
      await this.LayLopHocSinhTrongNam(
        HocSinhId,
        Dot.nam_hoc_id,
      );

    const PhanCong =
      await this.Prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            giao_vien_id:
              GiaoVien.id,

            lop_hoc_id:
              XepLop.lop_hoc_id,
          },
        });

    if (!PhanCong) {
      throw new ForbiddenException(
        'Bạn không được phân công tại lớp của học sinh này',
      );
    }

    return this.LayKetQuaHocSinhTheoDot(
      HocSinhId,
      DotDanhGiaId,
    );
  }

  async LayKetQuaHocSinhTheoDot(
    HocSinhId: number,
    DotDanhGiaId: number,
  ) {
    const [
      HocSinh,
      Dot,
    ] = await Promise.all([
      this.Prisma.hoc_sinh.findUnique({
        where: {
          id:
            HocSinhId,
        },

        select: {
          id: true,
          ma_hoc_sinh: true,
          ho_ten: true,
        },
      }),

      this.Prisma.dot_danh_gia.findUnique({
        where: {
          id:
            DotDanhGiaId,
        },

        include: {
          nam_hoc: true,
        },
      }),
    ]);

    if (!HocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }

    if (!Dot) {
      throw new NotFoundException(
        'Không tìm thấy đợt đánh giá',
      );
    }

    const [
      ketQuaMonHoc,
      diemDinhKy,
      nangLucPhamChat,
      tongKet,
    ] = await Promise.all([
      this.Prisma.ket_qua_mon_hoc.findMany({
        where: {
          hoc_sinh_id:
            HocSinhId,

          dot_danh_gia_id:
            DotDanhGiaId,
        },

        include: {
          mon_hoc: true,

          giao_vien: {
            select: {
              id: true,
              ho_ten: true,
            },
          },
        },
      }),

      this.Prisma.diem_kiem_tra_dinh_ky.findMany({
        where: {
          hoc_sinh_id:
            HocSinhId,

          cau_hinh_diem: {
            dot_danh_gia_id:
              DotDanhGiaId,
          },
        },

        include: {
          cau_hinh_diem: {
            include: {
              mon_hoc: true,
            },
          },

          lan_kiem_tra_dinh_ky: {
            orderBy: {
              lan_thu:
                'asc',
            },
          },
        },
      }),

      this.Prisma
        .ket_qua_nang_luc_pham_chat
        .findMany({
          where: {
            hoc_sinh_id:
              HocSinhId,

            dot_danh_gia_id:
              DotDanhGiaId,
          },

          include: {
            tieu_chi_danh_gia: true,
          },
        }),

      this.Prisma.tong_ket_giao_duc.findFirst({
        where: {
          hoc_sinh_id:
            HocSinhId,

          dot_danh_gia_id:
            DotDanhGiaId,
        },
      }),
    ]);

    return {
      hoc_sinh:
        HocSinh,

      dot_danh_gia:
        Dot,

      ket_qua_mon_hoc:
        ketQuaMonHoc,

      diem_dinh_ky:
        diemDinhKy,

      nang_luc_pham_chat:
        nangLucPhamChat,

      tong_ket_giao_duc:
        tongKet,
    };
  }

  // ==================================================
  // 14. GVCN NHẬP NĂNG LỰC / PHẨM CHẤT
  // ==================================================

  async CapNhatNangLucPhamChat(
    TaiKhoanId: number,
    DuLieu: CapNhatNangLucPhamChatDto,
  ) {
    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    await this.KiemTraQuyenGvcn(
      GiaoVien.id,
      DuLieu.hoc_sinh_id,
      DuLieu.dot_danh_gia_id,
    );

    const TieuChi =
      await this.Prisma
        .tieu_chi_danh_gia
        .findUnique({
          where: {
            id:
              DuLieu.tieu_chi_danh_gia_id,
          },
        });

    if (!TieuChi) {
      throw new NotFoundException(
        'Không tìm thấy tiêu chí đánh giá',
      );
    }

    if (
      TieuChi.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new BadRequestException(
        'Tiêu chí đánh giá đang không hoạt động',
      );
    }

    const MucDanhGia =
      DuLieu.muc_danh_gia?.trim();

    if (!MucDanhGia) {
      throw new BadRequestException(
        'Mức đánh giá không được để trống',
      );
    }

    const KetQuaCu =
      await this.Prisma
        .ket_qua_nang_luc_pham_chat
        .findFirst({
          where: {
            hoc_sinh_id:
              DuLieu.hoc_sinh_id,

            dot_danh_gia_id:
              DuLieu.dot_danh_gia_id,

            tieu_chi_danh_gia_id:
              DuLieu.tieu_chi_danh_gia_id,
          },
        });

    if (KetQuaCu) {
      const KetQua =
        await this.Prisma
          .ket_qua_nang_luc_pham_chat
          .update({
            where: {
              id:
                KetQuaCu.id,
            },

            data: {
              muc_danh_gia:
                MucDanhGia,

              nhan_xet:
                DuLieu.nhan_xet
                  ?.trim() ||
                null,

              giao_vien_cap_nhat_id:
                GiaoVien.id,

              ngay_cap_nhat:
                new Date(),
            },
          });

      return {
        thong_bao:
          'Cập nhật năng lực/phẩm chất thành công',

        ket_qua:
          KetQua,
      };
    }

    const KetQua =
      await this.Prisma
        .ket_qua_nang_luc_pham_chat
        .create({
          data: {
            hoc_sinh_id:
              DuLieu.hoc_sinh_id,

            dot_danh_gia_id:
              DuLieu.dot_danh_gia_id,

            tieu_chi_danh_gia_id:
              DuLieu.tieu_chi_danh_gia_id,

            muc_danh_gia:
              MucDanhGia,

            nhan_xet:
              DuLieu.nhan_xet
                ?.trim() ||
              null,

            giao_vien_cap_nhat_id:
              GiaoVien.id,
          },
        });

    return {
      thong_bao:
        'Nhập năng lực/phẩm chất thành công',

      ket_qua:
        KetQua,
    };
  }

  // ==================================================
  // 15. GVCN TỔNG KẾT GIÁO DỤC CUỐI NĂM
  // ==================================================

  async CapNhatTongKetGiaoDuc(
    TaiKhoanId: number,
    DuLieu: CapNhatTongKetGiaoDucDto,
  ) {
    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const {
      Dot,
    } =
      await this.KiemTraQuyenGvcn(
        GiaoVien.id,
        DuLieu.hoc_sinh_id,
        DuLieu.dot_danh_gia_id,
      );

    if (
      Dot.ma_dot !==
      'CUOI_NAM'
    ) {
      throw new BadRequestException(
        'Tổng kết giáo dục chỉ được thực hiện ở đợt CUOI_NAM',
      );
    }

    const MucKetQua =
      DuLieu.muc_ket_qua_giao_duc
        ?.trim() ||
      null;

    const KetQuaHoanThanh =
      DuLieu.ket_qua_hoan_thanh_lop
        ?.trim() ||
      null;

    const TongKetCu =
      await this.Prisma
        .tong_ket_giao_duc
        .findFirst({
          where: {
            hoc_sinh_id:
              DuLieu.hoc_sinh_id,

            dot_danh_gia_id:
              DuLieu.dot_danh_gia_id,
          },
        });

    if (TongKetCu) {
      const KetQua =
        await this.Prisma
          .tong_ket_giao_duc
          .update({
            where: {
              id:
                TongKetCu.id,
            },

            data: {
              muc_ket_qua_giao_duc:
                MucKetQua,

              ket_qua_hoan_thanh_lop:
                KetQuaHoanThanh,

              ngay_xet:
                new Date(),

              ngay_cap_nhat:
                new Date(),
            },
          });

      return {
        thong_bao:
          'Cập nhật tổng kết giáo dục thành công',

        tong_ket:
          KetQua,
      };
    }

    const KetQua =
      await this.Prisma
        .tong_ket_giao_duc
        .create({
          data: {
            hoc_sinh_id:
              DuLieu.hoc_sinh_id,

            dot_danh_gia_id:
              DuLieu.dot_danh_gia_id,

            muc_ket_qua_giao_duc:
              MucKetQua,

            ket_qua_hoan_thanh_lop:
              KetQuaHoanThanh,

            ngay_xet:
              new Date(),
          },
        });

    return {
      thong_bao:
        'Tạo tổng kết giáo dục thành công',

      tong_ket:
        KetQua,
    };
  }

  // ==================================================
  // 16. PHỤ HUYNH XEM KẾT QUẢ CỦA CON
  // ==================================================

  async LayKetQuaCuaCon(
    TaiKhoanId: number,
    HocSinhId: number,
    DotDanhGiaId: number,
  ) {
    const PhuHuynh =
      await this.LayPhuHuynhTuTaiKhoan(
        TaiKhoanId,
      );

    const LienKet =
      await this.Prisma
        .phu_huynh_hoc_sinh
        .findFirst({
          where: {
            phu_huynh_id:
              PhuHuynh.id,

            hoc_sinh_id:
              HocSinhId,
          },
        });

    if (!LienKet) {
      throw new ForbiddenException(
        'Bạn không có quyền xem kết quả của học sinh này',
      );
    }

    return this.LayKetQuaHocSinhTheoDot(
      HocSinhId,
      DotDanhGiaId,
    );
  }

  // ==================================================
  // 17. GIÁO VIÊN XEM HỌC SINH LỚP/MÔN ĐƯỢC PHÂN CÔNG
  // ==================================================

  async LayHocSinhDeDanhGia(
    TaiKhoanId: number,
    lopHocId: number,
  ) {
    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const PhanCong =
      await this.Prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            giao_vien_id:
              GiaoVien.id,

            lop_hoc_id:
              lopHocId,
          },
        });

    if (!PhanCong) {
      throw new ForbiddenException(
        'Bạn không được phân công tại lớp này',
      );
    }

    const Lop =
      await this.Prisma.lop_hoc.findUnique({
        where: {
          id:
            lopHocId,
        },

        include: {
          nam_hoc: true,
          khoi: true,
        },
      });

    if (!Lop) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    const HocSinh =
      await this.Prisma.xep_lop.findMany({
        where: {
          lop_hoc_id:
            lopHocId,

          trang_thai:
            'DANG_HOC',
        },

        orderBy: {
          hoc_sinh: {
            ho_ten:
              'asc',
          },
        },

        include: {
          hoc_sinh: {
            select: {
              id: true,
              ma_hoc_sinh: true,
              ho_ten: true,
              ngay_sinh: true,
              gioi_tinh: true,
            },
          },
        },
      });

    return {
      lop_hoc:
        Lop,

      hoc_sinh:
        HocSinh,
    };
  }
}