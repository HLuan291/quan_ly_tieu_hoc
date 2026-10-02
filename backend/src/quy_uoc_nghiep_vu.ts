import { BadRequestException } from '@nestjs/common';
import QuyUoc from './danh_muc_quy_uoc.json';

export { QuyUoc };

export function KiemTraGiaTriQuyUoc(
  GiaTri: unknown,
  DanhSach: ReadonlyArray<{ Ma: string; Ten: string }>,
  TenTruong: string,
): string {
  const Ma = typeof GiaTri === 'string' ? GiaTri.trim().toUpperCase() : '';
  if (!DanhSach.some((Item) => Item.Ma === Ma)) {
    throw new BadRequestException(`${TenTruong} phải là một trong: ${DanhSach.map((Item) => Item.Ma).join(', ')}`);
  }
  return Ma;
}
