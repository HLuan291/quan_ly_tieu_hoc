export class MotHocSinhDiemDanhDto {
  xep_lop_id!: number;
  trang_thai!: string;
  ghi_chu?: string;
}

export class DiemDanhHangLoatDto {
  lop_hoc_id!: number;
  ngay_hoc!: string;
  buoi_hoc!: string;

  danh_sach!: MotHocSinhDiemDanhDto[];
}

export class TaoDonXinNghiDto {
  hoc_sinh_id!: number;
  ngay_bat_dau!: string;
  ngay_ket_thuc!: string;
  buoi_nghi!: string;
  ly_do!: string;
}

export class XuLyDonXinNghiDto {
  trang_thai!: string;
  ly_do_tu_choi?: string;
}