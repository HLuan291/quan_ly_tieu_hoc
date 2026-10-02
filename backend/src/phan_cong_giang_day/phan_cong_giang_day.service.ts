import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../Prisma.service';

import {
  CapNhatMonHocDto,
  CapNhatMonHocKhoiDto,
  GanMonHocChoKhoiDto,
  KetThucPhanCongDto,
  PhanCongGvcnDto,
  PhanCongMonHocDto,
  TaoMonHocDto,
} from './phan_cong_giang_day.dto';

@Injectable()
export class PhanCongGiangDayService {
  constructor(
    private readonly Prisma: PrismaService,
  ) {}

  // ==================================================
  // HÀM DÙNG CHUNG
  // ==================================================

  private ChuyenNgay(
    GiaTri: string,
    TenTruong: string,
  ): Date {
    const Ngay = new Date(
      `${GiaTri}T00:00:00.000Z`,
    );

    if (Number.isNaN(Ngay.getTime())) {
      throw new BadRequestException(
        `${TenTruong} không hợp lệ`,
      );
    }

    return Ngay;
  }

  private KiemTraKhoangNgay(
    NgayBatDau: Date,
    NgayKetThuc: Date | null,
  ) {
    if (
      NgayKetThuc &&
      NgayKetThuc < NgayBatDau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }
  }

  // ==================================================
  // 1. TẠO MÔN HỌC
  // ==================================================

  async TaoMonHoc(
    DuLieu: TaoMonHocDto,
  ) {
    const MaMonHoc =
      DuLieu.ma_mon_hoc
        ?.trim()
        .toUpperCase();

    const TenMonHoc =
      DuLieu.ten_mon_hoc?.trim();

    if (
      !MaMonHoc ||
      !TenMonHoc
    ) {
      throw new BadRequestException(
        'Mã môn học và tên môn học không được để trống',
      );
    }

    const MonHocCu =
      await this.Prisma.mon_hoc.findUnique({
        where: {
          ma_mon_hoc:
            MaMonHoc,
        },
      });

    if (MonHocCu) {
      throw new ConflictException(
        'Mã môn học đã tồn tại',
      );
    }

    const MonHoc =
      await this.Prisma.mon_hoc.create({
        data: {
          ma_mon_hoc:
            MaMonHoc,

          ten_mon_hoc:
            TenMonHoc,
        },
      });

    return {
      thong_bao:
        'Tạo môn học thành công',

      mon_hoc:
        MonHoc,
    };
  }

  // ==================================================
  // 2. DANH SÁCH MÔN HỌC
  // ==================================================

  async LayDanhSachMonHoc(
    TuKhoa?: string,
    TrangThai?: string,
  ) {
    const Tim =
      TuKhoa?.trim();

    const TrangThaiTim =
      TrangThai?.trim();

    return this.Prisma.mon_hoc.findMany({
      where: {
        ...(Tim
          ? {
              OR: [
                {
                  ma_mon_hoc: {
                    contains:
                      Tim,
                  },
                },

                {
                  ten_mon_hoc: {
                    contains:
                      Tim,
                  },
                },
              ],
            }
          : {}),

        ...(TrangThaiTim
          ? {
              trang_thai:
                TrangThaiTim,
            }
          : {}),
      },

      orderBy: {
        ten_mon_hoc:
          'asc',
      },
    });
  }

  // ==================================================
  // 3. CẬP NHẬT MÔN HỌC
  // ==================================================

  async CapNhatMonHoc(
    Id: number,
    DuLieu: CapNhatMonHocDto,
  ) {
    const MonHoc =
      await this.Prisma.mon_hoc.findUnique({
        where: {
          Id,
        },
      });

    if (!MonHoc) {
      throw new NotFoundException(
        'Không tìm thấy môn học',
      );
    }

    if (
      DuLieu.ten_mon_hoc === undefined &&
      DuLieu.trang_thai === undefined
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }

    const TenMonHoc =
      DuLieu.ten_mon_hoc?.trim();

    const TrangThai =
      DuLieu.trang_thai?.trim();

    if (
      DuLieu.ten_mon_hoc !== undefined &&
      !TenMonHoc
    ) {
      throw new BadRequestException(
        'Tên môn học không được để trống',
      );
    }

    if (
      DuLieu.trang_thai !== undefined &&
      !TrangThai
    ) {
      throw new BadRequestException(
        'Trạng thái không được để trống',
      );
    }

    const KetQua =
      await this.Prisma.mon_hoc.update({
        where: {
          Id,
        },

        data: {
          ...(TenMonHoc
            ? {
                ten_mon_hoc:
                  TenMonHoc,
              }
            : {}),

          ...(TrangThai
            ? {
                trang_thai:
                  TrangThai,
              }
            : {}),

          ngay_cap_nhat:
            new Date(),
        },
      });

    return {
      thong_bao:
        'Cập nhật môn học thành công',

      mon_hoc:
        KetQua,
    };
  }

  // ==================================================
  // 4. GẮN MÔN HỌC VÀO KHỐI
  // ==================================================

  async GanMonHocChoKhoi(
    DuLieu: GanMonHocChoKhoiDto,
  ) {
    if (
      !Number.isInteger(
        DuLieu.mon_hoc_id,
      ) ||
      DuLieu.mon_hoc_id <= 0
    ) {
      throw new BadRequestException(
        'Môn học không hợp lệ',
      );
    }

    if (
      !Number.isInteger(
        DuLieu.khoi_id,
      ) ||
      DuLieu.khoi_id <= 0
    ) {
      throw new BadRequestException(
        'Khối không hợp lệ',
      );
    }

    const [
      MonHoc,
      khoi,
    ] = await Promise.all([
      this.Prisma.mon_hoc.findUnique({
        where: {
          id:
            DuLieu.mon_hoc_id,
        },
      }),

      this.Prisma.khoi.findUnique({
        where: {
          id:
            DuLieu.khoi_id,
        },
      }),
    ]);

    if (!MonHoc) {
      throw new NotFoundException(
        'Không tìm thấy môn học',
      );
    }

    if (!khoi) {
      throw new NotFoundException(
        'Không tìm thấy khối',
      );
    }

    if (
      MonHoc.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new BadRequestException(
        'Môn học đang không hoạt động',
      );
    }

    const Trung =
      await this.Prisma.mon_hoc_khoi.findFirst({
        where: {
          mon_hoc_id:
            DuLieu.mon_hoc_id,

          khoi_id:
            DuLieu.khoi_id,
        },
      });

    if (Trung) {
      throw new ConflictException(
        'Môn học đã được cấu hình cho khối này',
      );
    }

    const KetQua =
      await this.Prisma.mon_hoc_khoi.create({
        data: {
          mon_hoc_id:
            DuLieu.mon_hoc_id,

          khoi_id:
            DuLieu.khoi_id,

          mac_dinh_gvcn:
            DuLieu.mac_dinh_gvcn ??
            false,
        },

        include: {
          mon_hoc: true,
          khoi: true,
        },
      });

    return {
      thong_bao:
        'Gắn môn học cho khối thành công',

      mon_hoc_khoi:
        KetQua,
    };
  }

  // ==================================================
  // 5. DANH SÁCH MÔN THEO KHỐI
  // ==================================================

  async LayDanhSachMonHocKhoi(
    KhoiId?: number,
  ) {
    return this.Prisma.mon_hoc_khoi.findMany({
      where: {
        ...(KhoiId
          ? {
              khoi_id:
                KhoiId,
            }
          : {}),
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

      include: {
        khoi: true,
        mon_hoc: true,
      },
    });
  }

  // ==================================================
  // 6. ĐỔI MÔN MẶC ĐỊNH GVCN
  // ==================================================

  async CapNhatMonHocKhoi(
    Id: number,
    DuLieu: CapNhatMonHocKhoiDto,
  ) {
    if (
      typeof DuLieu.mac_dinh_gvcn !==
      'boolean'
    ) {
      throw new BadRequestException(
        'mac_dinh_gvcn phải là true hoặc false',
      );
    }

    const CauHinh =
      await this.Prisma.mon_hoc_khoi.findUnique({
        where: {
          Id,
        },
      });

    if (!CauHinh) {
      throw new NotFoundException(
        'Không tìm thấy cấu hình môn học - khối',
      );
    }

    const KetQua =
      await this.Prisma.mon_hoc_khoi.update({
        where: {
          Id,
        },

        data: {
          mac_dinh_gvcn:
            DuLieu.mac_dinh_gvcn,
        },

        include: {
          mon_hoc: true,
          khoi: true,
        },
      });

    return {
      thong_bao:
        'Cập nhật cấu hình môn học - khối thành công',

      mon_hoc_khoi:
        KetQua,
    };
  }

  // ==================================================
  // 7. PHÂN CÔNG GVCN
  //
  // Tạo:
  // - 1 dòng GVCN, mon_hoc_id = null
  // - tự động tạo các môn mac_dinh_gvcn = true
  // ==================================================

  async PhanCongGvcn(
    DuLieu: PhanCongGvcnDto,
  ) {
    if (
      !Number.isInteger(
        DuLieu.giao_vien_id,
      ) ||
      DuLieu.giao_vien_id <= 0
    ) {
      throw new BadRequestException(
        'Giáo viên không hợp lệ',
      );
    }

    if (
      !Number.isInteger(
        DuLieu.lop_hoc_id,
      ) ||
      DuLieu.lop_hoc_id <= 0
    ) {
      throw new BadRequestException(
        'Lớp học không hợp lệ',
      );
    }

    const NgayBatDau =
      this.ChuyenNgay(
        DuLieu.ngay_bat_dau,
        'Ngày bắt đầu',
      );

    const NgayKetThuc =
      DuLieu.ngay_ket_thuc
        ? this.ChuyenNgay(
            DuLieu.ngay_ket_thuc,
            'Ngày kết thúc',
          )
        : null;

    this.KiemTraKhoangNgay(
      NgayBatDau,
      NgayKetThuc,
    );

    const [
      GiaoVien,
      lopHoc,
    ] = await Promise.all([
      this.Prisma.giao_vien.findUnique({
        where: {
          id:
            DuLieu.giao_vien_id,
        },
      }),

      this.Prisma.lop_hoc.findUnique({
        where: {
          id:
            DuLieu.lop_hoc_id,
        },

        include: {
          khoi: true,
          nam_hoc: true,
        },
      }),
    ]);

    if (!GiaoVien) {
      throw new NotFoundException(
        'Không tìm thấy giáo viên',
      );
    }

    if (
      GiaoVien.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new BadRequestException(
        'Giáo viên đang không hoạt động',
      );
    }

    if (!lopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    const MonMacDinh =
      await this.Prisma.mon_hoc_khoi.findMany({
        where: {
          khoi_id:
            lopHoc.khoi_id,

          mac_dinh_gvcn:
            true,

          mon_hoc: {
            trang_thai:
              'HOAT_DONG',
          },
        },

        include: {
          mon_hoc: true,
        },
      });

    return this.Prisma.$transaction(
      async (Tx) => {
        // ------------------------------------------
        // Kiểm tra lớp đã có GVCN trong thời gian này
        // ------------------------------------------

        const GvcnTrung =
          await Tx.phan_cong_giao_vien.findFirst({
            where: {
              lop_hoc_id:
                DuLieu.lop_hoc_id,

              loai_phan_cong:
                'GVCN',

              mon_hoc_id:
                null,

              ...(NgayKetThuc
                ? {
                    ngay_bat_dau: {
                      lte:
                        NgayKetThuc,
                    },
                  }
                : {}),

              OR: [
                {
                  ngay_ket_thuc:
                    null,
                },

                {
                  ngay_ket_thuc: {
                    gte:
                      NgayBatDau,
                  },
                },
              ],
            },
          });

        if (GvcnTrung) {
          throw new ConflictException(
            'Lớp đã có giáo viên chủ nhiệm trong khoảng thời gian này',
          );
        }

        // ------------------------------------------
        // Kiểm tra các môn mặc định chưa bị GV khác giữ
        // ------------------------------------------

        for (
          const CauHinh
          of MonMacDinh
        ) {
          const Trung =
            await Tx.phan_cong_giao_vien.findFirst({
              where: {
                lop_hoc_id:
                  DuLieu.lop_hoc_id,

                mon_hoc_id:
                  CauHinh.mon_hoc_id,

                ...(NgayKetThuc
                  ? {
                      ngay_bat_dau: {
                        lte:
                          NgayKetThuc,
                      },
                    }
                  : {}),

                OR: [
                  {
                    ngay_ket_thuc:
                      null,
                  },

                  {
                    ngay_ket_thuc: {
                      gte:
                        NgayBatDau,
                    },
                  },
                ],
              },
            });

          if (Trung) {
            throw new ConflictException(
              `Môn ${CauHinh.mon_hoc.ten_mon_hoc} đã có giáo viên được phân công trong khoảng thời gian này`,
            );
          }
        }

        // ------------------------------------------
        // Tạo phân công GVCN chính
        // ------------------------------------------

        const Gvcn =
          await Tx.phan_cong_giao_vien.create({
            data: {
              giao_vien_id:
                DuLieu.giao_vien_id,

              lop_hoc_id:
                DuLieu.lop_hoc_id,

              mon_hoc_id:
                null,

              loai_phan_cong:
                'GVCN',

              nguon_phan_cong:
                'BO_SUNG',

              ngay_bat_dau:
                NgayBatDau,

              ngay_ket_thuc:
                NgayKetThuc,
            },
          });

        // ------------------------------------------
        // Tự động phân các môn mặc định GVCN
        // ------------------------------------------

        for (
          const CauHinh
          of MonMacDinh
        ) {
          await Tx.phan_cong_giao_vien.create({
            data: {
              giao_vien_id:
                DuLieu.giao_vien_id,

              lop_hoc_id:
                DuLieu.lop_hoc_id,

              mon_hoc_id:
                CauHinh.mon_hoc_id,

              loai_phan_cong:
                'GVCN',

              nguon_phan_cong:
                'TU_DONG_GVCN',

              ngay_bat_dau:
                NgayBatDau,

              ngay_ket_thuc:
                NgayKetThuc,
            },
          });
        }

        return {
          thong_bao:
            'Phân công giáo viên chủ nhiệm thành công',

          Gvcn,

          so_mon_tu_dong:
            MonMacDinh.length,
        };
      },
    );
  }

  // ==================================================
  // 8. PHÂN CÔNG MÔN HỌC
  //
  // Dùng cho môn không mặc định GVCN.
  // Có thể là GVBM hoặc GVCN.
  // ==================================================

  async PhanCongMonHoc(
    DuLieu: PhanCongMonHocDto,
  ) {
    if (
      !Number.isInteger(
        DuLieu.giao_vien_id,
      ) ||
      DuLieu.giao_vien_id <= 0
    ) {
      throw new BadRequestException(
        'Giáo viên không hợp lệ',
      );
    }

    if (
      !Number.isInteger(
        DuLieu.lop_hoc_id,
      ) ||
      DuLieu.lop_hoc_id <= 0
    ) {
      throw new BadRequestException(
        'Lớp học không hợp lệ',
      );
    }

    if (
      !Number.isInteger(
        DuLieu.mon_hoc_id,
      ) ||
      DuLieu.mon_hoc_id <= 0
    ) {
      throw new BadRequestException(
        'Môn học không hợp lệ',
      );
    }

    const LoaiPhanCong =
      DuLieu.loai_phan_cong
        ?.trim()
        .toUpperCase();

    if (
      ![
        'GVBM',
        'GVCN',
      ].includes(LoaiPhanCong)
    ) {
      throw new BadRequestException(
        'Loại phân công phải là GVBM hoặc GVCN',
      );
    }

    const NgayBatDau =
      this.ChuyenNgay(
        DuLieu.ngay_bat_dau,
        'Ngày bắt đầu',
      );

    const NgayKetThuc =
      DuLieu.ngay_ket_thuc
        ? this.ChuyenNgay(
            DuLieu.ngay_ket_thuc,
            'Ngày kết thúc',
          )
        : null;

    this.KiemTraKhoangNgay(
      NgayBatDau,
      NgayKetThuc,
    );

    const [
      GiaoVien,
      lopHoc,
      MonHoc,
    ] = await Promise.all([
      this.Prisma.giao_vien.findUnique({
        where: {
          id:
            DuLieu.giao_vien_id,
        },
      }),

      this.Prisma.lop_hoc.findUnique({
        where: {
          id:
            DuLieu.lop_hoc_id,
        },
      }),

      this.Prisma.mon_hoc.findUnique({
        where: {
          id:
            DuLieu.mon_hoc_id,
        },
      }),
    ]);

    if (!GiaoVien) {
      throw new NotFoundException(
        'Không tìm thấy giáo viên',
      );
    }

    if (
      GiaoVien.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new BadRequestException(
        'Giáo viên đang không hoạt động',
      );
    }

    if (!lopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    if (!MonHoc) {
      throw new NotFoundException(
        'Không tìm thấy môn học',
      );
    }

    if (
      MonHoc.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new BadRequestException(
        'Môn học đang không hoạt động',
      );
    }

    // Môn phải thuộc khối của lớp

    const MonHocKhoi =
      await this.Prisma.mon_hoc_khoi.findFirst({
        where: {
          mon_hoc_id:
            DuLieu.mon_hoc_id,

          khoi_id:
            lopHoc.khoi_id,
        },
      });

    if (!MonHocKhoi) {
      throw new BadRequestException(
        'Môn học không được cấu hình cho khối của lớp này',
      );
    }

    // Môn mặc định GVCN không cho GVBM nhận

    if (
      MonHocKhoi.mac_dinh_gvcn
    ) {
      throw new BadRequestException(
        'Môn này là môn mặc định của GVCN và được hệ thống tự phân công khi chọn GVCN',
      );
    }

    // Nếu chọn loại GVCN cho môn bổ sung,
    // GV đó phải thật sự đang là GVCN của lớp.

    if (
      LoaiPhanCong ===
      'GVCN'
    ) {
      const Gvcn =
        await this.Prisma
          .phan_cong_giao_vien
          .findFirst({
            where: {
              giao_vien_id:
                DuLieu.giao_vien_id,

              lop_hoc_id:
                DuLieu.lop_hoc_id,

              mon_hoc_id:
                null,

              loai_phan_cong:
                'GVCN',

              ngay_bat_dau: {
                lte:
                  NgayBatDau,
              },

              ...(NgayKetThuc
                ? {
                    OR: [
                      {
                        ngay_ket_thuc:
                          null,
                      },

                      {
                        ngay_ket_thuc: {
                          gte:
                            NgayKetThuc,
                        },
                      },
                    ],
                  }
                : {
                    ngay_ket_thuc:
                      null,
                  }),
            },
          });

      if (!Gvcn) {
        throw new ForbiddenException(
          'Giáo viên này không phải GVCN của lớp trong khoảng thời gian đã chọn',
        );
      }
    }

    // Một lớp + môn chỉ có một GV trong cùng thời gian

    const Trung =
      await this.Prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            lop_hoc_id:
              DuLieu.lop_hoc_id,

            mon_hoc_id:
              DuLieu.mon_hoc_id,

            ...(NgayKetThuc
              ? {
                  ngay_bat_dau: {
                    lte:
                      NgayKetThuc,
                  },
                }
              : {}),

            OR: [
              {
                ngay_ket_thuc:
                  null,
              },

              {
                ngay_ket_thuc: {
                  gte:
                    NgayBatDau,
                },
              },
            ],
          },
        });

    if (Trung) {
      throw new ConflictException(
        'Môn học của lớp đã có giáo viên được phân công trong khoảng thời gian này',
      );
    }

    const KetQua =
      await this.Prisma
        .phan_cong_giao_vien
        .create({
          data: {
            giao_vien_id:
              DuLieu.giao_vien_id,

            lop_hoc_id:
              DuLieu.lop_hoc_id,

            mon_hoc_id:
              DuLieu.mon_hoc_id,

            loai_phan_cong:
              LoaiPhanCong,

            nguon_phan_cong:
              'BO_SUNG',

            ngay_bat_dau:
              NgayBatDau,

            ngay_ket_thuc:
              NgayKetThuc,
          },

          include: {
            giao_vien: true,
            lop_hoc: true,
            mon_hoc: true,
          },
        });

    return {
      thong_bao:
        'Phân công môn học thành công',

      phan_cong:
        KetQua,
    };
  }

  // ==================================================
  // 9. DANH SÁCH PHÂN CÔNG
  // ==================================================

  async LayDanhSachPhanCong(
    LopHocId?: number,
    GiaoVienId?: number,
    LoaiPhanCong?: string,
  ) {
    const LoaiPhanCongTim =
      LoaiPhanCong
        ?.trim()
        .toUpperCase();

    if (
      LoaiPhanCongTim &&
      ![
        'GVCN',
        'GVBM',
      ].includes(
        LoaiPhanCongTim,
      )
    ) {
      throw new BadRequestException(
        'Loại phân công phải là GVCN hoặc GVBM',
      );
    }

    return this.Prisma
      .phan_cong_giao_vien
      .findMany({
        where: {
          ...(LopHocId
            ? {
                lop_hoc_id:
                  LopHocId,
              }
            : {}),

          ...(GiaoVienId
            ? {
                giao_vien_id:
                  GiaoVienId,
              }
            : {}),

          ...(LoaiPhanCongTim
            ? {
                loai_phan_cong:
                  LoaiPhanCongTim,
              }
            : {}),
        },

        orderBy: [
          {
            lop_hoc_id:
              'asc',
          },

          {
            ngay_bat_dau:
              'desc',
          },
        ],

        include: {
          giao_vien: {
            select: {
              id: true,
              ma_giao_vien: true,
              ho_ten: true,
              trang_thai: true,
            },
          },

          lop_hoc: {
            include: {
              nam_hoc: true,
              khoi: true,
            },
          },

          mon_hoc: true,
        },
      });
  }

  // ==================================================
  // 10. GIÁO VIÊN XEM PHÂN CÔNG CỦA MÌNH
  // ==================================================

  async LayPhanCongCuaToi(
    TaiKhoanId: number,
  ) {
    const GiaoVien =
      await this.Prisma.giao_vien.findUnique({
        where: {
          tai_khoan_id:
            TaiKhoanId,
        },

        select: {
          id: true,
          ma_giao_vien: true,
          ho_ten: true,
        },
      });

    if (!GiaoVien) {
      throw new NotFoundException(
        'Không tìm thấy hồ sơ giáo viên',
      );
    }

    const PhanCong =
      await this.Prisma
        .phan_cong_giao_vien
        .findMany({
          where: {
            giao_vien_id:
              GiaoVien.id,
          },

          orderBy: {
            ngay_bat_dau:
              'desc',
          },

          include: {
            lop_hoc: {
              include: {
                nam_hoc: true,
                khoi: true,
              },
            },

            mon_hoc: true,
          },
        });

    return {
      giao_vien:
        GiaoVien,

      phan_cong:
        PhanCong,
    };
  }

  // ==================================================
  // 11. KẾT THÚC PHÂN CÔNG
  //
  // Không xóa để giữ lịch sử.
  // ==================================================

  async KetThucPhanCong(
    Id: number,
    DuLieu: KetThucPhanCongDto,
  ) {
    const PhanCong =
      await this.Prisma
        .phan_cong_giao_vien
        .findUnique({
          where: {
            Id,
          },
        });

    if (!PhanCong) {
      throw new NotFoundException(
        'Không tìm thấy phân công',
      );
    }

    const NgayKetThuc =
      this.ChuyenNgay(
        DuLieu.ngay_ket_thuc,
        'Ngày kết thúc',
      );

    if (
      NgayKetThuc <
      PhanCong.ngay_bat_dau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc không được trước ngày bắt đầu',
      );
    }

    // Không cho kết thúc riêng dòng môn tự động GVCN.
    // Phải kết thúc phân công GVCN chính.

    if (
      PhanCong.nguon_phan_cong ===
      'TU_DONG_GVCN'
    ) {
      throw new BadRequestException(
        'Đây là môn được tự động tạo theo GVCN. Hãy kết thúc phân công GVCN chính.',
      );
    }

    // Nếu đây là dòng GVCN chính:
    // kết thúc luôn các môn do GVCN đảm nhiệm trong cùng lớp.

    if (
      PhanCong.loai_phan_cong ===
        'GVCN' &&
      PhanCong.mon_hoc_id ===
        null
    ) {
      return this.Prisma.$transaction(
        async (Tx) => {
          const Gvcn =
            await Tx
              .phan_cong_giao_vien
              .update({
                where: {
                  Id,
                },

                data: {
                  ngay_ket_thuc:
                    NgayKetThuc,
                },
              });

          await Tx
            .phan_cong_giao_vien
            .updateMany({
              where: {
                giao_vien_id:
                  PhanCong.giao_vien_id,

                lop_hoc_id:
                  PhanCong.lop_hoc_id,

                loai_phan_cong:
                  'GVCN',

                mon_hoc_id: {
                  not:
                    null,
                },

                ngay_bat_dau: {
                  gte:
                    PhanCong.ngay_bat_dau,

                  lte:
                    NgayKetThuc,
                },

                OR: [
                  {
                    ngay_ket_thuc:
                      null,
                  },

                  {
                    ngay_ket_thuc: {
                      gt:
                        NgayKetThuc,
                    },
                  },
                ],
              },

              data: {
                ngay_ket_thuc:
                  NgayKetThuc,
              },
            });

          return {
            thong_bao:
              'Kết thúc phân công GVCN thành công',

            phan_cong:
              Gvcn,
          };
        },
      );
    }

    // GVBM hoặc phân công môn bổ sung

    const KetQua =
      await this.Prisma
        .phan_cong_giao_vien
        .update({
          where: {
            Id,
          },

          data: {
            ngay_ket_thuc:
              NgayKetThuc,
          },
        });

    return {
      thong_bao:
        'Kết thúc phân công thành công',

      phan_cong:
        KetQua,
    };
  }
}