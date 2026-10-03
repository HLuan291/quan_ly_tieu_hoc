const { CheckCu, CheckMoi, CheckChuyenTiep, NhanDangCheck, TaoKeHoach } = require('../../scripts/sua-rang-buoc-phan-cong.cjs');

describe('Chuyển ràng buộc và dữ liệu phân công cũ', () => {
  const Dong = { id: 7, giao_vien_id: 2, lop_hoc_id: 3, mon_hoc_id: null, nguon_phan_cong: null, ngay_bat_dau: '2024-09-01', ngay_ket_thuc: '2025-06-01', ngay_tao: '2024-08-01 10:00:00' };

  it('nhận diện cả biểu thức MySQL có backtick và charset introducer', () => {
    expect(NhanDangCheck(CheckCu.replace(/loai_phan_cong/g, '`loai_phan_cong`').replace(/'CHU_NHIEM'/g, "_utf8mb4'CHU_NHIEM'"))).toBe('CU');
    expect(NhanDangCheck(CheckCu.replace(/'([A-Z_]+)'/g, "_utf8mb4\\'$1\\'"))).toBe('CU');
    expect(NhanDangCheck(CheckMoi)).toBe('MOI');
    expect(NhanDangCheck(CheckChuyenTiep)).toBe('CHUYEN_TIEP');
  });

  it('dừng nếu ràng buộc khác mẫu đã kiểm chứng', () => {
    expect(() => NhanDangCheck("loai_phan_cong IN ('GVCN')")).toThrow('khác mẫu');
  });

  it('đổi chủ nhiệm và môn cũ, giữ nguyên toàn bộ dữ liệu còn lại', () => {
    const DuLieu = [
      { ...Dong, loai_phan_cong: 'CHU_NHIEM' },
      { ...Dong, id: 8, loai_phan_cong: 'GIANG_DAY', mon_hoc_id: 4, nguon_phan_cong: 'TU_DONG_GVCN' },
      { ...Dong, id: 9, loai_phan_cong: 'GIANG_DAY', mon_hoc_id: 5, nguon_phan_cong: 'BO_SUNG' },
    ];
    expect(TaoKeHoach(DuLieu)).toEqual(DuLieu.map((Item, ViTri) => ({ ...Item, loai_phan_cong: ['GVCN', 'GVCN', 'GVBM'][ViTri] })));
    expect(DuLieu[0].loai_phan_cong).toBe('CHU_NHIEM');
  });

  it('chạy lại trên dữ liệu đã chuyển không thay đổi kế hoạch', () => {
    const DuLieu = [
      { ...Dong, loai_phan_cong: 'GVCN' },
      { ...Dong, loai_phan_cong: 'GVCN', nguon_phan_cong: 'BO_SUNG' },
      { ...Dong, loai_phan_cong: 'GVCN', mon_hoc_id: 4, nguon_phan_cong: 'TU_DONG_GVCN' },
      { ...Dong, loai_phan_cong: 'GVBM', mon_hoc_id: 5, nguon_phan_cong: 'BO_SUNG' },
    ];
    expect(TaoKeHoach(DuLieu)).toEqual(DuLieu);
  });

  it.each([
    { loai_phan_cong: 'SAI' },
    { loai_phan_cong: 'CHU_NHIEM', mon_hoc_id: 4 },
    { loai_phan_cong: 'GIANG_DAY', mon_hoc_id: 4, nguon_phan_cong: 'SAI' },
    { loai_phan_cong: 'GIANG_DAY', mon_hoc_id: 4, nguon_phan_cong: null },
    { loai_phan_cong: 'GVBM', nguon_phan_cong: 'BO_SUNG' },
    { loai_phan_cong: 'GVBM', mon_hoc_id: 4, nguon_phan_cong: 'TU_DONG_GVCN' },
    { loai_phan_cong: 'GVCN', nguon_phan_cong: 'TU_DONG_GVCN' },
  ])('từ chối dữ liệu không thể chuyển an toàn (%#)', (DuLieu) => {
    expect(() => TaoKeHoach([{ ...Dong, ...DuLieu }])).toThrow();
  });
});
