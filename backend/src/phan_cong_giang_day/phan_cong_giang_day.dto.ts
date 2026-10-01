export class TaoMonHocDto {
  ma_mon_hoc!: string;
  ten_mon_hoc!: string;
}

export class CapNhatMonHocDto {
  ten_mon_hoc?: string;
  trang_thai?: string;
}

export class GanMonHocChoKhoiDto {
  mon_hoc_id!: number;
  khoi_id!: number;
  mac_dinh_gvcn?: boolean;
}

export class CapNhatMonHocKhoiDto {
  mac_dinh_gvcn!: boolean;
}

export class PhanCongGvcnDto {
  giao_vien_id!: number;
  lop_hoc_id!: number;

  ngay_bat_dau!: string;
  ngay_ket_thuc?: string;
}

export class PhanCongMonHocDto {
  giao_vien_id!: number;
  lop_hoc_id!: number;
  mon_hoc_id!: number;

  loai_phan_cong!: string;

  ngay_bat_dau!: string;
  ngay_ket_thuc?: string;
}

export class KetThucPhanCongDto {
  ngay_ket_thuc!: string;
}