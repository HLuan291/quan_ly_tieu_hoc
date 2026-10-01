import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma.service';

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

  private kiemTraKhoangNgay(
    ngayBatDau: Date,
    ngayKetThuc: Date | null,
  ) {
    if (
      ngayKetThuc &&
      ngayKetThuc < ngayBatDau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }
  }

  // ==================================================
  // 1. TẠO MÔN HỌC
  // ==================================================

  async taoMonHoc(
    duLieu: TaoMonHocDto,
  ) {
    const maMonHoc =
      duLieu.ma_mon_hoc
        ?.trim()
        .toUpperCase();

    const tenMonHoc =
      duLieu.ten_mon_hoc?.trim();

    if (
      !maMonHoc ||
      !tenMonHoc
    ) {
      throw new BadRequestException(
        'Mã môn học và tên môn học không được để trống',
      );
    }

    const monHocCu =
      await this.prisma.mon_hoc.findUnique({
        where: {
          ma_mon_hoc:
            maMonHoc,
        },
      });

    if (monHocCu) {
      throw new ConflictException(
        'Mã môn học đã tồn tại',
      );
    }

    const monHoc =
      await this.prisma.mon_hoc.create({
        data: {
          ma_mon_hoc:
            maMonHoc,

          ten_mon_hoc:
            tenMonHoc,
        },
      });

    return {
      thong_bao:
        'Tạo môn học thành công',

      mon_hoc:
        monHoc,
    };
  }

  // ==================================================
  // 2. DANH SÁCH MÔN HỌC
  // ==================================================

  async layDanhSachMonHoc(
    tuKhoa?: string,
    trangThai?: string,
  ) {
    const tim =
      tuKhoa?.trim();

    const trangThaiTim =
      trangThai?.trim();

    return this.prisma.mon_hoc.findMany({
      where: {
        ...(tim
          ? {
              OR: [
                {
                  ma_mon_hoc: {
                    contains:
                      tim,
                  },
                },

                {
                  ten_mon_hoc: {
                    contains:
                      tim,
                  },
                },
              ],
            }
          : {}),

        ...(trangThaiTim
          ? {
              trang_thai:
                trangThaiTim,
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

  async capNhatMonHoc(
    id: number,
    duLieu: CapNhatMonHocDto,
  ) {
    const monHoc =
      await this.prisma.mon_hoc.findUnique({
        where: {
          id,
        },
      });

    if (!monHoc) {
      throw new NotFoundException(
        'Không tìm thấy môn học',
      );
    }

    if (
      duLieu.ten_mon_hoc === undefined &&
      duLieu.trang_thai === undefined
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }

    const tenMonHoc =
      duLieu.ten_mon_hoc?.trim();

    const trangThai =
      duLieu.trang_thai?.trim();

    if (
      duLieu.ten_mon_hoc !== undefined &&
      !tenMonHoc
    ) {
      throw new BadRequestException(
        'Tên môn học không được để trống',
      );
    }

    if (
      duLieu.trang_thai !== undefined &&
      !trangThai
    ) {
      throw new BadRequestException(
        'Trạng thái không được để trống',
      );
    }

    const ketQua =
      await this.prisma.mon_hoc.update({
        where: {
          id,
        },

        data: {
          ...(tenMonHoc
            ? {
                ten_mon_hoc:
                  tenMonHoc,
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
        'Cập nhật môn học thành công',

      mon_hoc:
        ketQua,
    };
  }

  // ==================================================
  // 4. GẮN MÔN HỌC VÀO KHỐI
  // ==================================================

  async ganMonHocChoKhoi(
    duLieu: GanMonHocChoKhoiDto,
  ) {
    if (
      !Number.isInteger(
        duLieu.mon_hoc_id,
      ) ||
      duLieu.mon_hoc_id <= 0
    ) {
      throw new BadRequestException(
        'Môn học không hợp lệ',
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

    const [
      monHoc,
      khoi,
    ] = await Promise.all([
      this.prisma.mon_hoc.findUnique({
        where: {
          id:
            duLieu.mon_hoc_id,
        },
      }),

      this.prisma.khoi.findUnique({
        where: {
          id:
            duLieu.khoi_id,
        },
      }),
    ]);

    if (!monHoc) {
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
      monHoc.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new BadRequestException(
        'Môn học đang không hoạt động',
      );
    }

    const trung =
      await this.prisma.mon_hoc_khoi.findFirst({
        where: {
          mon_hoc_id:
            duLieu.mon_hoc_id,

          khoi_id:
            duLieu.khoi_id,
        },
      });

    if (trung) {
      throw new ConflictException(
        'Môn học đã được cấu hình cho khối này',
      );
    }

    const ketQua =
      await this.prisma.mon_hoc_khoi.create({
        data: {
          mon_hoc_id:
            duLieu.mon_hoc_id,

          khoi_id:
            duLieu.khoi_id,

          mac_dinh_gvcn:
            duLieu.mac_dinh_gvcn ??
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
        ketQua,
    };
  }

  // ==================================================
  // 5. DANH SÁCH MÔN THEO KHỐI
  // ==================================================

  async layDanhSachMonHocKhoi(
    khoiId?: number,
  ) {
    return this.prisma.mon_hoc_khoi.findMany({
      where: {
        ...(khoiId
          ? {
              khoi_id:
                khoiId,
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

  async capNhatMonHocKhoi(
    id: number,
    duLieu: CapNhatMonHocKhoiDto,
  ) {
    if (
      typeof duLieu.mac_dinh_gvcn !==
      'boolean'
    ) {
      throw new BadRequestException(
        'mac_dinh_gvcn phải là true hoặc false',
      );
    }

    const cauHinh =
      await this.prisma.mon_hoc_khoi.findUnique({
        where: {
          id,
        },
      });

    if (!cauHinh) {
      throw new NotFoundException(
        'Không tìm thấy cấu hình môn học - khối',
      );
    }

    const ketQua =
      await this.prisma.mon_hoc_khoi.update({
        where: {
          id,
        },

        data: {
          mac_dinh_gvcn:
            duLieu.mac_dinh_gvcn,
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
        ketQua,
    };
  }

  // ==================================================
  // 7. PHÂN CÔNG GVCN
  //
  // Tạo:
  // - 1 dòng GVCN, mon_hoc_id = null
  // - tự động tạo các môn mac_dinh_gvcn = true
  // ==================================================

  async phanCongGvcn(
    duLieu: PhanCongGvcnDto,
  ) {
    if (
      !Number.isInteger(
        duLieu.giao_vien_id,
      ) ||
      duLieu.giao_vien_id <= 0
    ) {
      throw new BadRequestException(
        'Giáo viên không hợp lệ',
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

    this.kiemTraKhoangNgay(
      ngayBatDau,
      ngayKetThuc,
    );

    const [
      giaoVien,
      lopHoc,
    ] = await Promise.all([
      this.prisma.giao_vien.findUnique({
        where: {
          id:
            duLieu.giao_vien_id,
        },
      }),

      this.prisma.lop_hoc.findUnique({
        where: {
          id:
            duLieu.lop_hoc_id,
        },

        include: {
          khoi: true,
          nam_hoc: true,
        },
      }),
    ]);

    if (!giaoVien) {
      throw new NotFoundException(
        'Không tìm thấy giáo viên',
      );
    }

    if (
      giaoVien.trang_thai !==
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

    const monMacDinh =
      await this.prisma.mon_hoc_khoi.findMany({
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

    return this.prisma.$transaction(
      async (tx) => {
        // ------------------------------------------
        // Kiểm tra lớp đã có GVCN trong thời gian này
        // ------------------------------------------

        const gvcnTrung =
          await tx.phan_cong_giao_vien.findFirst({
            where: {
              lop_hoc_id:
                duLieu.lop_hoc_id,

              loai_phan_cong:
                'GVCN',

              mon_hoc_id:
                null,

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

        if (gvcnTrung) {
          throw new ConflictException(
            'Lớp đã có giáo viên chủ nhiệm trong khoảng thời gian này',
          );
        }

        // ------------------------------------------
        // Kiểm tra các môn mặc định chưa bị GV khác giữ
        // ------------------------------------------

        for (
          const cauHinh
          of monMacDinh
        ) {
          const trung =
            await tx.phan_cong_giao_vien.findFirst({
              where: {
                lop_hoc_id:
                  duLieu.lop_hoc_id,

                mon_hoc_id:
                  cauHinh.mon_hoc_id,

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
              `Môn ${cauHinh.mon_hoc.ten_mon_hoc} đã có giáo viên được phân công trong khoảng thời gian này`,
            );
          }
        }

        // ------------------------------------------
        // Tạo phân công GVCN chính
        // ------------------------------------------

        const gvcn =
          await tx.phan_cong_giao_vien.create({
            data: {
              giao_vien_id:
                duLieu.giao_vien_id,

              lop_hoc_id:
                duLieu.lop_hoc_id,

              mon_hoc_id:
                null,

              loai_phan_cong:
                'GVCN',

              nguon_phan_cong:
                'BO_SUNG',

              ngay_bat_dau:
                ngayBatDau,

              ngay_ket_thuc:
                ngayKetThuc,
            },
          });

        // ------------------------------------------
        // Tự động phân các môn mặc định GVCN
        // ------------------------------------------

        for (
          const cauHinh
          of monMacDinh
        ) {
          await tx.phan_cong_giao_vien.create({
            data: {
              giao_vien_id:
                duLieu.giao_vien_id,

              lop_hoc_id:
                duLieu.lop_hoc_id,

              mon_hoc_id:
                cauHinh.mon_hoc_id,

              loai_phan_cong:
                'GVCN',

              nguon_phan_cong:
                'TU_DONG_GVCN',

              ngay_bat_dau:
                ngayBatDau,

              ngay_ket_thuc:
                ngayKetThuc,
            },
          });
        }

        return {
          thong_bao:
            'Phân công giáo viên chủ nhiệm thành công',

          gvcn,

          so_mon_tu_dong:
            monMacDinh.length,
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

  async phanCongMonHoc(
    duLieu: PhanCongMonHocDto,
  ) {
    if (
      !Number.isInteger(
        duLieu.giao_vien_id,
      ) ||
      duLieu.giao_vien_id <= 0
    ) {
      throw new BadRequestException(
        'Giáo viên không hợp lệ',
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

    if (
      !Number.isInteger(
        duLieu.mon_hoc_id,
      ) ||
      duLieu.mon_hoc_id <= 0
    ) {
      throw new BadRequestException(
        'Môn học không hợp lệ',
      );
    }

    const loaiPhanCong =
      duLieu.loai_phan_cong
        ?.trim()
        .toUpperCase();

    if (
      ![
        'GVBM',
        'GVCN',
      ].includes(loaiPhanCong)
    ) {
      throw new BadRequestException(
        'Loại phân công phải là GVBM hoặc GVCN',
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

    this.kiemTraKhoangNgay(
      ngayBatDau,
      ngayKetThuc,
    );

    const [
      giaoVien,
      lopHoc,
      monHoc,
    ] = await Promise.all([
      this.prisma.giao_vien.findUnique({
        where: {
          id:
            duLieu.giao_vien_id,
        },
      }),

      this.prisma.lop_hoc.findUnique({
        where: {
          id:
            duLieu.lop_hoc_id,
        },
      }),

      this.prisma.mon_hoc.findUnique({
        where: {
          id:
            duLieu.mon_hoc_id,
        },
      }),
    ]);

    if (!giaoVien) {
      throw new NotFoundException(
        'Không tìm thấy giáo viên',
      );
    }

    if (
      giaoVien.trang_thai !==
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

    if (!monHoc) {
      throw new NotFoundException(
        'Không tìm thấy môn học',
      );
    }

    if (
      monHoc.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new BadRequestException(
        'Môn học đang không hoạt động',
      );
    }

    // Môn phải thuộc khối của lớp

    const monHocKhoi =
      await this.prisma.mon_hoc_khoi.findFirst({
        where: {
          mon_hoc_id:
            duLieu.mon_hoc_id,

          khoi_id:
            lopHoc.khoi_id,
        },
      });

    if (!monHocKhoi) {
      throw new BadRequestException(
        'Môn học không được cấu hình cho khối của lớp này',
      );
    }

    // Môn mặc định GVCN không cho GVBM nhận

    if (
      monHocKhoi.mac_dinh_gvcn
    ) {
      throw new BadRequestException(
        'Môn này là môn mặc định của GVCN và được hệ thống tự phân công khi chọn GVCN',
      );
    }

    // Nếu chọn loại GVCN cho môn bổ sung,
    // GV đó phải thật sự đang là GVCN của lớp.

    if (
      loaiPhanCong ===
      'GVCN'
    ) {
      const gvcn =
        await this.prisma
          .phan_cong_giao_vien
          .findFirst({
            where: {
              giao_vien_id:
                duLieu.giao_vien_id,

              lop_hoc_id:
                duLieu.lop_hoc_id,

              mon_hoc_id:
                null,

              loai_phan_cong:
                'GVCN',

              ngay_bat_dau: {
                lte:
                  ngayBatDau,
              },

              ...(ngayKetThuc
                ? {
                    OR: [
                      {
                        ngay_ket_thuc:
                          null,
                      },

                      {
                        ngay_ket_thuc: {
                          gte:
                            ngayKetThuc,
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

      if (!gvcn) {
        throw new ForbiddenException(
          'Giáo viên này không phải GVCN của lớp trong khoảng thời gian đã chọn',
        );
      }
    }

    // Một lớp + môn chỉ có một GV trong cùng thời gian

    const trung =
      await this.prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            lop_hoc_id:
              duLieu.lop_hoc_id,

            mon_hoc_id:
              duLieu.mon_hoc_id,

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
        'Môn học của lớp đã có giáo viên được phân công trong khoảng thời gian này',
      );
    }

    const ketQua =
      await this.prisma
        .phan_cong_giao_vien
        .create({
          data: {
            giao_vien_id:
              duLieu.giao_vien_id,

            lop_hoc_id:
              duLieu.lop_hoc_id,

            mon_hoc_id:
              duLieu.mon_hoc_id,

            loai_phan_cong:
              loaiPhanCong,

            nguon_phan_cong:
              'BO_SUNG',

            ngay_bat_dau:
              ngayBatDau,

            ngay_ket_thuc:
              ngayKetThuc,
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
        ketQua,
    };
  }

  // ==================================================
  // 9. DANH SÁCH PHÂN CÔNG
  // ==================================================

  async layDanhSachPhanCong(
    lopHocId?: number,
    giaoVienId?: number,
    loaiPhanCong?: string,
  ) {
    const loaiPhanCongTim =
      loaiPhanCong
        ?.trim()
        .toUpperCase();

    if (
      loaiPhanCongTim &&
      ![
        'GVCN',
        'GVBM',
      ].includes(
        loaiPhanCongTim,
      )
    ) {
      throw new BadRequestException(
        'Loại phân công phải là GVCN hoặc GVBM',
      );
    }

    return this.prisma
      .phan_cong_giao_vien
      .findMany({
        where: {
          ...(lopHocId
            ? {
                lop_hoc_id:
                  lopHocId,
              }
            : {}),

          ...(giaoVienId
            ? {
                giao_vien_id:
                  giaoVienId,
              }
            : {}),

          ...(loaiPhanCongTim
            ? {
                loai_phan_cong:
                  loaiPhanCongTim,
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

  async layPhanCongCuaToi(
    taiKhoanId: number,
  ) {
    const giaoVien =
      await this.prisma.giao_vien.findUnique({
        where: {
          tai_khoan_id:
            taiKhoanId,
        },

        select: {
          id: true,
          ma_giao_vien: true,
          ho_ten: true,
        },
      });

    if (!giaoVien) {
      throw new NotFoundException(
        'Không tìm thấy hồ sơ giáo viên',
      );
    }

    const phanCong =
      await this.prisma
        .phan_cong_giao_vien
        .findMany({
          where: {
            giao_vien_id:
              giaoVien.id,
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
        giaoVien,

      phan_cong:
        phanCong,
    };
  }

  // ==================================================
  // 11. KẾT THÚC PHÂN CÔNG
  //
  // Không xóa để giữ lịch sử.
  // ==================================================

  async ketThucPhanCong(
    id: number,
    duLieu: KetThucPhanCongDto,
  ) {
    const phanCong =
      await this.prisma
        .phan_cong_giao_vien
        .findUnique({
          where: {
            id,
          },
        });

    if (!phanCong) {
      throw new NotFoundException(
        'Không tìm thấy phân công',
      );
    }

    const ngayKetThuc =
      this.chuyenNgay(
        duLieu.ngay_ket_thuc,
        'Ngày kết thúc',
      );

    if (
      ngayKetThuc <
      phanCong.ngay_bat_dau
    ) {
      throw new BadRequestException(
        'Ngày kết thúc không được trước ngày bắt đầu',
      );
    }

    // Không cho kết thúc riêng dòng môn tự động GVCN.
    // Phải kết thúc phân công GVCN chính.

    if (
      phanCong.nguon_phan_cong ===
      'TU_DONG_GVCN'
    ) {
      throw new BadRequestException(
        'Đây là môn được tự động tạo theo GVCN. Hãy kết thúc phân công GVCN chính.',
      );
    }

    // Nếu đây là dòng GVCN chính:
    // kết thúc luôn các môn do GVCN đảm nhiệm trong cùng lớp.

    if (
      phanCong.loai_phan_cong ===
        'GVCN' &&
      phanCong.mon_hoc_id ===
        null
    ) {
      return this.prisma.$transaction(
        async (tx) => {
          const gvcn =
            await tx
              .phan_cong_giao_vien
              .update({
                where: {
                  id,
                },

                data: {
                  ngay_ket_thuc:
                    ngayKetThuc,
                },
              });

          await tx
            .phan_cong_giao_vien
            .updateMany({
              where: {
                giao_vien_id:
                  phanCong.giao_vien_id,

                lop_hoc_id:
                  phanCong.lop_hoc_id,

                loai_phan_cong:
                  'GVCN',

                mon_hoc_id: {
                  not:
                    null,
                },

                ngay_bat_dau: {
                  gte:
                    phanCong.ngay_bat_dau,

                  lte:
                    ngayKetThuc,
                },

                OR: [
                  {
                    ngay_ket_thuc:
                      null,
                  },

                  {
                    ngay_ket_thuc: {
                      gt:
                        ngayKetThuc,
                    },
                  },
                ],
              },

              data: {
                ngay_ket_thuc:
                  ngayKetThuc,
              },
            });

          return {
            thong_bao:
              'Kết thúc phân công GVCN thành công',

            phan_cong:
              gvcn,
          };
        },
      );
    }

    // GVBM hoặc phân công môn bổ sung

    const ketQua =
      await this.prisma
        .phan_cong_giao_vien
        .update({
          where: {
            id,
          },

          data: {
            ngay_ket_thuc:
              ngayKetThuc,
          },
        });

    return {
      thong_bao:
        'Kết thúc phân công thành công',

      phan_cong:
        ketQua,
    };
  }
}