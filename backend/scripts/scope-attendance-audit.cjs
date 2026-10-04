// Database audit riêng; tạo dữ liệu giả và đối chiếu HTTP với MySQL.
const Assert = require('node:assert/strict');
const Fs = require('node:fs');
const Path = require('node:path');
const Os = require('node:os');
const { spawn: Spawn } = require('node:child_process');
const Argon2 = require('argon2');
const { PrismaService } = require('../dist/prisma.service');
const { LayNgayNghiepVu } = require('../dist/ngay_nghiep_vu');

const Database = new URL(process.env.DATABASE_URL || 'mysql://missing');
Assert(process.env.AUDIT_ALLOW_TEST_DATA === '1' && Database.pathname.includes('audit'), 'Chỉ dùng DB audit riêng');
const FixtureFile = process.env.AUDIT_COMPLETE_FIXTURE_FILE;
Assert(FixtureFile && !Path.resolve(FixtureFile).startsWith(Path.resolve('..') + Path.sep), 'Fixture phải ở ngoài repository');
const Prisma = new PrismaService();
const Api = 'http://127.0.0.1:3000';
const Password = 'Ci@SchoolPassword123';
const Results = [];
const Tokens = {};
let Server;

function Check(Name, Passed) {
  Results.push({ ten: Name, dat: !!Passed });
  Assert(Passed, Name);
}
async function Call(Name, Method, Endpoint, Role, Body, Expected = 200) {
  const Response = await fetch(Api + Endpoint, {
    method: Method,
    headers: { 'Content-Type': 'application/json', ...(Tokens[Role] ? { Authorization: 'Bearer ' + Tokens[Role] } : {}) },
    ...(Body === undefined ? {} : { body: JSON.stringify(Body) }),
  });
  const Data = await Response.json();
  const Passed = Response.status === Expected;
  Results.push({ ten: Name, method: Method, endpoint: Endpoint, vai_tro: Role || 'KHACH', mong_doi: Expected, thuc_te: Response.status, dat: Passed });
  Assert(Passed, Name + ': HTTP ' + Response.status + ', expected ' + Expected + (Passed ? '' : ' ' + String(Data.message || '')));
  return Data;
}
async function Login(Role, Username, Secret = Password) {
  const Data = await Call('Đăng nhập ' + Role, 'POST', '/auth/login', '', { ten_dang_nhap_hoac_so_dien_thoai: Username, mat_khau: Secret }, 201);
  Check('Token ' + Role, typeof Data.access_token === 'string');
  Tokens[Role] = Data.access_token;
  return Data;
}
async function Change(Role, OldPassword) {
  const Data = await Call('Đổi mật khẩu ' + Role, 'POST', '/auth/doi-mat-khau', Role, { mat_khau_cu: OldPassword, mat_khau_moi: Password }, 201);
  Tokens[Role] = Data.access_token;
}
async function Start() {
  const Log = Fs.openSync(Path.resolve('../docs/ci-scope-server.log'), 'w');
  Server = Spawn(process.execPath, ['dist/main.js'], { env: { ...process.env, PORT: '3000' }, stdio: ['ignore', Log, Log] });
  for (let Attempt = 0; Attempt < 100; Attempt++) {
    try { if ((await fetch(Api + '/')).ok) return; } catch {}
    if (Server.exitCode !== null) throw new Error('Backend không khởi động');
    await new Promise(Done => setTimeout(Done, 100));
  }
  throw new Error('Backend hết thời gian khởi động');
}
async function Stop() {
  if (!Server || Server.exitCode !== null) return;
  const Exit = new Promise(Done => Server.once('exit', Done));
  Server.kill();
  await Exit;
}
async function Main() {
  const F = JSON.parse(Fs.readFileSync(FixtureFile, 'utf8'));
  await Start(); await Login('ADMIN', F.admin); await Login('GIAO_VIEN', F.teacher); await Login('PHU_HUYNH', F.parent);
  const Scope = await Call('GVCN tự gắn lớp qua danh mục', 'GET', '/ho_so_hoc_sinh/danh_muc', 'GIAO_VIEN');
  Check('GVCN chỉ có một lớp cố định', Scope.che_do === 'GVCN' && Scope.lop_chu_nhiem_id === F.class_id && Scope.lop_hoc.length === 1);
  const Grade4 = await Prisma.khoi.upsert({ where: { so_khoi: 4 }, create: { so_khoi: 4, ten_khoi: 'Khối 4' }, update: {} });
  const Class4 = await Call('Tạo lớp khối khác', 'POST', '/to_chuc_lop_hoc/lop_hoc', 'ADMIN', { nam_hoc_id: F.year_id, khoi_id: Grade4.id, ten_lop: '4 Scope' }, 201);
  const BeforePC = await Prisma.phan_cong_giao_vien.count({ where: { giao_vien_id: F.teacher_id } });
  await Call('Chặn một GVCN chủ nhiệm thêm lớp đồng thời', 'POST', '/phan_cong_giang_day/phan_cong/gvcn', 'ADMIN', {
    giao_vien_id: F.teacher_id, lop_hoc_id: Class4.lop_hoc.id, ngay_bat_dau: F.today,
  }, 409);
  Check('Từ chối không tạo phân công dư', await Prisma.phan_cong_giao_vien.count({ where: { giao_vien_id: F.teacher_id } }) === BeforePC);
  const LegacyMixed = await Prisma.phan_cong_giao_vien.create({ data: { giao_vien_id: F.teacher_id, lop_hoc_id: Class4.lop_hoc.id,
    mon_hoc_id: F.subject_id, loai_phan_cong: 'GVBM', nguon_phan_cong: 'BO_SUNG', ngay_bat_dau: new Date('2026-09-01') } });
  const Mixed = await Call('GVCN có dòng bộ môn cũ vẫn chỉ gắn lớp chủ nhiệm', 'GET', '/ho_so_hoc_sinh/danh_muc', 'GIAO_VIEN');
  Check('Phạm vi ưu tiên lớp chủ nhiệm', Mixed.che_do === 'GVCN' && Mixed.lop_hoc.length === 1 && Mixed.lop_hoc[0].id === F.class_id);
  await Call('GVCN không mở bảng lớp khác bằng query', 'GET', '/danh_gia_hoc_tap/bang_danh_gia?lop_hoc_id=' + Class4.lop_hoc.id + '&dot_danh_gia_id=' + F.dot_id, 'GIAO_VIEN', undefined, 403);
  await Call('GVCN không gọi danh sách đánh giá cũ cho lớp khác', 'GET', '/danh_gia_hoc_tap/lop/' + Class4.lop_hoc.id + '/hoc_sinh', 'GIAO_VIEN', undefined, 403);
  const BM = await Call('Tạo tài khoản GVBM', 'POST', '/giao_vien', 'ADMIN', {
    ho_ten: 'Trần Thị Bộ Môn', ngay_sinh: '1990-01-01', gioi_tinh: 'NU', so_dien_thoai: '0930000001', email: 'subject@example.test',
    dia_chi_lien_he: 'Địa chỉ giả', ngay_vao_truong: '2015-09-01', trinh_do_chuyen_mon: 'Đại học',
  }, 201);
  await Login('GVBM', BM.tai_khoan.ten_dang_nhap, BM.tai_khoan.mat_khau_ban_dau); await Change('GVBM', BM.tai_khoan.mat_khau_ban_dau);
  const Empty = await Call('GV chưa phân công chưa có lớp mặc định', 'GET', '/ho_so_hoc_sinh/danh_muc', 'GVBM');
  Check('Không tự gắn lớp của giáo viên khác', Empty.che_do === 'CHUA_PHAN_CONG' && Empty.lop_hoc.length === 0);
  const Mon = await Call('Tạo môn GVBM', 'POST', '/phan_cong_giang_day/mon_hoc', 'ADMIN', { ma_mon_hoc: 'CI_SCOPE_MON', ten_mon_hoc: 'Môn bộ môn kiểm thử' }, 201);
  for (const G of [F.grade_id, Grade4.id]) {
    await Call('Cấu hình môn bộ môn khối ' + G, 'POST', '/phan_cong_giang_day/mon_hoc_khoi', 'ADMIN', { mon_hoc_id: Mon.mon_hoc.id, khoi_id: G, mac_dinh_gvcn: false }, 201);
    await Call('Cấu hình đánh giá môn bộ môn khối ' + G, 'POST', '/danh_gia_hoc_tap/cau_hinh_danh_gia_mon', 'ADMIN', {
      mon_hoc_id: Mon.mon_hoc.id, khoi_id: G, dot_danh_gia_id: F.dot_id,
    }, 201);
  }
  for (const C of [F.class_id, Class4.lop_hoc.id]) await Call('Phân công GVBM lớp ' + C, 'POST', '/phan_cong_giang_day/phan_cong/mon_hoc', 'ADMIN', {
    giao_vien_id: BM.giao_vien.id, lop_hoc_id: C, mon_hoc_id: Mon.mon_hoc.id, loai_phan_cong: 'GVBM', ngay_bat_dau: '2026-09-01',
  }, 201);
  const Student4 = await Call('Tạo học sinh lớp khối 4', 'POST', '/ho_so_hoc_sinh/hoc_sinh', 'ADMIN', {
    hoc_sinh: { ho_ten: 'Nguyễn Văn Khối Bốn', ngay_sinh: '2017-01-01', gioi_tinh: 'NAM', dan_toc: 'Kinh', quoc_tich: 'Việt Nam',
      noi_sinh: 'Địa chỉ giả', so_dien_thoai_lien_he: '0930000002', dia_chi_thuong_tru: 'Địa chỉ giả', dia_chi_hien_tai: 'Địa chỉ giả', ngay_nhap_hoc: '2023-09-01' },
    phu_huynh: [{ ho_ten: 'Nguyễn Văn Giám Hộ', so_dien_thoai: '0930000002', moi_quan_he: 'CHA', tao_tai_khoan: false }],
  }, 201);
  await Call('Xếp lớp khối 4', 'POST', '/to_chuc_lop_hoc/xep_lop', 'ADMIN', { hoc_sinh_id: Student4.hoc_sinh.id, lop_hoc_id: Class4.lop_hoc.id, ngay_bat_dau: '2026-09-01' }, 201);
  const BMList = await Call('GVBM có hai lớp thuộc hai khối', 'GET', '/ho_so_hoc_sinh/danh_muc', 'GVBM');
  Check('GVBM chọn được đúng lớp và khối được giao', BMList.che_do === 'GVBM' && BMList.lop_hoc.length === 2 && new Set(BMList.lop_hoc.map(L => L.khoi_id)).size === 2 && BMList.lop_chu_nhiem_id === null);
  const BMStudents = await Call('GVBM xem học sinh trong tất cả lớp được giao', 'GET', '/ho_so_hoc_sinh/hoc_sinh', 'GVBM');
  Check('Danh sách GVBM gồm học sinh cả hai lớp', BMStudents.danh_sach.some(H => H.id === F.student_id) && BMStudents.danh_sach.some(H => H.id === Student4.hoc_sinh.id));
  await Call('GVBM sửa học sinh khối 4', 'PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + Student4.hoc_sinh.id, 'GVBM', { ghi_chu: 'Bổ sung bởi GVBM' });
  await Call('GVCN không xem hồ sơ ngoài lớp chủ nhiệm dù có phân công bộ môn', 'GET', '/ho_so_hoc_sinh/hoc_sinh/' + Student4.hoc_sinh.id, 'GIAO_VIEN', undefined, 403);
  for (const C of [F.class_id, Class4.lop_hoc.id]) {
    const Bang = await Call('GVBM xem bảng lớp ' + C, 'GET', '/danh_gia_hoc_tap/bang_danh_gia?lop_hoc_id=' + C + '&dot_danh_gia_id=' + F.dot_id, 'GVBM');
    Check('GVBM nhập đúng môn, năng lực chỉ xem lớp ' + C, Bang.mon_hoc.find(M => M.id === Mon.mon_hoc.id)?.duoc_nhap && !Bang.duoc_nhap_nang_luc);
  }
  await Call('GVBM đánh giá lớp khối 4', 'PUT', '/danh_gia_hoc_tap/ket_qua_mon_hoc', 'GVBM', {
    hoc_sinh_id: Student4.hoc_sinh.id, dot_danh_gia_id: F.dot_id, mon_hoc_id: Mon.mon_hoc.id, muc_danh_gia: 'HOAN_THANH', nhan_xet: 'GVBM nhập lớp khối 4',
  });
  await Call('GVBM không điểm danh', 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GVBM', {
    lop_hoc_id: F.class_id, ngay_hoc: F.attendance_day, buoi_hoc: 'SANG', danh_sach: [{ xep_lop_id: F.enrollment_id, trang_thai: 'CO_MAT' }],
  }, 403);
  await Prisma.phan_cong_giao_vien.delete({ where: { id: LegacyMixed.id } });
  const Sunday = new Date(F.today + 'T00:00:00Z'); Sunday.setUTCDate(Sunday.getUTCDate() - Sunday.getUTCDay());
  const SundayText = Sunday.toISOString().slice(0, 10);
  const SundayBefore = await Prisma.diem_danh.count({ where: { ngay_hoc: Sunday } });
  const Body = { lop_hoc_id: F.class_id, ngay_hoc: F.attendance_day, buoi_hoc: 'SANG', danh_sach: [{ xep_lop_id: F.enrollment_id, trang_thai: 'CO_MAT', ghi_chu: '' }] };
  for (const Buoi of ['SANG', 'CHIEU']) {
    await Call('Chặn lưu Chủ nhật buổi ' + Buoi, 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', { ...Body, ngay_hoc: SundayText, buoi_hoc: Buoi }, 400);
    await Call('Chặn mở điểm danh Chủ nhật buổi ' + Buoi, 'GET', '/diem_danh_nghi_hoc/diem_danh?lop_hoc_id=' + F.class_id + '&ngay_hoc=' + SundayText + '&buoi_hoc=' + Buoi, 'GIAO_VIEN', undefined, 400);
  }
  Check('Không phát sinh điểm danh Chủ nhật', await Prisma.diem_danh.count({ where: { ngay_hoc: Sunday } }) === SundayBefore);
  const Tomorrow = new Date(F.today + 'T00:00:00Z'); Tomorrow.setUTCDate(Tomorrow.getUTCDate() + 1);
  await Call('Chặn điểm danh tương lai', 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', { ...Body, ngay_hoc: Tomorrow.toISOString().slice(0, 10) }, 400);
  for (const Status of ['CO_MAT', 'VANG_CO_PHEP', 'VANG_KHONG_PHEP', 'DI_TRE']) {
    await Call('Ghi và sửa trạng thái ' + Status, 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', { ...Body, danh_sach: [{ ...Body.danh_sach[0], trang_thai: Status, ghi_chu: 'Trạng thái ' + Status }] }, 201);
    const DB = await Prisma.diem_danh.findMany({ where: { xep_lop_id: F.enrollment_id, ngay_hoc: new Date(F.attendance_day), buoi_hoc: 'SANG' } });
    Check('Lưu một bản ghi đúng trạng thái ' + Status, DB.length === 1 && DB[0].trang_thai === Status && DB[0].ghi_chu === 'Trạng thái ' + Status);
  }
  await Call('Lưu chiều độc lập với sáng', 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', { ...Body, buoi_hoc: 'CHIEU' }, 201);
  const Morning = await Call('Đọc sáng tự động trả trạng thái đi trễ', 'GET', '/diem_danh_nghi_hoc/diem_danh?lop_hoc_id=' + F.class_id + '&ngay_hoc=' + F.attendance_day + '&buoi_hoc=SANG', 'GIAO_VIEN');
  Check('Đọc đúng ngày và buổi sáng', Morning.danh_sach.find(X => X.id === F.enrollment_id)?.diem_danh[0]?.trang_thai === 'DI_TRE');
  const Evening = await Call('Đọc chiều độc lập', 'GET', '/diem_danh_nghi_hoc/diem_danh?lop_hoc_id=' + F.class_id + '&ngay_hoc=' + F.attendance_day + '&buoi_hoc=CHIEU', 'GIAO_VIEN');
  Check('Đọc đúng buổi chiều', Evening.danh_sach.find(X => X.id === F.enrollment_id)?.diem_danh[0]?.trang_thai === 'CO_MAT');
  const Detail = await Call('Đi trễ không tính là ngày vắng', 'GET', '/ho_so_hoc_sinh/hoc_sinh/' + F.student_id, 'GIAO_VIEN');
  Check('Tổng nghỉ bỏ qua Đi trễ và Có mặt', Detail.thong_ke_nghi.so_ngay_co_vang === 0 && Detail.thong_ke_nghi.so_buoi_vang === 0);
  const Parent = await Call('PH xem được trạng thái đi trễ', 'GET', '/diem_danh_nghi_hoc/diem_danh/con/' + F.student_id, 'PHU_HUYNH');
  Check('PH thấy DI_TRE của đúng con', Parent.diem_danh.some(D => D.trang_thai === 'DI_TRE'));
  Object.assign(F, { subject_teacher: BM.tai_khoan.ten_dang_nhap, subject_teacher_id: BM.giao_vien.id, subject_class_id: Class4.lop_hoc.id,
    subject_grade_id: Grade4.id, subject_student_id: Student4.hoc_sinh.id, subject_id_2: Mon.mon_hoc.id });
  Fs.writeFileSync(FixtureFile, JSON.stringify(F));
}
Main().catch(Error => {
  Results.push({ ten: 'Kiểm thử điểm danh và phạm vi bị gián đoạn', dat: false, thong_bao: Error.message.replace(/Ci@\w+|Bearer \S+/g, '[REDACTED]') });
  console.error(Error.message.replace(/Ci@\w+|Bearer \S+/g, '[REDACTED]')); process.exitCode = 1;
}).finally(async () => {
  await Stop(); await Prisma.$disconnect();
  const Report = { thoi_diem: new Date().toISOString(), database: Database.pathname.slice(1), loai_du_lieu: 'Giả trên MySQL CI riêng', tong: Results.length,
    dat: Results.filter(Row => Row.dat).length, khong_dat: Results.filter(Row => !Row.dat).length, http: Results.filter(Row => Row.method).length, ket_qua: Results };
  Fs.writeFileSync(Path.resolve('../docs/ci-scope-attendance-results.json'), JSON.stringify(Report, null, 2) + '\n');
  console.log('CI_SCOPE_ATTENDANCE_REPORT ' + JSON.stringify(Report));
});
