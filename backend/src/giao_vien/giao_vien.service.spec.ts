import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma.service';
import { GiaoVienService } from './giao_vien.service';

describe('Mật khẩu giáo viên do Admin cấp', () => {
  const Form = {
    ho_ten: 'Trần Thị Bình', ngay_sinh: '1990-01-01', gioi_tinh: 'NU',
    so_dien_thoai: '0000000001', email: 'demo@example.test', dia_chi_lien_he: 'Địa chỉ demo',
    ngay_vao_truong: '2015-09-01', trinh_do_chuyen_mon: 'Đại học',
  };

  function TaoDichVu() {
    const TaoTaiKhoan = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 1, ...data }));
    const CapNhatTaiKhoan = jest.fn().mockResolvedValue({ id: 1 });
    const TimTaiKhoan = jest.fn();
    const PrismaGia = {
      tai_khoan: {
        findUnique: jest.fn().mockResolvedValue(null), findFirst: TimTaiKhoan,
        create: TaoTaiKhoan, update: CapNhatTaiKhoan,
      },
      giao_vien: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue({ id: 9, tai_khoan_id: 1 }),
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 9, ...data })),
      },
      $transaction: jest.fn(),
    };
    PrismaGia.$transaction.mockImplementation(async (Ham) => Ham(PrismaGia));
    const Prisma = PrismaGia as unknown as PrismaService;
    return { Service: new GiaoVienService(Prisma), Prisma, TaoTaiKhoan, CapNhatTaiKhoan, TimTaiKhoan };
  }

  it('tạo tài khoản bằng mật khẩu Admin nhập, lưu hash và đăng nhập được', async () => {
    const { Service, Prisma, TaoTaiKhoan, TimTaiKhoan } = TaoDichVu();
    const MatKhau = ' GvDemo@123 ';
    const KetQua = await Service.TaoGiaoVien({ ...Form, mat_khau_ban_dau: MatKhau });
    const DuLieu = TaoTaiKhoan.mock.calls[0][0].data;
    expect(KetQua.tai_khoan.mat_khau_ban_dau).toBe(MatKhau);
    expect(DuLieu.mat_khau_bam).not.toBe(MatKhau);
    expect(await argon2.verify(DuLieu.mat_khau_bam as string, MatKhau)).toBe(true);
    TimTaiKhoan.mockResolvedValue({ id: 1, ...DuLieu });
    const Jwt = { signAsync: jest.fn().mockResolvedValue('token-demo') } as unknown as JwtService;
    const Auth = new AuthService(Prisma, Jwt);
    const Login = await Auth.DangNhap(KetQua.tai_khoan.ten_dang_nhap, MatKhau);
    expect(Login.tai_khoan.phai_doi_mat_khau).toBe(true);
    await expect(Auth.DangNhap(KetQua.tai_khoan.ten_dang_nhap, 'SaiMatKhau')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([undefined, ''])('vẫn tạo mật khẩu đăng nhập được khi để trống (%s)', async (MatKhau) => {
    const { Service, TaoTaiKhoan } = TaoDichVu();
    const KetQua = await Service.TaoGiaoVien({ ...Form, mat_khau_ban_dau: MatKhau });
    expect(KetQua.tai_khoan.mat_khau_ban_dau.length).toBeGreaterThanOrEqual(8);
    expect(await argon2.verify(TaoTaiKhoan.mock.calls[0][0].data.mat_khau_bam as string, KetQua.tai_khoan.mat_khau_ban_dau)).toBe(true);
  });

  it('cấp lại bằng mật khẩu đã chọn và buộc giáo viên đổi mật khẩu', async () => {
    const { Service, CapNhatTaiKhoan } = TaoDichVu();
    const KetQua = await Service.CapLaiMatKhauGiaoVien(9, 'GvDemo@456');
    const DuLieu = CapNhatTaiKhoan.mock.calls[0][0].data;
    expect(KetQua.mat_khau_moi).toBe('GvDemo@456');
    expect(await argon2.verify(DuLieu.mat_khau_bam, 'GvDemo@456')).toBe(true);
    expect(DuLieu).toEqual(expect.objectContaining({ phai_doi_mat_khau: true, ngay_doi_mat_khau: null }));
  });

  it('giữ cách gọi cấp lại mật khẩu cũ không có tham số mật khẩu', async () => {
    const { Service, CapNhatTaiKhoan } = TaoDichVu();
    const KetQua = await Service.CapLaiMatKhauGiaoVien(9);
    expect(await argon2.verify(CapNhatTaiKhoan.mock.calls[0][0].data.mat_khau_bam, KetQua.mat_khau_moi)).toBe(true);
  });

  it.each([123, null, [], '1234567', ' '.repeat(8), 'A'.repeat(129)])('từ chối mật khẩu sai trước khi ghi database (%#)', async (MatKhau) => {
    const { Service, TaoTaiKhoan, CapNhatTaiKhoan } = TaoDichVu();
    await expect(Service.TaoGiaoVien({ ...Form, mat_khau_ban_dau: MatKhau as string })).rejects.toBeInstanceOf(BadRequestException);
    await expect(Service.CapLaiMatKhauGiaoVien(9, MatKhau as string)).rejects.toBeInstanceOf(BadRequestException);
    expect(TaoTaiKhoan).not.toHaveBeenCalled();
    expect(CapNhatTaiKhoan).not.toHaveBeenCalled();
  });
});
