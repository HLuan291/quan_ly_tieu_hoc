import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service';

export interface DuLieuTaoGiaoVien {
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  so_dien_thoai: string;
  email: string;
  dia_chi_lien_he: string;
  ngay_vao_truong: string;
  trinh_do_chuyen_mon: string;
}

@Injectable()
export class GiaoVienService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================
  // BƯỚC 1: TẠO MÃ GIÁO VIÊN
  // GV0001 -> GV0002 -> GV0003...
  // =========================================

  private async taoMaGiaoVien() {
    const giaoVienCuoi =
      await this.prisma.giao_vien.findFirst({
        orderBy: {
          id: 'desc',
        },
        select: {
          ma_giao_vien: true,
        },
      });

    if (!giaoVienCuoi) {
      return 'GV0001';
    }

    const soCu = Number(
      giaoVienCuoi.ma_giao_vien.replace(
        'GV',
        '',
      ),
    );

    const soMoi = soCu + 1;

    return `GV${String(soMoi).padStart(
      4,
      '0',
    )}`;
  }

  // =========================================
  // BƯỚC 2: NHẬN DỮ LIỆU VÀ TẠO GIÁO VIÊN
  // =========================================

  async taoGiaoVien(
    duLieu: DuLieuTaoGiaoVien,
  ) {
    // -----------------------------------------
    // 2.1 KIỂM TRA DỮ LIỆU BẮT BUỘC
    // -----------------------------------------

    if (
      !duLieu.ho_ten?.trim() ||
      !duLieu.ngay_sinh ||
      !duLieu.gioi_tinh?.trim() ||
      !duLieu.so_dien_thoai?.trim() ||
      !duLieu.email?.trim() ||
      !duLieu.dia_chi_lien_he?.trim() ||
      !duLieu.ngay_vao_truong ||
      !duLieu.trinh_do_chuyen_mon?.trim()
    ) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ thông tin giáo viên',
      );
    }

    const soDienThoai =
      duLieu.so_dien_thoai.trim();

    // -----------------------------------------
    // 2.2 KIỂM TRA SỐ ĐIỆN THOẠI
    // -----------------------------------------

    const taiKhoanTonTai =
      await this.prisma.tai_khoan.findUnique({
        where: {
          so_dien_thoai: soDienThoai,
        },
      });

    if (taiKhoanTonTai) {
      throw new ConflictException(
        'Số điện thoại đã được sử dụng',
      );
    }

    // -----------------------------------------
    // 2.3 TẠO MÃ GIÁO VIÊN
    // -----------------------------------------

    const maGiaoVien =
      await this.taoMaGiaoVien();

    // GV0001 -> gv0001
    const tenDangNhap =
      maGiaoVien.toLowerCase();

    // -----------------------------------------
    // 2.4 TẠO MẬT KHẨU BAN ĐẦU
    // -----------------------------------------

    const matKhauBanDau =
      `Gv@${randomBytes(4).toString('hex')}`;

    // Không lưu mật khẩu thật vào DB
    const matKhauBam =
      await argon2.hash(matKhauBanDau);

    // =========================================
    // BƯỚC 3: TRANSACTION
    //
    // Tạo tài khoản
    //        +
    // Tạo giáo viên
    //
    // Một cái lỗi -> hủy cả hai
    // =========================================

    const ketQua =
      await this.prisma.$transaction(
        async (tx) => {
          // -----------------------------------
          // 3.1 TẠO TÀI KHOẢN
          // -----------------------------------

          const taiKhoan =
            await tx.tai_khoan.create({
              data: {
                ten_dang_nhap:
                  tenDangNhap,

                so_dien_thoai:
                  soDienThoai,

                mat_khau_bam:
                  matKhauBam,

                vai_tro:
                  'GIAO_VIEN',

                trang_thai:
                  'HOAT_DONG',

                phai_doi_mat_khau:
                  true,
              },
            });

          // -----------------------------------
          // 3.2 TẠO HỒ SƠ GIÁO VIÊN
          // -----------------------------------

          const giaoVien =
            await tx.giao_vien.create({
              data: {
                ma_giao_vien:
                  maGiaoVien,

                ho_ten:
                  duLieu.ho_ten.trim(),

                ngay_sinh:
                  new Date(
                    `${duLieu.ngay_sinh}T00:00:00.000Z`,
                  ),

                gioi_tinh:
                  duLieu.gioi_tinh.trim(),

                so_dien_thoai:
                  soDienThoai,

                email:
                  duLieu.email
                    .trim()
                    .toLowerCase(),

                dia_chi_lien_he:
                  duLieu.dia_chi_lien_he.trim(),

                ngay_vao_truong:
                  new Date(
                    `${duLieu.ngay_vao_truong}T00:00:00.000Z`,
                  ),

                trinh_do_chuyen_mon:
                  duLieu.trinh_do_chuyen_mon.trim(),

                trang_thai:
                  'HOAT_DONG',

                // Nối giáo viên với tài khoản
                tai_khoan_id:
                  taiKhoan.id,
              },
            });

          return {
            taiKhoan,
            giaoVien,
          };
        },
      );

    // =========================================
    // BƯỚC 4: TRẢ KẾT QUẢ CHO FRONTEND
    // =========================================

    return {
      thong_bao:
        'Thêm giáo viên thành công',

      giao_vien: {
        id:
          ketQua.giaoVien.id,

        ma_giao_vien:
          ketQua.giaoVien.ma_giao_vien,

        ho_ten:
          ketQua.giaoVien.ho_ten,

        so_dien_thoai:
          ketQua.giaoVien.so_dien_thoai,
      },

      tai_khoan: {
        ten_dang_nhap:
          ketQua.taiKhoan.ten_dang_nhap,

        mat_khau_ban_dau:
          matKhauBanDau,

        phai_doi_mat_khau:
          true,
      },
    };
  }
  async layDanhSachGiaoVien(
  tuKhoa?: string,
  trangThai?: string,
) {
  const tuKhoaTimKiem =
    tuKhoa?.trim();

  const trangThaiTimKiem =
    trangThai?.trim();

  const danhSach =
    await this.prisma.giao_vien.findMany({
      where: {
        // Nếu có từ khóa thì tìm
        ...(tuKhoaTimKiem
          ? {
              OR: [
                {
                  ma_giao_vien: {
                    contains:
                      tuKhoaTimKiem,
                  },
                },

                {
                  ho_ten: {
                    contains:
                      tuKhoaTimKiem,
                  },
                },

                {
                  so_dien_thoai: {
                    contains:
                      tuKhoaTimKiem,
                  },
                },

                {
                  email: {
                    contains:
                      tuKhoaTimKiem,
                  },
                },
              ],
            }
          : {}),

        // Nếu có chọn trạng thái
        ...(trangThaiTimKiem
          ? {
              trang_thai:
                trangThaiTimKiem,
            }
          : {}),
      },

      orderBy: {
        ho_ten: 'asc',
      },

      select: {
        id: true,

        ma_giao_vien: true,

        ho_ten: true,

        ngay_sinh: true,

        gioi_tinh: true,

        so_dien_thoai: true,

        email: true,

        dia_chi_lien_he: true,

        ngay_vao_truong: true,

        trinh_do_chuyen_mon: true,

        trang_thai: true,

        tai_khoan: {
          select: {
            ten_dang_nhap: true,

            trang_thai: true,

            lan_dang_nhap_cuoi: true,
          },
        },
      },
    });

  return {
    tong_so:
      danhSach.length,

    danh_sach:
      danhSach,
  };
}
}