import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// DTO TypeScript chỉ mô tả kiểu lúc biên dịch. Kiểm tra JSON thật trước khi Service dùng trim/Prisma.
const TruongBatBuoc: Record<string, string[]> = {
  TaoNamHocDto: ['ten_nam_hoc'],
  TaoLopHocDto: ['nam_hoc_id', 'khoi_id', 'ten_lop'],
  XepHocSinhVaoLopDto: ['hoc_sinh_id', 'lop_hoc_id', 'ngay_bat_dau'],
  TaoMonHocDto: ['ma_mon_hoc', 'ten_mon_hoc'],
  GanMonHocChoKhoiDto: ['mon_hoc_id', 'khoi_id'],
  CapNhatMonHocKhoiDto: ['mac_dinh_gvcn'],
  PhanCongGvcnDto: ['giao_vien_id', 'lop_hoc_id', 'ngay_bat_dau'],
  PhanCongMonHocDto: ['giao_vien_id', 'lop_hoc_id', 'mon_hoc_id', 'loai_phan_cong', 'ngay_bat_dau'],
  KetThucPhanCongDto: ['ngay_ket_thuc'],
  TaoHocSinhKemPhuHuynhDto: ['hoc_sinh', 'phu_huynh'],
  CapNhatTrangThaiHocSinhDto: ['trang_thai'],
  CapNhatSucKhoeHocSinhDto: ['chieu_cao_cm', 'can_nang_kg', 'ngay_do'],
  CapNhatMoiQuanHeDto: ['moi_quan_he'],
  ThongTinPhuHuynhDto: ['moi_quan_he'],
  DiemDanhHangLoatDto: ['lop_hoc_id', 'ngay_hoc', 'buoi_hoc', 'danh_sach'],
  TaoDonXinNghiDto: ['hoc_sinh_id', 'ngay_bat_dau', 'ngay_ket_thuc', 'buoi_nghi', 'ly_do'],
  XuLyDonXinNghiDto: ['trang_thai'],
  TaoDotDanhGiaDto: ['nam_hoc_id', 'ma_dot', 'ten_dot', 'hoc_ky', 'thu_tu'],
  TaoCauHinhDanhGiaMonDto: ['dot_danh_gia_id', 'khoi_id', 'mon_hoc_id'],
  TaoCauHinhDiemDto: ['dot_danh_gia_id', 'khoi_id', 'mon_hoc_id', 'ma_loai_diem', 'ten_hien_thi', 'thu_tu_hien_thi', 'cach_nhap'],
  TaoTieuChiDanhGiaDto: ['ma_tieu_chi', 'ten_tieu_chi', 'nhom_danh_gia', 'thu_tu_hien_thi'],
  CapNhatKetQuaMonHocDto: ['hoc_sinh_id', 'mon_hoc_id', 'dot_danh_gia_id', 'muc_danh_gia'],
  NhapDiemDinhKyDto: ['hoc_sinh_id', 'cau_hinh_diem_id', 'diem', 'ngay_kiem_tra'],
  NhapDiemKiemTraLaiDto: ['diem', 'ngay_kiem_tra'],
  CapNhatNangLucPhamChatDto: ['hoc_sinh_id', 'dot_danh_gia_id', 'tieu_chi_danh_gia_id', 'muc_danh_gia'],
  CapNhatTongKetGiaoDucDto: ['hoc_sinh_id', 'dot_danh_gia_id'],
};
const TruongChuoi = new Set([
  'ten_dang_nhap_hoac_so_dien_thoai', 'mat_khau', 'mat_khau_cu', 'mat_khau_moi', 'ho_ten', 'gioi_tinh',
  'so_dien_thoai', 'so_dien_thoai_lien_he', 'email', 'dia_chi_lien_he', 'trinh_do_chuyen_mon', 'dan_toc',
  'quoc_tich', 'noi_sinh', 'dia_chi_thuong_tru', 'dia_chi_hien_tai', 'ghi_chu', 'nghe_nghiep', 'moi_quan_he',
  'trang_thai', 'ten_nam_hoc', 'ten_lop', 'ma_mon_hoc', 'ten_mon_hoc', 'loai_phan_cong', 'buoi_hoc', 'buoi_nghi',
  'ly_do', 'ly_do_tu_choi', 'ma_dot', 'ten_dot', 'hoc_ky', 'ma_loai_diem', 'ten_hien_thi', 'cach_nhap',
  'ma_tieu_chi', 'ten_tieu_chi', 'nhom_danh_gia', 'muc_danh_gia', 'nhan_xet', 'ly_do_kiem_tra_lai',
  'muc_ket_qua_giao_duc', 'ket_qua_hoan_thanh_lop',
]);
const TruongCoTheNull = new Set(['ghi_chu', 'nghe_nghiep', 'nam_sinh', 'ngay_ket_thuc', 'nhan_xet', 'ly_do_tu_choi', 'ly_do_kiem_tra_lai', 'muc_ket_qua_giao_duc', 'ket_qua_hoan_thanh_lop']);
const TruongBoolean = new Set(['tao_tai_khoan', 'mac_dinh_gvcn', 'bat_buoc']);
const TruongSo = new Set(['nam_sinh', 'thu_tu', 'thu_tu_hien_thi', 'diem', 'chieu_cao_cm', 'can_nang_kg']);

@Injectable()
export class KiemTraBodyPipe implements PipeTransform {
  transform(GiaTri: unknown, Metadata: ArgumentMetadata) {
    if (Metadata.type !== 'body') return GiaTri;
    this.KiemTraDoiTuong(GiaTri, 'Dữ liệu');
    const Body = GiaTri as Record<string, unknown>;
    for (const Ten of TruongBatBuoc[Metadata.metatype?.name ?? ''] ?? []) {
      if (Body[Ten] === undefined || Body[Ten] === null || Body[Ten] === '') {
        throw new BadRequestException(`Thiếu thông tin ${Ten}`);
      }
    }
    return GiaTri;
  }

  private KiemTraDoiTuong(GiaTri: unknown, DuongDan: string) {
    if (!GiaTri || typeof GiaTri !== 'object' || Array.isArray(GiaTri)) {
      throw new BadRequestException(`${DuongDan} phải là một đối tượng JSON`);
    }
    for (const [Ten, GiaTriTruong] of Object.entries(GiaTri)) {
      if (GiaTriTruong === null && TruongCoTheNull.has(Ten)) continue;
      const Loi = () => { throw new BadRequestException(`${DuongDan}.${Ten} không đúng kiểu hoặc giá trị`); };
      if (Ten === 'phu_huynh' || Ten === 'danh_sach') {
        if (!Array.isArray(GiaTriTruong)) Loi();
        for (const [ViTri, Dong] of (GiaTriTruong as unknown[]).entries()) this.KiemTraDoiTuong(Dong, `${DuongDan}.${Ten}[${ViTri}]`);
      } else if (Ten === 'hoc_sinh') {
        this.KiemTraDoiTuong(GiaTriTruong, `${DuongDan}.${Ten}`);
      } else if (Ten.endsWith('_id') || Ten === 'id') {
        if (typeof GiaTriTruong !== 'number' || !Number.isSafeInteger(GiaTriTruong) || GiaTriTruong <= 0) Loi();
      } else if (TruongBoolean.has(Ten)) {
        if (typeof GiaTriTruong !== 'boolean') Loi();
      } else if (TruongSo.has(Ten)) {
        if (typeof GiaTriTruong !== 'number' || !Number.isFinite(GiaTriTruong)) Loi();
        if (['nam_sinh', 'thu_tu', 'thu_tu_hien_thi'].includes(Ten) && (!Number.isInteger(GiaTriTruong) || (GiaTriTruong as number) < 0)) Loi();
      } else if (TruongChuoi.has(Ten)) {
        if (typeof GiaTriTruong !== 'string') Loi();
        if (Ten === 'ho_ten' && Array.from(GiaTriTruong as string).length > 100) Loi();
      } else if (Ten.startsWith('ngay_')) {
        if (typeof GiaTriTruong !== 'string') Loi();
        const Ngay = new Date(`${GiaTriTruong}T00:00:00.000Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(GiaTriTruong as string) || Number.isNaN(Ngay.getTime()) || Ngay.toISOString().slice(0, 10) !== GiaTriTruong) Loi();
      }
    }
  }
}
