import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { LayNgayNghiepVu } from '../ngay_nghiep_vu';
import { KiemTraGiaTriQuyUoc, QuyUoc } from '../quy_uoc_nghiep_vu';

import {
  DiemDanhHangLoatDto,
  TaoDonXinNghiDto,
  XuLyDonXinNghiDto,
} from './diem_danh_nghi_hoc.dto';

@Injectable()
export class DiemDanhNghiHocService {
  constructor(
    private readonly Prisma: PrismaService,
  ) {}

  // ==================================================
  // HÀM DÙNG CHUNG
  // ==================================================

  private ChuyenNgay(
    giaTri: string,
    tenTruong: string,
  ): Date {
    const Ngay = new Date(
      `${giaTri}T00:00:00.000Z`,
    );

    if (typeof giaTri !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(giaTri) || Number.isNaN(Ngay.getTime()) || Ngay.toISOString().slice(0, 10) !== giaTri) {
      throw new BadRequestException(
        `${tenTruong} không hợp lệ`,
      );
    }

    return Ngay;
  }

  private KiemTraBuoiHoc(
    BuoiHoc: string,
  ) {
    if (
      ![
        'SANG',
        'CHIEU',
      ].includes(BuoiHoc)
    ) {
      throw new BadRequestException(
        'Buổi học phải là SANG hoặc CHIEU',
      );
    }
  }

  private KiemTraBuoiNghi(
    BuoiNghi: string,
  ) {
    if (
      ![
        'SANG',
        'CHIEU',
        'CA_NGAY',
      ].includes(BuoiNghi)
    ) {
      throw new BadRequestException(
        'Buổi nghỉ không hợp lệ',
      );
    }
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

  // ==================================================
  // KIỂM TRA GIÁO VIÊN CÓ LÀ GVCN CỦA LỚP
  // TẠI NGÀY ĐÓ KHÔNG
  // ==================================================

  private async KiemTraGvcn(
    giaoVienId: number,
    LopHocId: number,
    Ngay: Date,
  ) {
    const PhanCong =
      await this.Prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            giao_vien_id:
              giaoVienId,

            lop_hoc_id:
              LopHocId,

            loai_phan_cong:
              'GVCN',

            mon_hoc_id:
              null,

            ngay_bat_dau: {
              lte:
                Ngay,
            },

            OR: [
              {
                ngay_ket_thuc:
                  null,
              },

              {
                ngay_ket_thuc: {
                  gte:
                    Ngay,
                },
              },
            ],
          },
        });

    if (!PhanCong) {
      throw new ForbiddenException(
        'Bạn không phải giáo viên chủ nhiệm của lớp trong thời gian này',
      );
    }

    return PhanCong;
  }

  // ==================================================
  // 1. LẤY DANH SÁCH LỚP ĐỂ ĐIỂM DANH
  // GVCN dùng
  // ==================================================

  async LayLopChuNhiemCuaToi(
    TaiKhoanId: number,
  ) {
    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const HomNay =
      LayNgayNghiepVu();

    return this.Prisma
      .phan_cong_giao_vien
      .findMany({
        where: {
          giao_vien_id:
            GiaoVien.id,

          loai_phan_cong:
            'GVCN',

          mon_hoc_id:
            null,

          ngay_bat_dau: {
            lte:
              HomNay,
          },

          OR: [
            {
              ngay_ket_thuc:
                null,
            },

            {
              ngay_ket_thuc: {
                gte:
                  HomNay,
              },
            },
          ],
        },

        include: {
          lop_hoc: {
            include: {
              nam_hoc: true,
              khoi: true,
            },
          },
        },
      });
  }

  // ==================================================
  // 2. LẤY SỔ ĐIỂM DANH CỦA LỚP THEO NGÀY + BUỔI
  // ==================================================

  async LaySoDiemDanh(
    TaiKhoanId: number,
    VaiTro: string,
    LopHocId: number,
    NgayHocChuoi: string,
    BuoiHocChuoi: string,
  ) {
    const NgayHoc =
      this.ChuyenNgay(
        NgayHocChuoi,
        'Ngày học',
      );

    const BuoiHoc =
      BuoiHocChuoi
        .trim()
        .toUpperCase();

    this.KiemTraBuoiHoc(
      BuoiHoc,
    );

    const LopHoc =
      await this.Prisma.lop_hoc.findUnique({
        where: {
          id:
            LopHocId,
        },

        include: {
          nam_hoc: true,
          khoi: true,
        },
      });

    if (!LopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    // Giáo viên chỉ xem lớp mình chủ nhiệm.
    // Admin có thể xem để quản trị.

    if (
      VaiTro ===
      'GIAO_VIEN'
    ) {
      const GiaoVien =
        await this.LayGiaoVienTuTaiKhoan(
          TaiKhoanId,
        );

      await this.KiemTraGvcn(
        GiaoVien.id,
        LopHocId,
        NgayHoc,
      );
    } else if (
      VaiTro !==
      'ADMIN'
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xem sổ điểm danh lớp',
      );
    }

    const DanhSach =
      await this.Prisma.xep_lop.findMany({
        where: {
          lop_hoc_id:
            LopHocId,

          ngay_bat_dau: {
            lte:
              NgayHoc,
          },

          OR: [
            {
              ngay_ket_thuc:
                null,
            },

            {
              ngay_ket_thuc: {
                gte:
                  NgayHoc,
              },
            },
          ],
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

          diem_danh: {
            where: {
              ngay_hoc:
                NgayHoc,

              buoi_hoc:
                BuoiHoc,
            },

            select: {
              id: true,
              trang_thai: true,
              ghi_chu: true,
              giao_vien_cap_nhat_id: true,
              ngay_cap_nhat: true,
            },
          },
        },
      });

    return {
      lop_hoc:
        LopHoc,

      ngay_hoc:
        NgayHoc,

      buoi_hoc:
        BuoiHoc,

      danh_sach:
        DanhSach,
    };
  }

  // ==================================================
  // 3. ĐIỂM DANH CẢ LỚP
  // CHỈ GVCN
  // ==================================================

  async DiemDanhHangLoat(
    TaiKhoanId: number,
    DuLieu: DiemDanhHangLoatDto,
  ) {
    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const NgayHoc =
      this.ChuyenNgay(
        DuLieu.ngay_hoc,
        'Ngày học',
      );

    const BuoiHoc =
      DuLieu.buoi_hoc
        ?.trim()
        .toUpperCase();

    this.KiemTraBuoiHoc(
      BuoiHoc,
    );

    if (
      !Array.isArray(
        DuLieu.danh_sach,
      ) ||
      DuLieu.danh_sach.length === 0
    ) {
      throw new BadRequestException(
        'Danh sách điểm danh không được để trống',
      );
    }

    const XepLopIds =
      DuLieu.danh_sach.map(
        (Item) =>
          Item.xep_lop_id,
      );

    if (
      XepLopIds.some(
        (id) =>
          !Number.isInteger(id) ||
          id <= 0,
      )
    ) {
      throw new BadRequestException(
        'Danh sách điểm danh có xếp lớp không hợp lệ',
      );
    }

    if (
      new Set(
        XepLopIds,
      ).size !==
      XepLopIds.length
    ) {
      throw new BadRequestException(
        'Danh sách điểm danh không được chứa trùng xếp lớp',
      );
    }

    const LopHoc =
      await this.Prisma.lop_hoc.findUnique({
        where: {
          id:
            DuLieu.lop_hoc_id,
        },
      });

    if (!LopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    await this.KiemTraGvcn(
      GiaoVien.id,
      DuLieu.lop_hoc_id,
      NgayHoc,
    );

    return this.Prisma.$transaction(
      async (tx) => {
        const KetQua = [];

        for (
          const Item
          of DuLieu.danh_sach
        ) {
          const TrangThai = KiemTraGiaTriQuyUoc(Item.trang_thai, QuyUoc.DiemDanh, 'Trạng thái điểm danh');

          const XepLop =
            await tx.xep_lop.findFirst({
              where: {
                id:
                  Item.xep_lop_id,

                lop_hoc_id:
                  DuLieu.lop_hoc_id,

                ngay_bat_dau: {
                  lte:
                    NgayHoc,
                },

                OR: [
                  {
                    ngay_ket_thuc:
                      null,
                  },

                  {
                    ngay_ket_thuc: {
                      gte:
                        NgayHoc,
                    },
                  },
                ],
              },
            });

          if (!XepLop) {
            throw new BadRequestException(
              `Xếp lớp ID ${Item.xep_lop_id} không hợp lệ tại ngày điểm danh`,
            );
          }

          const DiemDanhCu =
            await tx.diem_danh.findFirst({
              where: {
                xep_lop_id:
                  Item.xep_lop_id,

                ngay_hoc:
                  NgayHoc,

                buoi_hoc:
                  BuoiHoc,
              },
            });

          if (DiemDanhCu) {
            const CapNhat =
              await tx.diem_danh.update({
                where: {
                  id:
                    DiemDanhCu.id,
                },

                data: {
                  trang_thai:
                    TrangThai,

                  ghi_chu:
                    Item.ghi_chu
                      ?.trim() ||
                    null,

                  giao_vien_cap_nhat_id:
                    GiaoVien.id,

                  ngay_cap_nhat:
                    new Date(),
                },
              });

            KetQua.push(
              CapNhat,
            );
          } else {
            const TaoMoi =
              await tx.diem_danh.create({
                data: {
                  xep_lop_id:
                    Item.xep_lop_id,

                  ngay_hoc:
                    NgayHoc,

                  buoi_hoc:
                    BuoiHoc,

                  trang_thai:
                    TrangThai,

                  ghi_chu:
                    Item.ghi_chu
                      ?.trim() ||
                    null,

                  giao_vien_cap_nhat_id:
                    GiaoVien.id,
                },
              });

            KetQua.push(
              TaoMoi,
            );
          }
        }

        return {
          thong_bao:
            'Điểm danh thành công',

          tong_so:
            KetQua.length,

          danh_sach:
            KetQua,
        };
      },
    );
  }

  // ==================================================
  // 4. PHỤ HUYNH XEM ĐIỂM DANH CỦA CON
  // ==================================================

  async LayDiemDanhCuaCon(
    TaiKhoanId: number,
    HocSinhId: number,
    TuNgayChuoi?: string,
    DenNgayChuoi?: string,
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
        'Bạn không có quyền xem học sinh này',
      );
    }

    const TuNgay =
      TuNgayChuoi
        ? this.ChuyenNgay(
            TuNgayChuoi,
            'Từ ngày',
          )
        : undefined;

    const DenNgay =
      DenNgayChuoi
        ? this.ChuyenNgay(
            DenNgayChuoi,
            'Đến ngày',
          )
        : undefined;

    if (
      TuNgay &&
      DenNgay &&
      DenNgay < TuNgay
    ) {
      throw new BadRequestException(
        'Đến ngày phải lớn hơn hoặc bằng từ ngày',
      );
    }

    const DanhSachXepLop =
      await this.Prisma.xep_lop.findMany({
        where: {
          hoc_sinh_id:
            HocSinhId,
        },

        select: {
          id: true,
        },
      });

    const XepLopIds =
      DanhSachXepLop.map(
        (Item) =>
          Item.id,
      );

    const DiemDanh =
      await this.Prisma.diem_danh.findMany({
        where: {
          xep_lop_id: {
            in:
              XepLopIds,
          },

          ...(TuNgay || DenNgay
            ? {
                ngay_hoc: {
                  ...(TuNgay
                    ? {
                        gte:
                          TuNgay,
                      }
                    : {}),

                  ...(DenNgay
                    ? {
                        lte:
                          DenNgay,
                      }
                    : {}),
                },
              }
            : {}),
        },

        orderBy: [
          {
            ngay_hoc:
              'desc',
          },

          {
            buoi_hoc:
              'asc',
          },
        ],

        include: {
          xep_lop: {
            include: {
              lop_hoc: {
                include: {
                  nam_hoc: true,
                  khoi: true,
                },
              },
            },
          },
        },
      });

    return {
      hoc_sinh_id:
        HocSinhId,

      diem_danh:
        DiemDanh,
    };
  }

  // ==================================================
  // 5. PHỤ HUYNH GỬI ĐƠN XIN NGHỈ
  // ==================================================

  async TaoDonXinNghi(
    TaiKhoanId: number,
    DuLieu: TaoDonXinNghiDto,
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
              DuLieu.hoc_sinh_id,
          },
        });

    if (!LienKet) {
      throw new ForbiddenException(
        'Bạn không có quyền gửi đơn cho học sinh này',
      );
    }

    const NgayBatDau =
      this.ChuyenNgay(
        DuLieu.ngay_bat_dau,
        'Ngày bắt đầu',
      );

    const NgayKetThuc =
      this.ChuyenNgay(
        DuLieu.ngay_ket_thuc,
        'Ngày kết thúc',
      );

    if (
      NgayKetThuc <
      NgayBatDau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }

    const BuoiNghi =
      DuLieu.buoi_nghi
        ?.trim()
        .toUpperCase();

    this.KiemTraBuoiNghi(
      BuoiNghi,
    );

    const LyDo =
      DuLieu.ly_do?.trim();

    if (!LyDo) {
      throw new BadRequestException(
        'Lý do xin nghỉ không được để trống',
      );
    }

    const Don =
      await this.Prisma.don_xin_nghi.create({
        data: {
          hoc_sinh_id:
            DuLieu.hoc_sinh_id,

          phu_huynh_id:
            PhuHuynh.id,

          ngay_bat_dau:
            NgayBatDau,

          ngay_ket_thuc:
            NgayKetThuc,

          buoi_nghi:
            BuoiNghi,

          ly_do:
            LyDo,

          trang_thai:
            'CHO_DUYET',
        },

        include: {
          hoc_sinh: {
            select: {
              id: true,
              ma_hoc_sinh: true,
              ho_ten: true,
            },
          },
        },
      });

    return {
      thong_bao:
        'Gửi đơn xin nghỉ thành công',

      don_xin_nghi:
        Don,
    };
  }

  // ==================================================
  // 6. PHỤ HUYNH XEM ĐƠN CỦA MÌNH
  // ==================================================

  async LayDonXinNghiCuaToi(
    TaiKhoanId: number,
  ) {
    const PhuHuynh =
      await this.LayPhuHuynhTuTaiKhoan(
        TaiKhoanId,
      );

    return this.Prisma.don_xin_nghi.findMany({
      where: {
        phu_huynh_id:
          PhuHuynh.id,
      },

      orderBy: {
        ngay_gui:
          'desc',
      },

      include: {
        hoc_sinh: {
          select: {
            id: true,
            ma_hoc_sinh: true,
            ho_ten: true,
          },
        },

        giao_vien: {
          select: {
            id: true,
            ma_giao_vien: true,
            ho_ten: true,
          },
        },
      },
    });
  }

  // ==================================================
  // 7. GVCN XEM ĐƠN CỦA MỘT LỚP
  // ==================================================

  async LayDonXinNghiCuaLop(
    TaiKhoanId: number,
    LopHocId: number,
    TrangThai?: string,
  ) {
    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const HomNay =
      LayNgayNghiepVu();

    await this.KiemTraGvcn(
      GiaoVien.id,
      LopHocId,
      HomNay,
    );

    const DanhSachXepLop =
      await this.Prisma.xep_lop.findMany({
        where: {
          lop_hoc_id:
            LopHocId,
        },

        select: {
          hoc_sinh_id:
            true,

          ngay_bat_dau:
            true,

          ngay_ket_thuc:
            true,
        },
      });

    const DieuKienTheoXepLop =
      DanhSachXepLop.map(
        (XepLop) => ({
          hoc_sinh_id:
            XepLop.hoc_sinh_id,

          ngay_ket_thuc: {
            gte:
              XepLop.ngay_bat_dau,
          },

          ...(XepLop.ngay_ket_thuc
            ? {
                ngay_bat_dau: {
                  lte:
                    XepLop.ngay_ket_thuc,
                },
              }
            : {}),
        }),
      );

    return this.Prisma.don_xin_nghi.findMany({
      where: {
        OR:
          DieuKienTheoXepLop,

        ...(TrangThai?.trim()
          ? {
              trang_thai:
                TrangThai
                  .trim()
                  .toUpperCase(),
            }
          : {}),
      },

      orderBy: {
        ngay_gui:
          'desc',
      },

      include: {
        hoc_sinh: {
          select: {
            id: true,
            ma_hoc_sinh: true,
            ho_ten: true,
          },
        },

        phu_huynh: {
          select: {
            id: true,
            ho_ten: true,
            so_dien_thoai: true,
          },
        },
      },
    });
  }

  // ==================================================
  // 8. GVCN DUYỆT / TỪ CHỐI ĐƠN
  // ==================================================

  async XuLyDonXinNghi(
    TaiKhoanId: number,
    DonId: number,
    DuLieu: XuLyDonXinNghiDto,
  ) {
    const GiaoVien =
      await this.LayGiaoVienTuTaiKhoan(
        TaiKhoanId,
      );

    const Don =
      await this.Prisma.don_xin_nghi.findUnique({
        where: {
          id:
            DonId,
        },
      });

    if (!Don) {
      throw new NotFoundException(
        'Không tìm thấy đơn xin nghỉ',
      );
    }

    if (
      Don.trang_thai !==
      'CHO_DUYET'
    ) {
      throw new BadRequestException(
        'Đơn này đã được xử lý',
      );
    }

    const TrangThai =
      DuLieu.trang_thai
        ?.trim()
        .toUpperCase();

    if (
      ![
        'DA_DUYET',
        'TU_CHOI',
      ].includes(TrangThai)
    ) {
      throw new BadRequestException(
        'Trạng thái phải là DA_DUYET hoặc TU_CHOI',
      );
    }

    if (
      TrangThai ===
        'TU_CHOI' &&
      !DuLieu.ly_do_tu_choi?.trim()
    ) {
      throw new BadRequestException(
        'Phải nhập lý do từ chối',
      );
    }

    // Tìm lớp của HS tại ngày bắt đầu xin nghỉ

    const XepLop =
      await this.Prisma.xep_lop.findFirst({
        where: {
          hoc_sinh_id:
            Don.hoc_sinh_id,

          ngay_bat_dau: {
            lte:
              Don.ngay_bat_dau,
          },

          OR: [
            {
              ngay_ket_thuc:
                null,
            },

            {
              ngay_ket_thuc: {
                gte:
                  Don.ngay_bat_dau,
              },
            },
          ],
        },

        orderBy: {
          ngay_bat_dau:
            'desc',
        },
      });

    if (!XepLop) {
      throw new BadRequestException(
        'Không xác định được lớp của học sinh tại thời điểm xin nghỉ',
      );
    }

    // Chỉ GVCN lớp đó được duyệt

    await this.KiemTraGvcn(
      GiaoVien.id,
      XepLop.lop_hoc_id,
      Don.ngay_bat_dau,
    );

    const KetQua =
      await this.Prisma.don_xin_nghi.update({
        where: {
          id:
            DonId,
        },

        data: {
          trang_thai:
            TrangThai,

          giao_vien_duyet_id:
            GiaoVien.id,

          ly_do_tu_choi:
            TrangThai ===
            'TU_CHOI'
              ? DuLieu.ly_do_tu_choi
                  ?.trim()
              : null,

          ngay_xu_ly:
            new Date(),
        },

        include: {
          hoc_sinh: {
            select: {
              id: true,
              ma_hoc_sinh: true,
              ho_ten: true,
            },
          },

          phu_huynh: {
            select: {
              id: true,
              ho_ten: true,
            },
          },

          giao_vien: {
            select: {
              id: true,
              ho_ten: true,
            },
          },
        },
      });

    return {
      thong_bao:
        TrangThai ===
        'DA_DUYET'
          ? 'Đã duyệt đơn xin nghỉ'
          : 'Đã từ chối đơn xin nghỉ',

      don_xin_nghi:
        KetQua,
    };
  }
}