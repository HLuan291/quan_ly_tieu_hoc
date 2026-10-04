import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service';
import { LayNgayNghiepVu } from '../ngay_nghiep_vu';

export interface DuLieuTaoGiaoVien {
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  so_dien_thoai: string;
  email: string;
  dia_chi_lien_he: string;
  ngay_vao_truong: string;
  trinh_do_chuyen_mon: string;
  mat_khau_ban_dau?: string;
}

export interface DuLieuCapNhatGiaoVien {
  ho_ten?: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  so_dien_thoai?: string;
  email?: string;
  dia_chi_lien_he?: string;
  ngay_vao_truong?: string;
  trinh_do_chuyen_mon?: string;
}

@Injectable()
export class GiaoVienService {
  constructor(
    private readonly Prisma: PrismaService,
  ) {}

  private TaoMatKhauTamThoi(GiaTri: unknown): string {
    if (GiaTri === undefined || GiaTri === '') {
      return `Gv@${randomBytes(16).toString('base64url')}`;
    }

    if (
      typeof GiaTri !== 'string' ||
      GiaTri.length < 8 ||
      GiaTri.length > 128 ||
      !GiaTri.trim()
    ) {
      throw new BadRequestException(
        'Mật khẩu phải có từ 8 đến 128 ký tự và không được chỉ chứa khoảng trắng',
      );
    }

    return GiaTri;
  }

  private ChuyenNgay(
    GiaTri: string,
    TenTruong: string,
  ): Date {
    const Ngay =
      new Date(
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

  private KiemTraSoDienThoai(
    SoDienThoai: string,
  ) {
    if (
      !/^\d{10}$/.test(
        SoDienThoai,
      )
    ) {
      throw new BadRequestException(
        'Số điện thoại phải gồm đúng 10 chữ số',
      );
    }
  }

  private KiemTraEmail(
    Email: string,
  ) {
    const DinhDangEmail =
      /^[^\s@]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

    if (
      !DinhDangEmail.test(
        Email,
      )
    ) {
      throw new BadRequestException(
        'Email không đúng định dạng, ví dụ: giaovien@truong.edu.vn',
      );
    }
  }

  private KiemTraHoTen(
    HoTen: string,
  ) {
    const CacTu =
      HoTen
        .trim()
        .split(/\s+/);

    const HopLe =
      CacTu.every(
        (Tu) =>
          /^\p{Lu}/u.test(
            Tu,
          ),
      );

    if (!HopLe) {
      throw new BadRequestException(
        'Họ tên phải viết hoa chữ cái đầu của mỗi từ, ví dụ: Trần Thị Bình',
      );
    }
  }

  private KiemTraNgaySinhGiaoVien(
    NgaySinh: Date,
  ) {
    const NgayNhoNhat =
      new Date(
        '1950-01-01T00:00:00.000Z',
      );

    const NgayLonNhat =
      LayNgayNghiepVu();

    const ThangSinhToiDa = NgayLonNhat.getUTCMonth();

    NgayLonNhat.setUTCFullYear(
      NgayLonNhat.getUTCFullYear() - 18,
    );

    if (NgayLonNhat.getUTCMonth() !== ThangSinhToiDa) {
      NgayLonNhat.setUTCDate(0);
    }

    if (
      NgaySinh < NgayNhoNhat ||
      NgaySinh > NgayLonNhat
    ) {
      throw new BadRequestException(
        'Ngày sinh phải từ năm 1950 và giáo viên phải đủ 18 tuổi',
      );
    }
  }

  private KiemTraNgayVaoTruong(
    NgaySinh: Date,
    NgayVaoTruong: Date,
  ) {
    const HomNay =
      LayNgayNghiepVu();

    const NgayDu18Tuoi =
      new Date(
        NgaySinh,
      );

    NgayDu18Tuoi.setUTCFullYear(
      NgayDu18Tuoi.getUTCFullYear() + 18,
    );

    if (
      NgayVaoTruong <
      NgayDu18Tuoi
    ) {
      throw new BadRequestException(
        'Ngày vào trường phải sau thời điểm giáo viên đủ 18 tuổi',
      );
    }

    if (
      NgayVaoTruong >
      HomNay
    ) {
      throw new BadRequestException(
        'Ngày vào trường không được lớn hơn ngày hiện tại',
      );
    }
  }

  private async TaoMaGiaoVien() {
    const GiaoVienCuoi =
      await this.Prisma.giao_vien.findFirst({
        orderBy: {
          id: 'desc',
        },
        select: {
          ma_giao_vien: true,
        },
      });

    if (!GiaoVienCuoi) {
      return 'GV0001';
    }

    const SoCu =
      Number(
        GiaoVienCuoi.ma_giao_vien.replace(
          'GV',
          '',
        ),
      );

    if (
      !Number.isInteger(
        SoCu,
      ) ||
      SoCu < 1
    ) {
      throw new BadRequestException(
        'Mã giáo viên hiện tại không hợp lệ',
      );
    }

    const SoMoi =
      SoCu + 1;

    return `GV${String(
      SoMoi,
    ).padStart(
      4,
      '0',
    )}`;
  }

  async TaoGiaoVien(DuLieu: DuLieuTaoGiaoVien) {
    // Mã tuần tự có thể bị một yêu cầu khác dùng trước khi transaction commit.
    // Mỗi lần thử dùng transaction mới; unique constraint vẫn bảo vệ dữ liệu.
    for (let LanThu = 0; LanThu < 3; LanThu++) {
      try {
        return await this.TaoGiaoVienMotLan(DuLieu);
      } catch (Loi: unknown) {
        if (!(Loi && typeof Loi === 'object' && 'code' in Loi && Loi.code === 'P2002')) throw Loi;
        if (LanThu === 2) throw new ConflictException('Thông tin giáo viên bị trùng khi tạo đồng thời; vui lòng thử lại');
      }
    }
    throw new ConflictException('Không thể cấp mã giáo viên');
  }

  private async TaoGiaoVienMotLan(
    DuLieu: DuLieuTaoGiaoVien,
  ) {
    if (
      !DuLieu.ho_ten?.trim() ||
      !DuLieu.ngay_sinh ||
      !DuLieu.gioi_tinh?.trim() ||
      !DuLieu.so_dien_thoai?.trim() ||
      !DuLieu.email?.trim() ||
      !DuLieu.dia_chi_lien_he?.trim() ||
      !DuLieu.ngay_vao_truong ||
      !DuLieu.trinh_do_chuyen_mon?.trim()
    ) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ thông tin giáo viên',
      );
    }

    const MatKhauBanDau = this.TaoMatKhauTamThoi(DuLieu.mat_khau_ban_dau);

    const HoTen =
      DuLieu.ho_ten.trim();

    const SoDienThoai =
      DuLieu.so_dien_thoai.trim();

    const Email =
      DuLieu.email
        .trim()
        .toLowerCase();

    this.KiemTraHoTen(
      HoTen,
    );

    this.KiemTraSoDienThoai(
      SoDienThoai,
    );

    this.KiemTraEmail(
      Email,
    );

    const NgaySinh =
      this.ChuyenNgay(
        DuLieu.ngay_sinh,
        'Ngày sinh',
      );

    this.KiemTraNgaySinhGiaoVien(
      NgaySinh,
    );

    const NgayVaoTruong =
      this.ChuyenNgay(
        DuLieu.ngay_vao_truong,
        'Ngày vào trường',
      );

    this.KiemTraNgayVaoTruong(
      NgaySinh,
      NgayVaoTruong,
    );

    const TaiKhoanTonTai =
      await this.Prisma.tai_khoan.findUnique({
        where: {
          so_dien_thoai:
            SoDienThoai,
        },
      });

    if (TaiKhoanTonTai) {
      throw new ConflictException(
        'Số điện thoại đã được sử dụng',
      );
    }

    const MaGiaoVien =
      await this.TaoMaGiaoVien();

    const TenDangNhap =
      MaGiaoVien.toLowerCase();

    const MatKhauBam =
      await argon2.hash(
        MatKhauBanDau,
      );

    const KetQua =
      await this.Prisma.$transaction(
        async (Tx) => {
          const TaiKhoan =
            await Tx.tai_khoan.create({
              data: {
                ten_dang_nhap:
                  TenDangNhap,

                so_dien_thoai:
                  SoDienThoai,

                mat_khau_bam:
                  MatKhauBam,

                vai_tro:
                  'GIAO_VIEN',

                trang_thai:
                  'HOAT_DONG',

                phai_doi_mat_khau:
                  true,
              },
            });

          const GiaoVien =
            await Tx.giao_vien.create({
              data: {
                ma_giao_vien:
                  MaGiaoVien,

                ho_ten:
                  HoTen,

                ngay_sinh:
                  NgaySinh,

                gioi_tinh:
                  DuLieu.gioi_tinh.trim(),

                so_dien_thoai:
                  SoDienThoai,

                email:
                  Email,

                dia_chi_lien_he:
                  DuLieu.dia_chi_lien_he.trim(),

                ngay_vao_truong:
                  NgayVaoTruong,

                trinh_do_chuyen_mon:
                  DuLieu.trinh_do_chuyen_mon.trim(),

                trang_thai:
                  'HOAT_DONG',

                tai_khoan_id:
                  TaiKhoan.id,
              },
            });

          return {
            TaiKhoan,
            GiaoVien,
          };
        },
      );

    return {
      thong_bao:
        'Thêm giáo viên thành công',

      giao_vien: {
        id:
          KetQua.GiaoVien.id,

        ma_giao_vien:
          KetQua.GiaoVien.ma_giao_vien,

        ho_ten:
          KetQua.GiaoVien.ho_ten,

        so_dien_thoai:
          KetQua.GiaoVien.so_dien_thoai,
      },

      tai_khoan: {
        ten_dang_nhap:
          KetQua.TaiKhoan.ten_dang_nhap,

        mat_khau_ban_dau:
          MatKhauBanDau,

        phai_doi_mat_khau:
          true,
      },
    };
  }

  async LayDanhSachGiaoVien(
    TuKhoa?: string,
    TrangThai?: string,
  ) {
    const TuKhoaTimKiem =
      TuKhoa?.trim();

    const TrangThaiTimKiem =
      TrangThai?.trim();

    const DanhSach =
      await this.Prisma.giao_vien.findMany({
        where: {
          ...(TuKhoaTimKiem
            ? {
                OR: [
                  {
                    ma_giao_vien: {
                      contains:
                        TuKhoaTimKiem,
                    },
                  },

                  {
                    ho_ten: {
                      contains:
                        TuKhoaTimKiem,
                    },
                  },

                  {
                    so_dien_thoai: {
                      contains:
                        TuKhoaTimKiem,
                    },
                  },

                  {
                    email: {
                      contains:
                        TuKhoaTimKiem,
                    },
                  },
                ],
              }
            : {}),

          ...(TrangThaiTimKiem
            ? {
                trang_thai:
                  TrangThaiTimKiem,
              }
            : { trang_thai: { not: 'DA_XOA' } }),
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
        DanhSach.length,

      danh_sach:
        DanhSach,
    };
  }

  async CapNhatGiaoVien(
    Id: number,
    DuLieu: DuLieuCapNhatGiaoVien,
  ) {
    const GiaoVien =
      await this.Prisma.giao_vien.findUnique({
        where: {
          id:
            Id,
        },
      });

    if (!GiaoVien) {
      throw new NotFoundException(
        'Không tìm thấy giáo viên',
      );
    }
    if (GiaoVien.trang_thai === 'DA_XOA') throw new ConflictException('Hồ sơ giáo viên đã được xóa khỏi danh sách sử dụng');


    if (
      Object.values(
        DuLieu,
      ).every(
        (GiaTri) =>
          GiaTri === undefined,
      )
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }

    const TruongChuoiBatBuoc = [
      [
        'Họ tên',
        DuLieu.ho_ten,
      ],
      [
        'Giới tính',
        DuLieu.gioi_tinh,
      ],
      [
        'Địa chỉ liên hệ',
        DuLieu.dia_chi_lien_he,
      ],
      [
        'Trình độ chuyên môn',
        DuLieu.trinh_do_chuyen_mon,
      ],
    ] as const;

    for (
      const [
        TenTruong,
        GiaTri,
      ]
      of TruongChuoiBatBuoc
    ) {
      if (
        GiaTri !== undefined &&
        !GiaTri.trim()
      ) {
        throw new BadRequestException(
          `${TenTruong} không được để trống`,
        );
      }
    }

    const HoTen =
      DuLieu.ho_ten !== undefined
        ? DuLieu.ho_ten.trim()
        : GiaoVien.ho_ten;

    this.KiemTraHoTen(
      HoTen,
    );

    let NgaySinh =
      GiaoVien.ngay_sinh;

    if (
      DuLieu.ngay_sinh !== undefined
    ) {
      if (!DuLieu.ngay_sinh.trim()) {
        throw new BadRequestException(
          'Ngày sinh không được để trống',
        );
      }

      NgaySinh =
        this.ChuyenNgay(
          DuLieu.ngay_sinh,
          'Ngày sinh',
        );
    }

    this.KiemTraNgaySinhGiaoVien(
      NgaySinh,
    );

    let NgayVaoTruong =
      GiaoVien.ngay_vao_truong;

    if (
      DuLieu.ngay_vao_truong !==
      undefined
    ) {
      if (
        !DuLieu.ngay_vao_truong.trim()
      ) {
        throw new BadRequestException(
          'Ngày vào trường không được để trống',
        );
      }

      NgayVaoTruong =
        this.ChuyenNgay(
          DuLieu.ngay_vao_truong,
          'Ngày vào trường',
        );
    }

    this.KiemTraNgayVaoTruong(
      NgaySinh,
      NgayVaoTruong,
    );

    const SoDienThoai =
      DuLieu.so_dien_thoai
        ?.trim();

    if (
      DuLieu.so_dien_thoai !==
        undefined &&
      !SoDienThoai
    ) {
      throw new BadRequestException(
        'Số điện thoại không được để trống',
      );
    }

    if (SoDienThoai) {
      this.KiemTraSoDienThoai(
        SoDienThoai,
      );

      if (
        SoDienThoai !==
        GiaoVien.so_dien_thoai
      ) {
        const TaiKhoanTrung =
          await this.Prisma
            .tai_khoan
            .findUnique({
              where: {
                so_dien_thoai:
                  SoDienThoai,
              },
            });

        if (
          TaiKhoanTrung &&
          TaiKhoanTrung.id !==
            GiaoVien.tai_khoan_id
        ) {
          throw new ConflictException(
            'Số điện thoại đã được sử dụng',
          );
        }
      }
    }

    const Email =
      DuLieu.email
        ?.trim()
        .toLowerCase();

    if (
      DuLieu.email !== undefined &&
      !Email
    ) {
      throw new BadRequestException(
        'Email không được để trống',
      );
    }

    if (Email) {
      this.KiemTraEmail(
        Email,
      );
    }

    const KetQua =
      await this.Prisma.$transaction(
        async (Tx) => {
          if (
            SoDienThoai &&
            SoDienThoai !==
              GiaoVien.so_dien_thoai
          ) {
            await Tx.tai_khoan.update({
              where: {
                id:
                  GiaoVien.tai_khoan_id,
              },

              data: {
                so_dien_thoai:
                  SoDienThoai,
              },
            });
          }

          return Tx.giao_vien.update({
            where: {
              id:
                Id,
            },

            data: {
              ...(DuLieu.ho_ten !==
                undefined
                ? {
                    ho_ten:
                      HoTen,
                  }
                : {}),

              ngay_sinh:
                NgaySinh,

              ...(DuLieu.gioi_tinh !==
                undefined
                ? {
                    gioi_tinh:
                      DuLieu.gioi_tinh.trim(),
                  }
                : {}),

              ...(SoDienThoai
                ? {
                    so_dien_thoai:
                      SoDienThoai,
                  }
                : {}),

              ...(Email
                ? {
                    email:
                      Email,
                  }
                : {}),

              ...(DuLieu.dia_chi_lien_he !==
                undefined
                ? {
                    dia_chi_lien_he:
                      DuLieu.dia_chi_lien_he.trim(),
                  }
                : {}),

              ngay_vao_truong:
                NgayVaoTruong,

              ...(DuLieu.trinh_do_chuyen_mon !==
                undefined
                ? {
                    trinh_do_chuyen_mon:
                      DuLieu.trinh_do_chuyen_mon.trim(),
                  }
                : {}),

              ngay_cap_nhat:
                new Date(),
            },
          });
        },
      );

    return {
      thong_bao:
        'Cập nhật giáo viên thành công',

      giao_vien:
        KetQua,
    };
  }

  async CapLaiMatKhauGiaoVien(
    Id: number,
    MatKhauNhap?: string,
  ) {
    const MatKhauMoi = this.TaoMatKhauTamThoi(MatKhauNhap);

    const GiaoVien =
      await this.Prisma.giao_vien.findUnique({
        where: {
          id:
            Id,
        },
      });

    if (!GiaoVien) {
      throw new NotFoundException(
        'Không tìm thấy giáo viên',
      );
    }
    if (GiaoVien.trang_thai === 'DA_XOA') throw new ConflictException('Hồ sơ giáo viên đã được xóa khỏi danh sách sử dụng');


    const MatKhauBam =
      await argon2.hash(
        MatKhauMoi,
      );

    await this.Prisma.tai_khoan.update({
      where: {
        id:
          GiaoVien.tai_khoan_id,
      },

      data: {
        mat_khau_bam:
          MatKhauBam,

        phai_doi_mat_khau:
          true,

        ngay_doi_mat_khau:
          null,
      },
    });

    return {
      thong_bao:
        'Cấp lại mật khẩu giáo viên thành công',

      mat_khau_moi:
        MatKhauMoi,

      phai_doi_mat_khau:
        true,
    };
  }
  async XoaGiaoVien(Id: number) {
    const GiaoVien = await this.Prisma.giao_vien.findUnique({ where: { id: Id } });
    if (!GiaoVien) throw new NotFoundException('Không tìm thấy giáo viên');
    const HomNay = LayNgayNghiepVu();
    await this.Prisma.$transaction([
      this.Prisma.giao_vien.update({ where: { id: Id }, data: { trang_thai: 'DA_XOA' } }),
      this.Prisma.phan_cong_giao_vien.updateMany({
        where: { giao_vien_id: Id, ngay_bat_dau: { lte: HomNay },
          OR: [{ ngay_ket_thuc: null }, { ngay_ket_thuc: { gt: HomNay } }] },
        data: { ngay_ket_thuc: HomNay },
      }),
      this.Prisma.tai_khoan.update({ where: { id: GiaoVien.tai_khoan_id }, data: { trang_thai: 'DA_KHOA' } }),
    ]);
    return { thong_bao: 'Đã xóa giáo viên khỏi danh sách sử dụng và khóa tài khoản; lịch sử được giữ lại' };
  }
}