// Một ngày có ít nhất một buổi vắng được đếm một lần.
// Khử trùng theo ngày/buổi nếu lịch sử chuyển lớp có hai bản ghi.
export function TinhThongKeNghi(DanhSach: Array<{ ngay_hoc: Date; buoi_hoc: string; trang_thai: string }>) {
  const Buoi = new Map<string, { ngay: string; co_phep: boolean }>();
  for (const Item of DanhSach) {
    if (!['VANG_CO_PHEP', 'VANG_KHONG_PHEP'].includes(Item.trang_thai)) continue;
    const Ngay = Item.ngay_hoc.toISOString().slice(0, 10);
    const Key = Ngay + '/' + Item.buoi_hoc;
    const Cu = Buoi.get(Key);
    Buoi.set(Key, { ngay: Ngay, co_phep: Item.trang_thai === 'VANG_CO_PHEP' && (Cu?.co_phep ?? true) });
  }
  const GiaTri = [...Buoi.values()];
  return {
    so_ngay_co_vang: new Set(GiaTri.map(Item => Item.ngay)).size,
    so_buoi_vang: GiaTri.length,
    so_buoi_co_phep: GiaTri.filter(Item => Item.co_phep).length,
    so_buoi_khong_phep: GiaTri.filter(Item => !Item.co_phep).length,
  };
}
