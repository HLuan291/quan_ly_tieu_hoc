export interface LopHoc {
  id: number; ten_lop: string; khoi_id: number; nam_hoc_id: number;
  khoi: { id: number; ten_khoi: string; so_khoi: number };
  nam_hoc: { id: number; ten_nam_hoc: string };
}
export interface HocSinhTomTat {
  id: number; ma_hoc_sinh: string; ho_ten: string; ngay_sinh: string; gioi_tinh: string;
  dan_toc: string; so_dien_thoai_lien_he: string; trang_thai: string;
  xep_lop: Array<{ id: number; lop_hoc: LopHoc; ngay_bat_dau: string; ngay_ket_thuc: string | null; trang_thai: string; ghi_chu?: string | null; ngay_xep_lop?: string }>;
}
export interface PhuHuynh {
  id: number; ho_ten: string; nam_sinh: number | null; so_dien_thoai: string;
  nghe_nghiep: string | null; tai_khoan_id: number | null; ngay_tao: string; ngay_cap_nhat: string;
}
export interface HoSoHocSinh extends HocSinhTomTat {
  quoc_tich: string; noi_sinh: string; dia_chi_thuong_tru: string; dia_chi_hien_tai: string;
  ngay_nhap_hoc: string; ghi_chu: string | null; chieu_cao_cm: number | string | null;
  can_nang_kg: number | string | null; ngay_do: string | null; ngay_tao: string; ngay_cap_nhat: string;
  phu_huynh_hoc_sinh: Array<{ moi_quan_he: string; ngay_lien_ket: string; phu_huynh: PhuHuynh }>;
  thong_ke_nghi: { so_ngay_co_vang: number; so_buoi_vang: number; so_buoi_co_phep: number; so_buoi_khong_phep: number };
}

export interface DanhMucLop {
  che_do: 'ADMIN' | 'GVCN' | 'GVBM' | 'CHUA_PHAN_CONG';
  lop_chu_nhiem_id: number | null; lop_hoc: LopHoc[];
}
