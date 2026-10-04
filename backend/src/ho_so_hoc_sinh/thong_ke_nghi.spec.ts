import { TinhThongKeNghi } from './thong_ke_nghi';
describe('Thống kê nghỉ theo điểm danh', () => {
  const Ngay = new Date('2026-10-01T00:00:00Z');
  it('đếm hai buổi cùng ngày thành một ngày có vắng', () => {
    expect(TinhThongKeNghi([
      { ngay_hoc: Ngay, buoi_hoc: 'SANG', trang_thai: 'VANG_CO_PHEP' },
      { ngay_hoc: Ngay, buoi_hoc: 'CHIEU', trang_thai: 'VANG_KHONG_PHEP' },
      { ngay_hoc: new Date('2026-10-02T00:00:00Z'), buoi_hoc: 'SANG', trang_thai: 'CO_MAT' },
    ])).toEqual({ so_ngay_co_vang: 1, so_buoi_vang: 2, so_buoi_co_phep: 1, so_buoi_khong_phep: 1 });
  });
  it('khử trùng buổi ở hai lịch sử lớp, ưu tiên ghi nhận không phép', () => {
    expect(TinhThongKeNghi([
      { ngay_hoc: Ngay, buoi_hoc: 'SANG', trang_thai: 'VANG_CO_PHEP' },
      { ngay_hoc: Ngay, buoi_hoc: 'SANG', trang_thai: 'VANG_KHONG_PHEP' },
    ])).toEqual({ so_ngay_co_vang: 1, so_buoi_vang: 1, so_buoi_co_phep: 0, so_buoi_khong_phep: 1 });
  });
  it('đi trễ không được tính vào buổi hoặc ngày vắng', () => {
    expect(TinhThongKeNghi([
      { ngay_hoc: Ngay, buoi_hoc: 'SANG', trang_thai: 'DI_TRE' },
      { ngay_hoc: Ngay, buoi_hoc: 'CHIEU', trang_thai: 'CO_MAT' },
    ])).toEqual({ so_ngay_co_vang: 0, so_buoi_vang: 0, so_buoi_co_phep: 0, so_buoi_khong_phep: 0 });
  });
  it('hồ sơ chưa có điểm danh vắng trả các tổng bằng 0', () => {
    expect(TinhThongKeNghi([]).so_ngay_co_vang).toBe(0);
  });
});
