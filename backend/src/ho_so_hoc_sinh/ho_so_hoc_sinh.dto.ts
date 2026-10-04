export class TaoHocSinhDto {
  ho_ten!: string;
  ngay_sinh!: string;
  gioi_tinh!: string;
  dan_toc!: string;
  quoc_tich!: string;
  noi_sinh!: string;

  so_dien_thoai_lien_he!: string;

  dia_chi_thuong_tru!: string;
  dia_chi_hien_tai!: string;

  ngay_nhap_hoc!: string;

  ghi_chu?: string;
}


export class ThongTinPhuHuynhDto {
  // Có ID = chọn phụ huynh đã tồn tại
  phu_huynh_id?: number;

  // Không có ID = tạo phụ huynh mới
  ho_ten?: string;
  nam_sinh?: number;
  so_dien_thoai?: string;
  nghe_nghiep?: string;

  moi_quan_he!: string;

  // Có muốn tạo tài khoản đăng nhập ngay không
  tao_tai_khoan?: boolean;
}


export class TaoHocSinhKemPhuHuynhDto {
  hoc_sinh!: TaoHocSinhDto;

  // Bắt buộc ít nhất 1 phụ huynh
  phu_huynh!: ThongTinPhuHuynhDto[];
}


export class CapNhatHocSinhDto {
  ho_ten?: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
  dan_toc?: string;
  quoc_tich?: string;
  noi_sinh?: string;

  so_dien_thoai_lien_he?: string;

  dia_chi_thuong_tru?: string;
  dia_chi_hien_tai?: string;

  ngay_nhap_hoc?: string;

  ghi_chu?: string | null;
}


export class CapNhatTrangThaiHocSinhDto {
  trang_thai!: string;
}


export class CapNhatSucKhoeHocSinhDto {
  chieu_cao_cm!: number;
  can_nang_kg!: number;
  ngay_do!: string;
}


export class CapNhatPhuHuynhDto {
  ho_ten?: string;
  nam_sinh?: number | null;
  so_dien_thoai?: string;
  nghe_nghiep?: string | null;
}


export class CapNhatMoiQuanHeDto {
  moi_quan_he!: string;
}
export class PhuHuynhTrongHoSoDto extends CapNhatPhuHuynhDto {
  id!: number;
  moi_quan_he?: string;
}

export class NguoiGiamHoMoiDto {
  ho_ten!: string;
  nam_sinh?: number | null;
  so_dien_thoai!: string;
  nghe_nghiep?: string | null;
}

// Một lần lưu cho các phần của hồ sơ; không cấp tài khoản hoặc đổi liên kết theo ID.
export class CapNhatHoSoHocSinhDto {
  hoc_sinh?: CapNhatHocSinhDto;
  suc_khoe?: CapNhatSucKhoeHocSinhDto | null;
  trang_thai?: string;
  phu_huynh?: PhuHuynhTrongHoSoDto[];
  nguoi_giam_ho?: NguoiGiamHoMoiDto;
}
