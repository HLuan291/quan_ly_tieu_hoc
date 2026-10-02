import { ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { HoSoHocSinhService } from '../ho_so_hoc_sinh/ho_so_hoc_sinh.service';
import { PhanCongGiangDayService } from '../phan_cong_giang_day/phan_cong_giang_day.service';
import { DiemDanhNghiHocService } from '../diem_danh_nghi_hoc/diem_danh_nghi_hoc.service';
import { DanhGiaHocTapService } from '../danh_gia_hoc_tap/danh_gia_hoc_tap.service';
import { TaoDauPhien } from './phien_dang_nhap';

describe('Các lỗi hồi quy của đợt audit', () => {
  const TaiKhoan = { id: 1, vai_tro: 'ADMIN', trang_thai: 'HOAT_DONG', phai_doi_mat_khau: false, mat_khau_bam: 'hash-1' };
  const Verify = jest.fn();
  const Find = jest.fn();
  const Prisma = { tai_khoan: { findUnique: Find } } as unknown as PrismaService;
  const Jwt = { verifyAsync: Verify } as unknown as JwtService;
  const Guard = new JwtAuthGuard(Jwt, Prisma);
  const TaoContext = (Headers: Record<string, unknown>, Url = '/giao_vien', Method = 'GET') => ({
    switchToHttp: () => ({ getRequest: () => ({ headers: Headers, originalUrl: Url, method: Method }) }),
  }) as unknown as ExecutionContext;

  beforeEach(() => {
    Verify.mockReset().mockResolvedValue({ sub: 1, phien_mat_khau: TaoDauPhien(TaiKhoan.mat_khau_bam) });
    Find.mockReset().mockResolvedValue({ ...TaiKhoan });
  });

  it('nhận Authorization do Node chuyển thành authorization', async () => {
    await expect(Guard.canActivate(TaoContext({ authorization: 'Bearer token' }))).resolves.toBe(true);
    expect(Verify).toHaveBeenCalledWith('token');
  });
  it('từ chối request không có token', async () => {
    await expect(Guard.canActivate(TaoContext({}))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(Find).not.toHaveBeenCalled();
  });
  it('từ chối header có phần thừa', async () => {
    await expect(Guard.canActivate(TaoContext({ authorization: 'Bearer token extra' }))).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('chặn tài khoản bị khóa theo trạng thái database', async () => {
    Find.mockResolvedValue({ ...TaiKhoan, trang_thai: 'KHOA' });
    await expect(Guard.canActivate(TaoContext({ authorization: 'Bearer token' }))).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('token cũ bị vô hiệu khi bản băm mật khẩu thay đổi', async () => {
    Find.mockResolvedValue({ ...TaiKhoan, mat_khau_bam: 'hash-2' });
    await expect(Guard.canActivate(TaoContext({ authorization: 'Bearer token' }))).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('cho phép đổi mật khẩu lần đầu và chặn API khác', async () => {
    Find.mockResolvedValue({ ...TaiKhoan, phai_doi_mat_khau: true });
    await expect(Guard.canActivate(TaoContext({ authorization: 'Bearer token' }, '/auth/doi-mat-khau', 'POST'))).resolves.toBe(true);
    await expect(Guard.canActivate(TaoContext({ authorization: 'Bearer token' }))).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('không xử lý giá trị đăng nhập sai kiểu thành lỗi 500', async () => {
    const Service = new AuthService(Prisma, Jwt);
    await expect(Service.DangNhap(123 as unknown as string, 'password')).rejects.toBeInstanceOf(BadRequestException);
  });
  const HocSinh = {
    ho_ten: 'Nguyễn Văn An', ngay_sinh: '2019-01-01', gioi_tinh: 'NAM', dan_toc: 'Kinh', quoc_tich: 'Việt Nam',
    noi_sinh: 'TP.HCM', so_dien_thoai_lien_he: '0901234567', dia_chi_thuong_tru: 'TP.HCM', dia_chi_hien_tai: 'TP.HCM', ngay_nhap_hoc: '2025-09-01',
  };
  it.each(['090123456', '09012345678', '090123456789012'])('từ chối số điện thoại %s', async (SoDienThoai) => {
    const Service = new HoSoHocSinhService({} as PrismaService);
    await expect(Service.TaoHocSinhKemPhuHuynh({ hoc_sinh: { ...HocSinh, so_dien_thoai_lien_he: SoDienThoai }, phu_huynh: [{ moi_quan_he: 'CHA', ho_ten: 'Nguyễn Văn Bình', so_dien_thoai: '0912345678' }] })).rejects.toBeInstanceOf(BadRequestException);
  });
  it.each([
    ['2099-01-01', '2099-09-01'], ['2019-01-01', '2018-09-01'], ['2019-01-01', '2099-09-01'],
  ])('từ chối ngày sinh %s và nhập học %s', async (NgaySinh, NgayNhapHoc) => {
    const Service = new HoSoHocSinhService({} as PrismaService);
    await expect(Service.TaoHocSinhKemPhuHuynh({ hoc_sinh: { ...HocSinh, ngay_sinh: NgaySinh, ngay_nhap_hoc: NgayNhapHoc }, phu_huynh: [{ moi_quan_he: 'CHA', ho_ten: 'Nguyễn Văn Bình', so_dien_thoai: '0912345678' }] })).rejects.toBeInstanceOf(BadRequestException);
  });
  it.each(['2026-02-30', '2026-13-01', '2026-2-1'])('không tự chuyển ngày sai %s sang ngày khác', async (Ngay) => {
    const PhanCong = new PhanCongGiangDayService({} as PrismaService);
    await expect(PhanCong.PhanCongGvcn({ giao_vien_id: 1, lop_hoc_id: 1, ngay_bat_dau: Ngay })).rejects.toBeInstanceOf(BadRequestException);
    const DiemDanh = new DiemDanhNghiHocService({} as PrismaService);
    await expect(DiemDanh.LaySoDiemDanh(1, 'ADMIN', 1, Ngay, 'SANG')).rejects.toBeInstanceOf(BadRequestException);
    const DanhGia = new DanhGiaHocTapService({} as PrismaService);
    expect(() => (DanhGia as unknown as { ChuyenNgay: (GiaTri: string, Ten: string) => Date }).ChuyenNgay(Ngay, 'Ngày kiểm tra')).toThrow(BadRequestException);
  });
});
