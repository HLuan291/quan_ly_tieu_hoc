export class TaoNamHocDto {
  ten_nam_hoc!: string;
}

export class CapNhatNamHocDto {
  ten_nam_hoc?: string;
  trang_thai?: string;
}

export class TaoLopHocDto {
  nam_hoc_id!: number;
  khoi_id!: number;
  ten_lop!: string;
  ghi_chu?: string;
}

export class CapNhatLopHocDto {
  ten_lop?: string;
  ghi_chu?: string | null;
}

export class XepHocSinhVaoLopDto {
  hoc_sinh_id!: number;
  lop_hoc_id!: number;
  ngay_bat_dau!: string;
  ngay_ket_thuc?: string;
  ghi_chu?: string;
}

export class CapNhatXepLopDto {
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string | null;
  ghi_chu?: string | null;
}