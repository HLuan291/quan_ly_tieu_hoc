import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma.service';

import {
  CapNhatHocSinhDto,
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
    private readonly prisma: PrismaService,
  ) {}


  // ==================================================
  // CÁC HÀM DÙNG CHUNG
  // ==================================================

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


  private chuyenNgay(
    giaTri: string,
    tenTruong: string,
  ): Date {

    const ngay = new Date(
      `${giaTri}T00:00:00.000Z`,
    );

    if (
      Number.isNaN(
        ngay.getTime(),
      )
    ) {
      throw new BadRequestException(
        `${tenTruong} không hợp lệ`,
      );
    }

    return ngay;
  }


  private kiemTraSoDienThoai(
    soDienThoai: string,
  ) {

    if (
      !/^\d{10,15}$/.test(
        soDienThoai,
      )
    ) {
      throw new BadRequestException(
        'Số điện thoại phải gồm từ 10 đến 15 chữ số',
      );
    }
  }


  private kiemTraMoiQuanHe(
    moiQuanHe: string,
  ) {

    const danhSachHopLe = [
      'CHA',
      'ME',
      'NGUOI_GIAM_HO',
    ];

    if (
      !danhSachHopLe.includes(
        moiQuanHe,
      )
    ) {
      throw new BadRequestException(
        'Mối quan hệ không hợp lệ',
      );
    }
  }


  private kiemTraNamSinhPhuHuynh(
    namSinh: number | null | undefined,
  ) {
    if (
      namSinh === undefined ||
      namSinh === null
    ) {
      return;
    }

    if (
      !Number.isInteger(
        namSinh,
      ) ||
      namSinh < 1900 ||
      namSinh > 2100
    ) {
      throw new BadRequestException(
        'Năm sinh phụ huynh phải là số nguyên từ 1900 đến 2100',
      );
    }
  }


  private async taoMaHocSinh() {

    const hocSinhCuoi =
      await this.prisma.hoc_sinh.findFirst({
        orderBy: {
          id: 'desc',
        },

        select: {
          ma_hoc_sinh: true,
        },
      });


    if (!hocSinhCuoi) {
      return 'HS0001';
    }

    const soCu = Number(
      hocSinhCuoi.ma_hoc_sinh.replace(
        'HS',
        '',
      ),
    );


    if (
      Number.isNaN(
        soCu,
      )
    ) {
      throw new BadRequestException(
        'Mã học sinh hiện tại không hợp lệ',
      );
    }


    return `HS${String(
      soCu + 1,
    ).padStart(
      4,
      '0',
    )}`;
  }


  // ==================================================
  // XÁC ĐỊNH PHẠM VI HỌC SINH ĐƯỢC XEM
  // ==================================================

  private async taoDieuKienPhamViHocSinh(
    nguoiDung: NguoiDungJwt,
  ): Promise<any> {

    // ADMIN xem tất cả

    if (
      nguoiDung.vai_tro ===
      'ADMIN'
    ) {
      return {};
    }


    // ================================================
    // GIÁO VIÊN
    // Chỉ thấy HS thuộc lớp đang được phân công
    // ================================================

    if (
      nguoiDung.vai_tro ===
      'GIAO_VIEN'
    ) {

      const giaoVien =
        await this.prisma.giao_vien.findUnique({
          where: {
            tai_khoan_id:
              nguoiDung.sub,
          },

          select: {
            id: true,
          },
        });


      if (!giaoVien) {
        throw new ForbiddenException(
          'Không tìm thấy hồ sơ giáo viên',
        );
      }


      const homNay =
        this.homNay();


      const phanCong =
        await this.prisma
          .phan_cong_giao_vien
          .findMany({
            where: {
              giao_vien_id:
                giaoVien.id,

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

            select: {
              lop_hoc_id:
                true,
            },
          });


      const lopHocIds = [
        ...new Set(
          phanCong.map(
            (item) =>
              item.lop_hoc_id,
          ),
        ),
      ];


      if (
        lopHocIds.length === 0
      ) {
        return {
          id: {
            equals:
              -1,
          },
        };
      }


      return {
        xep_lop: {
          some: {
            lop_hoc_id: {
              in:
                lopHocIds,
            },

            trang_thai:
              'DANG_HOC',

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
      };
    }


    // ================================================
    // PHỤ HUYNH
    // Chỉ thấy HS được liên kết với mình
    // ================================================

    if (
      nguoiDung.vai_tro ===
      'PHU_HUYNH'
    ) {

      const phuHuynh =
        await this.prisma.phu_huynh.findUnique({
          where: {
            tai_khoan_id:
              nguoiDung.sub,
          },

          select: {
            id: true,
          },
        });


      if (!phuHuynh) {
        throw new ForbiddenException(
          'Không tìm thấy hồ sơ phụ huynh',
        );
      }


      return {
        phu_huynh_hoc_sinh: {
          some: {
            phu_huynh_id:
              phuHuynh.id,
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

  private async kiemTraQuyenXemHocSinh(
    nguoiDung: NguoiDungJwt,
    hocSinhId: number,
  ) {

    const phamVi =
      await this.taoDieuKienPhamViHocSinh(
        nguoiDung,
      );


    const hocSinh =
      await this.prisma.hoc_sinh.findFirst({
        where: {
          id:
            hocSinhId,

          ...phamVi,
        },

        select: {
          id: true,
        },
      });


    if (!hocSinh) {
      throw new ForbiddenException(
        'Bạn không có quyền xem học sinh này',
      );
    }
  }


  // ==================================================
  // 1. ADMIN TẠO HỌC SINH + PHỤ HUYNH
  // CÙNG MỘT LẦN LƯU
  // ==================================================

  async taoHocSinhKemPhuHuynh(
    duLieu: TaoHocSinhKemPhuHuynhDto,
  ) {

    const hocSinh =
      duLieu.hoc_sinh;


    if (
      !hocSinh ||
      !hocSinh.ho_ten?.trim() ||
      !hocSinh.ngay_sinh ||
      !hocSinh.gioi_tinh?.trim() ||
      !hocSinh.dan_toc?.trim() ||
      !hocSinh.quoc_tich?.trim() ||
      !hocSinh.noi_sinh?.trim() ||
      !hocSinh.so_dien_thoai_lien_he?.trim() ||
      !hocSinh.dia_chi_thuong_tru?.trim() ||
      !hocSinh.dia_chi_hien_tai?.trim() ||
      !hocSinh.ngay_nhap_hoc
    ) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ thông tin học sinh',
      );
    }


    if (
      !Array.isArray(
        duLieu.phu_huynh,
      ) ||
      duLieu.phu_huynh.length === 0
    ) {
      throw new BadRequestException(
        'Học sinh phải có ít nhất một phụ huynh hoặc người giám hộ',
      );
    }


    const soDienThoaiLienHe =
      hocSinh
        .so_dien_thoai_lien_he
        .trim();


    this.kiemTraSoDienThoai(
      soDienThoaiLienHe,
    );


    for (
      const phuHuynh
      of duLieu.phu_huynh
    ) {

      this.kiemTraMoiQuanHe(
        phuHuynh.moi_quan_he,
      );


      // Nếu không chọn PH có sẵn
      // thì phải nhập thông tin PH mới

      if (
        !phuHuynh.phu_huynh_id
      ) {

        if (
          !phuHuynh.ho_ten?.trim() ||
          !phuHuynh.so_dien_thoai?.trim()
        ) {
          throw new BadRequestException(
            'Phụ huynh mới phải có họ tên và số điện thoại',
          );
        }


        this.kiemTraSoDienThoai(
          phuHuynh
            .so_dien_thoai
            .trim(),
        );

        this.kiemTraNamSinhPhuHuynh(
          phuHuynh.nam_sinh,
        );
      }
    }


    const maHocSinh =
      await this.taoMaHocSinh();


    const taiKhoanMoi: Array<{
      phu_huynh_id: number;
      ho_ten: string;
      ten_dang_nhap: string;
      mat_khau_ban_dau: string;
    }> = [];


    const ketQua =
      await this.prisma.$transaction(
        async (tx) => {

          // ==========================================
          // A. TẠO HỌC SINH
          // ==========================================

          const hocSinhMoi =
            await tx.hoc_sinh.create({
              data: {
                ma_hoc_sinh:
                  maHocSinh,

                ho_ten:
                  hocSinh.ho_ten.trim(),

                ngay_sinh:
                  this.chuyenNgay(
                    hocSinh.ngay_sinh,
                    'Ngày sinh',
                  ),

                gioi_tinh:
                  hocSinh.gioi_tinh.trim(),

                dan_toc:
                  hocSinh.dan_toc.trim(),

                quoc_tich:
                  hocSinh.quoc_tich.trim(),

                noi_sinh:
                  hocSinh.noi_sinh.trim(),

                so_dien_thoai_lien_he:
                  soDienThoaiLienHe,

                dia_chi_thuong_tru:
                  hocSinh
                    .dia_chi_thuong_tru
                    .trim(),

                dia_chi_hien_tai:
                  hocSinh
                    .dia_chi_hien_tai
                    .trim(),

                ngay_nhap_hoc:
                  this.chuyenNgay(
                    hocSinh.ngay_nhap_hoc,
                    'Ngày nhập học',
                  ),

                // Dùng default nghiệp vụ của DB
                trang_thai:
                  'DANG_HOC',

                ghi_chu:
                  hocSinh.ghi_chu
                    ?.trim() ||
                  null,
              },
            });


          const phuHuynhDaGan =
            new Set<number>();


          // ==========================================
          // B. XỬ LÝ TỪNG PHỤ HUYNH
          // ==========================================

          for (
            const thongTin
            of duLieu.phu_huynh
          ) {

            let phuHuynh;


            // ========================================
            // B1. CHỌN PHỤ HUYNH ĐÃ CÓ
            // ========================================

            if (
              thongTin.phu_huynh_id
            ) {

              phuHuynh =
                await tx.phu_huynh.findUnique({
                  where: {
                    id:
                      thongTin.phu_huynh_id,
                  },
                });


              if (!phuHuynh) {
                throw new NotFoundException(
                  `Không tìm thấy phụ huynh ID ${thongTin.phu_huynh_id}`,
                );
              }

            }


            // ========================================
            // B2. TẠO PHỤ HUYNH MỚI
            // ========================================

            else {

              phuHuynh =
                await tx.phu_huynh.create({
                  data: {
                    ho_ten:
                      thongTin.ho_ten!
                        .trim(),

                    nam_sinh:
                      thongTin.nam_sinh,

                    so_dien_thoai:
                      thongTin
                        .so_dien_thoai!
                        .trim(),

                    nghe_nghiep:
                      thongTin.nghe_nghiep
                        ?.trim() ||
                      null,
                  },
                });
            }


            // Không cho cùng một PH
            // được gắn 2 lần vào cùng HS

            if (
              phuHuynhDaGan.has(
                phuHuynh.id,
              )
            ) {
              throw new ConflictException(
                'Một phụ huynh không thể được gắn hai lần cho cùng học sinh',
              );
            }


            phuHuynhDaGan.add(
              phuHuynh.id,
            );


            // ========================================
            // B3. NẾU ADMIN CHỌN TẠO TÀI KHOẢN PH
            // ========================================

            if (
              thongTin.tao_tai_khoan &&
              !phuHuynh.tai_khoan_id
            ) {

              const taiKhoanTrung =
                await tx.tai_khoan.findUnique({
                  where: {
                    so_dien_thoai:
                      phuHuynh.so_dien_thoai,
                  },
                });


              if (taiKhoanTrung) {
                throw new ConflictException(
                  `Số điện thoại ${phuHuynh.so_dien_thoai} đã được dùng cho tài khoản khác`,
                );
              }


              const tenDangNhap =
                `ph${String(
                  phuHuynh.id,
                ).padStart(
                  6,
                  '0',
                )}`;


              const matKhauBanDau =
                `Ph@${randomBytes(
                  4,
                ).toString(
                  'hex',
                )}`;


              const matKhauBam =
                await argon2.hash(
                  matKhauBanDau,
                );


              const taiKhoan =
                await tx.tai_khoan.create({
                  data: {
                    ten_dang_nhap:
                      tenDangNhap,

                    so_dien_thoai:
                      phuHuynh.so_dien_thoai,

                    mat_khau_bam:
                      matKhauBam,

                    vai_tro:
                      'PHU_HUYNH',

                    trang_thai:
                      'HOAT_DONG',

                    phai_doi_mat_khau:
                      true,
                  },
                });


              await tx.phu_huynh.update({
                where: {
                  id:
                    phuHuynh.id,
                },

                data: {
                  tai_khoan_id:
                    taiKhoan.id,
                },
              });


              taiKhoanMoi.push({
                phu_huynh_id:
                  phuHuynh.id,

                ho_ten:
                  phuHuynh.ho_ten,

                ten_dang_nhap:
                  tenDangNhap,

                mat_khau_ban_dau:
                  matKhauBanDau,
              });
            }


            // ========================================
            // C. GẮN PHỤ HUYNH VỚI HỌC SINH
            // ========================================

            await tx
              .phu_huynh_hoc_sinh
              .create({
                data: {
                  phu_huynh_id:
                    phuHuynh.id,

                  hoc_sinh_id:
                    hocSinhMoi.id,

                  moi_quan_he:
                    thongTin.moi_quan_he,
                },
              });
          }


          return hocSinhMoi;
        },
      );


    return {
      thong_bao:
        'Thêm học sinh và phụ huynh thành công',

      hoc_sinh:
        ketQua,

      tai_khoan_phu_huynh_moi:
        taiKhoanMoi,
    };
  }


  // ==================================================
  // 2. DANH SÁCH HỌC SINH
  // ADMIN: tất cả
  // GV: lớp được phân công
  // PH: con được liên kết
  // ==================================================

  async layDanhSachHocSinh(
    nguoiDung: NguoiDungJwt,
    tuKhoa?: string,
    trangThai?: string,
  ) {

    const phamVi =
      await this.taoDieuKienPhamViHocSinh(
        nguoiDung,
      );


    const tuKhoaTimKiem =
      tuKhoa?.trim();


    const trangThaiTimKiem =
      trangThai?.trim();


    const danhSach =
      await this.prisma.hoc_sinh.findMany({
        where: {
          ...phamVi,


          ...(tuKhoaTimKiem
            ? {
                OR: [
                  {
                    ma_hoc_sinh: {
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
                    so_dien_thoai_lien_he: {
                      contains:
                        tuKhoaTimKiem,
                    },
                  },
                ],
              }
            : {}),


          ...(trangThaiTimKiem
            ? {
                trang_thai:
                  trangThaiTimKiem,
              }
            : {}),
        },


        orderBy: {
          ho_ten:
            'asc',
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

          so_dien_thoai_lien_he:
            true,

          trang_thai:
            true,

          chieu_cao_cm:
            true,

          can_nang_kg:
            true,

          ngay_do:
            true,

          xep_lop: {
            orderBy: {
              ngay_bat_dau:
                'desc',
            },

            take:
              1,

            select: {
              id:
                true,

              lop_hoc_id:
                true,

              ngay_bat_dau:
                true,

              ngay_ket_thuc:
                true,

              trang_thai:
                true,
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


  // ==================================================
  // 3. CHI TIẾT HỌC SINH
  // ==================================================

  async layChiTietHocSinh(
    nguoiDung: NguoiDungJwt,
    id: number,
  ) {

    await this.kiemTraQuyenXemHocSinh(
      nguoiDung,
      id,
    );


    const hocSinh =
      await this.prisma.hoc_sinh.findUnique({
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
                },
              },
            },
          },
        },
      });


    if (!hocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }


    // PH chỉ thấy chính thông tin PH của mình
    // không tự động xem hồ sơ PH khác

    if (
      nguoiDung.vai_tro ===
      'PHU_HUYNH'
    ) {

      const phuHuynh =
        await this.prisma.phu_huynh.findUnique({
          where: {
            tai_khoan_id:
              nguoiDung.sub,
          },

          select: {
            id: true,
          },
        });


      return {
        ...hocSinh,

        phu_huynh_hoc_sinh:
          hocSinh
            .phu_huynh_hoc_sinh
            .filter(
              (item) =>
                item.phu_huynh.id ===
                phuHuynh?.id,
            ),
      };
    }


    return hocSinh;
  }


  // ==================================================
  // 4. ADMIN CẬP NHẬT HỒ SƠ HỌC SINH
  // ==================================================

  async capNhatHocSinh(
    id: number,
    duLieu: CapNhatHocSinhDto,
  ) {

    const hocSinh =
      await this.prisma.hoc_sinh.findUnique({
        where: {
          id,
        },
      });


    if (!hocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }


    if (
      Object.values(
        duLieu,
      ).every(
        (item) =>
          item === undefined,
      )
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }


    const cacTruongChuoiBatBuoc = [
      [
        'Họ tên',
        duLieu.ho_ten,
      ],
      [
        'Giới tính',
        duLieu.gioi_tinh,
      ],
      [
        'Dân tộc',
        duLieu.dan_toc,
      ],
      [
        'Quốc tịch',
        duLieu.quoc_tich,
      ],
      [
        'Nơi sinh',
        duLieu.noi_sinh,
      ],
      [
        'Địa chỉ thường trú',
        duLieu.dia_chi_thuong_tru,
      ],
      [
        'Địa chỉ hiện tại',
        duLieu.dia_chi_hien_tai,
      ],
    ] as const;


    for (
      const [
        tenTruong,
        giaTri,
      ]
      of cacTruongChuoiBatBuoc
    ) {
      if (
        giaTri !== undefined &&
        !giaTri.trim()
      ) {
        throw new BadRequestException(
          `${tenTruong} không được để trống`,
        );
      }
    }


    if (
      duLieu.ngay_sinh !== undefined &&
      !duLieu.ngay_sinh.trim()
    ) {
      throw new BadRequestException(
        'Ngày sinh không được để trống',
      );
    }


    if (
      duLieu.ngay_nhap_hoc !== undefined &&
      !duLieu.ngay_nhap_hoc.trim()
    ) {
      throw new BadRequestException(
        'Ngày nhập học không được để trống',
      );
    }


    const soDienThoai =
      duLieu
        .so_dien_thoai_lien_he
        ?.trim();


    if (
      duLieu.so_dien_thoai_lien_he !== undefined &&
      !soDienThoai
    ) {
      throw new BadRequestException(
        'Số điện thoại liên hệ không được để trống',
      );
    }


    if (soDienThoai) {
      this.kiemTraSoDienThoai(
        soDienThoai,
      );
    }


    const ketQua =
      await this.prisma.hoc_sinh.update({
        where: {
          id,
        },


        data: {

          ...(duLieu.ho_ten !== undefined
            ? {
                ho_ten:
                  duLieu.ho_ten.trim(),
              }
            : {}),


          ...(duLieu.ngay_sinh
            ? {
                ngay_sinh:
                  this.chuyenNgay(
                    duLieu.ngay_sinh,
                    'Ngày sinh',
                  ),
              }
            : {}),


          ...(duLieu.gioi_tinh !== undefined
            ? {
                gioi_tinh:
                  duLieu.gioi_tinh.trim(),
              }
            : {}),


          ...(duLieu.dan_toc !== undefined
            ? {
                dan_toc:
                  duLieu.dan_toc.trim(),
              }
            : {}),


          ...(duLieu.quoc_tich !== undefined
            ? {
                quoc_tich:
                  duLieu.quoc_tich.trim(),
              }
            : {}),


          ...(duLieu.noi_sinh !== undefined
            ? {
                noi_sinh:
                  duLieu.noi_sinh.trim(),
              }
            : {}),


          ...(soDienThoai
            ? {
                so_dien_thoai_lien_he:
                  soDienThoai,
              }
            : {}),


          ...(duLieu.dia_chi_thuong_tru !== undefined
            ? {
                dia_chi_thuong_tru:
                  duLieu
                    .dia_chi_thuong_tru
                    .trim(),
              }
            : {}),


          ...(duLieu.dia_chi_hien_tai !== undefined
            ? {
                dia_chi_hien_tai:
                  duLieu
                    .dia_chi_hien_tai
                    .trim(),
              }
            : {}),


          ...(duLieu.ngay_nhap_hoc
            ? {
                ngay_nhap_hoc:
                  this.chuyenNgay(
                    duLieu.ngay_nhap_hoc,
                    'Ngày nhập học',
                  ),
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
        },
      });


    return {
      thong_bao:
        'Cập nhật học sinh thành công',

      hoc_sinh:
        ketQua,
    };
  }


  // ==================================================
  // 5. ADMIN CẬP NHẬT TRẠNG THÁI HS
  // ==================================================

  async capNhatTrangThaiHocSinh(
    id: number,
    duLieu: CapNhatTrangThaiHocSinhDto,
  ) {

    if (
      !duLieu.trang_thai?.trim()
    ) {
      throw new BadRequestException(
        'Trạng thái không được để trống',
      );
    }


    const hocSinh =
      await this.prisma.hoc_sinh.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });


    if (!hocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }


    const ketQua =
      await this.prisma.hoc_sinh.update({
        where: {
          id,
        },

        data: {
          trang_thai:
            duLieu.trang_thai.trim(),
        },
      });


    return {
      thong_bao:
        'Cập nhật trạng thái học sinh thành công',

      hoc_sinh:
        ketQua,
    };
  }


  // ==================================================
  // 6. ADMIN CẬP NHẬT SỨC KHỎE HIỆN TẠI
  // ==================================================

  async capNhatSucKhoeHocSinh(
    id: number,
    duLieu: CapNhatSucKhoeHocSinhDto,
  ) {

    const hocSinh =
      await this.prisma.hoc_sinh.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });


    if (!hocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }


    if (
      !Number.isFinite(
        duLieu.chieu_cao_cm,
      ) ||
      !Number.isFinite(
        duLieu.can_nang_kg,
      ) ||
      duLieu.chieu_cao_cm <= 0 ||
      duLieu.can_nang_kg <= 0
    ) {
      throw new BadRequestException(
        'Chiều cao và cân nặng không hợp lệ',
      );
    }


    const ketQua =
      await this.prisma.hoc_sinh.update({
        where: {
          id,
        },

        data: {
          chieu_cao_cm:
            duLieu.chieu_cao_cm,

          can_nang_kg:
            duLieu.can_nang_kg,

          ngay_do:
            this.chuyenNgay(
              duLieu.ngay_do,
              'Ngày đo',
            ),
        },
      });


    return {
      thong_bao:
        'Cập nhật sức khỏe thành công',

      hoc_sinh:
        ketQua,
    };
  }


  // ==================================================
  // 7. ADMIN TÌM / XEM DANH SÁCH PHỤ HUYNH
  // Dùng khi nhập em ruột để chọn PH đã tồn tại
  // ==================================================

  async layDanhSachPhuHuynh(
    tuKhoa?: string,
  ) {

    const tim =
      tuKhoa?.trim();


    const danhSach =
      await this.prisma.phu_huynh.findMany({
        where: {

          ...(tim
            ? {
                OR: [
                  {
                    ho_ten: {
                      contains:
                        tim,
                    },
                  },

                  {
                    so_dien_thoai: {
                      contains:
                        tim,
                    },
                  },

                  {
                    nghe_nghiep: {
                      contains:
                        tim,
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
        danhSach.length,

      danh_sach:
        danhSach,
    };
  }


  // ==================================================
  // 8. ADMIN XEM CHI TIẾT PHỤ HUYNH
  // ==================================================

  async layChiTietPhuHuynh(
    id: number,
  ) {

    const phuHuynh =
      await this.prisma.phu_huynh.findUnique({
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


    if (!phuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy phụ huynh',
      );
    }


    return phuHuynh;
  }


  // ==================================================
  // 9. PHỤ HUYNH XEM HỒ SƠ CỦA CHÍNH MÌNH
  // ==================================================

  async layPhuHuynhCuaToi(
    taiKhoanId: number,
  ) {

    const phuHuynh =
      await this.prisma.phu_huynh.findUnique({
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


    if (!phuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy hồ sơ phụ huynh',
      );
    }


    return phuHuynh;
  }


  // ==================================================
  // 10. ADMIN CẬP NHẬT PHỤ HUYNH
  // SĐT phải đồng bộ tai_khoan nếu đã có tài khoản
  // ==================================================

  async capNhatPhuHuynh(
    id: number,
    duLieu: CapNhatPhuHuynhDto,
  ) {

    const phuHuynh =
      await this.prisma.phu_huynh.findUnique({
        where: {
          id,
        },
      });


    if (!phuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy phụ huynh',
      );
    }


    if (
      Object.values(
        duLieu,
      ).every(
        (item) =>
          item === undefined,
      )
    ) {
      throw new BadRequestException(
        'Không có dữ liệu cần cập nhật',
      );
    }


    if (
      duLieu.ho_ten !== undefined &&
      !duLieu.ho_ten.trim()
    ) {
      throw new BadRequestException(
        'Họ tên phụ huynh không được để trống',
      );
    }


    this.kiemTraNamSinhPhuHuynh(
      duLieu.nam_sinh,
    );


    const soDienThoai =
      duLieu.so_dien_thoai
        ?.trim();


    if (
      duLieu.so_dien_thoai !== undefined &&
      !soDienThoai
    ) {
      throw new BadRequestException(
        'Số điện thoại phụ huynh không được để trống',
      );
    }


    if (soDienThoai) {

      this.kiemTraSoDienThoai(
        soDienThoai,
      );


      if (
        phuHuynh.tai_khoan_id &&
        soDienThoai !==
          phuHuynh.so_dien_thoai
      ) {

        const taiKhoanTrung =
          await this.prisma
            .tai_khoan
            .findUnique({
              where: {
                so_dien_thoai:
                  soDienThoai,
              },
            });


        if (
          taiKhoanTrung &&
          taiKhoanTrung.id !==
            phuHuynh.tai_khoan_id
        ) {
          throw new ConflictException(
            'Số điện thoại đã được tài khoản khác sử dụng',
          );
        }
      }
    }


    const ketQua =
      await this.prisma.$transaction(
        async (tx) => {

          // Đồng bộ SĐT tài khoản
          if (
            phuHuynh.tai_khoan_id &&
            soDienThoai
          ) {

            await tx.tai_khoan.update({
              where: {
                id:
                  phuHuynh.tai_khoan_id,
              },

              data: {
                so_dien_thoai:
                  soDienThoai,
              },
            });
          }


          return tx.phu_huynh.update({
            where: {
              id,
            },


            data: {

              ...(duLieu.ho_ten !== undefined
                ? {
                    ho_ten:
                      duLieu.ho_ten.trim(),
                  }
                : {}),


              ...(duLieu.nam_sinh !== undefined
                ? {
                    nam_sinh:
                      duLieu.nam_sinh,
                  }
                : {}),


              ...(soDienThoai
                ? {
                    so_dien_thoai:
                      soDienThoai,
                  }
                : {}),


              ...(duLieu.nghe_nghiep !== undefined
                ? {
                    nghe_nghiep:
                      duLieu.nghe_nghiep
                        ?.trim() ||
                      null,
                  }
                : {}),
            },
          });
        },
      );


    return {
      thong_bao:
        'Cập nhật phụ huynh thành công',

      phu_huynh:
        ketQua,
    };
  }


  // ==================================================
  // 11. ADMIN TẠO TÀI KHOẢN CHO PHỤ HUYNH CÓ SẴN
  // ==================================================

  async taoTaiKhoanPhuHuynh(
    id: number,
  ) {

    const phuHuynh =
      await this.prisma.phu_huynh.findUnique({
        where: {
          id,
        },
      });


    if (!phuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy phụ huynh',
      );
    }


    if (
      phuHuynh.tai_khoan_id
    ) {
      throw new ConflictException(
        'Phụ huynh đã có tài khoản',
      );
    }


    const taiKhoanTrung =
      await this.prisma.tai_khoan.findUnique({
        where: {
          so_dien_thoai:
            phuHuynh.so_dien_thoai,
        },
      });


    if (taiKhoanTrung) {
      throw new ConflictException(
        'Số điện thoại đã được tài khoản khác sử dụng',
      );
    }


    const tenDangNhap =
      `ph${String(
        id,
      ).padStart(
        6,
        '0',
      )}`;


    const matKhauBanDau =
      `Ph@${randomBytes(
        4,
      ).toString(
        'hex',
      )}`;


    const matKhauBam =
      await argon2.hash(
        matKhauBanDau,
      );


    const taiKhoan =
      await this.prisma.$transaction(
        async (tx) => {

          const taiKhoanMoi =
            await tx.tai_khoan.create({
              data: {
                ten_dang_nhap:
                  tenDangNhap,

                so_dien_thoai:
                  phuHuynh.so_dien_thoai,

                mat_khau_bam:
                  matKhauBam,

                vai_tro:
                  'PHU_HUYNH',

                trang_thai:
                  'HOAT_DONG',

                phai_doi_mat_khau:
                  true,
              },
            });


          await tx.phu_huynh.update({
            where: {
              id,
            },

            data: {
              tai_khoan_id:
                taiKhoanMoi.id,
            },
          });


          return taiKhoanMoi;
        },
      );


    return {
      thong_bao:
        'Tạo tài khoản phụ huynh thành công',

      ten_dang_nhap:
        taiKhoan.ten_dang_nhap,

      so_dien_thoai:
        taiKhoan.so_dien_thoai,

      mat_khau_ban_dau:
        matKhauBanDau,

      phai_doi_mat_khau:
        true,
    };
  }


  // ==================================================
  // 12. ADMIN CẤP LẠI MẬT KHẨU PHỤ HUYNH
  // ==================================================

  async capLaiMatKhauPhuHuynh(
    id: number,
  ) {

    const phuHuynh =
      await this.prisma.phu_huynh.findUnique({
        where: {
          id,
        },
      });


    if (!phuHuynh) {
      throw new NotFoundException(
        'Không tìm thấy phụ huynh',
      );
    }


    if (
      !phuHuynh.tai_khoan_id
    ) {
      throw new BadRequestException(
        'Phụ huynh chưa có tài khoản',
      );
    }


    const matKhauMoi =
      `Ph@${randomBytes(
        4,
      ).toString(
        'hex',
      )}`;


    const matKhauBam =
      await argon2.hash(
        matKhauMoi,
      );


    await this.prisma.tai_khoan.update({
      where: {
        id:
          phuHuynh.tai_khoan_id,
      },

      data: {
        mat_khau_bam:
          matKhauBam,

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
        matKhauMoi,

      phai_doi_mat_khau:
        true,
    };
  }


  // ==================================================
  // 13. ADMIN THÊM PHỤ HUYNH CHO HS ĐÃ CÓ
  // Có thể chọn PH cũ hoặc tạo PH mới
  // ==================================================

  async themPhuHuynhVaoHocSinh(
    hocSinhId: number,
    duLieu: ThongTinPhuHuynhDto,
  ) {

    this.kiemTraMoiQuanHe(
      duLieu.moi_quan_he,
    );


    const hocSinh =
      await this.prisma.hoc_sinh.findUnique({
        where: {
          id:
            hocSinhId,
        },

        select: {
          id: true,
        },
      });


    if (!hocSinh) {
      throw new NotFoundException(
        'Không tìm thấy học sinh',
      );
    }


    let taiKhoanMoi:
      | {
          ten_dang_nhap: string;
          mat_khau_ban_dau: string;
        }
      | null =
      null;


    const ketQua =
      await this.prisma.$transaction(
        async (tx) => {

          let phuHuynh;


          if (
            duLieu.phu_huynh_id
          ) {

            phuHuynh =
              await tx.phu_huynh.findUnique({
                where: {
                  id:
                    duLieu.phu_huynh_id,
                },
              });


            if (!phuHuynh) {
              throw new NotFoundException(
                'Không tìm thấy phụ huynh',
              );
            }

          } else {

            if (
              !duLieu.ho_ten?.trim() ||
              !duLieu.so_dien_thoai?.trim()
            ) {
              throw new BadRequestException(
                'Phụ huynh mới phải có họ tên và số điện thoại',
              );
            }


            const soDienThoai =
              duLieu
                .so_dien_thoai
                .trim();


            this.kiemTraSoDienThoai(
              soDienThoai,
            );


            this.kiemTraNamSinhPhuHuynh(
              duLieu.nam_sinh,
            );


            phuHuynh =
              await tx.phu_huynh.create({
                data: {
                  ho_ten:
                    duLieu.ho_ten.trim(),

                  nam_sinh:
                    duLieu.nam_sinh,

                  so_dien_thoai:
                    soDienThoai,

                  nghe_nghiep:
                    duLieu.nghe_nghiep
                      ?.trim() ||
                    null,
                },
              });
          }


          if (
            duLieu.tao_tai_khoan &&
            !phuHuynh.tai_khoan_id
          ) {
            const taiKhoanTrung =
              await tx.tai_khoan.findUnique({
                where: {
                  so_dien_thoai:
                    phuHuynh.so_dien_thoai,
                },
              });


            if (taiKhoanTrung) {
              throw new ConflictException(
                'Số điện thoại đã được tài khoản khác sử dụng',
              );
            }


            const tenDangNhap =
              `ph${String(
                phuHuynh.id,
              ).padStart(
                6,
                '0',
              )}`;


            const matKhauBanDau =
              `Ph@${randomBytes(
                4,
              ).toString(
                'hex',
              )}`;


            const matKhauBam =
              await argon2.hash(
                matKhauBanDau,
              );


            const taiKhoan =
              await tx.tai_khoan.create({
                data: {
                  ten_dang_nhap:
                    tenDangNhap,

                  so_dien_thoai:
                    phuHuynh.so_dien_thoai,

                  mat_khau_bam:
                    matKhauBam,

                  vai_tro:
                    'PHU_HUYNH',

                  trang_thai:
                    'HOAT_DONG',

                  phai_doi_mat_khau:
                    true,
                },
              });


            await tx.phu_huynh.update({
              where: {
                id:
                  phuHuynh.id,
              },

              data: {
                tai_khoan_id:
                  taiKhoan.id,
              },
            });


            taiKhoanMoi = {
              ten_dang_nhap:
                tenDangNhap,

              mat_khau_ban_dau:
                matKhauBanDau,
            };
          }


          const lienKetCu =
            await tx
              .phu_huynh_hoc_sinh
              .findFirst({
                where: {
                  phu_huynh_id:
                    phuHuynh.id,

                  hoc_sinh_id:
                    hocSinhId,
                },
              });


          if (lienKetCu) {
            throw new ConflictException(
              'Phụ huynh đã được liên kết với học sinh này',
            );
          }


          return tx
            .phu_huynh_hoc_sinh
            .create({
              data: {
                phu_huynh_id:
                  phuHuynh.id,

                hoc_sinh_id:
                  hocSinhId,

                moi_quan_he:
                  duLieu.moi_quan_he,
              },
            });
        },
      );


    return {
      thong_bao:
        'Thêm phụ huynh cho học sinh thành công',

      lien_ket:
        ketQua,

      tai_khoan_phu_huynh_moi:
        taiKhoanMoi,
    };
  }


  // ==================================================
  // 14. ADMIN SỬA CHA / MẸ / NGƯỜI GIÁM HỘ
  // ==================================================

  async capNhatMoiQuanHe(
    hocSinhId: number,
    phuHuynhId: number,
    duLieu: CapNhatMoiQuanHeDto,
  ) {

    this.kiemTraMoiQuanHe(
      duLieu.moi_quan_he,
    );


    const lienKet =
      await this.prisma
        .phu_huynh_hoc_sinh
        .findFirst({
          where: {
            hoc_sinh_id:
              hocSinhId,

            phu_huynh_id:
              phuHuynhId,
          },
        });


    if (!lienKet) {
      throw new NotFoundException(
        'Không tìm thấy liên kết phụ huynh - học sinh',
      );
    }


    const ketQua =
      await this.prisma
        .phu_huynh_hoc_sinh
        .update({
          where: {
            id:
              lienKet.id,
          },

          data: {
            moi_quan_he:
              duLieu.moi_quan_he,
          },
        });


    return {
      thong_bao:
        'Cập nhật mối quan hệ thành công',

      lien_ket:
        ketQua,
    };
  }


  // ==================================================
  // 15. ADMIN HỦY LIÊN KẾT NHẬP SAI
  // Không cho HS mất hết PH
  // ==================================================

  async huyLienKetPhuHuynhHocSinh(
    hocSinhId: number,
    phuHuynhId: number,
  ) {

    const danhSachLienKet =
      await this.prisma
        .phu_huynh_hoc_sinh
        .findMany({
          where: {
            hoc_sinh_id:
              hocSinhId,
          },

          select: {
            id:
              true,

            phu_huynh_id:
              true,
          },
        });


    const lienKet =
      danhSachLienKet.find(
        (item) =>
          item.phu_huynh_id ===
          phuHuynhId,
      );


    if (!lienKet) {
      throw new NotFoundException(
        'Không tìm thấy liên kết',
      );
    }


    if (
      danhSachLienKet.length <= 1
    ) {
      throw new BadRequestException(
        'Học sinh phải còn ít nhất một phụ huynh hoặc người giám hộ',
      );
    }


    await this.prisma
      .phu_huynh_hoc_sinh
      .delete({
        where: {
          id:
            lienKet.id,
        },
      });


    return {
      thong_bao:
        'Hủy liên kết thành công',
    };
  }
}