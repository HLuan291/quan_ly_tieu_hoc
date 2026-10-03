// Chạy trên database kiểm thử riêng: AUDIT_ALLOW_TEST_DATA=1 DATABASE_URL=... node scripts/runtime-audit.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const argon2 = require('argon2');
const { JwtService } = require('@nestjs/jwt');
const { PrismaService } = require('../dist/prisma.service');

const Database = new URL(process.env.DATABASE_URL || 'mysql://missing');
if (process.env.AUDIT_ALLOW_TEST_DATA !== '1' || !Database.pathname.includes('audit')) {
  throw new Error('Chỉ chạy với database có tên chứa audit và AUDIT_ALLOW_TEST_DATA=1. Script tạo dữ liệu giả, không xóa dữ liệu.');
}
const Prisma = new PrismaService();
const KetQua = [];
const Tokens = {};
const ApiUrl = process.env.AUDIT_API_URL || 'http://127.0.0.1:3000';
const MaLan = Date.now().toString();
const MatKhau = 'Audit@Password123';
let Server;

async function Goi(Ten, Method, Url, VaiTro, Body, Status = 200) {
  const Response = await fetch(ApiUrl + Url, {
    method: Method,
    headers: { 'Content-Type': 'application/json', ...(Tokens[VaiTro] ? { Authorization: `Bearer ${Tokens[VaiTro]}` } : {}) },
    body: Body === undefined ? undefined : JSON.stringify(Body),
  });
  const NoiDung = await Response.text();
  let Data;
  try { Data = JSON.parse(NoiDung); } catch { Data = { noi_dung: NoiDung }; }
  const Dat = Response.status === Status;
  KetQua.push({ ten: Ten, method: Method, endpoint: Url, vai_tro: VaiTro || 'KHACH', mong_doi: Status, thuc_te: Response.status, dat: Dat, ...(Dat ? {} : { thong_bao: Data.message || 'API chấp nhận dữ liệu/quyền đang kỳ vọng bị từ chối' }) });
  if (!Dat) console.log('FAIL', Ten, 'expected', Status, 'got', Response.status);
  return Data;
}
function Ghi(Ten, Dat) { KetQua.push({ ten: Ten, dat: !!Dat }); if (!Dat) console.log('FAIL', Ten); }
async function DangNhap(Ten, TaiKhoan, VaiTro) {
  const Data = await Goi(Ten, 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: TaiKhoan, mat_khau: MatKhau }, 201);
  assert(Data.access_token, Ten); Tokens[VaiTro] = Data.access_token; return Data;
}
async function Main() {
  const Admin = await Prisma.tai_khoan.create({ data: { ten_dang_nhap: 'audit_admin_' + MaLan, so_dien_thoai: '0990000001', mat_khau_bam: await argon2.hash(MatKhau), vai_tro: 'ADMIN', phai_doi_mat_khau: false } });
  const Khoi = await Prisma.khoi.create({ data: { so_khoi: 2, ten_khoi: 'Khối 2' } });
  Server = spawn(process.execPath, ['dist/main.js'], { env: { ...process.env, PORT: new URL(ApiUrl).port || '3000' }, stdio: ['ignore', fs.openSync(path.resolve('../docs/runtime-server.log'), 'w'), 'pipe'] });
  Server.stderr.on('data', (Data) => fs.appendFileSync(path.resolve('../docs/runtime-server.log'), Data));
  for (let Lan = 0; Lan < 100; Lan++) {
    try { if ((await fetch(ApiUrl + '/')).ok) break; } catch {}
    await new Promise((Done) => setTimeout(Done, 100));
    if (Server.exitCode !== null) throw new Error('Backend không khởi động');
  }
  await Goi('HTTP trang gốc', 'GET', '/', '');
  await Goi('Không token', 'GET', '/giao_vien', '', undefined, 401);
  await Goi('Sai kiểu login', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: 123, mat_khau: MatKhau }, 400);
  await Goi('Sai mật khẩu', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: Admin.ten_dang_nhap, mat_khau: 'wrong' }, 401);
  await DangNhap('Đăng nhập ADMIN', Admin.ten_dang_nhap, 'ADMIN');
  await Goi('Kết nối MySQL', 'GET', '/kiem-tra-db', 'ADMIN');
  await Goi('Danh sách giáo viên rỗng', 'GET', '/giao_vien', 'ADMIN');
  const FormGv = { ho_ten: 'Trần Thị Bình', ngay_sinh: '1990-01-01', gioi_tinh: 'NU', so_dien_thoai: '0990000002', email: 'audit@example.test', dia_chi_lien_he: 'Địa chỉ giả', ngay_vao_truong: '2015-09-01', trinh_do_chuyen_mon: 'Đại học' };
  const Gv = await Goi('Tạo giáo viên', 'POST', '/giao_vien', 'ADMIN', FormGv, 201);
  assert(Gv.giao_vien && Gv.tai_khoan);
  await Goi('Trùng SĐT giáo viên', 'POST', '/giao_vien', 'ADMIN', FormGv, 409);
  await Goi('Tên giáo viên sai kiểu', 'POST', '/giao_vien', 'ADMIN', { ...FormGv, ho_ten: 123 }, 400);
  await Goi('Ngày giáo viên không tồn tại', 'POST', '/giao_vien', 'ADMIN', { ...FormGv, ngay_sinh: '1990-02-30' }, 400);
  await Goi('Sửa giáo viên', 'PATCH', `/giao_vien/${Gv.giao_vien.id}`, 'ADMIN', { email: 'updated@example.test' });
  await Goi('Giáo viên không tồn tại', 'PATCH', '/giao_vien/999999', 'ADMIN', { ho_ten: 'Trần Thị Bình' }, 404);
  let Login = await Goi('Đăng nhập giáo viên lần đầu', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: Gv.tai_khoan.ten_dang_nhap, mat_khau: Gv.tai_khoan.mat_khau_ban_dau }, 201);
  Tokens.GIAO_VIEN = Login.access_token;
  await Goi('Bắt buộc đổi mật khẩu', 'GET', '/phan_cong_giang_day/phan_cong/cua_toi', 'GIAO_VIEN', undefined, 403);
  Login = await Goi('Đổi mật khẩu giáo viên', 'POST', '/auth/doi-mat-khau', 'GIAO_VIEN', { mat_khau_cu: Gv.tai_khoan.mat_khau_ban_dau, mat_khau_moi: MatKhau }, 201);
  Tokens.GIAO_VIEN = Login.access_token;
  await DangNhap('Đăng nhập GIAO_VIEN sau đổi mật khẩu', Gv.tai_khoan.ten_dang_nhap, 'GIAO_VIEN');
  await Goi('Giáo viên không sửa hồ sơ giáo viên', 'PATCH', `/giao_vien/${Gv.giao_vien.id}`, 'GIAO_VIEN', {}, 403);
  const Nam = await Goi('Tạo năm học', 'POST', '/to_chuc_lop_hoc/nam_hoc', 'ADMIN', { ten_nam_hoc: '2026-2027' }, 201);
  await Goi('Trùng năm học', 'POST', '/to_chuc_lop_hoc/nam_hoc', 'ADMIN', { ten_nam_hoc: '2026-2027' }, 409);
  await Goi('Năm học sai khoảng năm', 'POST', '/to_chuc_lop_hoc/nam_hoc', 'ADMIN', { ten_nam_hoc: '2026-2028' }, 400);
  const Lop = await Goi('Tạo lớp', 'POST', '/to_chuc_lop_hoc/lop_hoc', 'ADMIN', { nam_hoc_id: Nam.nam_hoc.id, khoi_id: Khoi.id, ten_lop: '2A' }, 201);
  const LopKhac = await Goi('Tạo lớp ngoài phạm vi', 'POST', '/to_chuc_lop_hoc/lop_hoc', 'ADMIN', { nam_hoc_id: Nam.nam_hoc.id, khoi_id: Khoi.id, ten_lop: '2B' }, 201);
  await Goi('Tạo lớp thiếu ID', 'POST', '/to_chuc_lop_hoc/lop_hoc', 'ADMIN', { ten_lop: '2C' }, 400);
  await Goi('Tạo lớp trùng', 'POST', '/to_chuc_lop_hoc/lop_hoc', 'ADMIN', { nam_hoc_id: Nam.nam_hoc.id, khoi_id: Khoi.id, ten_lop: '2A' }, 409);
  const HocSinh = { ho_ten: 'Nguyễn Văn An', ngay_sinh: '2019-01-01', gioi_tinh: 'NAM', dan_toc: 'Kinh', quoc_tich: 'Việt Nam', noi_sinh: 'Địa chỉ giả', so_dien_thoai_lien_he: '0990000003', dia_chi_thuong_tru: 'Địa chỉ giả', dia_chi_hien_tai: 'Địa chỉ giả', ngay_nhap_hoc: '2025-09-01' };
  const PhuHuynh = { ho_ten: 'Nguyễn Văn Bình', so_dien_thoai: '0990000003', nam_sinh: 1985, moi_quan_he: 'CHA', tao_tai_khoan: true };
  const Hs = await Goi('Tạo học sinh và phụ huynh', 'POST', '/ho_so_hoc_sinh/hoc_sinh', 'ADMIN', { hoc_sinh: HocSinh, phu_huynh: [PhuHuynh] }, 201);
  assert(Hs.hoc_sinh);
  const HsKhac = await Goi('Tạo học sinh ngoài phạm vi', 'POST', '/ho_so_hoc_sinh/hoc_sinh', 'ADMIN', { hoc_sinh: { ...HocSinh, ho_ten: 'Lê Văn Nam', so_dien_thoai_lien_he: '0990000004' }, phu_huynh: [{ ...PhuHuynh, ho_ten: 'Lê Văn Bình', so_dien_thoai: '0990000004' }] }, 201);
  await Goi('Học sinh ngày tương lai', 'POST', '/ho_so_hoc_sinh/hoc_sinh', 'ADMIN', { hoc_sinh: { ...HocSinh, ngay_sinh: '2099-01-01' }, phu_huynh: [PhuHuynh] }, 400);
  await Goi('Học sinh SĐT 11 số', 'POST', '/ho_so_hoc_sinh/hoc_sinh', 'ADMIN', { hoc_sinh: { ...HocSinh, so_dien_thoai_lien_he: '09900000031' }, phu_huynh: [PhuHuynh] }, 400);
  await Goi('Phụ huynh null', 'POST', '/ho_so_hoc_sinh/hoc_sinh', 'ADMIN', { hoc_sinh: HocSinh, phu_huynh: [null] }, 400);
  await Goi('Sửa học sinh', 'PATCH', `/ho_so_hoc_sinh/hoc_sinh/${Hs.hoc_sinh.id}`, 'ADMIN', { noi_sinh: 'Địa chỉ giả mới' });
  await Goi('Sửa ngày nhập học trước sinh', 'PATCH', `/ho_so_hoc_sinh/hoc_sinh/${Hs.hoc_sinh.id}`, 'ADMIN', { ngay_nhap_hoc: '2018-01-01' }, 400);
  const Xep = await Goi('Xếp lớp', 'POST', '/to_chuc_lop_hoc/xep_lop', 'ADMIN', { hoc_sinh_id: Hs.hoc_sinh.id, lop_hoc_id: Lop.lop_hoc.id, ngay_bat_dau: '2026-09-01' }, 201);
  await Goi('Xếp lớp ngoài phạm vi', 'POST', '/to_chuc_lop_hoc/xep_lop', 'ADMIN', { hoc_sinh_id: HsKhac.hoc_sinh.id, lop_hoc_id: LopKhac.lop_hoc.id, ngay_bat_dau: '2026-09-01' }, 201);
  await Goi('Trùng thời gian xếp lớp', 'POST', '/to_chuc_lop_hoc/xep_lop', 'ADMIN', { hoc_sinh_id: Hs.hoc_sinh.id, lop_hoc_id: Lop.lop_hoc.id, ngay_bat_dau: '2026-09-01' }, 409);
  await Goi('Lịch sử xếp lớp', 'GET', `/to_chuc_lop_hoc/xep_lop/hoc_sinh/${Hs.hoc_sinh.id}`, 'ADMIN');
  const Mon = await Goi('Tạo môn', 'POST', '/phan_cong_giang_day/mon_hoc', 'ADMIN', { ma_mon_hoc: 'TOAN', ten_mon_hoc: 'Toán' }, 201);
  const MonBm = await Goi('Tạo môn bộ môn', 'POST', '/phan_cong_giang_day/mon_hoc', 'ADMIN', { ma_mon_hoc: 'TA', ten_mon_hoc: 'Tiếng Anh' }, 201);
  const MonKhoi = await Goi('Gắn môn mặc định GVCN', 'POST', '/phan_cong_giang_day/mon_hoc_khoi', 'ADMIN', { mon_hoc_id: Mon.mon_hoc.id, khoi_id: Khoi.id, mac_dinh_gvcn: true }, 201);
  await Goi('Gắn môn bộ môn', 'POST', '/phan_cong_giang_day/mon_hoc_khoi', 'ADMIN', { mon_hoc_id: MonBm.mon_hoc.id, khoi_id: Khoi.id, mac_dinh_gvcn: false }, 201);
  await Goi('Sửa môn', 'PATCH', `/phan_cong_giang_day/mon_hoc/${Mon.mon_hoc.id}`, 'ADMIN', { ten_mon_hoc: 'Toán' });
  await Goi('Sửa môn khối', 'PATCH', `/phan_cong_giang_day/mon_hoc_khoi/${MonKhoi.mon_hoc_khoi.id}`, 'ADMIN', { mac_dinh_gvcn: true });
  const Pc = await Goi('Phân công GVCN', 'POST', '/phan_cong_giang_day/phan_cong/gvcn', 'ADMIN', { giao_vien_id: Gv.giao_vien.id, lop_hoc_id: Lop.lop_hoc.id, ngay_bat_dau: '2026-09-01' }, 201);
  await Goi('Trùng GVCN', 'POST', '/phan_cong_giang_day/phan_cong/gvcn', 'ADMIN', { giao_vien_id: Gv.giao_vien.id, lop_hoc_id: Lop.lop_hoc.id, ngay_bat_dau: '2026-09-01' }, 409);
  const PcBm = await Goi('Phân công GVBM', 'POST', '/phan_cong_giang_day/phan_cong/mon_hoc', 'ADMIN', { giao_vien_id: Gv.giao_vien.id, lop_hoc_id: Lop.lop_hoc.id, mon_hoc_id: MonBm.mon_hoc.id, loai_phan_cong: 'GVBM', ngay_bat_dau: '2026-09-01' }, 201);
  await Goi('Phân công của giáo viên', 'GET', '/phan_cong_giang_day/phan_cong/cua_toi', 'GIAO_VIEN');
  const DanhSach = await Goi('Phạm vi học sinh giáo viên', 'GET', '/ho_so_hoc_sinh/hoc_sinh', 'GIAO_VIEN');
  Ghi('Giáo viên chỉ thấy học sinh lớp được phân công', DanhSach.danh_sach.length === 1 && DanhSach.danh_sach[0].id === Hs.hoc_sinh.id);
  await Goi('Giáo viên không xem học sinh lớp khác', 'GET', `/ho_so_hoc_sinh/hoc_sinh/${HsKhac.hoc_sinh.id}`, 'GIAO_VIEN', undefined, 403);
  const FormDd = { lop_hoc_id: Lop.lop_hoc.id, ngay_hoc: '2026-10-02', buoi_hoc: 'SANG', danh_sach: [{ xep_lop_id: Xep.xep_lop.id, trang_thai: 'CO_MAT' }] };
  await Goi('Tải điểm danh', 'GET', `/diem_danh_nghi_hoc/diem_danh?lop_hoc_id=${Lop.lop_hoc.id}&ngay_hoc=2026-10-02&buoi_hoc=SANG`, 'GIAO_VIEN');
  await Goi('Ghi điểm danh', 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', FormDd, 201);
  await Goi('Cập nhật điểm danh cùng buổi', 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', FormDd, 201);
  Ghi('Không nhân đôi điểm danh', await Prisma.diem_danh.count() === 1);
  await Goi('Điểm danh trùng xếp lớp trong body', 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', { ...FormDd, danh_sach: [...FormDd.danh_sach, ...FormDd.danh_sach] }, 400);
  await Goi('Ngày điểm danh sai', 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', { ...FormDd, ngay_hoc: '2026-02-30' }, 400);
  let PhLogin = await Goi('Đăng nhập phụ huynh lần đầu bằng SĐT', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: PhuHuynh.so_dien_thoai, mat_khau: Hs.tai_khoan_phu_huynh_moi[0].mat_khau_ban_dau }, 201);
  Tokens.PHU_HUYNH = PhLogin.access_token;
  PhLogin = await Goi('Đổi mật khẩu phụ huynh', 'POST', '/auth/doi-mat-khau', 'PHU_HUYNH', { mat_khau_cu: Hs.tai_khoan_phu_huynh_moi[0].mat_khau_ban_dau, mat_khau_moi: MatKhau }, 201);
  Tokens.PHU_HUYNH = PhLogin.access_token;
  await DangNhap('Đăng nhập PHU_HUYNH', PhuHuynh.so_dien_thoai, 'PHU_HUYNH');
  await Goi('Phụ huynh không đăng nhập bằng username', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: Hs.tai_khoan_phu_huynh_moi[0].ten_dang_nhap, mat_khau: MatKhau }, 401);
  const Me = await Goi('Phụ huynh xem con mình', 'GET', '/ho_so_hoc_sinh/phu_huynh/me', 'PHU_HUYNH');
  Ghi('Phụ huynh chỉ thấy con mình', Me.phu_huynh_hoc_sinh.length === 1 && Me.phu_huynh_hoc_sinh[0].hoc_sinh.id === Hs.hoc_sinh.id);
  await Goi('Phụ huynh xem điểm danh con', 'GET', `/diem_danh_nghi_hoc/diem_danh/con/${Hs.hoc_sinh.id}`, 'PHU_HUYNH');
  await Goi('Phụ huynh không xem con người khác', 'GET', `/diem_danh_nghi_hoc/diem_danh/con/${HsKhac.hoc_sinh.id}`, 'PHU_HUYNH', undefined, 403);
  const FormDon = { hoc_sinh_id: Hs.hoc_sinh.id, ngay_bat_dau: '2026-10-02', ngay_ket_thuc: '2026-10-03', buoi_nghi: 'CA_NGAY', ly_do: 'Lý do giả để kiểm thử' };
  const Don = await Goi('Gửi đơn nghỉ', 'POST', '/diem_danh_nghi_hoc/don_xin_nghi', 'PHU_HUYNH', FormDon, 201);
  const DonKhac = await Goi('Gửi đơn để từ chối', 'POST', '/diem_danh_nghi_hoc/don_xin_nghi', 'PHU_HUYNH', FormDon, 201);
  await Goi('Gửi đơn ngày kết thúc trước bắt đầu', 'POST', '/diem_danh_nghi_hoc/don_xin_nghi', 'PHU_HUYNH', { ...FormDon, ngay_ket_thuc: '2026-10-01' }, 400);
  await Goi('Gửi đơn cho con người khác', 'POST', '/diem_danh_nghi_hoc/don_xin_nghi', 'PHU_HUYNH', { ...FormDon, hoc_sinh_id: HsKhac.hoc_sinh.id }, 403);
  await Goi('Giáo viên xem đơn lớp', 'GET', `/diem_danh_nghi_hoc/don_xin_nghi/lop/${Lop.lop_hoc.id}`, 'GIAO_VIEN');
  await Goi('Duyệt đơn', 'PATCH', `/diem_danh_nghi_hoc/don_xin_nghi/${Don.don_xin_nghi.id}/xu_ly`, 'GIAO_VIEN', { trang_thai: 'DA_DUYET' });
  await Goi('Không xử lý lại đơn', 'PATCH', `/diem_danh_nghi_hoc/don_xin_nghi/${Don.don_xin_nghi.id}/xu_ly`, 'GIAO_VIEN', { trang_thai: 'DA_DUYET' }, 400);
  await Goi('Từ chối thiếu lý do', 'PATCH', `/diem_danh_nghi_hoc/don_xin_nghi/${DonKhac.don_xin_nghi.id}/xu_ly`, 'GIAO_VIEN', { trang_thai: 'TU_CHOI' }, 400);
  await Goi('Từ chối đơn', 'PATCH', `/diem_danh_nghi_hoc/don_xin_nghi/${DonKhac.don_xin_nghi.id}/xu_ly`, 'GIAO_VIEN', { trang_thai: 'TU_CHOI', ly_do_tu_choi: 'Lý do giả' });
  const Dot = await Goi('Tạo đợt cuối năm', 'POST', '/danh_gia_hoc_tap/dot_danh_gia', 'ADMIN', { nam_hoc_id: Nam.nam_hoc.id, ma_dot: 'CUOI_NAM', ten_dot: 'Cuối năm', hoc_ky: 'HK2', thu_tu: 4 }, 201);
  await Goi('Cấu hình môn đánh giá', 'POST', '/danh_gia_hoc_tap/cau_hinh_danh_gia_mon', 'ADMIN', { dot_danh_gia_id: Dot.dot_danh_gia.id, khoi_id: Khoi.id, mon_hoc_id: Mon.mon_hoc.id }, 201);
  const FormCauHinh = { dot_danh_gia_id: Dot.dot_danh_gia.id, khoi_id: Khoi.id, mon_hoc_id: Mon.mon_hoc.id, ma_loai_diem: 'DINH_KY', ten_hien_thi: 'Điểm kiểm thử', thu_tu_hien_thi: 1, cach_nhap: 'NHAP_TAY' };
  const Ch = await Goi('Cấu hình điểm nhập tay', 'POST', '/danh_gia_hoc_tap/cau_hinh_diem', 'ADMIN', FormCauHinh, 201);
  const TuTinh = await Goi('Cấu hình điểm tự tính', 'POST', '/danh_gia_hoc_tap/cau_hinh_diem', 'ADMIN', { ...FormCauHinh, ma_loai_diem: 'TONG_HOP', cach_nhap: 'TU_TINH', thu_tu_hien_thi: 2 }, 201);
  const Tc = await Goi('Tạo tiêu chí', 'POST', '/danh_gia_hoc_tap/tieu_chi_danh_gia', 'ADMIN', { ma_tieu_chi: 'TU_CHU', ten_tieu_chi: 'Tự chủ', nhom_danh_gia: 'NANG_LUC', thu_tu_hien_thi: 1 }, 201);
  await Goi('Danh sách học sinh đánh giá', 'GET', `/danh_gia_hoc_tap/lop/${Lop.lop_hoc.id}/hoc_sinh`, 'GIAO_VIEN');
  const FormDanhGia = { hoc_sinh_id: Hs.hoc_sinh.id, mon_hoc_id: Mon.mon_hoc.id, dot_danh_gia_id: Dot.dot_danh_gia.id, muc_danh_gia: 'HOAN_THANH_TOT', nhan_xet: 'Nhận xét giả' };
  await Goi('Nhập kết quả môn', 'PUT', '/danh_gia_hoc_tap/ket_qua_mon_hoc', 'GIAO_VIEN', FormDanhGia);
  const FormDiem = { hoc_sinh_id: Hs.hoc_sinh.id, cau_hinh_diem_id: Ch.cau_hinh_diem.id, diem: 8, ngay_kiem_tra: '2026-10-02' };
  const Diem = await Goi('Nhập điểm định kỳ', 'POST', '/danh_gia_hoc_tap/diem_dinh_ky', 'GIAO_VIEN', FormDiem, 201);
  await Goi('Điểm lớn hơn 10', 'POST', '/danh_gia_hoc_tap/diem_dinh_ky', 'GIAO_VIEN', { ...FormDiem, diem: 11 }, 400);
  await Goi('Điểm trùng', 'POST', '/danh_gia_hoc_tap/diem_dinh_ky', 'GIAO_VIEN', FormDiem, 409);
  await Goi('Không nhập tay điểm tự tính', 'POST', '/danh_gia_hoc_tap/diem_dinh_ky', 'GIAO_VIEN', { ...FormDiem, cau_hinh_diem_id: TuTinh.cau_hinh_diem.id }, 400);
  await Goi('Nhập kiểm tra lại', 'POST', `/danh_gia_hoc_tap/diem_dinh_ky/${Diem.diem.id}/kiem_tra_lai`, 'GIAO_VIEN', { diem: 9, ngay_kiem_tra: '2026-10-02', ly_do_kiem_tra_lai: 'Kiểm thử' }, 201);
  await Goi('Nhập năng lực phẩm chất', 'PUT', '/danh_gia_hoc_tap/nang_luc_pham_chat', 'GIAO_VIEN', { hoc_sinh_id: Hs.hoc_sinh.id, dot_danh_gia_id: Dot.dot_danh_gia.id, tieu_chi_danh_gia_id: Tc.tieu_chi.id, muc_danh_gia: 'TOT' });
  await Goi('Nhập tổng kết', 'PUT', '/danh_gia_hoc_tap/tong_ket_giao_duc', 'GIAO_VIEN', { hoc_sinh_id: Hs.hoc_sinh.id, dot_danh_gia_id: Dot.dot_danh_gia.id, muc_ket_qua_giao_duc: 'HOAN_THANH_TOT', ket_qua_hoan_thanh_lop: 'HOAN_THANH' });
  const Kq = await Goi('Phụ huynh xem kết quả đầy đủ', 'GET', `/danh_gia_hoc_tap/con/${Hs.hoc_sinh.id}/dot/${Dot.dot_danh_gia.id}`, 'PHU_HUYNH');
  Ghi('Kết quả trả đủ môn/điểm/năng lực/tổng kết', Kq.ket_qua_mon_hoc.length === 1 && Kq.diem_dinh_ky.length === 2 && Kq.nang_luc_pham_chat.length === 1 && !!Kq.tong_ket_giao_duc);
  await Goi('Phụ huynh không xem kết quả con khác', 'GET', `/danh_gia_hoc_tap/con/${HsKhac.hoc_sinh.id}/dot/${Dot.dot_danh_gia.id}`, 'PHU_HUYNH', undefined, 403);
  await Goi('ADMIN xem kết quả học sinh', 'GET', `/danh_gia_hoc_tap/hoc_sinh/${Hs.hoc_sinh.id}/dot/${Dot.dot_danh_gia.id}`, 'ADMIN');
  await Goi('Giáo viên không xem kết quả lớp khác', 'GET', `/danh_gia_hoc_tap/hoc_sinh/${HsKhac.hoc_sinh.id}/dot/${Dot.dot_danh_gia.id}`, 'GIAO_VIEN', undefined, 403);
  await Goi('Phụ huynh không dùng API nhân viên', 'GET', `/danh_gia_hoc_tap/hoc_sinh/${Hs.hoc_sinh.id}/dot/${Dot.dot_danh_gia.id}`, 'PHU_HUYNH', undefined, 403);
  Tokens.HET_HAN = await new JwtService({ secret: process.env.JWT_SECRET }).signAsync({ sub: Admin.id }, { expiresIn: -1 });
  await Goi('Token hết hạn', 'GET', '/giao_vien', 'HET_HAN', undefined, 401);
  const Fixture = { admin: Admin.ten_dang_nhap, giao_vien: Gv.tai_khoan.ten_dang_nhap, phu_huynh: PhuHuynh.so_dien_thoai, mat_khau: MatKhau, tokens: Tokens, hoc_sinh_id: Hs.hoc_sinh.id, lop_hoc_id: Lop.lop_hoc.id, dot_id: Dot.dot_danh_gia.id };
  // File tạm chỉ chứa tài khoản giả, ngoài repository; không đưa vào báo cáo.
  if (process.env.AUDIT_FIXTURE_FILE) fs.writeFileSync(process.env.AUDIT_FIXTURE_FILE, JSON.stringify(Fixture));
  for (const Route of JSON.parse(fs.readFileSync(path.resolve('../docs/endpoint-map.json')))) {
    if (!Route.bao_ve) continue;
    await Goi('Không token: ' + Route.method + ' ' + Route.endpoint, Route.method, Route.endpoint.replace(/:[A-Za-z_]+/g, '1'), '', ['POST','PATCH','PUT'].includes(Route.method) ? {} : undefined, 401);
  }
  console.log('Core runtime complete:', KetQua.length, 'checks');
  if (process.env.AUDIT_UI_SCRIPT) {
    const Ui = spawn(process.execPath, [process.env.AUDIT_UI_SCRIPT], { env: process.env, stdio: 'inherit' });
    await new Promise((Resolve, Reject) => { Ui.on('exit', (Code) => Code === 0 ? Resolve() : Reject(new Error('UI test failed'))); });
  }
  // Các ca cần phát hiện lỗ hổng hiện có. Kỳ vọng được ghi riêng, không che lỗi.
  await Goi('ENUM: không lưu trạng thái điểm danh tùy ý', 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', { ...FormDd, danh_sach: [{ ...FormDd.danh_sach[0], trang_thai: 'SAI_QUY_UOC' }] }, 400);
  await Goi('ENUM: không lưu mức đánh giá tùy ý', 'PUT', '/danh_gia_hoc_tap/ket_qua_mon_hoc', 'GIAO_VIEN', { ...FormDanhGia, muc_danh_gia: 'SAI_QUY_UOC' }, 400);
  for (const TrangThai of ['VANG_CO_PHEP', 'VANG_KHONG_PHEP', 'CO_MAT']) {
    await Goi('ENUM hợp lệ điểm danh ' + TrangThai, 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', { ...FormDd, danh_sach: [{ ...FormDd.danh_sach[0], trang_thai: TrangThai }] }, 201);
  }
  await Goi('Điểm danh lỗi giữa danh sách rollback cả lượt', 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', { ...FormDd, danh_sach: [{ ...FormDd.danh_sach[0], trang_thai: 'VANG_CO_PHEP' }, { xep_lop_id: 999999, trang_thai: 'SAI_QUY_UOC' }] }, 400);
  Ghi('Điểm danh giữ nguyên sau rollback', (await Prisma.diem_danh.findFirst()).trang_thai === 'CO_MAT');
  for (const Muc of ['HOAN_THANH', 'CHUA_HOAN_THANH', 'HOAN_THANH_TOT']) {
    await Goi('ENUM hợp lệ đánh giá môn ' + Muc, 'PUT', '/danh_gia_hoc_tap/ket_qua_mon_hoc', 'GIAO_VIEN', { ...FormDanhGia, muc_danh_gia: Muc });
  }
  await Goi('Môn học không nhận mức năng lực', 'PUT', '/danh_gia_hoc_tap/ket_qua_mon_hoc', 'GIAO_VIEN', { ...FormDanhGia, muc_danh_gia: 'TOT' }, 400);
  const FormNangLuc = { hoc_sinh_id: Hs.hoc_sinh.id, dot_danh_gia_id: Dot.dot_danh_gia.id, tieu_chi_danh_gia_id: Tc.tieu_chi.id };
  for (const Muc of ['DAT', 'CAN_CO_GANG', 'TOT']) {
    await Goi('ENUM hợp lệ năng lực ' + Muc, 'PUT', '/danh_gia_hoc_tap/nang_luc_pham_chat', 'GIAO_VIEN', { ...FormNangLuc, muc_danh_gia: Muc });
  }
  await Goi('Năng lực không nhận mức của môn', 'PUT', '/danh_gia_hoc_tap/nang_luc_pham_chat', 'GIAO_VIEN', { ...FormNangLuc, muc_danh_gia: 'HOAN_THANH' }, 400);
  await Goi('Năng lực không nhận giá trị tùy ý', 'PUT', '/danh_gia_hoc_tap/nang_luc_pham_chat', 'GIAO_VIEN', { ...FormNangLuc, muc_danh_gia: 'SAI_QUY_UOC' }, 400);
  const FormTongKet = { hoc_sinh_id: Hs.hoc_sinh.id, dot_danh_gia_id: Dot.dot_danh_gia.id };
  for (const Muc of ['HOAN_THANH_XUAT_SAC', 'HOAN_THANH_TOT', 'HOAN_THANH', 'CHUA_HOAN_THANH']) {
    await Goi('ENUM hợp lệ tổng kết ' + Muc, 'PUT', '/danh_gia_hoc_tap/tong_ket_giao_duc', 'GIAO_VIEN', { ...FormTongKet, muc_ket_qua_giao_duc: Muc, ket_qua_hoan_thanh_lop: 'HOAN_THANH' });
  }
  await Goi('Kết quả lớp chưa hoàn thành hợp lệ', 'PUT', '/danh_gia_hoc_tap/tong_ket_giao_duc', 'GIAO_VIEN', { ...FormTongKet, ket_qua_hoan_thanh_lop: 'CHUA_HOAN_THANH' });
  await Goi('Tổng kết không nhận giá trị tùy ý', 'PUT', '/danh_gia_hoc_tap/tong_ket_giao_duc', 'GIAO_VIEN', { ...FormTongKet, muc_ket_qua_giao_duc: 'SAI_QUY_UOC' }, 400);
  await Goi('Kết quả lớp không nhận giá trị tùy ý', 'PUT', '/danh_gia_hoc_tap/tong_ket_giao_duc', 'GIAO_VIEN', { ...FormTongKet, ket_qua_hoan_thanh_lop: 'SAI_QUY_UOC' }, 400);
  await Goi('Tổng kết giữ hỗ trợ null', 'PUT', '/danh_gia_hoc_tap/tong_ket_giao_duc', 'GIAO_VIEN', { ...FormTongKet, muc_ket_qua_giao_duc: null, ket_qua_hoan_thanh_lop: null });
  await Goi('PUBLIC: không lộ số tài khoản cho khách', 'GET', '/kiem-tra-db', '', undefined, 401);
  await Goi('Kết thúc phân công bộ môn', 'PATCH', `/phan_cong_giang_day/phan_cong/${PcBm.phan_cong.id}/ket_thuc`, 'ADMIN', { ngay_ket_thuc: '2026-09-30' });
  await Goi('Kết thúc GVCN và môn tự động', 'PATCH', `/phan_cong_giang_day/phan_cong/${Pc.Gvcn.id}/ket_thuc`, 'ADMIN', { ngay_ket_thuc: '2026-09-30' });
  await Goi('QUYEN: giáo viên hết phân công không ghi đánh giá mới', 'PUT', '/danh_gia_hoc_tap/ket_qua_mon_hoc', 'GIAO_VIEN', FormDanhGia, 403);
  await Goi('QUYEN: giáo viên hết GVCN không ghi tổng kết mới', 'PUT', '/danh_gia_hoc_tap/tong_ket_giao_duc', 'GIAO_VIEN', { hoc_sinh_id: Hs.hoc_sinh.id, dot_danh_gia_id: Dot.dot_danh_gia.id, muc_ket_qua_giao_duc: 'HOAN_THANH_TOT' }, 403);
  await Goi('GIỚI HẠN: tên giáo viên quá độ dài trả 400', 'PATCH', `/giao_vien/${Gv.giao_vien.id}`, 'ADMIN', { ho_ten: 'A'.repeat(101) }, 400);
  await Promise.all([1, 2].map((So) => Goi('ĐỒNG THỜI: tạo giáo viên ' + So, 'POST', '/giao_vien', 'ADMIN', { ...FormGv, so_dien_thoai: '099000001' + So }, 201)));
  const TokenCu = Tokens.GIAO_VIEN;
  const Reset = await Goi('Cấp lại mật khẩu giáo viên', 'POST', `/giao_vien/${Gv.giao_vien.id}/cap_lai_mat_khau`, 'ADMIN', undefined, 201);
  Login = await Goi('Đăng nhập sau cấp lại mật khẩu', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: Gv.tai_khoan.ten_dang_nhap, mat_khau: Reset.mat_khau_moi }, 201);
  Tokens.GIAO_VIEN = Login.access_token;
  Login = await Goi('Đổi mật khẩu sau reset', 'POST', '/auth/doi-mat-khau', 'GIAO_VIEN', { mat_khau_cu: Reset.mat_khau_moi, mat_khau_moi: MatKhau + 'New' }, 201);
  Tokens.TOKEN_CU = TokenCu;
  await Goi('SESSION: token cũ sau reset không dùng lại', 'GET', '/phan_cong_giang_day/phan_cong/cua_toi', 'TOKEN_CU', undefined, 401);

  const MatKhauAdminDat = ' GvDemo@Manual123 ';
  const GvMatKhau = await Goi('MẬT KHẨU: tạo giáo viên bằng mật khẩu Admin đặt', 'POST', '/giao_vien', 'ADMIN', { ...FormGv, so_dien_thoai: '0990000031', mat_khau_ban_dau: MatKhauAdminDat }, 201);
  assert(GvMatKhau.giao_vien && GvMatKhau.tai_khoan);
  Ghi('MẬT KHẨU: trả đúng mật khẩu đã chọn, giữ khoảng trắng', GvMatKhau.tai_khoan.mat_khau_ban_dau === MatKhauAdminDat);
  const TaiKhoanMatKhau = await Prisma.tai_khoan.findUnique({ where: { ten_dang_nhap: GvMatKhau.tai_khoan.ten_dang_nhap } });
  Ghi('MẬT KHẨU: chỉ lưu Argon2 hash của mật khẩu đã chọn', TaiKhoanMatKhau.mat_khau_bam !== MatKhauAdminDat && await argon2.verify(TaiKhoanMatKhau.mat_khau_bam, MatKhauAdminDat));
  const DanhSachGv = await Goi('MẬT KHẨU: đọc danh sách giáo viên', 'GET', '/giao_vien', 'ADMIN');
  const DanhSachJson = JSON.stringify(DanhSachGv);
  Ghi('MẬT KHẨU: danh sách không trả mật khẩu rõ hoặc hash', !DanhSachJson.includes(MatKhauAdminDat) && !DanhSachJson.includes('mat_khau_bam') && !DanhSachJson.includes('mat_khau_ban_dau'));
  let LoginMatKhau = await Goi('MẬT KHẨU: đăng nhập bằng username và mật khẩu Admin đặt', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: GvMatKhau.tai_khoan.ten_dang_nhap, mat_khau: MatKhauAdminDat }, 201);
  assert(LoginMatKhau.access_token);
  Ghi('MẬT KHẨU: tạo mới buộc đổi mật khẩu lần đầu', LoginMatKhau.tai_khoan.phai_doi_mat_khau === true);
  Tokens.GV_MAT_KHAU = LoginMatKhau.access_token;
  await Goi('MẬT KHẨU: chặn nghiệp vụ trước khi đổi lần đầu', 'GET', '/phan_cong_giang_day/phan_cong/cua_toi', 'GV_MAT_KHAU', undefined, 403);
  LoginMatKhau = await Goi('MẬT KHẨU: giáo viên tự đổi mật khẩu lần đầu', 'POST', '/auth/doi-mat-khau', 'GV_MAT_KHAU', { mat_khau_cu: MatKhauAdminDat, mat_khau_moi: 'GvDemo@Changed123' }, 201);
  Tokens.GV_MAT_KHAU = LoginMatKhau.access_token;
  await Goi('MẬT KHẨU: dùng nghiệp vụ sau khi đổi', 'GET', '/phan_cong_giang_day/phan_cong/cua_toi', 'GV_MAT_KHAU');
  await Goi('MẬT KHẨU: giáo viên không được cấp lại mật khẩu', 'POST', `/giao_vien/${GvMatKhau.giao_vien.id}/cap_lai_mat_khau`, 'GV_MAT_KHAU', { mat_khau_moi: 'GvDemo@Forbidden123' }, 403);
  await Goi('MẬT KHẨU: phụ huynh không được cấp lại mật khẩu', 'POST', `/giao_vien/${GvMatKhau.giao_vien.id}/cap_lai_mat_khau`, 'PHU_HUYNH', {}, 403);
  const MatKhauSai = [
    ['ngắn hơn 8 ký tự', '1234567'], ['sai kiểu số', 123], ['null', null],
    ['chỉ có khoảng trắng', ' '.repeat(8)], ['dài hơn 128 ký tự', 'A'.repeat(129)],
  ];
  for (const [Ten, GiaTri] of MatKhauSai) {
    await Goi('MẬT KHẨU: từ chối tạo mới với mật khẩu ' + Ten, 'POST', '/giao_vien', 'ADMIN', { ...FormGv, so_dien_thoai: '0990000032', mat_khau_ban_dau: GiaTri }, 400);
    await Goi('MẬT KHẨU: từ chối cấp lại với mật khẩu ' + Ten, 'POST', `/giao_vien/${GvMatKhau.giao_vien.id}/cap_lai_mat_khau`, 'ADMIN', { mat_khau_moi: GiaTri }, 400);
  }
  Ghi('MẬT KHẨU: không tạo giáo viên khi mật khẩu sai', await Prisma.giao_vien.count({ where: { so_dien_thoai: '0990000032' } }) === 0);
  await Goi('MẬT KHẨU: dữ liệu cấp lại sai không làm mất phiên hiện tại', 'GET', '/phan_cong_giang_day/phan_cong/cua_toi', 'GV_MAT_KHAU');
  const TokenTruocCapLai = Tokens.GV_MAT_KHAU;
  const MatKhauCapLai = 'GvDemo@Reset456';
  const ResetMatKhau = await Goi('MẬT KHẨU: cấp lại bằng mật khẩu Admin đặt', 'POST', `/giao_vien/${GvMatKhau.giao_vien.id}/cap_lai_mat_khau`, 'ADMIN', { mat_khau_moi: MatKhauCapLai }, 201);
  Ghi('MẬT KHẨU: trả đúng mật khẩu cấp lại', ResetMatKhau.mat_khau_moi === MatKhauCapLai && ResetMatKhau.phai_doi_mat_khau === true);
  Tokens.GV_TRUOC_CAP_LAI = TokenTruocCapLai;
  await Goi('MẬT KHẨU: token cũ bị thu hồi sau cấp lại', 'GET', '/phan_cong_giang_day/phan_cong/cua_toi', 'GV_TRUOC_CAP_LAI', undefined, 401);
  await Goi('MẬT KHẨU: mật khẩu cũ không đăng nhập được sau cấp lại', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: GvMatKhau.tai_khoan.ten_dang_nhap, mat_khau: 'GvDemo@Changed123' }, 401);
  LoginMatKhau = await Goi('MẬT KHẨU: dùng SĐT giả và mật khẩu cấp lại để đăng nhập', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: '0990000031', mat_khau: MatKhauCapLai }, 201);
  Ghi('MẬT KHẨU: cấp lại buộc đổi mật khẩu lần đầu', LoginMatKhau.tai_khoan.phai_doi_mat_khau === true);
  Tokens.GV_MAT_KHAU = LoginMatKhau.access_token;
  await Goi('MẬT KHẨU: chặn nghiệp vụ sau cấp lại trước khi đổi', 'GET', '/phan_cong_giang_day/phan_cong/cua_toi', 'GV_MAT_KHAU', undefined, 403);
  const ResetTuSinh = await Goi('MẬT KHẨU: cấp lại với body rỗng tự sinh mật khẩu', 'POST', `/giao_vien/${GvMatKhau.giao_vien.id}/cap_lai_mat_khau`, 'ADMIN', {}, 201);
  await Goi('MẬT KHẨU: mật khẩu tự sinh đăng nhập được', 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: GvMatKhau.tai_khoan.ten_dang_nhap, mat_khau: ResetTuSinh.mat_khau_moi }, 201);

  await Prisma.tai_khoan.update({ where: { id: Admin.id }, data: { trang_thai: 'KHOA' } });
  await Goi('Tài khoản khóa bị chặn với token đang có', 'GET', '/giao_vien', 'ADMIN', undefined, 403);
}

Main().catch((Error) => { KetQua.push({ ten: 'Runtime bị gián đoạn', dat: false, thong_bao: Error.message }); console.error(Error.message); process.exitCode = 1; }).finally(async () => {
  Server?.kill();
  await Prisma.$disconnect();
  const Report = { thoi_diem: new Date().toISOString(), database: Database.pathname.slice(1), loai_du_lieu: 'Dữ liệu giả; DB được tạo từ Prisma schema, không phải DB của người dùng', tong: KetQua.length, dat: KetQua.filter((X) => X.dat).length, khong_dat: KetQua.filter((X) => !X.dat).length, ket_qua: KetQua };
  fs.writeFileSync(path.resolve(process.env.AUDIT_REPORT_FILE || '../docs/runtime-audit-results.json'), JSON.stringify(Report, null, 2));
  console.log(JSON.stringify({ tong: Report.tong, dat: Report.dat, khong_dat: Report.khong_dat }));
  if (Report.khong_dat) process.exitCode = 1;
});
