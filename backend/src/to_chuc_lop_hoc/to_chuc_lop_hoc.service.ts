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

  private homNay(): Date {
    const ngay = new Date();

    ngay.setUTCHours(
      0,
      0,
      0,
      0,
    );

    return ngay;
  }

  // ==================================================
  // 1. TẠO NĂM HỌC
  // ==================================================

  async taoNamHoc(
    duLieu: TaoNamHocDto,
  ) {
    const tenNamHoc =
      duLieu.ten_nam_hoc?.trim();

    if (!tenNamHoc) {
      throw new BadRequestException(
        'Tên năm học không được để trống',
      );
    }

    const namHocCu =
      await this.prisma.nam_hoc.findUnique({
        where: {
          ten_nam_hoc:
            tenNamHoc,
        },
      });

    if (namHocCu) {
      throw new ConflictException(
        'Năm học đã tồn tại',
      );
    }

    const namHoc =
      await this.prisma.nam_hoc.create({
        data: {
          ten_nam_hoc:
            tenNamHoc,
        },
      });

    return {
      thong_bao:
        'Tạo năm học thành công',

      nam_hoc:
        namHoc,
    };
  }

  // ==================================================
  // 2. DANH SÁCH NĂM HỌC
  // ==================================================

  async layDanhSachNamHoc() {
    return this.prisma.nam_hoc.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  // ==================================================
  // 3. CẬP NHẬT NĂM HỌC
  // ==================================================

  async capNhatNamHoc(
    id: number,
    duLieu: CapNhatNamHocDto,
  ) {
    const namHoc =
      await this.prisma.nam_hoc.findUnique({
        where: {
          id,
        },
      });

    if (!namHoc) {
      throw new NotFoundException(
        'Không tìm thấy năm học',
      );
    }

    if (
      duLieu.ten_nam_hoc === undefined &&
      duLieu.trang_thai === undefined
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }

    const tenNamHoc =
      duLieu.ten_nam_hoc?.trim();

    if (
      duLieu.ten_nam_hoc !== undefined &&
      !tenNamHoc
    ) {
      throw new BadRequestException(
        'Tên năm học không được để trống',
      );
    }

    if (
      tenNamHoc &&
      tenNamHoc !== namHoc.ten_nam_hoc
    ) {
      const trung =
        await this.prisma.nam_hoc.findUnique({
          where: {
            ten_nam_hoc:
              tenNamHoc,
          },
        });

      if (trung) {
        throw new ConflictException(
          'Tên năm học đã tồn tại',
        );
      }
    }

    const trangThai =
      duLieu.trang_thai?.trim();

    if (
      duLieu.trang_thai !== undefined &&
      !trangThai
    ) {
      throw new BadRequestException(
        'Trạng thái không được để trống',
      );
    }

    const ketQua =
      await this.prisma.nam_hoc.update({
        where: {
          id,
        },

        data: {
          ...(tenNamHoc
            ? {
                ten_nam_hoc:
                  tenNamHoc,
              }
            : {}),

          ...(trangThai
            ? {
                trang_thai:
                  trangThai,
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
        ketQua,
    };
  }

  // ==================================================
  // 4. DANH SÁCH KHỐI
  // ==================================================

  async layDanhSachKhoi() {
    return this.prisma.khoi.findMany({
      orderBy: {
        so_khoi: 'asc',
      },
    });
  }

  // ==================================================
  // 5. TẠO LỚP
  // ==================================================

  async taoLopHoc(
    duLieu: TaoLopHocDto,
  ) {
    if (
      !Number.isInteger(
        duLieu.nam_hoc_id,
      ) ||
      duLieu.nam_hoc_id <= 0
    ) {
      throw new BadRequestException(
        'Năm học không hợp lệ',
      );
    }

    if (
      !Number.isInteger(
        duLieu.khoi_id,
      ) ||
      duLieu.khoi_id <= 0
    ) {
      throw new BadRequestException(
        'Khối không hợp lệ',
      );
    }

    const tenLop =
      duLieu.ten_lop?.trim();

    if (!tenLop) {
      throw new BadRequestException(
        'Tên lớp không được để trống',
      );
    }

    const [
      namHoc,
      khoi,
    ] = await Promise.all([
      this.prisma.nam_hoc.findUnique({
        where: {
          id:
            duLieu.nam_hoc_id,
        },
      }),

      this.prisma.khoi.findUnique({
        where: {
          id:
            duLieu.khoi_id,
        },
      }),
    ]);

    if (!namHoc) {
      throw new NotFoundException(
        'Không tìm thấy năm học',
      );
    }

    if (!khoi) {
      throw new NotFoundException(
        'Không tìm thấy khối',
      );
    }

    const lopTrung =
      await this.prisma.lop_hoc.findFirst({
        where: {
          nam_hoc_id:
            duLieu.nam_hoc_id,

          ten_lop:
            tenLop,
        },
      });

    if (lopTrung) {
      throw new ConflictException(
        'Tên lớp đã tồn tại trong năm học này',
      );
    }

    const lopHoc =
      await this.prisma.lop_hoc.create({
        data: {
          nam_hoc_id:
            duLieu.nam_hoc_id,

          khoi_id:
            duLieu.khoi_id,

          ten_lop:
            tenLop,

          ghi_chu:
            duLieu.ghi_chu
              ?.trim() ||
            null,
        },
      });

    return {
      thong_bao:
        'Tạo lớp học thành công',

      lop_hoc:
        lopHoc,
    };
  }

  // ==================================================
  // 6. DANH SÁCH LỚP
  // ==================================================

  async layDanhSachLopHoc(
    namHocId?: number,
    khoiId?: number,
    tuKhoa?: string,
  ) {
    const tim =
      tuKhoa?.trim();

    return this.prisma.lop_hoc.findMany({
      where: {
        ...(namHocId
          ? {
              nam_hoc_id:
                namHocId,
            }
          : {}),

        ...(khoiId
          ? {
              khoi_id:
                khoiId,
            }
          : {}),

        ...(tim
          ? {
              ten_lop: {
                contains:
                  tim,
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

  async layChiTietLopHoc(
    id: number,
  ) {
    const lopHoc =
      await this.prisma.lop_hoc.findUnique({
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

    if (!lopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    return lopHoc;
  }

  // ==================================================
  // 8. CẬP NHẬT LỚP
  // ==================================================

  async capNhatLopHoc(
    id: number,
    duLieu: CapNhatLopHocDto,
  ) {
    const lopHoc =
      await this.prisma.lop_hoc.findUnique({
        where: {
          id,
        },
      });

    if (!lopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    if (
      duLieu.ten_lop === undefined &&
      duLieu.ghi_chu === undefined
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }

    const tenLop =
      duLieu.ten_lop?.trim();

    if (
      duLieu.ten_lop !== undefined &&
      !tenLop
    ) {
      throw new BadRequestException(
        'Tên lớp không được để trống',
      );
    }

    if (
      tenLop &&
      tenLop !== lopHoc.ten_lop
    ) {
      const trung =
        await this.prisma.lop_hoc.findFirst({
          where: {
            nam_hoc_id:
              lopHoc.nam_hoc_id,

            ten_lop:
              tenLop,

            id: {
              not:
                id,
            },
          },
        });

      if (trung) {
        throw new ConflictException(
          'Tên lớp đã tồn tại trong năm học này',
        );
      }
    }

    const ketQua =
      await this.prisma.lop_hoc.update({
        where: {
          id,
        },

        data: {
          ...(tenLop
            ? {
                ten_lop:
                  tenLop,
              }
            : {}),

          ...(duLieu.ghi_chu !== undefined
            ? {
                ghi_chu:
                  duLieu.ghi_chu
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
        ketQua,
    };
  }

  // ==================================================
  // 9. HỌC SINH CHƯA CÓ LỚP HIỆN TẠI
  // ==================================================

  async layHocSinhChuaXepLop() {
    const homNay =
      this.homNay();

    return this.prisma.hoc_sinh.findMany({
      where: {
        trang_thai:
          'DANG_HOC',

        xep_lop: {
          none: {
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

  async xepHocSinhVaoLop(
    duLieu: XepHocSinhVaoLopDto,
  ) {
    if (
      !Number.isInteger(
        duLieu.hoc_sinh_id,
      ) ||
      duLieu.hoc_sinh_id <= 0
    ) {
      throw new BadRequestException(
        'Học sinh không hợp lệ',
      );
    }

    if (
      !Number.isInteger(
        duLieu.lop_hoc_id,
      ) ||
      duLieu.lop_hoc_id <= 0
    ) {
      throw new BadRequestException(
        'Lớp học không hợp lệ',
      );
    }

    const ngayBatDau =
      this.chuyenNgay(
        duLieu.ngay_bat_dau,
        'Ngày bắt đầu',
      );

    const ngayKetThuc =
      duLieu.ngay_ket_thuc
        ? this.chuyenNgay(
            duLieu.ngay_ket_thuc,
            'Ngày kết thúc',
          )
        : null;

    if (
      ngayKetThuc &&
      ngayKetThuc < ngayBatDau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }

    const [
      hocSinh,
      lopHoc,
    ] = await Promise.all([
      this.prisma.hoc_sinh.findUnique({
        where: {
          id:
            duLieu.hoc_sinh_id,
        },
      }),

      this.prisma.lop_hoc.findUnique({
        where: {
          id:
            duLieu.lop_hoc_id,
        },
      }),
    ]);

    if (!hocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }

    if (
      hocSinh.trang_thai !==
      'DANG_HOC'
    ) {
      throw new BadRequestException(
        'Chỉ học sinh đang học mới được xếp lớp',
      );
    }

    if (!lopHoc) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    const trungKhoangThoiGian =
      await this.prisma.xep_lop.findFirst({
        where: {
          hoc_sinh_id:
            duLieu.hoc_sinh_id,

          ...(ngayKetThuc
            ? {
                ngay_bat_dau: {
                  lte:
                    ngayKetThuc,
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
                  ngayBatDau,
              },
            },
          ],
        },
      });

    if (trungKhoangThoiGian) {
      throw new ConflictException(
        'Học sinh đã được xếp lớp trong khoảng thời gian này',
      );
    }

    const xepLop =
      await this.prisma.xep_lop.create({
        data: {
          hoc_sinh_id:
            duLieu.hoc_sinh_id,

          lop_hoc_id:
            duLieu.lop_hoc_id,

          ngay_bat_dau:
            ngayBatDau,

          ngay_ket_thuc:
            ngayKetThuc,

          ghi_chu:
            duLieu.ghi_chu
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
        xepLop,
    };
  }

  // ==================================================
  // 11. LỊCH SỬ XẾP LỚP CỦA HỌC SINH
  // ==================================================

  async layLichSuXepLopHocSinh(
    hocSinhId: number,
  ) {
    const hocSinh =
      await this.prisma.hoc_sinh.findUnique({
        where: {
          id:
            hocSinhId,
        },

        select: {
          id: true,
          ma_hoc_sinh: true,
          ho_ten: true,
        },
      });

    if (!hocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }

    const lichSu =
      await this.prisma.xep_lop.findMany({
        where: {
          hoc_sinh_id:
            hocSinhId,
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
        hocSinh,

      lich_su:
        lichSu,
    };
  }

  // ==================================================
  // 12. CẬP NHẬT XẾP LỚP
  // DÙNG KHI KẾT THÚC / SỬA NGÀY
  // ==================================================

  async capNhatXepLop(
    id: number,
    duLieu: CapNhatXepLopDto,
  ) {
    const xepLop =
      await this.prisma.xep_lop.findUnique({
        where: {
          id,
        },
      });

    if (!xepLop) {
      throw new NotFoundException(
        'Không tìm thấy thông tin xếp lớp',
      );
    }

    if (
      duLieu.ngay_bat_dau === undefined &&
      duLieu.ngay_ket_thuc === undefined &&
      duLieu.ghi_chu === undefined
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }

    if (
      duLieu.ngay_bat_dau !== undefined &&
      !duLieu.ngay_bat_dau.trim()
    ) {
      throw new BadRequestException(
        'Ngày bắt đầu không được để trống',
      );
    }

    if (
      typeof duLieu.ngay_ket_thuc ===
        'string' &&
      !duLieu.ngay_ket_thuc.trim()
    ) {
      throw new BadRequestException(
        'Ngày kết thúc không được để trống. Dùng null nếu muốn bỏ ngày kết thúc',
      );
    }

    const ngayBatDau =
      duLieu.ngay_bat_dau
        ? this.chuyenNgay(
            duLieu.ngay_bat_dau,
            'Ngày bắt đầu',
          )
        : xepLop.ngay_bat_dau;

    let ngayKetThuc:
      | Date
      | null =
      xepLop.ngay_ket_thuc;

    if (
      duLieu.ngay_ket_thuc === null
    ) {
      ngayKetThuc = null;
    } else if (
      duLieu.ngay_ket_thuc
    ) {
      ngayKetThuc =
        this.chuyenNgay(
          duLieu.ngay_ket_thuc,
          'Ngày kết thúc',
        );
    }

    if (
      ngayKetThuc &&
      ngayKetThuc < ngayBatDau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }

    const trung =
      await this.prisma.xep_lop.findFirst({
        where: {
          hoc_sinh_id:
            xepLop.hoc_sinh_id,

          id: {
            not:
              id,
          },

          ...(ngayKetThuc
            ? {
                ngay_bat_dau: {
                  lte:
                    ngayKetThuc,
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
                  ngayBatDau,
              },
            },
          ],
        },
      });

    if (trung) {
      throw new ConflictException(
        'Khoảng thời gian xếp lớp bị trùng',
      );
    }

    const ketQua =
      await this.prisma.xep_lop.update({
        where: {
          id,
        },

        data: {
          ngay_bat_dau:
            ngayBatDau,

          ngay_ket_thuc:
            ngayKetThuc,

          ...(duLieu.ghi_chu !== undefined
            ? {
                ghi_chu:
                  duLieu.ghi_chu
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
        ketQua,
    };
  }
}