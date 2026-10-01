import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service';

import {
  DiemDanhHangLoatDto,
  TaoDonXinNghiDto,
  XuLyDonXinNghiDto,
} from './diem_danh_nghi_hoc.dto';

@Injectable()
export class DiemDanhNghiHocService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ==================================================
  // HÀM DÙNG CHUNG
  // ==================================================

  private chuyenNgay(
    giaTri: string,
    tenTruong: string,
  ): Date {
    const ngay = new Date(
      `${giaTri}T00:00:00.000Z`,
    );

    if (Number.isNaN(ngay.getTime())) {
      throw new BadRequestException(
        `${tenTruong} không hợp lệ`,
      );
    }

    return ngay;
  }

  private kiemTraBuoiHoc(
    buoiHoc: string,
  ) {
    if (
      ![
        'SANG',
        'CHIEU',
      ].includes(buoiHoc)
    ) {
      throw new BadRequestException(
        'Buổi học phải là SANG hoặc CHIEU',
      );
    }
  }

  private kiemTraBuoiNghi(
    buoiNghi: string,
  ) {
    if (
      ![
        'SANG',
        'CHIEU',
        'CA_NGAY',
      ].includes(buoiNghi)
    ) {
      throw new BadRequestException(
        'Buổi nghỉ không hợp lệ',
      );
    }
  }

  private async layGiaoVienTuTaiKhoan(
    taiKhoanId: number,
  ) {
    const giaoVien =
      await this.prisma.giao_vien.findUnique({
        where: {
          tai_khoan_id:
            taiKhoanId,
        },
      });

    if (!giaoVien) {
      throw new ForbiddenException(
        'Không tìm thấy hồ sơ giáo viên',
      );
    }

    return giaoVien;
  }

  private async layPhuHuynhTuTaiKhoan(
    taiKhoanId: number,
  ) {
    const phuHuynh =
      await this.prisma.phu_huynh.findUnique({
        where: {
          tai_khoan_id:
            taiKhoanId,
        },
      });

    if (!phuHuynh) {
      throw new ForbiddenException(
        'Không tìm thấy hồ sơ phụ huynh',
      );
    }

    return phuHuynh;
  }

  // ==================================================
  // KIỂM TRA GIÁO VIÊN CÓ LÀ GVCN CỦA LỚP
  // TẠI NGÀY ĐÓ KHÔNG
  // ==================================================

  private async kiemTraGvcn(
    giaoVienId: number,
    lopHocId: number,
    ngay: Date,
  ) {
    const phanCong =
      await this.prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            giao_vien_id:
              giaoVienId,

            lop_hoc_id:
              lopHocId,

            loai_phan_cong:
              'GVCN',

            mon_hoc_id:
              null,

            ngay_bat_dau: {
              lte:
                ngay,
            },

            OR: [
              {
                ngay_ket_thuc:
                  null,
              },

              {
                ngay_ket_thuc: {
                  gte:
                    ngay,
                },
              },
            ],
          },
        });

    if (!phanCong) {
      throw new ForbiddenException(
        'Bạn không phải giáo viên chủ nhiệm của lớp trong thời gian này',
      );
    }

    return phanCong;
  }

  // ==================================================
  // 1. LẤY DANH SÁCH LỚP ĐỂ ĐIỂM DANH
  // GVCN dùng
  // ==================================================

  async layLopChuNhiemCuaToi(
    taiKhoanId: number,
  ) {
    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    const homNay =
      this.chuyenNgay(
        new Date()
          .toISOString()
          .slice(0, 10),
        'Ngày hiện tại',
      );

    return this.prisma
      .phan_cong_giao_vien
      .findMany({
        where: {
          giao_vien_id:
            giaoVien.id,

          loai_phan_cong:
            'GVCN',

          mon_hoc_id:
            null,

          ngay_bat_dau: {
            lte:
              homNay,
          },

          OR: [
            {
              ngay_ket_thuc:
                null,
            },

            {
              ngay_ket_thuc: {
                gte:
                  homNay,
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

  async laySoDiemDanh(
    taiKhoanId: number,
    vaiTro: string,
    lopHocId: number,
    ngayHocChuoi: string,
    buoiHocChuoi: string,
  ) {
    const ngayHoc =
      this.chuyenNgay(
        ngayHocChuoi,
        'Ngày học',
      );

    const buoiHoc =
      buoiHocChuoi
        .trim()
        .toUpperCase();

    this.kiemTraBuoiHoc(
      buoiHoc,
    );

    const lopHoc =
      await this.prisma.lop_hoc.findUnique({
        where: {
          id:
            lopHocId,
        },

        include: {
          nam_hoc: true,
          khoi: true,
        },
      });

    if (!lopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    // Giáo viên chỉ xem lớp mình chủ nhiệm.
    // Admin có thể xem để quản trị.

    if (
      vaiTro ===
      'GIAO_VIEN'
    ) {
      const giaoVien =
        await this.layGiaoVienTuTaiKhoan(
          taiKhoanId,
        );

      await this.kiemTraGvcn(
        giaoVien.id,
        lopHocId,
        ngayHoc,
      );
    } else if (
      vaiTro !==
      'ADMIN'
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xem sổ điểm danh lớp',
      );
    }

    const danhSach =
      await this.prisma.xep_lop.findMany({
        where: {
          lop_hoc_id:
            lopHocId,

          ngay_bat_dau: {
            lte:
              ngayHoc,
          },

          OR: [
            {
              ngay_ket_thuc:
                null,
            },

            {
              ngay_ket_thuc: {
                gte:
                  ngayHoc,
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
                ngayHoc,

              buoi_hoc:
                buoiHoc,
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
        lopHoc,

      ngay_hoc:
        ngayHoc,

      buoi_hoc:
        buoiHoc,

      danh_sach:
        danhSach,
    };
  }

  // ==================================================
  // 3. ĐIỂM DANH CẢ LỚP
  // CHỈ GVCN
  // ==================================================

  async diemDanhHangLoat(
    taiKhoanId: number,
    duLieu: DiemDanhHangLoatDto,
  ) {
    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    const ngayHoc =
      this.chuyenNgay(
        duLieu.ngay_hoc,
        'Ngày học',
      );

    const buoiHoc =
      duLieu.buoi_hoc
        ?.trim()
        .toUpperCase();

    this.kiemTraBuoiHoc(
      buoiHoc,
    );

    if (
      !Array.isArray(
        duLieu.danh_sach,
      ) ||
      duLieu.danh_sach.length === 0
    ) {
      throw new BadRequestException(
        'Danh sách điểm danh không được để trống',
      );
    }

    const xepLopIds =
      duLieu.danh_sach.map(
        (item) =>
          item.xep_lop_id,
      );

    if (
      xepLopIds.some(
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
        xepLopIds,
      ).size !==
      xepLopIds.length
    ) {
      throw new BadRequestException(
        'Danh sách điểm danh không được chứa trùng xếp lớp',
      );
    }

    const lopHoc =
      await this.prisma.lop_hoc.findUnique({
        where: {
          id:
            duLieu.lop_hoc_id,
        },
      });

    if (!lopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    await this.kiemTraGvcn(
      giaoVien.id,
      duLieu.lop_hoc_id,
      ngayHoc,
    );

    return this.prisma.$transaction(
      async (tx) => {
        const ketQua = [];

        for (
          const item
          of duLieu.danh_sach
        ) {
          if (
            !item.trang_thai?.trim()
          ) {
            throw new BadRequestException(
              'Trạng thái điểm danh không được để trống',
            );
          }

          const xepLop =
            await tx.xep_lop.findFirst({
              where: {
                id:
                  item.xep_lop_id,

                lop_hoc_id:
                  duLieu.lop_hoc_id,

                ngay_bat_dau: {
                  lte:
                    ngayHoc,
                },

                OR: [
                  {
                    ngay_ket_thuc:
                      null,
                  },

                  {
                    ngay_ket_thuc: {
                      gte:
                        ngayHoc,
                    },
                  },
                ],
              },
            });

          if (!xepLop) {
            throw new BadRequestException(
              `Xếp lớp ID ${item.xep_lop_id} không hợp lệ tại ngày điểm danh`,
            );
          }

          const diemDanhCu =
            await tx.diem_danh.findFirst({
              where: {
                xep_lop_id:
                  item.xep_lop_id,

                ngay_hoc:
                  ngayHoc,

                buoi_hoc:
                  buoiHoc,
              },
            });

          if (diemDanhCu) {
            const capNhat =
              await tx.diem_danh.update({
                where: {
                  id:
                    diemDanhCu.id,
                },

                data: {
                  trang_thai:
                    item.trang_thai
                      .trim()
                      .toUpperCase(),

                  ghi_chu:
                    item.ghi_chu
                      ?.trim() ||
                    null,

                  giao_vien_cap_nhat_id:
                    giaoVien.id,

                  ngay_cap_nhat:
                    new Date(),
                },
              });

            ketQua.push(
              capNhat,
            );
          } else {
            const taoMoi =
              await tx.diem_danh.create({
                data: {
                  xep_lop_id:
                    item.xep_lop_id,

                  ngay_hoc:
                    ngayHoc,

                  buoi_hoc:
                    buoiHoc,

                  trang_thai:
                    item.trang_thai
                      .trim()
                      .toUpperCase(),

                  ghi_chu:
                    item.ghi_chu
                      ?.trim() ||
                    null,

                  giao_vien_cap_nhat_id:
                    giaoVien.id,
                },
              });

            ketQua.push(
              taoMoi,
            );
          }
        }

        return {
          thong_bao:
            'Điểm danh thành công',

          tong_so:
            ketQua.length,

          danh_sach:
            ketQua,
        };
      },
    );
  }

  // ==================================================
  // 4. PHỤ HUYNH XEM ĐIỂM DANH CỦA CON
  // ==================================================

  async layDiemDanhCuaCon(
    taiKhoanId: number,
    hocSinhId: number,
    tuNgayChuoi?: string,
    denNgayChuoi?: string,
  ) {
    const phuHuynh =
      await this.layPhuHuynhTuTaiKhoan(
        taiKhoanId,
      );

    const lienKet =
      await this.prisma
        .phu_huynh_hoc_sinh
        .findFirst({
          where: {
            phu_huynh_id:
              phuHuynh.id,

            hoc_sinh_id:
              hocSinhId,
          },
        });

    if (!lienKet) {
      throw new ForbiddenException(
        'Bạn không có quyền xem học sinh này',
      );
    }

    const tuNgay =
      tuNgayChuoi
        ? this.chuyenNgay(
            tuNgayChuoi,
            'Từ ngày',
          )
        : undefined;

    const denNgay =
      denNgayChuoi
        ? this.chuyenNgay(
            denNgayChuoi,
            'Đến ngày',
          )
        : undefined;

    if (
      tuNgay &&
      denNgay &&
      denNgay < tuNgay
    ) {
      throw new BadRequestException(
        'Đến ngày phải lớn hơn hoặc bằng từ ngày',
      );
    }

    const danhSachXepLop =
      await this.prisma.xep_lop.findMany({
        where: {
          hoc_sinh_id:
            hocSinhId,
        },

        select: {
          id: true,
        },
      });

    const xepLopIds =
      danhSachXepLop.map(
        (item) =>
          item.id,
      );

    const diemDanh =
      await this.prisma.diem_danh.findMany({
        where: {
          xep_lop_id: {
            in:
              xepLopIds,
          },

          ...(tuNgay || denNgay
            ? {
                ngay_hoc: {
                  ...(tuNgay
                    ? {
                        gte:
                          tuNgay,
                      }
                    : {}),

                  ...(denNgay
                    ? {
                        lte:
                          denNgay,
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
        hocSinhId,

      diem_danh:
        diemDanh,
    };
  }

  // ==================================================
  // 5. PHỤ HUYNH GỬI ĐƠN XIN NGHỈ
  // ==================================================

  async taoDonXinNghi(
    taiKhoanId: number,
    duLieu: TaoDonXinNghiDto,
  ) {
    const phuHuynh =
      await this.layPhuHuynhTuTaiKhoan(
        taiKhoanId,
      );

    const lienKet =
      await this.prisma
        .phu_huynh_hoc_sinh
        .findFirst({
          where: {
            phu_huynh_id:
              phuHuynh.id,

            hoc_sinh_id:
              duLieu.hoc_sinh_id,
          },
        });

    if (!lienKet) {
      throw new ForbiddenException(
        'Bạn không có quyền gửi đơn cho học sinh này',
      );
    }

    const ngayBatDau =
      this.chuyenNgay(
        duLieu.ngay_bat_dau,
        'Ngày bắt đầu',
      );

    const ngayKetThuc =
      this.chuyenNgay(
        duLieu.ngay_ket_thuc,
        'Ngày kết thúc',
      );

    if (
      ngayKetThuc <
      ngayBatDau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }

    const buoiNghi =
      duLieu.buoi_nghi
        ?.trim()
        .toUpperCase();

    this.kiemTraBuoiNghi(
      buoiNghi,
    );

    const lyDo =
      duLieu.ly_do?.trim();

    if (!lyDo) {
      throw new BadRequestException(
        'Lý do xin nghỉ không được để trống',
      );
    }

    const don =
      await this.prisma.don_xin_nghi.create({
        data: {
          hoc_sinh_id:
            duLieu.hoc_sinh_id,

          phu_huynh_id:
            phuHuynh.id,

          ngay_bat_dau:
            ngayBatDau,

          ngay_ket_thuc:
            ngayKetThuc,

          buoi_nghi:
            buoiNghi,

          ly_do:
            lyDo,

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
        don,
    };
  }

  // ==================================================
  // 6. PHỤ HUYNH XEM ĐƠN CỦA MÌNH
  // ==================================================

  async layDonXinNghiCuaToi(
    taiKhoanId: number,
  ) {
    const phuHuynh =
      await this.layPhuHuynhTuTaiKhoan(
        taiKhoanId,
      );

    return this.prisma.don_xin_nghi.findMany({
      where: {
        phu_huynh_id:
          phuHuynh.id,
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

  async layDonXinNghiCuaLop(
    taiKhoanId: number,
    lopHocId: number,
    trangThai?: string,
  ) {
    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    const homNay =
      this.chuyenNgay(
        new Date()
          .toISOString()
          .slice(0, 10),
        'Ngày hiện tại',
      );

    await this.kiemTraGvcn(
      giaoVien.id,
      lopHocId,
      homNay,
    );

    const danhSachXepLop =
      await this.prisma.xep_lop.findMany({
        where: {
          lop_hoc_id:
            lopHocId,
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

    const dieuKienTheoXepLop =
      danhSachXepLop.map(
        (xepLop) => ({
          hoc_sinh_id:
            xepLop.hoc_sinh_id,

          ngay_ket_thuc: {
            gte:
              xepLop.ngay_bat_dau,
          },

          ...(xepLop.ngay_ket_thuc
            ? {
                ngay_bat_dau: {
                  lte:
                    xepLop.ngay_ket_thuc,
                },
              }
            : {}),
        }),
      );

    return this.prisma.don_xin_nghi.findMany({
      where: {
        OR:
          dieuKienTheoXepLop,

        ...(trangThai?.trim()
          ? {
              trang_thai:
                trangThai
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

  async xuLyDonXinNghi(
    taiKhoanId: number,
    donId: number,
    duLieu: XuLyDonXinNghiDto,
  ) {
    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    const don =
      await this.prisma.don_xin_nghi.findUnique({
        where: {
          id:
            donId,
        },
      });

    if (!don) {
      throw new NotFoundException(
        'Không tìm thấy đơn xin nghỉ',
      );
    }

    if (
      don.trang_thai !==
      'CHO_DUYET'
    ) {
      throw new BadRequestException(
        'Đơn này đã được xử lý',
      );
    }

    const trangThai =
      duLieu.trang_thai
        ?.trim()
        .toUpperCase();

    if (
      ![
        'DA_DUYET',
        'TU_CHOI',
      ].includes(trangThai)
    ) {
      throw new BadRequestException(
        'Trạng thái phải là DA_DUYET hoặc TU_CHOI',
      );
    }

    if (
      trangThai ===
        'TU_CHOI' &&
      !duLieu.ly_do_tu_choi?.trim()
    ) {
      throw new BadRequestException(
        'Phải nhập lý do từ chối',
      );
    }

    // Tìm lớp của HS tại ngày bắt đầu xin nghỉ

    const xepLop =
      await this.prisma.xep_lop.findFirst({
        where: {
          hoc_sinh_id:
            don.hoc_sinh_id,

          ngay_bat_dau: {
            lte:
              don.ngay_bat_dau,
          },

          OR: [
            {
              ngay_ket_thuc:
                null,
            },

            {
              ngay_ket_thuc: {
                gte:
                  don.ngay_bat_dau,
              },
            },
          ],
        },

        orderBy: {
          ngay_bat_dau:
            'desc',
        },
      });

    if (!xepLop) {
      throw new BadRequestException(
        'Không xác định được lớp của học sinh tại thời điểm xin nghỉ',
      );
    }

    // Chỉ GVCN lớp đó được duyệt

    await this.kiemTraGvcn(
      giaoVien.id,
      xepLop.lop_hoc_id,
      don.ngay_bat_dau,
    );

    const ketQua =
      await this.prisma.don_xin_nghi.update({
        where: {
          id:
            donId,
        },

        data: {
          trang_thai:
            trangThai,

          giao_vien_duyet_id:
            giaoVien.id,

          ly_do_tu_choi:
            trangThai ===
            'TU_CHOI'
              ? duLieu.ly_do_tu_choi
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
        trangThai ===
        'DA_DUYET'
          ? 'Đã duyệt đơn xin nghỉ'
          : 'Đã từ chối đơn xin nghỉ',

      don_xin_nghi:
        ketQua,
    };
  }
}