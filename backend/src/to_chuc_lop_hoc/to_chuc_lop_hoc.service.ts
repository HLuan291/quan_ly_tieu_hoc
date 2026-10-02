import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service';

import {
  CapNhatLopHocDto,
  CapNhatNamHocDto,
  CapNhatXepLopDto,
  TaoLopHocDto,
  TaoNamHocDto,
  XepHocSinhVaoLopDto,
} from './to_chuc_lop_hoc.dto';

@Injectable()
export class ToChucLopHocService {
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

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        GiaTri,
      ) ||
      Number.isNaN(
        Ngay.getTime(),
      ) ||
      Ngay.toISOString().slice(0, 10) !==
        GiaTri
    ) {
      throw new BadRequestException(
        `${TenTruong} không hợp lệ`,
      );
    }

    return Ngay;
  }

  private HomNay(): Date {
    const Ngay = new Date();

    Ngay.setUTCHours(
      0,
      0,
      0,
      0,
    );

    return Ngay;
  }

  private KiemTraTenNamHoc(
    TenNamHoc: string,
  ) {
    const KetQua =
      /^(\d{4})-(\d{4})$/.exec(
        TenNamHoc,
      );

    if (!KetQua) {
      throw new BadRequestException(
        'Năm học phải có dạng YYYY-YYYY, ví dụ: 2026-2027',
      );
    }

    const NamBatDau =
      Number(
        KetQua[1],
      );

    const NamKetThuc =
      Number(
        KetQua[2],
      );

    if (
      NamKetThuc !==
      NamBatDau + 1
    ) {
      throw new BadRequestException(
        'Năm kết thúc phải lớn hơn năm bắt đầu đúng 1 năm',
      );
    }
  }

  // ==================================================
  // 1. TẠO NĂM HỌC
  // ==================================================

  async TaoNamHoc(
    DuLieu: TaoNamHocDto,
  ) {
    const TenNamHoc =
      DuLieu.ten_nam_hoc?.trim();

    if (!TenNamHoc) {
      throw new BadRequestException(
        'Tên năm học không được để trống',
      );
    }

    this.KiemTraTenNamHoc(
      TenNamHoc,
    );

    const NamHocCu =
      await this.Prisma.nam_hoc.findUnique({
        where: {
          ten_nam_hoc:
            TenNamHoc,
        },
      });

    if (NamHocCu) {
      throw new ConflictException(
        'Năm học đã tồn tại',
      );
    }

    const NamHoc =
      await this.Prisma.nam_hoc.create({
        data: {
          ten_nam_hoc:
            TenNamHoc,
        },
      });

    return {
      thong_bao:
        'Tạo năm học thành công',

      nam_hoc:
        NamHoc,
    };
  }

  // ==================================================
  // 2. DANH SÁCH NĂM HỌC
  // ==================================================

  async LayDanhSachNamHoc() {
    return this.Prisma.nam_hoc.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  // ==================================================
  // 3. CẬP NHẬT NĂM HỌC
  // ==================================================

  async CapNhatNamHoc(
    id: number,
    DuLieu: CapNhatNamHocDto,
  ) {
    const NamHoc =
      await this.Prisma.nam_hoc.findUnique({
        where: {
          id,
        },
      });

    if (!NamHoc) {
      throw new NotFoundException(
        'Không tìm thấy năm học',
      );
    }

    if (
      DuLieu.ten_nam_hoc === undefined &&
      DuLieu.trang_thai === undefined
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }

    const TenNamHoc =
      DuLieu.ten_nam_hoc?.trim();

    if (
      DuLieu.ten_nam_hoc !== undefined &&
      !TenNamHoc
    ) {
      throw new BadRequestException(
        'Tên năm học không được để trống',
      );
    }

    if (TenNamHoc) {
      this.KiemTraTenNamHoc(
        TenNamHoc,
      );
    }

    if (
      TenNamHoc &&
      TenNamHoc !== NamHoc.ten_nam_hoc
    ) {
      const Trung =
        await this.Prisma.nam_hoc.findUnique({
          where: {
            ten_nam_hoc:
              TenNamHoc,
          },
        });

      if (Trung) {
        throw new ConflictException(
          'Tên năm học đã tồn tại',
        );
      }
    }

    const TrangThai =
      DuLieu.trang_thai?.trim();

    if (
      DuLieu.trang_thai !== undefined &&
      !TrangThai
    ) {
      throw new BadRequestException(
        'Trạng thái không được để trống',
      );
    }

    const KetQua =
      await this.Prisma.nam_hoc.update({
        where: {
          id,
        },

        data: {
          ...(TenNamHoc
            ? {
                ten_nam_hoc:
                  TenNamHoc,
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
        'Cập nhật năm học thành công',

      nam_hoc:
        KetQua,
    };
  }

  // ==================================================
  // 4. DANH SÁCH KHỐI
  // ==================================================

  async LayDanhSachKhoi() {
    return this.Prisma.khoi.findMany({
      orderBy: {
        so_khoi: 'asc',
      },
    });
  }

  // ==================================================
  // 5. TẠO LỚP
  // ==================================================

  async TaoLopHoc(
    DuLieu: TaoLopHocDto,
  ) {
    if (
      !Number.isInteger(
        DuLieu.nam_hoc_id,
      ) ||
      DuLieu.nam_hoc_id <= 0
    ) {
      throw new BadRequestException(
        'Năm học không hợp lệ',
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

    const TenLop =
      DuLieu.ten_lop?.trim();

    if (!TenLop) {
      throw new BadRequestException(
        'Tên lớp không được để trống',
      );
    }

    const [
      NamHoc,
      khoi,
    ] = await Promise.all([
      this.Prisma.nam_hoc.findUnique({
        where: {
          id:
            DuLieu.nam_hoc_id,
        },
      }),

      this.Prisma.khoi.findUnique({
        where: {
          id:
            DuLieu.khoi_id,
        },
      }),
    ]);

    if (!NamHoc) {
      throw new NotFoundException(
        'Không tìm thấy năm học',
      );
    }

    if (!khoi) {
      throw new NotFoundException(
        'Không tìm thấy khối',
      );
    }

    const LopTrung =
      await this.Prisma.lop_hoc.findFirst({
        where: {
          nam_hoc_id:
            DuLieu.nam_hoc_id,

          ten_lop:
            TenLop,
        },
      });

    if (LopTrung) {
      throw new ConflictException(
        'Tên lớp đã tồn tại trong năm học này',
      );
    }

    const LopHoc =
      await this.Prisma.lop_hoc.create({
        data: {
          nam_hoc_id:
            DuLieu.nam_hoc_id,

          khoi_id:
            DuLieu.khoi_id,

          ten_lop:
            TenLop,

          ghi_chu:
            DuLieu.ghi_chu
              ?.trim() ||
            null,
        },
      });

    return {
      thong_bao:
        'Tạo lớp học thành công',

      lop_hoc:
        LopHoc,
    };
  }

  // ==================================================
  // 6. DANH SÁCH LỚP
  // ==================================================

  async LayDanhSachLopHoc(
    NamHocId?: number,
    KhoiId?: number,
    TuKhoa?: string,
  ) {
    const Tim =
      TuKhoa?.trim();

    return this.Prisma.lop_hoc.findMany({
      where: {
        ...(NamHocId
          ? {
              nam_hoc_id:
                NamHocId,
            }
          : {}),

        ...(KhoiId
          ? {
              khoi_id:
                KhoiId,
            }
          : {}),

        ...(Tim
          ? {
              ten_lop: {
                contains:
                  Tim,
              },
            }
          : {}),
      },

      orderBy: [
        {
          nam_hoc_id:
            'desc',
        },

        {
          khoi_id:
            'asc',
        },

        {
          ten_lop:
            'asc',
        },
      ],

      include: {
        nam_hoc: true,
        khoi: true,

        _count: {
          select: {
            xep_lop: true,
            phan_cong_giao_vien: true,
          },
        },
      },
    });
  }

  // ==================================================
  // 7. CHI TIẾT LỚP
  // ==================================================

  async LayChiTietLopHoc(
    id: number,
  ) {
    const LopHoc =
      await this.Prisma.lop_hoc.findUnique({
        where: {
          id,
        },

        include: {
          nam_hoc: true,
          khoi: true,

          xep_lop: {
            orderBy: {
              ngay_bat_dau:
                'desc',
            },

            include: {
              hoc_sinh: {
                select: {
                  id: true,
                  ma_hoc_sinh: true,
                  ho_ten: true,
                  ngay_sinh: true,
                  gioi_tinh: true,
                  trang_thai: true,
                },
              },
            },
          },
        },
      });

    if (!LopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    return LopHoc;
  }

  // ==================================================
  // 8. CẬP NHẬT LỚP
  // ==================================================

  async CapNhatLopHoc(
    id: number,
    DuLieu: CapNhatLopHocDto,
  ) {
    const LopHoc =
      await this.Prisma.lop_hoc.findUnique({
        where: {
          id,
        },
      });

    if (!LopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    if (
      DuLieu.ten_lop === undefined &&
      DuLieu.ghi_chu === undefined
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }

    const TenLop =
      DuLieu.ten_lop?.trim();

    if (
      DuLieu.ten_lop !== undefined &&
      !TenLop
    ) {
      throw new BadRequestException(
        'Tên lớp không được để trống',
      );
    }

    if (
      TenLop &&
      TenLop !== LopHoc.ten_lop
    ) {
      const Trung =
        await this.Prisma.lop_hoc.findFirst({
          where: {
            nam_hoc_id:
              LopHoc.nam_hoc_id,

            ten_lop:
              TenLop,

            id: {
              not:
                id,
            },
          },
        });

      if (Trung) {
        throw new ConflictException(
          'Tên lớp đã tồn tại trong năm học này',
        );
      }
    }

    const KetQua =
      await this.Prisma.lop_hoc.update({
        where: {
          id,
        },

        data: {
          ...(TenLop
            ? {
                ten_lop:
                  TenLop,
              }
            : {}),

          ...(DuLieu.ghi_chu !== undefined
            ? {
                ghi_chu:
                  DuLieu.ghi_chu
                    ?.trim() ||
                  null,
              }
            : {}),

          ngay_cap_nhat:
            new Date(),
        },
      });

    return {
      thong_bao:
        'Cập nhật lớp học thành công',

      lop_hoc:
        KetQua,
    };
  }

  // ==================================================
  // 9. HỌC SINH CHƯA CÓ LỚP HIỆN TẠI
  // ==================================================

  async LayHocSinhChuaXepLop() {
    const HomNay =
      this.HomNay();

    return this.Prisma.hoc_sinh.findMany({
      where: {
        trang_thai:
          'DANG_HOC',

        xep_lop: {
          none: {
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
        },
      },

      orderBy: {
        ho_ten:
          'asc',
      },

      select: {
        id: true,
        ma_hoc_sinh: true,
        ho_ten: true,
        ngay_sinh: true,
        gioi_tinh: true,
      },
    });
  }

  // ==================================================
  // 10. XẾP HỌC SINH VÀO LỚP
  // ==================================================

  async XepHocSinhVaoLop(
    DuLieu: XepHocSinhVaoLopDto,
  ) {
    if (
      !Number.isInteger(
        DuLieu.hoc_sinh_id,
      ) ||
      DuLieu.hoc_sinh_id <= 0
    ) {
      throw new BadRequestException(
        'Học sinh không hợp lệ',
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

    if (
      NgayKetThuc &&
      NgayKetThuc < NgayBatDau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }

    const [
      HocSinh,
      LopHoc,
    ] = await Promise.all([
      this.Prisma.hoc_sinh.findUnique({
        where: {
          id:
            DuLieu.hoc_sinh_id,
        },
      }),

      this.Prisma.lop_hoc.findUnique({
        where: {
          id:
            DuLieu.lop_hoc_id,
        },
      }),
    ]);

    if (!HocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }

    if (
      HocSinh.trang_thai !==
      'DANG_HOC'
    ) {
      throw new BadRequestException(
        'Chỉ học sinh đang học mới được xếp lớp',
      );
    }

    if (!LopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    const TrungKhoangThoiGian =
      await this.Prisma.xep_lop.findFirst({
        where: {
          hoc_sinh_id:
            DuLieu.hoc_sinh_id,

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

    if (TrungKhoangThoiGian) {
      throw new ConflictException(
        'Học sinh đã được xếp lớp trong khoảng thời gian này',
      );
    }

    const XepLop =
      await this.Prisma.xep_lop.create({
        data: {
          hoc_sinh_id:
            DuLieu.hoc_sinh_id,

          lop_hoc_id:
            DuLieu.lop_hoc_id,

          ngay_bat_dau:
            NgayBatDau,

          ngay_ket_thuc:
            NgayKetThuc,

          ghi_chu:
            DuLieu.ghi_chu
              ?.trim() ||
            null,
        },

        include: {
          hoc_sinh: true,

          lop_hoc: {
            include: {
              nam_hoc: true,
              khoi: true,
            },
          },
        },
      });

    return {
      thong_bao:
        'Xếp lớp thành công',

      xep_lop:
        XepLop,
    };
  }

  // ==================================================
  // 11. LỊCH SỬ XẾP LỚP CỦA HỌC SINH
  // ==================================================

  async LayLichSuXepLopHocSinh(
    HocSinhId: number,
  ) {
    const HocSinh =
      await this.Prisma.hoc_sinh.findUnique({
        where: {
          id:
            HocSinhId,
        },

        select: {
          id: true,
          ma_hoc_sinh: true,
          ho_ten: true,
        },
      });

    if (!HocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }

    const LichSu =
      await this.Prisma.xep_lop.findMany({
        where: {
          hoc_sinh_id:
            HocSinhId,
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
        },
      });

    return {
      hoc_sinh:
        HocSinh,

      lich_su:
        LichSu,
    };
  }

  // ==================================================
  // 12. CẬP NHẬT XẾP LỚP
  // DÙNG KHI KẾT THÚC / SỬA NGÀY
  // ==================================================

  async CapNhatXepLop(
    id: number,
    DuLieu: CapNhatXepLopDto,
  ) {
    const XepLop =
      await this.Prisma.xep_lop.findUnique({
        where: {
          id,
        },
      });

    if (!XepLop) {
      throw new NotFoundException(
        'Không tìm thấy thông tin xếp lớp',
      );
    }

    if (
      DuLieu.ngay_bat_dau === undefined &&
      DuLieu.ngay_ket_thuc === undefined &&
      DuLieu.ghi_chu === undefined
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }

    if (
      DuLieu.ngay_bat_dau !== undefined &&
      !DuLieu.ngay_bat_dau.trim()
    ) {
      throw new BadRequestException(
        'Ngày bắt đầu không được để trống',
      );
    }

    if (
      typeof DuLieu.ngay_ket_thuc ===
        'string' &&
      !DuLieu.ngay_ket_thuc.trim()
    ) {
      throw new BadRequestException(
        'Ngày kết thúc không được để trống. Dùng null nếu muốn bỏ ngày kết thúc',
      );
    }

    const NgayBatDau =
      DuLieu.ngay_bat_dau
        ? this.ChuyenNgay(
            DuLieu.ngay_bat_dau,
            'Ngày bắt đầu',
          )
        : XepLop.ngay_bat_dau;

    let NgayKetThuc:
      | Date
      | null =
      XepLop.ngay_ket_thuc;

    if (
      DuLieu.ngay_ket_thuc === null
    ) {
      NgayKetThuc = null;
    } else if (
      DuLieu.ngay_ket_thuc
    ) {
      NgayKetThuc =
        this.ChuyenNgay(
          DuLieu.ngay_ket_thuc,
          'Ngày kết thúc',
        );
    }

    if (
      NgayKetThuc &&
      NgayKetThuc < NgayBatDau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }

    const Trung =
      await this.Prisma.xep_lop.findFirst({
        where: {
          hoc_sinh_id:
            XepLop.hoc_sinh_id,

          id: {
            not:
              id,
          },

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
        'Khoảng thời gian xếp lớp bị trùng',
      );
    }

    const KetQua =
      await this.Prisma.xep_lop.update({
        where: {
          id,
        },

        data: {
          ngay_bat_dau:
            NgayBatDau,

          ngay_ket_thuc:
            NgayKetThuc,

          ...(DuLieu.ghi_chu !== undefined
            ? {
                ghi_chu:
                  DuLieu.ghi_chu
                    ?.trim() ||
                  null,
              }
            : {}),
        },
      });

    return {
      thong_bao:
        'Cập nhật xếp lớp thành công',

      xep_lop:
        KetQua,
    };
  }
}