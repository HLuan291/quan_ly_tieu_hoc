export class TaoDotDanhGiaDto {
  nam_hoc_id!: number;
  ma_dot!: string;
  ten_dot!: string;
  hoc_ky!: string;
  thu_tu!: number;
}

export class TaoCauHinhDanhGiaMonDto {
  dot_danh_gia_id!: number;
  khoi_id!: number;
  mon_hoc_id!: number;
}

export class TaoCauHinhDiemDto {
  dot_danh_gia_id!: number;
  khoi_id!: number;
  mon_hoc_id!: number;

  ma_loai_diem!: string;
  ten_hien_thi!: string;

  bat_buoc?: boolean;
  thu_tu_hien_thi!: number;

  // NHAP_TAY | TU_TINH
  cach_nhap!: string;
}

export class TaoTieuChiDanhGiaDto {
  ma_tieu_chi!: string;
  ten_tieu_chi!: string;

  // NANG_LUC | PHAM_CHAT
  nhom_danh_gia!: string;

  thu_tu_hien_thi!: number;
}

export class CapNhatKetQuaMonHocDto {
  hoc_sinh_id!: number;
  mon_hoc_id!: number;
  dot_danh_gia_id!: number;

  muc_danh_gia!: string;
  nhan_xet?: string;
}

export class NhapDiemDinhKyDto {
  hoc_sinh_id!: number;
  cau_hinh_diem_id!: number;
  diem!: number;
  ngay_kiem_tra!: string;
}

export class NhapDiemKiemTraLaiDto {
  diem!: number;
  ngay_kiem_tra!: string;
  ly_do_kiem_tra_lai?: string;
}

export class CapNhatNangLucPhamChatDto {
  hoc_sinh_id!: number;
  dot_danh_gia_id!: number;
  tieu_chi_danh_gia_id!: number;

  muc_danh_gia!: string;
  nhan_xet?: string;
}

export class CapNhatTongKetGiaoDucDto {
  hoc_sinh_id!: number;
  dot_danh_gia_id!: number;

  muc_ket_qua_giao_duc?: string;
  ket_qua_hoan_thanh_lop?: string;
}