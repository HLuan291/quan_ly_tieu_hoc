import { LayNgayNghiepVu } from './ngay_nghiep_vu';
import { PrismaService } from './prisma.service';
import { GiaoVienService } from './giao_vien/giao_vien.service';
import { HoSoHocSinhService } from './ho_so_hoc_sinh/ho_so_hoc_sinh.service';
import { ToChucLopHocService } from './to_chuc_lop_hoc/to_chuc_lop_hoc.service';
import { DiemDanhNghiHocService } from './diem_danh_nghi_hoc/diem_danh_nghi_hoc.service';
import { DanhGiaHocTapService } from './danh_gia_hoc_tap/danh_gia_hoc_tap.service';

describe('Ngày nghiệp vụ của trường', () => {
  it.each([
    ['2026-10-03T16:59:59.999Z', '2026-10-03'],
    ['2026-10-03T17:00:00.000Z', '2026-10-04'],
    ['2026-10-03T23:59:59.999Z', '2026-10-04'],
    ['2026-10-04T00:00:00.000Z', '2026-10-04'],
    ['2026-10-31T17:00:00.000Z', '2026-11-01'],
    ['2026-12-31T17:00:00.000Z', '2027-01-01'],
    ['2024-02-28T17:00:00.000Z', '2024-02-29'],
    ['2024-02-29T17:00:00.000Z', '2024-03-01'],
    ['2026-02-28T17:00:00.000Z', '2026-03-01'],
  ])('%s thuộc ngày %s tại Việt Nam', (ThoiDiem, Ngay) => {
    expect(LayNgayNghiepVu(new Date(ThoiDiem)).toISOString()).toBe(Ngay + 'T00:00:00.000Z');
  });

  it.each(['UTC', 'Asia/Ho_Chi_Minh', 'America/Los_Angeles'])(
    'không đổi ngày nghiệp vụ khi máy chủ dùng %s',
    (MuiGio) => {
      const MuiGioCu = process.env.TZ;
      try {
        process.env.TZ = MuiGio;
        expect(LayNgayNghiepVu(new Date('2026-10-03T17:30:00.000Z')).toISOString())
          .toBe('2026-10-04T00:00:00.000Z');
      } finally {
        if (MuiGioCu === undefined) delete process.env.TZ;
        else process.env.TZ = MuiGioCu;
      }
    },
  );
});

describe('Nghiệp vụ lúc 00:30 tại Việt Nam', () => {
  const HomNay = new Date('2026-10-04T00:00:00.000Z');
  const Lop = { id: 2, ten_lop: '1 A', nam_hoc_id: 1, khoi_id: 1,
    nam_hoc: { id: 1, ten_nam_hoc: '2026-2027' }, khoi: { id: 1, so_khoi: 1, ten_khoi: 'Khối 1' } };
  const PC = { lop_hoc_id: 2, loai_phan_cong: 'GVCN', mon_hoc_id: null, lop_hoc: Lop };
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-03T17:30:00.000Z'));
  });
  afterEach(() => jest.useRealTimers());

  it('chấp nhận giáo viên tròn 18 tuổi hôm nay', () => {
    const Service = new GiaoVienService({} as PrismaService) as unknown as {
      KiemTraNgaySinhGiaoVien: (NgaySinh: Date) => void;
    };
    expect(() => Service.KiemTraNgaySinhGiaoVien(new Date('2008-10-04T00:00:00.000Z'))).not.toThrow();
  });

  it('không nhận giáo viên sinh 01/03 sớm một ngày vào 29/02', () => {
    jest.setSystemTime(new Date('2024-02-28T17:30:00.000Z'));
    const Service = new GiaoVienService({} as PrismaService) as unknown as {
      KiemTraNgaySinhGiaoVien: (NgaySinh: Date) => void;
    };
    expect(() => Service.KiemTraNgaySinhGiaoVien(new Date('2006-03-01T00:00:00.000Z'))).toThrow();
  });

  it('nhận giáo viên đã tròn 18 tuổi từ 28/02 khi hôm nay là 29/02', () => {
    jest.setSystemTime(new Date('2024-02-28T17:30:00.000Z'));
    const Service = new GiaoVienService({} as PrismaService) as unknown as {
      KiemTraNgaySinhGiaoVien: (NgaySinh: Date) => void;
    };
    expect(() => Service.KiemTraNgaySinhGiaoVien(new Date('2006-02-28T00:00:00.000Z'))).not.toThrow();
  });

  it('chấp nhận ngày vào trường là hôm nay', () => {
    const Service = new GiaoVienService({} as PrismaService) as unknown as {
      KiemTraNgayVaoTruong: (NgaySinh: Date, NgayVaoTruong: Date) => void;
    };
    expect(() => Service.KiemTraNgayVaoTruong(new Date('1990-01-01T00:00:00.000Z'), HomNay)).not.toThrow();
  });

  it('chấp nhận ngày nhập học là hôm nay', () => {
    const Service = new HoSoHocSinhService({} as PrismaService) as unknown as {
      KiemTraNgayHocSinh: (NgaySinh: Date, NgayNhapHoc: Date) => void;
    };
    expect(() => Service.KiemTraNgayHocSinh(new Date('2019-01-01T00:00:00.000Z'), HomNay)).not.toThrow();
  });

  it('không coi ngày sinh hôm nay là tương lai', () => {
    const Service = new HoSoHocSinhService({} as PrismaService) as unknown as {
      KiemTraNgayHocSinh: (NgaySinh: Date, NgayNhapHoc: Date) => void;
    };
    expect(() => Service.KiemTraNgayHocSinh(HomNay, HomNay)).not.toThrow();
  });

  it('giới hạn năm sinh phụ huynh chuyển năm lúc 00:00 Việt Nam', () => {
    jest.setSystemTime(new Date('2026-12-31T17:30:00.000Z'));
    const Service = new HoSoHocSinhService({} as PrismaService) as unknown as {
      KiemTraNamSinhPhuHuynh: (NamSinh: number) => void;
    };
    expect(() => Service.KiemTraNamSinhPhuHuynh(2009)).not.toThrow();
    expect(() => Service.KiemTraNamSinhPhuHuynh(2010)).toThrow();
  });

  it('danh sách học sinh chưa xếp lớp dùng ngày hôm nay tại Việt Nam', async () => {
    const Prisma = { hoc_sinh: { findMany: jest.fn().mockResolvedValue([]) } };
    await new ToChucLopHocService(Prisma as unknown as PrismaService).LayHocSinhChuaXepLop();
    expect(Prisma.hoc_sinh.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        xep_lop: { none: expect.objectContaining({ ngay_bat_dau: { lte: HomNay } }) },
      }),
    }));
  });

  it('phạm vi học sinh giáo viên bắt đầu từ ngày Việt Nam', async () => {
    const Prisma = {
      giao_vien: { findUnique: jest.fn().mockResolvedValue({ id: 1, trang_thai: 'HOAT_DONG' }) },
      phan_cong_giao_vien: { findMany: jest.fn().mockResolvedValue([PC]) },
      hoc_sinh: { findMany: jest.fn().mockResolvedValue([]) },
    };
    await new HoSoHocSinhService(Prisma as unknown as PrismaService).LayDanhSachHocSinh({
      sub: 1, vai_tro: 'GIAO_VIEN', phai_doi_mat_khau: false,
    });
    expect(Prisma.phan_cong_giao_vien.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ ngay_bat_dau: { lte: HomNay } }),
    }));
  });

  it('lớp chủ nhiệm để điểm danh dùng ngày Việt Nam', async () => {
    const Prisma = {
      giao_vien: { findUnique: jest.fn().mockResolvedValue({ id: 1, trang_thai: 'HOAT_DONG' }) },
      phan_cong_giao_vien: { findMany: jest.fn().mockResolvedValue([]) },
    };
    await new DiemDanhNghiHocService(Prisma as unknown as PrismaService).LayLopChuNhiemCuaToi(1);
    expect(Prisma.phan_cong_giao_vien.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ ngay_bat_dau: { lte: HomNay } }),
    }));
  });

  it('đánh giá học sinh nhận phân công bắt đầu hôm nay', async () => {
    const Prisma = {
      giao_vien: { findUnique: jest.fn().mockResolvedValue({ id: 1, trang_thai: 'HOAT_DONG' }) },
      phan_cong_giao_vien: { findFirst: jest.fn().mockResolvedValue({ id: 1, trang_thai: 'HOAT_DONG' }) },
      lop_hoc: { findUnique: jest.fn().mockResolvedValue({ id: 2 }) },
      xep_lop: { findMany: jest.fn().mockResolvedValue([]) },
    };
    await new DanhGiaHocTapService(Prisma as unknown as PrismaService).LayHocSinhDeDanhGia(1, 2);
    expect(Prisma.phan_cong_giao_vien.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ ngay_bat_dau: { lte: HomNay } }),
    }));
  });
});
