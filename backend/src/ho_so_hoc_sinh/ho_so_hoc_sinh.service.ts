import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';

import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { LayPhamViGiaoVien } from '../pham_vi_giao_vien';
import { LayNgayNghiepVu } from '../ngay_nghiep_vu';
import { TinhThongKeNghi } from './thong_ke_nghi';

import {
  CapNhatHocSinhDto,
  CapNhatHoSoHocSinhDto,
  CapNhatMoiQuanHeDto,
  CapNhatPhuHuynhDto,
  CapNhatSucKhoeHocSinhDto,
  CapNhatTrangThaiHocSinhDto,
  TaoHocSinhKemPhuHuynhDto,
  ThongTinPhuHuynhDto,
} from './ho_so_hoc_sinh.dto';


export interface NguoiDungJwt {
  sub: number;
  vai_tro: string;
  phai_doi_mat_khau: boolean;
}


@Injectable()
export class HoSoHocSinhService {

  constructor(
    private readonly Prisma: PrismaService,
  ) {}


  // ==================================================
  // CÁC HÀM DÙNG CHUNG
  // ==================================================

  private HomNay(): Date {
    return LayNgayNghiepVu();
  }


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

  private KiemTraNgayHocSinh(NgaySinh: Date, NgayNhapHoc: Date) {
    const HomNay = this.HomNay();
    if (NgaySinh > HomNay || NgayNhapHoc > HomNay || NgayNhapHoc < NgaySinh) {
      throw new BadRequestException('Ngày sinh và ngày nhập học không được trong tương lai; ngày nhập học không được trước ngày sinh');
    }
  }

  private KiemTraHoTen(HoTen: string) {
    if (!HoTen.trim().split(/\s+/).every((Tu) => /^\p{Lu}/u.test(Tu))) {
      throw new BadRequestException('Họ tên phải viết hoa chữ cái đầu của mỗi từ');
    }
  }


  private KiemTraMoiQuanHe(
    MoiQuanHe: string,
  ) {

    const DanhSachHopLe = [
      'CHA',
      'ME',
      'NGUOI_GIAM_HO',
    ];

    if (
      !DanhSachHopLe.includes(
        MoiQuanHe,
      )
    ) {
      throw new BadRequestException(
        'Mối quan hệ không hợp lệ',
      );
    }
  }


  private KiemTraNamSinhPhuHuynh(
    NamSinh: number | null | undefined,
  ) {
    if (
      NamSinh === undefined ||
      NamSinh === null
    ) {
      return;
    }

    const NamHienTai =
      LayNgayNghiepVu().getUTCFullYear();

    const NamLonNhat =
      NamHienTai - 18;

    if (
      !Number.isInteger(
        NamSinh,
      ) ||
      NamSinh < 1900 ||
      NamSinh > NamLonNhat
    ) {
      throw new BadRequestException(
        `Năm sinh phụ huynh phải từ 1900 đến ${NamLonNhat}`,
      );
    }
  }


  private async TaoMaHocSinh() {

    const HocSinhCuoi =
      await this.Prisma.hoc_sinh.findFirst({
        orderBy: {
          id: 'desc',
        },

        select: {
          ma_hoc_sinh: true,
        },
      });


    if (!HocSinhCuoi) {
      return 'HS0001';
    }

    const SoCu = Number(
      HocSinhCuoi.ma_hoc_sinh.replace(
        'HS',
        '',
      ),
    );


    if (
      Number.isNaN(
        SoCu,
      )
    ) {
      throw new BadRequestException(
        'Mã học sinh hiện tại không hợp lệ',
      );
    }


    return `HS${String(
      SoCu + 1,
    ).padStart(
      4,
      '0',
    )}`;
  }


  // ==================================================
  // XÁC ĐỊNH PHẠM VI HỌC SINH ĐƯỢC XEM
  // ==================================================

  private async TaoDieuKienPhamViHocSinh(
    NguoiDung: NguoiDungJwt,
  ): Promise<any> {

    // ADMIN xem tất cả

    if (
      NguoiDung.vai_tro ===
      'ADMIN'
    ) {
      return {};
    }


    // ================================================
    // GIÁO VIÊN
    // Chỉ thấy HS thuộc lớp đang được phân công
    // ================================================

    if (
      NguoiDung.vai_tro ===
      'GIAO_VIEN'
    ) {

      const HomNay = this.HomNay();
      const PhamVi = await LayPhamViGiaoVien(this.Prisma, { tai_khoan_id: NguoiDung.sub });
      const LopHocIds = PhamVi.lop_hoc.map(L => L.id);

      if (
        LopHocIds.length === 0
      ) {
        return {
          id: {
            equals:
              -1,
          },
        };
      }


      return {
        trang_thai: { not: 'DA_XOA' },
        xep_lop: {
          some: {
            lop_hoc_id: {
              in:
                LopHocIds,
            },

            trang_thai:
              'DANG_HOC',

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
      };
    }


    // ================================================
    // PHỤ HUYNH
    // Chỉ thấy HS được liên kết với mình
    // ================================================

    if (
      NguoiDung.vai_tro ===
      'PHU_HUYNH'
    ) {

      const PhuHuynh =
        await this.Prisma.phu_huynh.findUnique({
          where: {
            tai_khoan_id:
              NguoiDung.sub,
          },

          select: {
            id: true,
          },
        });


      if (!PhuHuynh) {
        throw new ForbiddenException(
          'Không tìm thấy hồ sơ phụ huynh',
        );
      }


      return {
        phu_huynh_hoc_sinh: {
          some: {
            phu_huynh_id:
              PhuHuynh.id,
          },
        },
      };
    }


    throw new ForbiddenException(
      'Vai trò không có quyền xem học sinh',
    );
  }


  // ==================================================
  // KIỂM TRA QUYỀN XEM 1 HỌC SINH
  // ==================================================

  private async KiemTraQuyenXemHocSinh(
    NguoiDung: NguoiDungJwt,
    HocSinhId: number,
  ) {

    const PhamVi =
      await this.TaoDieuKienPhamViHocSinh(
        NguoiDung,
      );


    const HocSinh =
      await this.Prisma.hoc_sinh.findFirst({
        where: {
          id:
            HocSinhId,

          ...PhamVi,
        },

        select: {
          id: true,
        },
      });


    if (!HocSinh) {
      throw new ForbiddenException(
        'Bạn không có quyền xem học sinh này',
      );
    }
  }


  // ==================================================
  // 1. ADMIN TẠO HỌC SINH + PHỤ HUYNH
  // CÙNG MỘT LẦN LƯU
  // ==================================================

  async TaoHocSinhKemPhuHuynh(
    DuLieu: TaoHocSinhKemPhuHuynhDto,
  ) {

    const HocSinh =
      DuLieu.hoc_sinh;


    if (
      !HocSinh ||
      !HocSinh.ho_ten?.trim() ||
      !HocSinh.ngay_sinh ||
      !HocSinh.gioi_tinh?.trim() ||
      !HocSinh.dan_toc?.trim() ||
      !HocSinh.quoc_tich?.trim() ||
      !HocSinh.noi_sinh?.trim() ||
      !HocSinh.so_dien_thoai_lien_he?.trim() ||
      !HocSinh.dia_chi_thuong_tru?.trim() ||
      !HocSinh.dia_chi_hien_tai?.trim() ||
      !HocSinh.ngay_nhap_hoc
    ) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ thông tin học sinh',
      );
    }


    if (
      !Array.isArray(
        DuLieu.phu_huynh,
      ) ||
      DuLieu.phu_huynh.length === 0
    ) {
      throw new BadRequestException(
        'Học sinh phải có ít nhất một phụ huynh hoặc người giám hộ',
      );
    }


    const SoDienThoaiLienHe =
      HocSinh
        .so_dien_thoai_lien_he
        .trim();

    const NgaySinh = this.ChuyenNgay(HocSinh.ngay_sinh, 'Ngày sinh');
    const NgayNhapHoc = this.ChuyenNgay(HocSinh.ngay_nhap_hoc, 'Ngày nhập học');
    this.KiemTraNgayHocSinh(NgaySinh, NgayNhapHoc);
    this.KiemTraHoTen(HocSinh.ho_ten);


    this.KiemTraSoDienThoai(
      SoDienThoaiLienHe,
    );


    for (
      const PhuHuynh
      of DuLieu.phu_huynh
    ) {

      this.KiemTraMoiQuanHe(
        PhuHuynh.moi_quan_he,
      );


      // Nếu không chọn PH có sẵn
      // thì phải nhập thông tin PH mới

      if (
        !PhuHuynh.phu_huynh_id
      ) {

        if (
          !PhuHuynh.ho_ten?.trim() ||
          !PhuHuynh.so_dien_thoai?.trim()
        ) {
          throw new BadRequestException(
            'Phụ huynh mới phải có họ tên và số điện thoại',
          );
        }


        this.KiemTraSoDienThoai(
          PhuHuynh
            .so_dien_thoai
            .trim(),
        );

        this.KiemTraHoTen(PhuHuynh.ho_ten!);

        this.KiemTraNamSinhPhuHuynh(
          PhuHuynh.nam_sinh,
        );
      }
    }


    const MaHocSinh =
      await this.TaoMaHocSinh();


    const TaiKhoanMoi: Array<{
      phu_huynh_id: number;
      ho_ten: string;
      ten_dang_nhap: string;
      so_dien_thoai: string;
      mat_khau_ban_dau: string;
    }> = [];


    const KetQua =
      await this.Prisma.$transaction(
        async (Tx) => {

          // ==========================================
          // A. TẠO HỌC SINH
          // ==========================================

          const HocSinhMoi =
            await Tx.hoc_sinh.create({
              data: {
                ma_hoc_sinh:
                  MaHocSinh,

                ho_ten:
                  HocSinh.ho_ten.trim(),

          ngay_sinh: NgaySinh,

                gioi_tinh:
                  HocSinh.gioi_tinh.trim(),

                dan_toc:
                  HocSinh.dan_toc.trim(),

                quoc_tich:
                  HocSinh.quoc_tich.trim(),

                noi_sinh:
                  HocSinh.noi_sinh.trim(),

                so_dien_thoai_lien_he:
                  SoDienThoaiLienHe,

                dia_chi_thuong_tru:
                  HocSinh
                    .dia_chi_thuong_tru
                    .trim(),

                dia_chi_hien_tai:
                  HocSinh
                    .dia_chi_hien_tai
                    .trim(),

          ngay_nhap_hoc: NgayNhapHoc,

                // Dùng default nghiệp vụ của DB
                trang_thai:
                  'DANG_HOC',

                ghi_chu:
                  HocSinh.ghi_chu
                    ?.trim() ||
                  null,
              },
            });


          const PhuHuynhDaGan =
            new Set<number>();


          // ==========================================
          // B. XỬ LÝ TỪNG PHỤ HUYNH
          // ==========================================

          for (
            const ThongTin
            of DuLieu.phu_huynh
          ) {

            let PhuHuynh;


            // ========================================
            // B1. CHỌN PHỤ HUYNH ĐÃ CÓ
            // ========================================

            if (
              ThongTin.phu_huynh_id
            ) {

              PhuHuynh =
                await Tx.phu_huynh.findUnique({
                  where: {
                    id:
                      ThongTin.phu_huynh_id,
                  },
                });


              if (!PhuHuynh) {
                throw new NotFoundException(
                  `Không tìm thấy phụ huynh ID ${ThongTin.phu_huynh_id}`,
                );
              }

            }


            // ========================================
            // B2. TẠO PHỤ HUYNH MỚI
            // ========================================

            else {

              PhuHuynh =
                await Tx.phu_huynh.create({
                  data: {
                    ho_ten:
                      ThongTin.ho_ten!
                        .trim(),

                    nam_sinh:
                      ThongTin.nam_sinh,

                    so_dien_thoai:
                      ThongTin
                        .so_dien_thoai!
                        .trim(),

                    nghe_nghiep:
                      ThongTin.nghe_nghiep
                        ?.trim() ||
                      null,
                  },
                });
            }


            // Không cho cùng một PH
            // được gắn 2 lần vào cùng HS

            if (
              PhuHuynhDaGan.has(
                PhuHuynh.id,
              )
            ) {
              throw new ConflictException(
                'Một phụ huynh không thể được gắn hai lần cho cùng học sinh',
              );
            }


            PhuHuynhDaGan.add(
              PhuHuynh.id,
            );


            // ========================================
            // B3. NẾU ADMIN CHỌN TẠO TÀI KHOẢN PH
            // ========================================

            if (
              ThongTin.tao_tai_khoan &&
              !PhuHuynh.tai_khoan_id
            ) {

              const TaiKhoanTrung =
                await Tx.tai_khoan.findUnique({
                  where: {
                    so_dien_thoai:
                      PhuHuynh.so_dien_thoai,
                  },
                });


              if (TaiKhoanTrung) {
                throw new ConflictException(
                  `Số điện thoại ${PhuHuynh.so_dien_thoai} đã được dùng cho tài khoản khác`,
                );
              }


              const TenDangNhap =
                `ph${String(
                  PhuHuynh.id,
                ).padStart(
                  6,
                  '0',
                )}`;


              const MatKhauBanDau =
                `Ph@${randomBytes(
                  4,
                ).toString(
                  'hex',
                )}`;


              const MatKhauBam =
                await argon2.hash(
                  MatKhauBanDau,
                );


              const TaiKhoan =
                await Tx.tai_khoan.create({
                  data: {
                    ten_dang_nhap:
                      TenDangNhap,

                    so_dien_thoai:
                      PhuHuynh.so_dien_thoai,

                    mat_khau_bam:
                      MatKhauBam,

                    vai_tro:
                      'PHU_HUYNH',

                    trang_thai:
                      'HOAT_DONG',

                    phai_doi_mat_khau:
                      true,
                  },
                });


              await Tx.phu_huynh.update({
                where: {
                  id:
                    PhuHuynh.id,
                },

                data: {
                  tai_khoan_id:
                    TaiKhoan.id,
                },
              });


              TaiKhoanMoi.push({
                so_dien_thoai: PhuHuynh.so_dien_thoai,
                phu_huynh_id:
                  PhuHuynh.id,

                ho_ten:
                  PhuHuynh.ho_ten,

                ten_dang_nhap:
                  TenDangNhap,

                mat_khau_ban_dau:
                  MatKhauBanDau,
              });
            }


            // ========================================
            // C. GẮN PHỤ HUYNH VỚI HỌC SINH
            // ========================================

            await Tx
              .phu_huynh_hoc_sinh
              .create({
                data: {
                  phu_huynh_id:
                    PhuHuynh.id,

                  hoc_sinh_id:
                    HocSinhMoi.id,

                  moi_quan_he:
                    ThongTin.moi_quan_he,
                },
              });
          }


          return HocSinhMoi;
        },
      );


    return {
      thong_bao:
        'Thêm học sinh và phụ huynh thành công',

      hoc_sinh:
        KetQua,

      tai_khoan_phu_huynh_moi:
        TaiKhoanMoi,
    };
  }


  // ==================================================
  // 2. DANH SÁCH HỌC SINH
  // ADMIN: tất cả
  // GV: lớp được phân công
  // PH: con được liên kết
  // ==================================================

  async LayDanhMuc(NguoiDung: NguoiDungJwt) {
    if (!['ADMIN', 'GIAO_VIEN'].includes(NguoiDung.vai_tro)) {
      throw new ForbiddenException('Chỉ Admin và giáo viên được xem danh mục lớp');
    }
    if (NguoiDung.vai_tro === 'GIAO_VIEN') {
      const PhamVi = await LayPhamViGiaoVien(this.Prisma, { tai_khoan_id: NguoiDung.sub });
      return { che_do: PhamVi.che_do, lop_chu_nhiem_id: PhamVi.lop_chu_nhiem_id,
        giao_vien: PhamVi.giao_vien, lop_hoc: PhamVi.lop_hoc };
    }
    const Lop = await this.Prisma.lop_hoc.findMany({
      include: { khoi: true, nam_hoc: true },
      orderBy: [{ nam_hoc_id: 'desc' }, { ten_lop: 'asc' }],
    });
    return { che_do: 'ADMIN', lop_chu_nhiem_id: null, lop_hoc: Lop };
  }

  async KiemTraQuyenSuaHocSinh(NguoiDung: NguoiDungJwt, Id: number) {
    if (!['ADMIN', 'GIAO_VIEN'].includes(NguoiDung.vai_tro)) {
      throw new ForbiddenException('Chỉ Admin và giáo viên được cập nhật hồ sơ');
    }
    if (NguoiDung.vai_tro !== 'ADMIN') await this.KiemTraQuyenXemHocSinh(NguoiDung, Id);
    const HocSinh = await this.Prisma.hoc_sinh.findUnique({ where: { id: Id } });
    if (!HocSinh) throw new NotFoundException('Không tìm thấy học sinh');
    if (HocSinh.trang_thai === 'DA_XOA') throw new ConflictException('Hồ sơ đã được xóa khỏi danh sách sử dụng');
  }

  async KiemTraQuyenSuaPhuHuynh(NguoiDung: NguoiDungJwt, Id: number) {
    if (NguoiDung.vai_tro === 'ADMIN') return;
    if (NguoiDung.vai_tro !== 'GIAO_VIEN') throw new ForbiddenException('Không có quyền cập nhật phụ huynh');
    const PhamVi = await this.TaoDieuKienPhamViHocSinh(NguoiDung);
    const HocSinh = await this.Prisma.hoc_sinh.findFirst({
      where: { AND: [PhamVi, { phu_huynh_hoc_sinh: { some: { phu_huynh_id: Id } } }] },
      select: { id: true },
    });
    if (!HocSinh) throw new ForbiddenException('Phụ huynh không thuộc học sinh trong lớp được phân công');
  }

  async XoaHocSinh(Id: number) {
    const HocSinh = await this.Prisma.hoc_sinh.findUnique({ where: { id: Id } });
    if (!HocSinh) throw new NotFoundException('Không tìm thấy học sinh');
    await this.Prisma.$transaction([
      this.Prisma.hoc_sinh.update({ where: { id: Id }, data: { trang_thai: 'DA_XOA' } }),
      this.Prisma.xep_lop.updateMany({
        where: { hoc_sinh_id: Id, trang_thai: 'DANG_HOC' },
        data: { trang_thai: 'DA_KET_THUC' },
      }),
    ]);
    return { thong_bao: 'Đã xóa học sinh khỏi danh sách sử dụng; lịch sử hồ sơ được lưu giữ' };
  }

  async LayDanhSachHocSinh(
    NguoiDung: NguoiDungJwt, TuKhoa?: string, TrangThai?: string,
    NamHocId?: number, KhoiId?: number, LopHocId?: number,
  ) {
    const PhamVi = await this.TaoDieuKienPhamViHocSinh(NguoiDung);
    const TuKhoaTimKiem = TuKhoa?.trim();
    const LocLop = {
      ...(NamHocId ? { nam_hoc_id: NamHocId } : {}),
      ...(KhoiId ? { khoi_id: KhoiId } : {}),
      ...(LopHocId ? { id: LopHocId } : {}),
    };
    const CoLocLop = Object.keys(LocLop).length > 0;
    const DanhSach = await this.Prisma.hoc_sinh.findMany({
      where: {
        AND: [
          PhamVi,
          { trang_thai: TrangThai?.trim() || { not: 'DA_XOA' } },
          ...(CoLocLop ? [{ xep_lop: { some: { lop_hoc: LocLop, trang_thai: 'DANG_HOC' } } }] : []),
          ...(TuKhoaTimKiem ? [{ OR: [
            { ma_hoc_sinh: { contains: TuKhoaTimKiem } },
            { ho_ten: { contains: TuKhoaTimKiem } },
            { so_dien_thoai_lien_he: { contains: TuKhoaTimKiem } },
          ] }] : []),
        ],
      },
      orderBy: [{ ho_ten: 'asc' }, { id: 'asc' }],
      select: {
        id: true, ma_hoc_sinh: true, ho_ten: true, ngay_sinh: true, gioi_tinh: true,
        dan_toc: true, so_dien_thoai_lien_he: true, trang_thai: true,
        chieu_cao_cm: true, can_nang_kg: true, ngay_do: true,
        xep_lop: {
          where: CoLocLop ? { lop_hoc: LocLop, trang_thai: 'DANG_HOC' } : {},
          orderBy: [{ ngay_bat_dau: 'desc' }, { id: 'desc' }], take: 1,
          include: { lop_hoc: { include: { khoi: true, nam_hoc: true } } },
        },
      },
    });
    return { tong_so: DanhSach.length, danh_sach: DanhSach };
  }

  async LayChiTietHocSinh(
    NguoiDung: NguoiDungJwt,
    id: number,
  ) {

    await this.KiemTraQuyenXemHocSinh(
      NguoiDung,
      id,
    );


    const HocSinh =
      await this.Prisma.hoc_sinh.findUnique({
        where: {
          id,
        },


        select: {
          id: true,

          ma_hoc_sinh:
            true,

          ho_ten:
            true,

          ngay_sinh:
            true,

          gioi_tinh:
            true,

          dan_toc:
            true,

          quoc_tich:
            true,

          noi_sinh:
            true,

          so_dien_thoai_lien_he:
            true,

          dia_chi_thuong_tru:
            true,

          dia_chi_hien_tai:
            true,

          ngay_nhap_hoc:
            true,

          trang_thai:
            true,

          ghi_chu:
            true,

          chieu_cao_cm:
            true,

          can_nang_kg:
            true,

          ngay_do:
            true,

          ngay_tao:
            true,

          ngay_cap_nhat:
            true,


          xep_lop: {
            orderBy: {
              ngay_bat_dau:
                'desc',
            },

            select: {
              id:
                true,

              lop_hoc_id:
                true,
              lop_hoc: { include: { khoi: true, nam_hoc: true } },

              ngay_xep_lop:
                true,

              ngay_bat_dau:
                true,

              ngay_ket_thuc:
                true,

              trang_thai:
                true,

              ghi_chu:
                true,
            },
          },


          phu_huynh_hoc_sinh: {
            select: {
              moi_quan_he:
                true,

              ngay_lien_ket:
                true,

              phu_huynh: {
                select: {
                  id:
                    true,

                  ho_ten:
                    true,

                  nam_sinh:
                    true,

                  so_dien_thoai:
                    true,

                  nghe_nghiep:
                    true,

                  tai_khoan_id:
                    true,
                  ngay_tao: true,
                  ngay_cap_nhat: true,
                },
              },
            },
          },
        },
      });


    if (!HocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }


    const Vang = await this.Prisma.diem_danh.findMany({
      where: {
        xep_lop: { hoc_sinh_id: id },
        trang_thai: { in: ['VANG_CO_PHEP', 'VANG_KHONG_PHEP'] },
      },
      select: { ngay_hoc: true, buoi_hoc: true, trang_thai: true },
      orderBy: [{ ngay_hoc: 'desc' }, { buoi_hoc: 'asc' }],
    });
    const ThongKeNghi = TinhThongKeNghi(Vang);

    // PH chỉ thấy chính thông tin PH của mình
    // không tự động xem hồ sơ PH khác

    if (
      NguoiDung.vai_tro ===
      'PHU_HUYNH'
    ) {

      const PhuHuynh =
        await this.Prisma.phu_huynh.findUnique({
          where: {
            tai_khoan_id:
              NguoiDung.sub,
          },

          select: {
            id: true,
          },
        });


      return {
        ...HocSinh,
        thong_ke_nghi: ThongKeNghi,

        phu_huynh_hoc_sinh:
          HocSinh
            .phu_huynh_hoc_sinh
            .filter(
              (Item) =>
                Item.phu_huynh.id ===
                PhuHuynh?.id,
            ),
      };
    }


    return { ...HocSinh, thong_ke_nghi: ThongKeNghi };
  }


  // ==================================================
  // 4. ADMIN CẬP NHẬT HỒ SƠ HỌC SINH
  // ==================================================


  async CapNhatHoSoHocSinh(NguoiDung: NguoiDungJwt, Id: number, DuLieu: CapNhatHoSoHocSinhDto) {
    await this.KiemTraQuyenSuaHocSinh(NguoiDung, Id);
    const KiemTraTruong = (Data: object, Truong: string[]) => {
      const La = Object.keys(Data).find(Key => !Truong.includes(Key));
      if (La) throw new BadRequestException('Không được cập nhật trường ' + La);
      const GioiHan: Record<string, number> = { ho_ten: 100, dan_toc: 50, quoc_tich: 50, noi_sinh: 255, dia_chi_thuong_tru: 255, dia_chi_hien_tai: 255, nghe_nghiep: 100 };
      for (const [Key, Value] of Object.entries(Data)) {
        if (typeof Value === 'string' && GioiHan[Key] && Array.from(Value).length > GioiHan[Key]) {
          throw new BadRequestException('Thông tin ' + Key + ' quá dài');
        }
      }
    };
    KiemTraTruong(DuLieu, ['hoc_sinh', 'suc_khoe', 'trang_thai', 'phu_huynh', 'nguoi_giam_ho']);
    if (DuLieu.trang_thai !== undefined && NguoiDung.vai_tro !== 'ADMIN') {
      throw new ForbiddenException('Chỉ Admin được thay đổi trạng thái học sinh');
    }
    if (!Object.keys(DuLieu).length) throw new BadRequestException('Không có dữ liệu cần cập nhật');
    if (DuLieu.hoc_sinh) KiemTraTruong(DuLieu.hoc_sinh, ['ho_ten', 'ngay_sinh', 'gioi_tinh', 'dan_toc', 'quoc_tich', 'noi_sinh', 'so_dien_thoai_lien_he', 'dia_chi_thuong_tru', 'dia_chi_hien_tai', 'ngay_nhap_hoc', 'ghi_chu']);
    if (DuLieu.suc_khoe) {
      KiemTraTruong(DuLieu.suc_khoe, ['chieu_cao_cm', 'can_nang_kg', 'ngay_do']);
      if (DuLieu.suc_khoe.chieu_cao_cm > 9999.9 || DuLieu.suc_khoe.can_nang_kg > 999.99 ||
          !DuLieu.suc_khoe.ngay_do || this.ChuyenNgay(DuLieu.suc_khoe.ngay_do, 'Ngày đo') > this.HomNay()) {
        throw new BadRequestException('Sức khỏe hoặc ngày đo không hợp lệ');
      }
    }
    if (DuLieu.trang_thai !== undefined && !['DANG_HOC', 'CHUYEN_TRUONG', 'THOI_HOC'].includes(DuLieu.trang_thai)) {
      throw new BadRequestException('Trạng thái học sinh không hợp lệ');
    }
    if (DuLieu.phu_huynh && (DuLieu.phu_huynh.length > 20 || new Set(DuLieu.phu_huynh.map(P => P.id)).size !== DuLieu.phu_huynh.length)) {
      throw new BadRequestException('Danh sách phụ huynh không hợp lệ hoặc bị trùng');
    }
    for (const PH of DuLieu.phu_huynh ?? []) KiemTraTruong(PH, ['id', 'ho_ten', 'nam_sinh', 'so_dien_thoai', 'nghe_nghiep', 'moi_quan_he']);
    const GiamHo = DuLieu.nguoi_giam_ho;
    if (GiamHo) {
      KiemTraTruong(GiamHo, ['ho_ten', 'nam_sinh', 'so_dien_thoai', 'nghe_nghiep']);
      if (!GiamHo.ho_ten?.trim() || !GiamHo.so_dien_thoai?.trim()) throw new BadRequestException('Người giám hộ cần họ tên và số điện thoại');
      this.KiemTraHoTen(GiamHo.ho_ten);
      this.KiemTraSoDienThoai(GiamHo.so_dien_thoai.trim());
      this.KiemTraNamSinhPhuHuynh(GiamHo.nam_sinh);
    }
    await this.Prisma.$transaction(async Tx => {
      await Tx.$queryRaw`SELECT id FROM hoc_sinh WHERE id = ${Id} FOR UPDATE`;
      const HS = await Tx.hoc_sinh.findUnique({ where: { id: Id } });
      if (!HS || HS.trang_thai === 'DA_XOA') throw new ConflictException('Hồ sơ học sinh không còn sử dụng');
      for (const PH of DuLieu.phu_huynh ?? []) {
        if (!Number.isSafeInteger(PH.id) || PH.id <= 0) throw new BadRequestException('ID phụ huynh không hợp lệ');
        const LK = await Tx.phu_huynh_hoc_sinh.findUnique({ where: { phu_huynh_id_hoc_sinh_id: { phu_huynh_id: PH.id, hoc_sinh_id: Id } } });
        if (!LK) throw new ForbiddenException('Phụ huynh chưa liên kết với học sinh này');
      }
      if (DuLieu.hoc_sinh) await this.CapNhatHocSinh(Id, DuLieu.hoc_sinh, Tx);
      if (DuLieu.suc_khoe) await this.CapNhatSucKhoeHocSinh(Id, DuLieu.suc_khoe, Tx);
      if (DuLieu.trang_thai !== undefined) await this.CapNhatTrangThaiHocSinh(Id, { trang_thai: DuLieu.trang_thai }, Tx);
      for (const PH of DuLieu.phu_huynh ?? []) {
        const { id, moi_quan_he, ...ThongTin } = PH;
        if (Object.keys(ThongTin).length) await this.CapNhatPhuHuynh(id, ThongTin, Tx);
        if (moi_quan_he !== undefined) await this.CapNhatMoiQuanHe(Id, id, { moi_quan_he }, Tx);
      }
      if (GiamHo) {
        const Trung = await Tx.phu_huynh_hoc_sinh.findFirst({ where: { hoc_sinh_id: Id, phu_huynh: { so_dien_thoai: GiamHo.so_dien_thoai.trim() } } });
        if (Trung) throw new ConflictException('Số điện thoại đã có trong hồ sơ phụ huynh hoặc người giám hộ');
        const PH = await Tx.phu_huynh.create({ data: {
          ho_ten: GiamHo.ho_ten.trim(), so_dien_thoai: GiamHo.so_dien_thoai.trim(),
          nam_sinh: GiamHo.nam_sinh, nghe_nghiep: GiamHo.nghe_nghiep?.trim() || null,
        } });
        await Tx.phu_huynh_hoc_sinh.create({ data: { hoc_sinh_id: Id, phu_huynh_id: PH.id, moi_quan_he: 'NGUOI_GIAM_HO' } });
      }
      await Tx.hoc_sinh.update({ where: { id: Id }, data: { ngay_cap_nhat: new Date() } });
    });
    return { thong_bao: 'Đã lưu toàn bộ hồ sơ học sinh' };
  }

  async CapNhatHocSinh(
    id: number,
    DuLieu: CapNhatHocSinhDto,
    Db: Prisma.TransactionClient = this.Prisma,
  ) {

    const HocSinh =
      await Db.hoc_sinh.findUnique({
        where: {
          id,
        },
      });


    if (!HocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }

    const NgaySinh = DuLieu.ngay_sinh !== undefined
      ? this.ChuyenNgay(DuLieu.ngay_sinh, 'Ngày sinh') : HocSinh.ngay_sinh;
    const NgayNhapHoc = DuLieu.ngay_nhap_hoc !== undefined
      ? this.ChuyenNgay(DuLieu.ngay_nhap_hoc, 'Ngày nhập học') : HocSinh.ngay_nhap_hoc;
    this.KiemTraNgayHocSinh(NgaySinh, NgayNhapHoc);
    if (DuLieu.ho_ten !== undefined) this.KiemTraHoTen(DuLieu.ho_ten);


    if (
      Object.values(
        DuLieu,
      ).every(
        (Item) =>
          Item === undefined,
      )
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }


    const CacTruongChuoiBatBuoc = [
      [
        'Họ tên',
        DuLieu.ho_ten,
      ],
      [
        'Giới tính',
        DuLieu.gioi_tinh,
      ],
      [
        'Dân tộc',
        DuLieu.dan_toc,
      ],
      [
        'Quốc tịch',
        DuLieu.quoc_tich,
      ],
      [
        'Nơi sinh',
        DuLieu.noi_sinh,
      ],
      [
        'Địa chỉ thường trú',
        DuLieu.dia_chi_thuong_tru,
      ],
      [
        'Địa chỉ hiện tại',
        DuLieu.dia_chi_hien_tai,
      ],
    ] as const;


    for (
      const [
        TenTruong,
        GiaTri,
      ]
      of CacTruongChuoiBatBuoc
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


    if (
      DuLieu.ngay_sinh !== undefined &&
      !DuLieu.ngay_sinh.trim()
    ) {
      throw new BadRequestException(
        'Ngày sinh không được để trống',
      );
    }


    if (
      DuLieu.ngay_nhap_hoc !== undefined &&
      !DuLieu.ngay_nhap_hoc.trim()
    ) {
      throw new BadRequestException(
        'Ngày nhập học không được để trống',
      );
    }


    const SoDienThoai =
      DuLieu
        .so_dien_thoai_lien_he
        ?.trim();


    if (
      DuLieu.so_dien_thoai_lien_he !== undefined &&
      !SoDienThoai
    ) {
      throw new BadRequestException(
        'Số điện thoại liên hệ không được để trống',
      );
    }


    if (SoDienThoai) {
      this.KiemTraSoDienThoai(
        SoDienThoai,
      );
    }


    const KetQua =
      await Db.hoc_sinh.update({
        where: {
          id,
        },


        data: {

          ...(DuLieu.ho_ten !== undefined
            ? {
                ho_ten:
                  DuLieu.ho_ten.trim(),
              }
            : {}),


        ngay_sinh: NgaySinh,


          ...(DuLieu.gioi_tinh !== undefined
            ? {
                gioi_tinh:
                  DuLieu.gioi_tinh.trim(),
              }
            : {}),


          ...(DuLieu.dan_toc !== undefined
            ? {
                dan_toc:
                  DuLieu.dan_toc.trim(),
              }
            : {}),


          ...(DuLieu.quoc_tich !== undefined
            ? {
                quoc_tich:
                  DuLieu.quoc_tich.trim(),
              }
            : {}),


          ...(DuLieu.noi_sinh !== undefined
            ? {
                noi_sinh:
                  DuLieu.noi_sinh.trim(),
              }
            : {}),


          ...(SoDienThoai
            ? {
                so_dien_thoai_lien_he:
                  SoDienThoai,
              }
            : {}),


          ...(DuLieu.dia_chi_thuong_tru !== undefined
            ? {
                dia_chi_thuong_tru:
                  DuLieu
                    .dia_chi_thuong_tru
                    .trim(),
              }
            : {}),


          ...(DuLieu.dia_chi_hien_tai !== undefined
            ? {
                dia_chi_hien_tai:
                  DuLieu
                    .dia_chi_hien_tai
                    .trim(),
              }
            : {}),


        ngay_nhap_hoc: NgayNhapHoc,
        ngay_cap_nhat: new Date(),


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
        'Cập nhật học sinh thành công',

      hoc_sinh:
        KetQua,
    };
  }


  // ==================================================
  // 5. ADMIN CẬP NHẬT TRẠNG THÁI HS
  // ==================================================

  async CapNhatTrangThaiHocSinh(
    id: number,
    DuLieu: CapNhatTrangThaiHocSinhDto,
    Db: Prisma.TransactionClient = this.Prisma,
  ) {

    if (
      !DuLieu.trang_thai?.trim() || DuLieu.trang_thai.trim() === 'DA_XOA'
    ) {
      throw new BadRequestException(
        'Trạng thái không được để trống',
      );
    }


    const HocSinh =
      await Db.hoc_sinh.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });


    if (!HocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }


    const KetQua =
      await Db.hoc_sinh.update({
        where: {
          id,
        },

        data: {
          trang_thai:
            DuLieu.trang_thai.trim(),
        },
      });


    return {
      thong_bao:
        'Cập nhật trạng thái học sinh thành công',

      hoc_sinh:
        KetQua,
    };
  }


  // ==================================================
  // 6. ADMIN CẬP NHẬT SỨC KHỎE HIỆN TẠI
  // ==================================================

  async CapNhatSucKhoeHocSinh(
    id: number,
    DuLieu: CapNhatSucKhoeHocSinhDto,
    Db: Prisma.TransactionClient = this.Prisma,
  ) {

    const HocSinh =
      await Db.hoc_sinh.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });


    if (!HocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }


    if (
      !Number.isFinite(
        DuLieu.chieu_cao_cm,
      ) ||
      !Number.isFinite(
        DuLieu.can_nang_kg,
      ) ||
      DuLieu.chieu_cao_cm <= 0 ||
      DuLieu.can_nang_kg <= 0
    ) {
      throw new BadRequestException(
        'Chiều cao và cân nặng không hợp lệ',
      );
    }


    const KetQua =
      await Db.hoc_sinh.update({
        where: {
          id,
        },

        data: {
          chieu_cao_cm:
            DuLieu.chieu_cao_cm,

          can_nang_kg:
            DuLieu.can_nang_kg,

          ngay_do:
            this.ChuyenNgay(
              DuLieu.ngay_do,
              'Ngày đo',
            ),
        },
      });


    return {
      thong_bao:
        'Cập nhật sức khỏe thành công',

      hoc_sinh:
        KetQua,
    };
  }


  // ==================================================
  // 7. ADMIN TÌM / XEM DANH SÁCH PHỤ HUYNH
  // Dùng khi nhập em ruột để chọn PH đã tồn tại
  // ==================================================

  async LayDanhSachPhuHuynh(
    TuKhoa?: string,
  ) {

    const Tim =
      TuKhoa?.trim();


    const DanhSach =
      await this.Prisma.phu_huynh.findMany({
        where: {

          ...(Tim
            ? {
                OR: [
                  {
                    ho_ten: {
                      contains:
                        Tim,
                    },
                  },

                  {
                    so_dien_thoai: {
                      contains:
                        Tim,
                    },
                  },

                  {
                    nghe_nghiep: {
                      contains:
                        Tim,
                    },
                  },
                ],
              }
            : {}),
        },


        orderBy: {
          ho_ten:
            'asc',
        },


        select: {
          id:
            true,

          ho_ten:
            true,

          nam_sinh:
            true,

          so_dien_thoai:
            true,

          nghe_nghiep:
            true,

          tai_khoan_id:
            true,
        },
      });


    return {
      tong_so:
        DanhSach.length,

      danh_sach:
        DanhSach,
    };
  }


  // ==================================================
  // 8. ADMIN XEM CHI TIẾT PHỤ HUYNH
  // ==================================================

  async LayChiTietPhuHuynh(
    id: number,
  ) {

    const PhuHuynh =
      await this.Prisma.phu_huynh.findUnique({
        where: {
          id,
        },


        select: {
          id:
            true,

          ho_ten:
            true,

          nam_sinh:
            true,

          so_dien_thoai:
            true,

          nghe_nghiep:
            true,

          tai_khoan_id:
            true,

          ngay_tao:
            true,

          ngay_cap_nhat:
            true,


          phu_huynh_hoc_sinh: {
            select: {
              moi_quan_he:
                true,

              ngay_lien_ket:
                true,

              hoc_sinh: {
                select: {
                  id:
                    true,

                  ma_hoc_sinh:
                    true,

                  ho_ten:
                    true,

                  ngay_sinh:
                    true,

                  trang_thai:
                    true,
                },
              },
            },
          },
        },
      });


    if (!PhuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy phụ huynh',
      );
    }


    return PhuHuynh;
  }


  // ==================================================
  // 9. PHỤ HUYNH XEM HỒ SƠ CỦA CHÍNH MÌNH
  // ==================================================

  async LayPhuHuynhCuaToi(
    taiKhoanId: number,
  ) {

    const PhuHuynh =
      await this.Prisma.phu_huynh.findUnique({
        where: {
          tai_khoan_id:
            taiKhoanId,
        },


        select: {
          id:
            true,

          ho_ten:
            true,

          nam_sinh:
            true,

          so_dien_thoai:
            true,

          nghe_nghiep:
            true,


          phu_huynh_hoc_sinh: {
            select: {
              moi_quan_he:
                true,

              hoc_sinh: {
                select: {
                  id:
                    true,

                  ma_hoc_sinh:
                    true,

                  ho_ten:
                    true,

                  ngay_sinh:
                    true,

                  trang_thai:
                    true,
                },
              },
            },
          },
        },
      });


    if (!PhuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy hồ sơ phụ huynh',
      );
    }


    return PhuHuynh;
  }


  // ==================================================
  // 10. ADMIN CẬP NHẬT PHỤ HUYNH
  // SĐT phải đồng bộ tai_khoan nếu đã có tài khoản
  // ==================================================

  async CapNhatPhuHuynh(
    id: number,
    DuLieu: CapNhatPhuHuynhDto,
    Db: Prisma.TransactionClient = this.Prisma,
  ) {

    const PhuHuynh =
      await Db.phu_huynh.findUnique({
        where: {
          id,
        },
      });


    if (!PhuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy phụ huynh',
      );
    }


    if (
      Object.values(
        DuLieu,
      ).every(
        (Item) =>
          Item === undefined,
      )
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }


    if (
      DuLieu.ho_ten !== undefined &&
      !DuLieu.ho_ten.trim()
    ) {
      throw new BadRequestException(
        'Họ tên phụ huynh không được để trống',
      );
    }

    if (DuLieu.ho_ten !== undefined) this.KiemTraHoTen(DuLieu.ho_ten);


    this.KiemTraNamSinhPhuHuynh(
      DuLieu.nam_sinh,
    );


    const SoDienThoai =
      DuLieu.so_dien_thoai
        ?.trim();


    if (
      DuLieu.so_dien_thoai !== undefined &&
      !SoDienThoai
    ) {
      throw new BadRequestException(
        'Số điện thoại phụ huynh không được để trống',
      );
    }


    if (SoDienThoai) {

      this.KiemTraSoDienThoai(
        SoDienThoai,
      );


      if (
        PhuHuynh.tai_khoan_id &&
        SoDienThoai !==
          PhuHuynh.so_dien_thoai
      ) {

        const TaiKhoanTrung =
          await Db
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
            PhuHuynh.tai_khoan_id
        ) {
          throw new ConflictException(
            'Số điện thoại đã được tài khoản khác sử dụng',
          );
        }
      }
    }


    const Ghi = async (Tx: Prisma.TransactionClient) => {

          // Đồng bộ SĐT tài khoản
          if (
            PhuHuynh.tai_khoan_id &&
            SoDienThoai
          ) {

            await Tx.tai_khoan.update({
              where: {
                id:
                  PhuHuynh.tai_khoan_id,
              },

              data: {
                so_dien_thoai:
                  SoDienThoai,
              },
            });
          }


      return Tx.phu_huynh.update({
            where: {
              id,
            },


        data: {
          ngay_cap_nhat: new Date(),

              ...(DuLieu.ho_ten !== undefined
                ? {
                    ho_ten:
                      DuLieu.ho_ten.trim(),
                  }
                : {}),


              ...(DuLieu.nam_sinh !== undefined
                ? {
                    nam_sinh:
                      DuLieu.nam_sinh,
                  }
                : {}),


              ...(SoDienThoai
                ? {
                    so_dien_thoai:
                      SoDienThoai,
                  }
                : {}),


              ...(DuLieu.nghe_nghiep !== undefined
                ? {
                    nghe_nghiep:
                      DuLieu.nghe_nghiep
                        ?.trim() ||
                      null,
                  }
                : {}),
            },
          });
        };
    const KetQua = Db === this.Prisma ? await this.Prisma.$transaction(Ghi) : await Ghi(Db);


    return {
      thong_bao:
        'Cập nhật phụ huynh thành công',

      phu_huynh:
        KetQua,
    };
  }


  // ==================================================
  // 11. ADMIN TẠO TÀI KHOẢN CHO PHỤ HUYNH CÓ SẴN
  // ==================================================

  async TaoTaiKhoanPhuHuynh(
    id: number,
  ) {

    const PhuHuynh =
      await this.Prisma.phu_huynh.findUnique({
        where: {
          id,
        },
      });


    if (!PhuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy phụ huynh',
      );
    }


    if (
      PhuHuynh.tai_khoan_id
    ) {
      throw new ConflictException(
        'Phụ huynh đã có tài khoản',
      );
    }


    const TaiKhoanTrung =
      await this.Prisma.tai_khoan.findUnique({
        where: {
          so_dien_thoai:
            PhuHuynh.so_dien_thoai,
        },
      });


    if (TaiKhoanTrung) {
      throw new ConflictException(
        'Số điện thoại đã được tài khoản khác sử dụng',
      );
    }


    const TenDangNhap =
      `ph${String(
        id,
      ).padStart(
        6,
        '0',
      )}`;


    const MatKhauBanDau =
      `Ph@${randomBytes(
        4,
      ).toString(
        'hex',
      )}`;


    const MatKhauBam =
      await argon2.hash(
        MatKhauBanDau,
      );


    const TaiKhoan =
      await this.Prisma.$transaction(
        async (Tx) => {

          const TaiKhoanMoi =
            await Tx.tai_khoan.create({
              data: {
                ten_dang_nhap:
                  TenDangNhap,

                so_dien_thoai:
                  PhuHuynh.so_dien_thoai,

                mat_khau_bam:
                  MatKhauBam,

                vai_tro:
                  'PHU_HUYNH',

                trang_thai:
                  'HOAT_DONG',

                phai_doi_mat_khau:
                  true,
              },
            });


          await Tx.phu_huynh.update({
            where: {
              id,
            },

            data: {
              tai_khoan_id:
                TaiKhoanMoi.id,
            },
          });


          return TaiKhoanMoi;
        },
      );


    return {
      thong_bao:
        'Tạo tài khoản phụ huynh thành công',

      ten_dang_nhap:
        TaiKhoan.ten_dang_nhap,

      so_dien_thoai:
        TaiKhoan.so_dien_thoai,

      mat_khau_ban_dau:
        MatKhauBanDau,

      phai_doi_mat_khau:
        true,
    };
  }


  // ==================================================
  // 12. ADMIN CẤP LẠI MẬT KHẨU PHỤ HUYNH
  // ==================================================

  async CapLaiMatKhauPhuHuynh(
    id: number,
  ) {

    const PhuHuynh =
      await this.Prisma.phu_huynh.findUnique({
        where: {
          id,
        },
      });


    if (!PhuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy phụ huynh',
      );
    }


    if (
      !PhuHuynh.tai_khoan_id
    ) {
      throw new BadRequestException(
        'Phụ huynh chưa có tài khoản',
      );
    }


    const MatKhauMoi =
      `Ph@${randomBytes(
        4,
      ).toString(
        'hex',
      )}`;


    const MatKhauBam =
      await argon2.hash(
        MatKhauMoi,
      );


    await this.Prisma.tai_khoan.update({
      where: {
        id:
          PhuHuynh.tai_khoan_id,
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
        'Cấp lại mật khẩu thành công',

      mat_khau_moi:
        MatKhauMoi,

      phai_doi_mat_khau:
        true,
    };
  }


  // ==================================================
  // 13. ADMIN THÊM PHỤ HUYNH CHO HS ĐÃ CÓ
  // Có thể chọn PH cũ hoặc tạo PH mới
  // ==================================================

  async ThemPhuHuynhVaoHocSinh(
    HocSinhId: number,
    DuLieu: ThongTinPhuHuynhDto,
  ) {

    this.KiemTraMoiQuanHe(
      DuLieu.moi_quan_he,
    );


    const HocSinh =
      await this.Prisma.hoc_sinh.findUnique({
        where: {
          id:
            HocSinhId,
        },

        select: {
          id: true,
        },
      });


    if (!HocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }


    let TaiKhoanMoi:
      | {
          ten_dang_nhap: string;
          mat_khau_ban_dau: string;
        }
      | null =
      null;


    const KetQua =
      await this.Prisma.$transaction(
        async (Tx) => {

          let PhuHuynh;


          if (
            DuLieu.phu_huynh_id
          ) {

            PhuHuynh =
              await Tx.phu_huynh.findUnique({
                where: {
                  id:
                    DuLieu.phu_huynh_id,
                },
              });


            if (!PhuHuynh) {
              throw new NotFoundException(
                'Không tìm thấy phụ huynh',
              );
            }

          } else {

            if (
              !DuLieu.ho_ten?.trim() ||
              !DuLieu.so_dien_thoai?.trim()
            ) {
              throw new BadRequestException(
                'Phụ huynh mới phải có họ tên và số điện thoại',
              );
            }


        const SoDienThoai =
              DuLieu
                .so_dien_thoai
            .trim();

        this.KiemTraHoTen(DuLieu.ho_ten);


            this.KiemTraSoDienThoai(
              SoDienThoai,
            );


            this.KiemTraNamSinhPhuHuynh(
              DuLieu.nam_sinh,
            );


            PhuHuynh =
              await Tx.phu_huynh.create({
                data: {
                  ho_ten:
                    DuLieu.ho_ten.trim(),

                  nam_sinh:
                    DuLieu.nam_sinh,

                  so_dien_thoai:
                    SoDienThoai,

                  nghe_nghiep:
                    DuLieu.nghe_nghiep
                      ?.trim() ||
                    null,
                },
              });
          }


          if (
            DuLieu.tao_tai_khoan &&
            !PhuHuynh.tai_khoan_id
          ) {
            const TaiKhoanTrung =
              await Tx.tai_khoan.findUnique({
                where: {
                  so_dien_thoai:
                    PhuHuynh.so_dien_thoai,
                },
              });


            if (TaiKhoanTrung) {
              throw new ConflictException(
                'Số điện thoại đã được tài khoản khác sử dụng',
              );
            }


            const TenDangNhap =
              `ph${String(
                PhuHuynh.id,
              ).padStart(
                6,
                '0',
              )}`;


            const MatKhauBanDau =
              `Ph@${randomBytes(
                4,
              ).toString(
                'hex',
              )}`;


            const MatKhauBam =
              await argon2.hash(
                MatKhauBanDau,
              );


            const TaiKhoan =
              await Tx.tai_khoan.create({
                data: {
                  ten_dang_nhap:
                    TenDangNhap,

                  so_dien_thoai:
                    PhuHuynh.so_dien_thoai,

                  mat_khau_bam:
                    MatKhauBam,

                  vai_tro:
                    'PHU_HUYNH',

                  trang_thai:
                    'HOAT_DONG',

                  phai_doi_mat_khau:
                    true,
                },
              });


            await Tx.phu_huynh.update({
              where: {
                id:
                  PhuHuynh.id,
              },

              data: {
                tai_khoan_id:
                  TaiKhoan.id,
              },
            });


            TaiKhoanMoi = {
              ten_dang_nhap:
                TenDangNhap,

              mat_khau_ban_dau:
                MatKhauBanDau,
            };
          }


          const LienKetCu =
            await Tx
              .phu_huynh_hoc_sinh
              .findFirst({
                where: {
                  phu_huynh_id:
                    PhuHuynh.id,

                  hoc_sinh_id:
                    HocSinhId,
                },
              });


          if (LienKetCu) {
            throw new ConflictException(
              'Phụ huynh đã được liên kết với học sinh này',
            );
          }


          return Tx
            .phu_huynh_hoc_sinh
            .create({
              data: {
                phu_huynh_id:
                  PhuHuynh.id,

                hoc_sinh_id:
                  HocSinhId,

                moi_quan_he:
                  DuLieu.moi_quan_he,
              },
            });
        },
      );


    return {
      thong_bao:
        'Thêm phụ huynh cho học sinh thành công',

      lien_ket:
        KetQua,

      tai_khoan_phu_huynh_moi:
        TaiKhoanMoi,
    };
  }


  // ==================================================
  // 14. ADMIN SỬA CHA / MẸ / NGƯỜI GIÁM HỘ
  // ==================================================

  async CapNhatMoiQuanHe(
    HocSinhId: number,
    PhuHuynhId: number,
    DuLieu: CapNhatMoiQuanHeDto,
    Db: Prisma.TransactionClient = this.Prisma,
  ) {

    this.KiemTraMoiQuanHe(
      DuLieu.moi_quan_he,
    );


    const LienKet =
      await Db
        .phu_huynh_hoc_sinh
        .findFirst({
          where: {
            hoc_sinh_id:
              HocSinhId,

            phu_huynh_id:
              PhuHuynhId,
          },
        });


    if (!LienKet) {
      throw new NotFoundException(
        'Không tìm thấy liên kết phụ huynh - học sinh',
      );
    }


    const KetQua =
      await Db
        .phu_huynh_hoc_sinh
        .update({
          where: {
            id:
              LienKet.id,
          },

          data: {
            moi_quan_he:
              DuLieu.moi_quan_he,
          },
        });


    return {
      thong_bao:
        'Cập nhật mối quan hệ thành công',

      lien_ket:
        KetQua,
    };
  }


  // ==================================================
  // 15. ADMIN HỦY LIÊN KẾT NHẬP SAI
  // Không cho HS mất hết PH
  // ==================================================

  async HuyLienKetPhuHuynhHocSinh(
    HocSinhId: number,
    PhuHuynhId: number,
  ) {

    const DanhSachLienKet =
      await this.Prisma
        .phu_huynh_hoc_sinh
        .findMany({
          where: {
            hoc_sinh_id:
              HocSinhId,
          },

          select: {
            id:
              true,

            phu_huynh_id:
              true,
          },
        });


    const LienKet =
      DanhSachLienKet.find(
        (Item) =>
          Item.phu_huynh_id ===
          PhuHuynhId,
      );


    if (!LienKet) {
      throw new NotFoundException(
        'Không tìm thấy liên kết',
      );
    }


    if (
      DanhSachLienKet.length <= 1
    ) {
      throw new BadRequestException(
        'Học sinh phải còn ít nhất một phụ huynh hoặc người giám hộ',
      );
    }


    await this.Prisma
      .phu_huynh_hoc_sinh
      .delete({
        where: {
          id:
            LienKet.id,
        },
      });


    return {
      thong_bao:
        'Hủy liên kết thành công',
    };
  }
}
