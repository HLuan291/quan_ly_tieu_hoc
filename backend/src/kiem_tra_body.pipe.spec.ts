import { BadRequestException } from '@nestjs/common';
import { KiemTraBodyPipe } from './kiem_tra_body.pipe';
import { TaoLopHocDto } from './to_chuc_lop_hoc/to_chuc_lop_hoc.dto';
import { TaoHocSinhKemPhuHuynhDto } from './ho_so_hoc_sinh/ho_so_hoc_sinh.dto';
import { CapLaiMatKhauGiaoVienDto } from './giao_vien/giao_vien.dto';

describe('Kiểm tra JSON trước Service', () => {
  const Pipe = new KiemTraBodyPipe();
  const Metadata = { type: 'body' as const, metatype: TaoLopHocDto };
  it.each([null, [], 'text', { nam_hoc_id: '1', khoi_id: 1, ten_lop: '2A' }, { nam_hoc_id: 1, khoi_id: 1, ten_lop: 123 }, { nam_hoc_id: 1, ten_lop: '2A' }])('trả 400 cho body sai kiểu/thiếu trường %#', (Body) => {
    expect(() => Pipe.transform(Body, Metadata)).toThrow(BadRequestException);
  });
  it('từ chối họ tên vượt giới hạn cột MySQL', () => {
    expect(() => Pipe.transform({ ho_ten: 'A'.repeat(101) }, { type: 'body', metatype: Object })).toThrow(BadRequestException);
  });
  it('giữ nguyên body hợp lệ', () => {
    const Body = { nam_hoc_id: 1, khoi_id: 1, ten_lop: '2A' };
    expect(Pipe.transform(Body, Metadata)).toBe(Body);
  });
  it('từ chối phần tử phụ huynh null', () => {
    expect(() => Pipe.transform({ hoc_sinh: {}, phu_huynh: [null] }, { type: 'body', metatype: TaoHocSinhKemPhuHuynhDto })).toThrow(BadRequestException);
  });
  it('không kiểm tra lại tham số query thành chuỗi', () => {
    expect(Pipe.transform('1', { type: 'query' })).toBe('1');
  });
  it('chấp nhận request cấp lại mật khẩu cũ không có body', () => {
    expect(Pipe.transform(undefined, { type: 'body', metatype: CapLaiMatKhauGiaoVienDto })).toEqual({});
    expect(() => Pipe.transform(undefined, Metadata)).toThrow(BadRequestException);
  });
  it.each(['mat_khau_ban_dau', 'mat_khau_moi'])('trả 400 khi %s sai kiểu', (Ten) => {
    expect(() => Pipe.transform({ [Ten]: 123 }, { type: 'body', metatype: Object })).toThrow(BadRequestException);
  });
});
