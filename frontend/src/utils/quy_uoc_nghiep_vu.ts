// Cùng một danh mục JSON cho backend và giao diện, tránh lệch mã khi sửa quy ước.
import QuyUoc from '../../../backend/src/danh_muc_quy_uoc.json';

export { QuyUoc };

export function LayNhanQuyUoc(
  DanhSach: ReadonlyArray<{ Ma: string; Ten: string }>,
  Ma: string,
): string {
  return DanhSach.find((Item) => Item.Ma === Ma)?.Ten ?? Ma;
}
