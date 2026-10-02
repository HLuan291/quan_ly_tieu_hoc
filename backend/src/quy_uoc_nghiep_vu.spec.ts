import { BadRequestException } from '@nestjs/common';
import { KiemTraGiaTriQuyUoc, QuyUoc } from './quy_uoc_nghiep_vu';

describe('Giá trị nghiệp vụ theo đúng loại đánh giá', () => {
  it.each([undefined, null, 123, {}, '', '   ', 'SAI_QUY_UOC', 'VANG'])('từ chối trạng thái điểm danh không hợp lệ %#', (GiaTri) => {
    expect(() => KiemTraGiaTriQuyUoc(GiaTri, QuyUoc.DiemDanh, 'Trạng thái')).toThrow(BadRequestException);
  });

  it('chuẩn hóa khoảng trắng và chữ thường nhưng không đổi ý nghĩa', () => {
    expect(KiemTraGiaTriQuyUoc('  vang_co_phep  ', QuyUoc.DiemDanh, 'Trạng thái')).toBe('VANG_CO_PHEP');
  });

  it.each(['TOT', 'DAT', 'CAN_CO_GANG', 'HOAN_THANH_XUAT_SAC'])('môn học không nhận mức của nhóm khác: %s', (Muc) => {
    expect(() => KiemTraGiaTriQuyUoc(Muc, QuyUoc.DanhGiaMon, 'Mức môn')).toThrow(BadRequestException);
  });

  it.each(['HOAN_THANH_TOT', 'HOAN_THANH', 'CHUA_HOAN_THANH'])('năng lực/phẩm chất không nhận mức môn học: %s', (Muc) => {
    expect(() => KiemTraGiaTriQuyUoc(Muc, QuyUoc.NangLucPhamChat, 'Mức năng lực')).toThrow(BadRequestException);
  });

  it('hoàn thành xuất sắc chỉ dùng cho tổng kết', () => {
    expect(KiemTraGiaTriQuyUoc('HOAN_THANH_XUAT_SAC', QuyUoc.TongKetGiaoDuc, 'Tổng kết')).toBe('HOAN_THANH_XUAT_SAC');
    expect(() => KiemTraGiaTriQuyUoc('HOAN_THANH_XUAT_SAC', QuyUoc.HoanThanhLop, 'Hoàn thành lớp')).toThrow(BadRequestException);
  });
});
