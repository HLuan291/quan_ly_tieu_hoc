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

  private kiemTraDiem(
    diem: number,
  ) {
    if (
      !Number.isFinite(diem) ||
      diem < 0 ||
      diem > 10
    ) {
      throw new BadRequestException(
        'Điểm phải nằm trong khoảng từ 0 đến 10',
      );
    }
  }

  // ==================================================
  // TÌM LỚP CỦA HỌC SINH TRONG NĂM HỌC
  // ==================================================

  private async layLopHocSinhTrongNam(
    hocSinhId: number,
    namHocId: number,
  ) {
    const xepLop =
      await this.prisma.xep_lop.findFirst({
        where: {
          hoc_sinh_id:
            hocSinhId,

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

    if (!xepLop) {
      throw new BadRequestException(
        'Học sinh chưa được xếp lớp trong năm học của đợt đánh giá',
      );
    }

    return xepLop;
  }

  // ==================================================
  // KIỂM TRA GV ĐƯỢC DẠY MÔN CỦA HS
  // ==================================================

  private async kiemTraQuyenDanhGiaMon(
    giaoVienId: number,
    hocSinhId: number,
    monHocId: number,
    dotDanhGiaId: number,
  ) {
    const dot =
      await this.prisma.dot_danh_gia.findUnique({
        where: {
          id:
            dotDanhGiaId,
        },
      });

    if (!dot) {
      throw new NotFoundException(
        'Không tìm thấy đợt đánh giá',
      );
    }

    const xepLop =
      await this.layLopHocSinhTrongNam(
        hocSinhId,
        dot.nam_hoc_id,
      );

    const phanCong =
      await this.prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            giao_vien_id:
              giaoVienId,

            lop_hoc_id:
              xepLop.lop_hoc_id,

            mon_hoc_id:
              monHocId,
          },
        });

    if (!phanCong) {
      throw new ForbiddenException(
        'Bạn không được phân công dạy môn này cho học sinh',
      );
    }

    return {
      dot,
      xepLop,
      phanCong,
    };
  }

  // ==================================================
  // KIỂM TRA GVCN CỦA HỌC SINH TRONG NĂM
  // ==================================================

  private async kiemTraQuyenGvcn(
    giaoVienId: number,
    hocSinhId: number,
    dotDanhGiaId: number,
  ) {
    const dot =
      await this.prisma.dot_danh_gia.findUnique({
        where: {
          id:
            dotDanhGiaId,
        },
      });

    if (!dot) {
      throw new NotFoundException(
        'Không tìm thấy đợt đánh giá',
      );
    }

    const xepLop =
      await this.layLopHocSinhTrongNam(
        hocSinhId,
        dot.nam_hoc_id,
      );

    const gvcn =
      await this.prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            giao_vien_id:
              giaoVienId,

            lop_hoc_id:
              xepLop.lop_hoc_id,

            loai_phan_cong:
              'GVCN',

            mon_hoc_id:
              null,
          },
        });

    if (!gvcn) {
      throw new ForbiddenException(
        'Bạn không phải giáo viên chủ nhiệm của học sinh này',
      );
    }

    return {
      dot,
      xepLop,
      gvcn,
    };
  }

  // ==================================================
  // 1. TẠO ĐỢT ĐÁNH GIÁ
  // ==================================================

  async taoDotDanhGia(
    duLieu: TaoDotDanhGiaDto,
  ) {
    const namHoc =
      await this.prisma.nam_hoc.findUnique({
        where: {
          id:
            duLieu.nam_hoc_id,
        },
      });

    if (!namHoc) {
      throw new NotFoundException(
        'Không tìm thấy năm học',
      );
    }

    const maDot =
      duLieu.ma_dot
        ?.trim()
        .toUpperCase();

    const tenDot =
      duLieu.ten_dot?.trim();

    const hocKy =
      duLieu.hoc_ky
        ?.trim()
        .toUpperCase();

    if (
      !maDot ||
      !tenDot ||
      !hocKy
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
      ].includes(maDot)
    ) {
      throw new BadRequestException(
        'Mã đợt đánh giá không hợp lệ',
      );
    }

    if (
      !Number.isInteger(
        duLieu.thu_tu,
      ) ||
      duLieu.thu_tu <= 0
    ) {
      throw new BadRequestException(
        'Thứ tự đánh giá không hợp lệ',
      );
    }

    const trungMa =
      await this.prisma.dot_danh_gia.findFirst({
        where: {
          nam_hoc_id:
            duLieu.nam_hoc_id,

          ma_dot:
            maDot,
        },
      });

    if (trungMa) {
      throw new ConflictException(
        'Đợt đánh giá đã tồn tại trong năm học',
      );
    }

    const trungThuTu =
      await this.prisma.dot_danh_gia.findFirst({
        where: {
          nam_hoc_id:
            duLieu.nam_hoc_id,

          thu_tu:
            duLieu.thu_tu,
        },
      });

    if (trungThuTu) {
      throw new ConflictException(
        'Thứ tự đợt đánh giá đã tồn tại',
      );
    }

    const ketQua =
      await this.prisma.dot_danh_gia.create({
        data: {
          nam_hoc_id:
            duLieu.nam_hoc_id,

          ma_dot:
            maDot,

          ten_dot:
            tenDot,

          hoc_ky:
            hocKy,

          thu_tu:
            duLieu.thu_tu,
        },
      });

    return {
      thong_bao:
        'Tạo đợt đánh giá thành công',

      dot_danh_gia:
        ketQua,
    };
  }

  // ==================================================
  // 2. DANH SÁCH ĐỢT ĐÁNH GIÁ
  // ==================================================

  async layDanhSachDotDanhGia(
    namHocId?: number,
  ) {
    return this.prisma.dot_danh_gia.findMany({
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

  async taoCauHinhDanhGiaMon(
    duLieu: TaoCauHinhDanhGiaMonDto,
  ) {
    const [
      dot,
      khoi,
      mon,
    ] = await Promise.all([
      this.prisma.dot_danh_gia.findUnique({
        where: {
          id:
            duLieu.dot_danh_gia_id,
        },
      }),

      this.prisma.khoi.findUnique({
        where: {
          id:
            duLieu.khoi_id,
        },
      }),

      this.prisma.mon_hoc.findUnique({
        where: {
          id:
            duLieu.mon_hoc_id,
        },
      }),
    ]);

    if (!dot) {
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

    const monKhoi =
      await this.prisma.mon_hoc_khoi.findFirst({
        where: {
          khoi_id:
            duLieu.khoi_id,

          mon_hoc_id:
            duLieu.mon_hoc_id,
        },
      });

    if (!monKhoi) {
      throw new BadRequestException(
        'Môn học không thuộc khối này',
      );
    }

    const trung =
      await this.prisma
        .cau_hinh_danh_gia_mon
        .findFirst({
          where: {
            dot_danh_gia_id:
              duLieu.dot_danh_gia_id,

            khoi_id:
              duLieu.khoi_id,

            mon_hoc_id:
              duLieu.mon_hoc_id,
          },
        });

    if (trung) {
      throw new ConflictException(
        'Cấu hình đánh giá môn đã tồn tại',
      );
    }

    const ketQua =
      await this.prisma
        .cau_hinh_danh_gia_mon
        .create({
          data: {
            dot_danh_gia_id:
              duLieu.dot_danh_gia_id,

            khoi_id:
              duLieu.khoi_id,

            mon_hoc_id:
              duLieu.mon_hoc_id,
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
        ketQua,
    };
  }

  // ==================================================
  // 4. DANH SÁCH CẤU HÌNH ĐÁNH GIÁ MÔN
  // ==================================================

  async layCauHinhDanhGiaMon(
    dotDanhGiaId?: number,
    khoiId?: number,
  ) {
    return this.prisma
      .cau_hinh_danh_gia_mon
      .findMany({
        where: {
          ...(dotDanhGiaId
            ? {
                dot_danh_gia_id:
                  dotDanhGiaId,
              }
            : {}),

          ...(khoiId
            ? {
                khoi_id:
                  khoiId,
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

  async taoCauHinhDiem(
    duLieu: TaoCauHinhDiemDto,
  ) {
    const cachNhap =
      duLieu.cach_nhap
        ?.trim()
        .toUpperCase();

    if (
      ![
        'NHAP_TAY',
        'TU_TINH',
      ].includes(cachNhap)
    ) {
      throw new BadRequestException(
        'Cách nhập phải là NHAP_TAY hoặc TU_TINH',
      );
    }

    const maLoaiDiem =
      duLieu.ma_loai_diem
        ?.trim()
        .toUpperCase();

    const tenHienThi =
      duLieu.ten_hien_thi?.trim();

    if (
      !maLoaiDiem ||
      !tenHienThi
    ) {
      throw new BadRequestException(
        'Thông tin loại điểm chưa đầy đủ',
      );
    }

    const cauHinhMon =
      await this.prisma
        .cau_hinh_danh_gia_mon
        .findFirst({
          where: {
            dot_danh_gia_id:
              duLieu.dot_danh_gia_id,

            khoi_id:
              duLieu.khoi_id,

            mon_hoc_id:
              duLieu.mon_hoc_id,
          },
        });

    if (!cauHinhMon) {
      throw new BadRequestException(
        'Môn học chưa được cấu hình đánh giá cho khối và đợt này',
      );
    }

    const trung =
      await this.prisma.cau_hinh_diem.findFirst({
        where: {
          dot_danh_gia_id:
            duLieu.dot_danh_gia_id,

          khoi_id:
            duLieu.khoi_id,

          mon_hoc_id:
            duLieu.mon_hoc_id,

          ma_loai_diem:
            maLoaiDiem,
        },
      });

    if (trung) {
      throw new ConflictException(
        'Loại điểm đã tồn tại',
      );
    }

    const ketQua =
      await this.prisma.cau_hinh_diem.create({
        data: {
          dot_danh_gia_id:
            duLieu.dot_danh_gia_id,

          khoi_id:
            duLieu.khoi_id,

          mon_hoc_id:
            duLieu.mon_hoc_id,

          ma_loai_diem:
            maLoaiDiem,

          ten_hien_thi:
            tenHienThi,

          bat_buoc:
            duLieu.bat_buoc ??
            true,

          thu_tu_hien_thi:
            duLieu.thu_tu_hien_thi,

          cach_nhap:
            cachNhap,
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
        ketQua,
    };
  }

  // ==================================================
  // 6. DANH SÁCH CẤU HÌNH ĐIỂM
  // ==================================================

  async layCauHinhDiem(
    dotDanhGiaId?: number,
    khoiId?: number,
    monHocId?: number,
  ) {
    return this.prisma.cau_hinh_diem.findMany({
      where: {
        ...(dotDanhGiaId
          ? {
              dot_danh_gia_id:
                dotDanhGiaId,
            }
          : {}),

        ...(khoiId
          ? {
              khoi_id:
                khoiId,
            }
          : {}),

        ...(monHocId
          ? {
              mon_hoc_id:
                monHocId,
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

  async taoTieuChiDanhGia(
    duLieu: TaoTieuChiDanhGiaDto,
  ) {
    const maTieuChi =
      duLieu.ma_tieu_chi
        ?.trim()
        .toUpperCase();

    const tenTieuChi =
      duLieu.ten_tieu_chi?.trim();

    const nhomDanhGia =
      duLieu.nhom_danh_gia
        ?.trim()
        .toUpperCase();

    if (
      !maTieuChi ||
      !tenTieuChi ||
      !nhomDanhGia
    ) {
      throw new BadRequestException(
        'Thông tin tiêu chí chưa đầy đủ',
      );
    }

    if (
      ![
        'NANG_LUC',
        'PHAM_CHAT',
      ].includes(nhomDanhGia)
    ) {
      throw new BadRequestException(
        'Nhóm đánh giá phải là NANG_LUC hoặc PHAM_CHAT',
      );
    }

    const trung =
      await this.prisma
        .tieu_chi_danh_gia
        .findUnique({
          where: {
            ma_tieu_chi:
              maTieuChi,
          },
        });

    if (trung) {
      throw new ConflictException(
        'Mã tiêu chí đã tồn tại',
      );
    }

    const ketQua =
      await this.prisma
        .tieu_chi_danh_gia
        .create({
          data: {
            ma_tieu_chi:
              maTieuChi,

            ten_tieu_chi:
              tenTieuChi,

            nhom_danh_gia:
              nhomDanhGia,

            thu_tu_hien_thi:
              duLieu.thu_tu_hien_thi,
          },
        });

    return {
      thong_bao:
        'Tạo tiêu chí thành công',

      tieu_chi:
        ketQua,
    };
  }

  // ==================================================
  // 8. DANH SÁCH TIÊU CHÍ
  // ==================================================

  async layDanhSachTieuChi(
    nhomDanhGia?: string,
  ) {
    return this.prisma
      .tieu_chi_danh_gia
      .findMany({
        where: {
          trang_thai:
            'HOAT_DONG',

          ...(nhomDanhGia?.trim()
            ? {
                nhom_danh_gia:
                  nhomDanhGia
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

  async capNhatKetQuaMonHoc(
    taiKhoanId: number,
    duLieu: CapNhatKetQuaMonHocDto,
  ) {
    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    await this.kiemTraQuyenDanhGiaMon(
      giaoVien.id,
      duLieu.hoc_sinh_id,
      duLieu.mon_hoc_id,
      duLieu.dot_danh_gia_id,
    );

    const mucDanhGia =
      duLieu.muc_danh_gia?.trim();

    if (!mucDanhGia) {
      throw new BadRequestException(
        'Mức đánh giá không được để trống',
      );
    }

    const cauHinh =
      await this.prisma
        .cau_hinh_danh_gia_mon
        .findFirst({
          where: {
            dot_danh_gia_id:
              duLieu.dot_danh_gia_id,

            mon_hoc_id:
              duLieu.mon_hoc_id,
          },
        });

    if (!cauHinh) {
      throw new BadRequestException(
        'Môn học chưa được cấu hình cho đợt đánh giá',
      );
    }

    const ketQuaCu =
      await this.prisma.ket_qua_mon_hoc.findFirst({
        where: {
          hoc_sinh_id:
            duLieu.hoc_sinh_id,

          mon_hoc_id:
            duLieu.mon_hoc_id,

          dot_danh_gia_id:
            duLieu.dot_danh_gia_id,
        },
      });

    if (ketQuaCu) {
      const ketQua =
        await this.prisma.ket_qua_mon_hoc.update({
          where: {
            id:
              ketQuaCu.id,
          },

          data: {
            muc_danh_gia:
              mucDanhGia,

            nhan_xet:
              duLieu.nhan_xet
                ?.trim() ||
              null,

            giao_vien_cap_nhat_id:
              giaoVien.id,

            ngay_cap_nhat:
              new Date(),
          },
        });

      return {
        thong_bao:
          'Cập nhật kết quả môn học thành công',

        ket_qua:
          ketQua,
      };
    }

    const ketQua =
      await this.prisma.ket_qua_mon_hoc.create({
        data: {
          hoc_sinh_id:
            duLieu.hoc_sinh_id,

          mon_hoc_id:
            duLieu.mon_hoc_id,

          dot_danh_gia_id:
            duLieu.dot_danh_gia_id,

          muc_danh_gia:
            mucDanhGia,

          nhan_xet:
            duLieu.nhan_xet
              ?.trim() ||
            null,

          giao_vien_cap_nhat_id:
            giaoVien.id,
        },
      });

    return {
      thong_bao:
        'Nhập kết quả môn học thành công',

      ket_qua:
        ketQua,
    };
  }

  // ==================================================
  // 10. NHẬP ĐIỂM KTĐK LẦN ĐẦU
  // ==================================================

  async nhapDiemDinhKy(
    taiKhoanId: number,
    duLieu: NhapDiemDinhKyDto,
  ) {
    this.kiemTraDiem(
      duLieu.diem,
    );

    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    const cauHinh =
      await this.prisma.cau_hinh_diem.findUnique({
        where: {
          id:
            duLieu.cau_hinh_diem_id,
        },
      });

    if (!cauHinh) {
      throw new NotFoundException(
        'Không tìm thấy cấu hình điểm',
      );
    }

    if (
      cauHinh.cach_nhap !==
      'NHAP_TAY'
    ) {
      throw new BadRequestException(
        'Loại điểm này được hệ thống tự tính, không được nhập tay',
      );
    }

    await this.kiemTraQuyenDanhGiaMon(
      giaoVien.id,
      duLieu.hoc_sinh_id,
      cauHinh.mon_hoc_id,
      cauHinh.dot_danh_gia_id,
    );

    const daCo =
      await this.prisma
        .diem_kiem_tra_dinh_ky
        .findFirst({
          where: {
            hoc_sinh_id:
              duLieu.hoc_sinh_id,

            cau_hinh_diem_id:
              duLieu.cau_hinh_diem_id,
          },
        });

    if (daCo) {
      throw new ConflictException(
        'Điểm này đã tồn tại. Nếu kiểm tra lại hãy dùng chức năng nhập lần kiểm tra lại.',
      );
    }

    const ngayKiemTra =
      this.chuyenNgay(
        duLieu.ngay_kiem_tra,
        'Ngày kiểm tra',
      );

    const ketQua =
      await this.prisma.$transaction(
        async (tx) => {
          const diem =
            await tx.diem_kiem_tra_dinh_ky.create({
              data: {
                hoc_sinh_id:
                  duLieu.hoc_sinh_id,

                cau_hinh_diem_id:
                  duLieu.cau_hinh_diem_id,

                diem:
                  duLieu.diem,

                giao_vien_cap_nhat_id:
                  giaoVien.id,
              },
            });

          await tx.lan_kiem_tra_dinh_ky.create({
            data: {
              diem_kiem_tra_dinh_ky_id:
                diem.id,

              lan_thu:
                1,

              diem:
                duLieu.diem,

              ngay_kiem_tra:
                ngayKiemTra,

              giao_vien_nhap_id:
                giaoVien.id,
            },
          });

          return diem;
        },
      );

    await this.tinhLaiDiemTuTinh(
      duLieu.hoc_sinh_id,
      cauHinh.dot_danh_gia_id,
      cauHinh.khoi_id,
      cauHinh.mon_hoc_id,
      giaoVien.id,
    );

    return {
      thong_bao:
        'Nhập điểm định kỳ thành công',

      diem:
        ketQua,
    };
  }

  // ==================================================
  // 11. NHẬP LẦN KIỂM TRA LẠI
  // ==================================================

  async nhapDiemKiemTraLai(
    taiKhoanId: number,
    diemId: number,
    duLieu: NhapDiemKiemTraLaiDto,
  ) {
    this.kiemTraDiem(
      duLieu.diem,
    );

    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    const diemHienTai =
      await this.prisma
        .diem_kiem_tra_dinh_ky
        .findUnique({
          where: {
            id:
              diemId,
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

    if (!diemHienTai) {
      throw new NotFoundException(
        'Không tìm thấy điểm định kỳ',
      );
    }

    await this.kiemTraQuyenDanhGiaMon(
      giaoVien.id,
      diemHienTai.hoc_sinh_id,
      diemHienTai.cau_hinh_diem.mon_hoc_id,
      diemHienTai.cau_hinh_diem.dot_danh_gia_id,
    );

    const lanCuoi =
      diemHienTai
        .lan_kiem_tra_dinh_ky[0]
        ?.lan_thu ??
      0;

    const lanMoi =
      lanCuoi + 1;

    const ngayKiemTra =
      this.chuyenNgay(
        duLieu.ngay_kiem_tra,
        'Ngày kiểm tra',
      );

    const ketQua =
      await this.prisma.$transaction(
        async (tx) => {
          const lanKiemTra =
            await tx.lan_kiem_tra_dinh_ky.create({
              data: {
                diem_kiem_tra_dinh_ky_id:
                  diemId,

                lan_thu:
                  lanMoi,

                diem:
                  duLieu.diem,

                ngay_kiem_tra:
                  ngayKiemTra,

                ly_do_kiem_tra_lai:
                  duLieu.ly_do_kiem_tra_lai
                    ?.trim() ||
                  null,

                giao_vien_nhap_id:
                  giaoVien.id,
              },
            });

          await tx.diem_kiem_tra_dinh_ky.update({
            where: {
              id:
                diemId,
            },

            data: {
              // Điểm hiện hành = lần kiểm tra mới nhất
              diem:
                duLieu.diem,

              giao_vien_cap_nhat_id:
                giaoVien.id,

              ngay_cap_nhat:
                new Date(),
            },
          });

          return lanKiemTra;
        },
      );

    await this.tinhLaiDiemTuTinh(
      diemHienTai.hoc_sinh_id,
      diemHienTai.cau_hinh_diem.dot_danh_gia_id,
      diemHienTai.cau_hinh_diem.khoi_id,
      diemHienTai.cau_hinh_diem.mon_hoc_id,
      giaoVien.id,
    );

    return {
      thong_bao:
        'Nhập lần kiểm tra lại thành công',

      lan_kiem_tra:
        ketQua,
    };
  }

  // ==================================================
  // 12. TÍNH ĐIỂM CÓ cach_nhap = TU_TINH
  //
  // Lấy trung bình các thành phần NHAP_TAY
  // và làm tròn thành điểm hiện hành.
  // ==================================================

  private async tinhLaiDiemTuTinh(
    hocSinhId: number,
    dotDanhGiaId: number,
    khoiId: number,
    monHocId: number,
    giaoVienId: number,
  ) {
    const cauHinhTuTinh =
      await this.prisma.cau_hinh_diem.findMany({
        where: {
          dot_danh_gia_id:
            dotDanhGiaId,

          khoi_id:
            khoiId,

          mon_hoc_id:
            monHocId,

          cach_nhap:
            'TU_TINH',
        },
      });

    if (
      cauHinhTuTinh.length === 0
    ) {
      return;
    }

    const cauHinhNhapTay =
      await this.prisma.cau_hinh_diem.findMany({
        where: {
          dot_danh_gia_id:
            dotDanhGiaId,

          khoi_id:
            khoiId,

          mon_hoc_id:
            monHocId,

          cach_nhap:
            'NHAP_TAY',
        },

        select: {
          id: true,
        },
      });

    const ids =
      cauHinhNhapTay.map(
        (item) =>
          item.id,
      );

    if (ids.length === 0) {
      return;
    }

    const diemThanhPhan =
      await this.prisma
        .diem_kiem_tra_dinh_ky
        .findMany({
          where: {
            hoc_sinh_id:
              hocSinhId,

            cau_hinh_diem_id: {
              in:
                ids,
            },
          },

          select: {
            diem: true,
          },
        });

    if (
      diemThanhPhan.length !==
      ids.length
    ) {
      return;
    }

    const tong =
      diemThanhPhan.reduce(
        (giaTri, item) =>
          giaTri +
          Number(item.diem),
        0,
      );

    const diemTuTinh =
      Math.round(
        tong /
          diemThanhPhan.length,
      );

    for (
      const cauHinh
      of cauHinhTuTinh
    ) {
      const diemCu =
        await this.prisma
          .diem_kiem_tra_dinh_ky
          .findFirst({
            where: {
              hoc_sinh_id:
                hocSinhId,

              cau_hinh_diem_id:
                cauHinh.id,
            },
          });

      if (diemCu) {
        await this.prisma
          .diem_kiem_tra_dinh_ky
          .update({
            where: {
              id:
                diemCu.id,
            },

            data: {
              diem:
                diemTuTinh,

              giao_vien_cap_nhat_id:
                giaoVienId,

              ngay_cap_nhat:
                new Date(),
            },
          });
      } else {
        await this.prisma
          .diem_kiem_tra_dinh_ky
          .create({
            data: {
              hoc_sinh_id:
                hocSinhId,

              cau_hinh_diem_id:
                cauHinh.id,

              diem:
                diemTuTinh,

              giao_vien_cap_nhat_id:
                giaoVienId,
            },
          });
      }
    }
  }

  // ==================================================
  // 13. GV XEM KẾT QUẢ CỦA HS THEO ĐỢT
  // ==================================================

  async layKetQuaHocSinhTheoDot(
    hocSinhId: number,
    dotDanhGiaId: number,
  ) {
    const [
      hocSinh,
      dot,
    ] = await Promise.all([
      this.prisma.hoc_sinh.findUnique({
        where: {
          id:
            hocSinhId,
        },

        select: {
          id: true,
          ma_hoc_sinh: true,
          ho_ten: true,
        },
      }),

      this.prisma.dot_danh_gia.findUnique({
        where: {
          id:
            dotDanhGiaId,
        },

        include: {
          nam_hoc: true,
        },
      }),
    ]);

    if (!hocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }

    if (!dot) {
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
      this.prisma.ket_qua_mon_hoc.findMany({
        where: {
          hoc_sinh_id:
            hocSinhId,

          dot_danh_gia_id:
            dotDanhGiaId,
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

      this.prisma.diem_kiem_tra_dinh_ky.findMany({
        where: {
          hoc_sinh_id:
            hocSinhId,

          cau_hinh_diem: {
            dot_danh_gia_id:
              dotDanhGiaId,
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

      this.prisma
        .ket_qua_nang_luc_pham_chat
        .findMany({
          where: {
            hoc_sinh_id:
              hocSinhId,

            dot_danh_gia_id:
              dotDanhGiaId,
          },

          include: {
            tieu_chi_danh_gia: true,
          },
        }),

      this.prisma.tong_ket_giao_duc.findFirst({
        where: {
          hoc_sinh_id:
            hocSinhId,

          dot_danh_gia_id:
            dotDanhGiaId,
        },
      }),
    ]);

    return {
      hoc_sinh:
        hocSinh,

      dot_danh_gia:
        dot,

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

  async capNhatNangLucPhamChat(
    taiKhoanId: number,
    duLieu: CapNhatNangLucPhamChatDto,
  ) {
    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    await this.kiemTraQuyenGvcn(
      giaoVien.id,
      duLieu.hoc_sinh_id,
      duLieu.dot_danh_gia_id,
    );

    const tieuChi =
      await this.prisma
        .tieu_chi_danh_gia
        .findUnique({
          where: {
            id:
              duLieu.tieu_chi_danh_gia_id,
          },
        });

    if (!tieuChi) {
      throw new NotFoundException(
        'Không tìm thấy tiêu chí đánh giá',
      );
    }

    if (
      tieuChi.trang_thai !==
      'HOAT_DONG'
    ) {
      throw new BadRequestException(
        'Tiêu chí đánh giá đang không hoạt động',
      );
    }

    const mucDanhGia =
      duLieu.muc_danh_gia?.trim();

    if (!mucDanhGia) {
      throw new BadRequestException(
        'Mức đánh giá không được để trống',
      );
    }

    const ketQuaCu =
      await this.prisma
        .ket_qua_nang_luc_pham_chat
        .findFirst({
          where: {
            hoc_sinh_id:
              duLieu.hoc_sinh_id,

            dot_danh_gia_id:
              duLieu.dot_danh_gia_id,

            tieu_chi_danh_gia_id:
              duLieu.tieu_chi_danh_gia_id,
          },
        });

    if (ketQuaCu) {
      const ketQua =
        await this.prisma
          .ket_qua_nang_luc_pham_chat
          .update({
            where: {
              id:
                ketQuaCu.id,
            },

            data: {
              muc_danh_gia:
                mucDanhGia,

              nhan_xet:
                duLieu.nhan_xet
                  ?.trim() ||
                null,

              giao_vien_cap_nhat_id:
                giaoVien.id,

              ngay_cap_nhat:
                new Date(),
            },
          });

      return {
        thong_bao:
          'Cập nhật năng lực/phẩm chất thành công',

        ket_qua:
          ketQua,
      };
    }

    const ketQua =
      await this.prisma
        .ket_qua_nang_luc_pham_chat
        .create({
          data: {
            hoc_sinh_id:
              duLieu.hoc_sinh_id,

            dot_danh_gia_id:
              duLieu.dot_danh_gia_id,

            tieu_chi_danh_gia_id:
              duLieu.tieu_chi_danh_gia_id,

            muc_danh_gia:
              mucDanhGia,

            nhan_xet:
              duLieu.nhan_xet
                ?.trim() ||
              null,

            giao_vien_cap_nhat_id:
              giaoVien.id,
          },
        });

    return {
      thong_bao:
        'Nhập năng lực/phẩm chất thành công',

      ket_qua:
        ketQua,
    };
  }

  // ==================================================
  // 15. GVCN TỔNG KẾT GIÁO DỤC CUỐI NĂM
  // ==================================================

  async capNhatTongKetGiaoDuc(
    taiKhoanId: number,
    duLieu: CapNhatTongKetGiaoDucDto,
  ) {
    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    const {
      dot,
    } =
      await this.kiemTraQuyenGvcn(
        giaoVien.id,
        duLieu.hoc_sinh_id,
        duLieu.dot_danh_gia_id,
      );

    if (
      dot.ma_dot !==
      'CUOI_NAM'
    ) {
      throw new BadRequestException(
        'Tổng kết giáo dục chỉ được thực hiện ở đợt CUOI_NAM',
      );
    }

    const mucKetQua =
      duLieu.muc_ket_qua_giao_duc
        ?.trim() ||
      null;

    const ketQuaHoanThanh =
      duLieu.ket_qua_hoan_thanh_lop
        ?.trim() ||
      null;

    const tongKetCu =
      await this.prisma
        .tong_ket_giao_duc
        .findFirst({
          where: {
            hoc_sinh_id:
              duLieu.hoc_sinh_id,

            dot_danh_gia_id:
              duLieu.dot_danh_gia_id,
          },
        });

    if (tongKetCu) {
      const ketQua =
        await this.prisma
          .tong_ket_giao_duc
          .update({
            where: {
              id:
                tongKetCu.id,
            },

            data: {
              muc_ket_qua_giao_duc:
                mucKetQua,

              ket_qua_hoan_thanh_lop:
                ketQuaHoanThanh,

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
          ketQua,
      };
    }

    const ketQua =
      await this.prisma
        .tong_ket_giao_duc
        .create({
          data: {
            hoc_sinh_id:
              duLieu.hoc_sinh_id,

            dot_danh_gia_id:
              duLieu.dot_danh_gia_id,

            muc_ket_qua_giao_duc:
              mucKetQua,

            ket_qua_hoan_thanh_lop:
              ketQuaHoanThanh,

            ngay_xet:
              new Date(),
          },
        });

    return {
      thong_bao:
        'Tạo tổng kết giáo dục thành công',

      tong_ket:
        ketQua,
    };
  }

  // ==================================================
  // 16. PHỤ HUYNH XEM KẾT QUẢ CỦA CON
  // ==================================================

  async layKetQuaCuaCon(
    taiKhoanId: number,
    hocSinhId: number,
    dotDanhGiaId: number,
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
        'Bạn không có quyền xem kết quả của học sinh này',
      );
    }

    return this.layKetQuaHocSinhTheoDot(
      hocSinhId,
      dotDanhGiaId,
    );
  }

  // ==================================================
  // 17. GIÁO VIÊN XEM HỌC SINH LỚP/MÔN ĐƯỢC PHÂN CÔNG
  // ==================================================

  async layHocSinhDeDanhGia(
    taiKhoanId: number,
    lopHocId: number,
  ) {
    const giaoVien =
      await this.layGiaoVienTuTaiKhoan(
        taiKhoanId,
      );

    const phanCong =
      await this.prisma
        .phan_cong_giao_vien
        .findFirst({
          where: {
            giao_vien_id:
              giaoVien.id,

            lop_hoc_id:
              lopHocId,
          },
        });

    if (!phanCong) {
      throw new ForbiddenException(
        'Bạn không được phân công tại lớp này',
      );
    }

    const lop =
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

    if (!lop) {
      throw new NotFoundException(
        'Không tìm thấy lớp học',
      );
    }

    const hocSinh =
      await this.prisma.xep_lop.findMany({
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
        lop,

      hoc_sinh:
        hocSinh,
    };
  }
}