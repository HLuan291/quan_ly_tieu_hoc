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
  const Log = Fs.openSync(Path.resolve('../docs/ci-extra-server.log'), 'w');
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
  const CoreFile = Fs.readdirSync(Os.tmpdir()).filter(Name => /^assignment-regression-[0-9]+\.json$/.test(Name))
    .map(Name => Path.join(Os.tmpdir(), Name)).sort((A, B) => Fs.statSync(B).mtimeMs - Fs.statSync(A).mtimeMs)[0];
  Assert(CoreFile, 'Cần chạy assignment-constraint-audit trước');
  const Core = JSON.parse(Fs.readFileSync(CoreFile, 'utf8'));
  Fs.writeFileSync(Path.resolve('../docs/ci-core-results.json'), JSON.stringify(Core, null, 2) + '\n');
  console.log('CI_CORE_REPORT ' + JSON.stringify(Core));
  Check('Bộ API core đã đạt', Core.tong === 231 && Core.khong_dat === 0);
  const Admin = await Prisma.tai_khoan.create({ data: {
    ten_dang_nhap: 'complete_ci_admin', so_dien_thoai: '0960000001', mat_khau_bam: await Argon2.hash(Password), vai_tro: 'ADMIN', phai_doi_mat_khau: false,
  } });
  await Start();
  await Login('ADMIN', Admin.ten_dang_nhap);
  const Teacher = await Call('Tạo giáo viên riêng', 'POST', '/giao_vien', 'ADMIN', {
    ho_ten: 'Trần Thị Kiểm Thử', ngay_sinh: '1990-01-01', gioi_tinh: 'NU', so_dien_thoai: '0960000002',
    email: 'complete@example.test', dia_chi_lien_he: 'Địa chỉ giả', ngay_vao_truong: '2015-09-01', trinh_do_chuyen_mon: 'Đại học', mat_khau_ban_dau: 'Ci@InitialPassword123',
  }, 201);
  await Login('GIAO_VIEN', Teacher.tai_khoan.ten_dang_nhap, Teacher.tai_khoan.mat_khau_ban_dau);
  await Change('GIAO_VIEN', Teacher.tai_khoan.mat_khau_ban_dau);
  const Year = await Prisma.nam_hoc.findUniqueOrThrow({ where: { ten_nam_hoc: '2026-2027' } });
  const Grade = await Prisma.khoi.upsert({ where: { so_khoi: 5 }, create: { so_khoi: 5, ten_khoi: 'Khối 5' }, update: {} });
  const Class = await Call('Tạo lớp riêng', 'POST', '/to_chuc_lop_hoc/lop_hoc', 'ADMIN', { nam_hoc_id: Year.id, khoi_id: Grade.id, ten_lop: '5 CI' }, 201);
  const Subject = await Call('Tạo môn riêng', 'POST', '/phan_cong_giang_day/mon_hoc', 'ADMIN', { ma_mon_hoc: 'CI_TIN', ten_mon_hoc: 'Tin học kiểm thử' }, 201);
  await Call('Cấu hình môn GVCN', 'POST', '/phan_cong_giang_day/mon_hoc_khoi', 'ADMIN', { mon_hoc_id: Subject.mon_hoc.id, khoi_id: Grade.id, mac_dinh_gvcn: true }, 201);
  await Call('Phân công lớp riêng', 'POST', '/phan_cong_giang_day/phan_cong/gvcn', 'ADMIN', { giao_vien_id: Teacher.giao_vien.id, lop_hoc_id: Class.lop_hoc.id, ngay_bat_dau: '2026-09-01' }, 201);
  const Student = await Call('Tạo học sinh chưa cấp TK phụ huynh', 'POST', '/ho_so_hoc_sinh/hoc_sinh', 'ADMIN', {
    hoc_sinh: {
      ho_ten: 'Nguyễn Văn Kiểm Thử', ngay_sinh: '2016-01-01', gioi_tinh: 'NAM', dan_toc: 'Kinh', quoc_tich: 'Việt Nam', noi_sinh: 'Địa chỉ giả',
      so_dien_thoai_lien_he: '0960000003', dia_chi_thuong_tru: 'Địa chỉ giả', dia_chi_hien_tai: 'Địa chỉ giả', ngay_nhap_hoc: '2022-09-01',
    },
    phu_huynh: [{ ho_ten: 'Nguyễn Văn Phụ Huynh', so_dien_thoai: '0960000003', nam_sinh: 1985, moi_quan_he: 'CHA', tao_tai_khoan: false }],
  }, 201);
  const StudentId = Student.hoc_sinh.id;
  const Parent = await Prisma.phu_huynh.findUniqueOrThrow({ where: { so_dien_thoai: '0960000003' } });
  const Account = await Call('Cấp tài khoản phụ huynh đã có hồ sơ', 'POST', '/ho_so_hoc_sinh/phu_huynh/' + Parent.id + '/tao_tai_khoan', 'ADMIN', undefined, 201);
  Check('Cấp tài khoản không lộ hash', !JSON.stringify(Account).includes('mat_khau_bam'));
  await Call('Không cấp trùng tài khoản PH', 'POST', '/ho_so_hoc_sinh/phu_huynh/' + Parent.id + '/tao_tai_khoan', 'ADMIN', undefined, 409);
  await Login('PHU_HUYNH', Parent.so_dien_thoai, Account.mat_khau_ban_dau);
  await Call('PH phải đổi mật khẩu', 'GET', '/ho_so_hoc_sinh/phu_huynh/me', 'PHU_HUYNH', undefined, 403);
  await Change('PHU_HUYNH', Account.mat_khau_ban_dau);
  const Enrollment = await Call('Xếp lớp riêng', 'POST', '/to_chuc_lop_hoc/xep_lop', 'ADMIN', { hoc_sinh_id: StudentId, lop_hoc_id: Class.lop_hoc.id, ngay_bat_dau: '2026-09-01' }, 201);
  await Call('Cập nhật xếp lớp', 'PATCH', '/to_chuc_lop_hoc/xep_lop/' + Enrollment.xep_lop.id, 'ADMIN', { ghi_chu: 'Ghi chú CI', ngay_ket_thuc: null });
  Check('Ghi chú xếp lớp được lưu', (await Prisma.xep_lop.findUniqueOrThrow({ where: { id: Enrollment.xep_lop.id } })).ghi_chu === 'Ghi chú CI');
  await Call('Cập nhật trạng thái học sinh', 'PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + StudentId + '/trang_thai', 'ADMIN', { trang_thai: 'DANG_HOC' });
  await Call('Cập nhật sức khỏe', 'PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + StudentId + '/suc_khoe', 'ADMIN', { chieu_cao_cm: 135, can_nang_kg: 32, ngay_do: '2026-10-04' });
  await Call('Chặn sức khỏe âm', 'PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + StudentId + '/suc_khoe', 'ADMIN', { chieu_cao_cm: -1, can_nang_kg: 32, ngay_do: '2026-10-04' }, 400);
  const Second = await Call('Thêm phụ huynh thứ hai', 'POST', '/ho_so_hoc_sinh/hoc_sinh/' + StudentId + '/phu_huynh', 'ADMIN', {
    ho_ten: 'Trần Thị Phụ Huynh', so_dien_thoai: '0960000004', nam_sinh: 1987, moi_quan_he: 'ME', tao_tai_khoan: false,
  }, 201);
  const SecondId = Second.lien_ket.phu_huynh_id;
  for (const Role of ['ADMIN', 'GIAO_VIEN', 'PHU_HUYNH']) {
    const Detail = await Call('Chi tiết học sinh ' + Role, 'GET', '/ho_so_hoc_sinh/hoc_sinh/' + StudentId, Role);
    Check('Chi tiết đúng học sinh/sức khỏe ' + Role, Detail.id === StudentId && Detail.ho_ten === 'Nguyễn Văn Kiểm Thử' && Number(Detail.chieu_cao_cm) === 135 && Detail.xep_lop.some(Item => Item.lop_hoc_id === Class.lop_hoc.id));
    Check('Chi tiết giới hạn phụ huynh ' + Role, Role === 'PHU_HUYNH' ? Detail.phu_huynh_hoc_sinh.length === 1 && Detail.phu_huynh_hoc_sinh[0].phu_huynh.id === Parent.id : Detail.phu_huynh_hoc_sinh.length === 2);
    Check('Chi tiết không lộ hash ' + Role, !JSON.stringify(Detail).includes('mat_khau_bam'));
  }
  await Call('Tìm PH', 'GET', '/ho_so_hoc_sinh/phu_huynh?tu_khoa=0960000003', 'ADMIN');
  const ParentDetail = await Call('Chi tiết PH', 'GET', '/ho_so_hoc_sinh/phu_huynh/' + Parent.id, 'ADMIN');
  Check('PH trả đúng hồ sơ', ParentDetail.id === Parent.id && !JSON.stringify(ParentDetail).includes('mat_khau_bam'));
  await Call('Cập nhật PH', 'PATCH', '/ho_so_hoc_sinh/phu_huynh/' + Parent.id, 'ADMIN', { nghe_nghiep: 'Nghề giả' });
  Check('Nghề PH được lưu', (await Prisma.phu_huynh.findUniqueOrThrow({ where: { id: Parent.id } })).nghe_nghiep === 'Nghề giả');
  await Call('Sửa mối quan hệ PH thứ hai', 'PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + StudentId + '/phu_huynh/' + SecondId + '/moi_quan_he', 'ADMIN', { moi_quan_he: 'NGUOI_GIAM_HO' });
  await Call('Hủy liên kết PH thứ hai', 'DELETE', '/ho_so_hoc_sinh/hoc_sinh/' + StudentId + '/phu_huynh/' + SecondId, 'ADMIN');
  Check('Hủy liên kết giữ hồ sơ PH', await Prisma.phu_huynh.count({ where: { id: SecondId } }) === 1);
  await Call('Không hủy PH cuối cùng', 'DELETE', '/ho_so_hoc_sinh/hoc_sinh/' + StudentId + '/phu_huynh/' + Parent.id, 'ADMIN', undefined, 400);
  const OldParentToken = Tokens.PHU_HUYNH;
  const Reset = await Call('Cấp lại mật khẩu PH', 'POST', '/ho_so_hoc_sinh/phu_huynh/' + Parent.id + '/cap_lai_mat_khau', 'ADMIN', undefined, 201);
  await Call('Token PH cũ hết hiệu lực sau cấp lại', 'GET', '/ho_so_hoc_sinh/phu_huynh/me', 'PHU_HUYNH', undefined, 401);
  Check('Hash PH mới đúng', await Argon2.verify((await Prisma.tai_khoan.findUniqueOrThrow({ where: { so_dien_thoai: Parent.so_dien_thoai } })).mat_khau_bam, Reset.mat_khau_moi));
  await Login('PHU_HUYNH', Parent.so_dien_thoai, Reset.mat_khau_moi);
  await Change('PHU_HUYNH', Reset.mat_khau_moi);
  Check('Phiên PH được thay', Tokens.PHU_HUYNH !== OldParentToken);
  const Dot = await Prisma.dot_danh_gia.findFirstOrThrow({ where: { nam_hoc_id: Year.id, ma_dot: 'CUOI_NAM' } });
  await Call('Cấu hình môn lớp riêng', 'POST', '/danh_gia_hoc_tap/cau_hinh_danh_gia_mon', 'ADMIN', { dot_danh_gia_id: Dot.id, khoi_id: Grade.id, mon_hoc_id: Subject.mon_hoc.id }, 201);
  const Catalogs = [
    '/danh_gia_hoc_tap/dot_danh_gia?nam_hoc_id=' + Year.id,
    '/danh_gia_hoc_tap/cau_hinh_danh_gia_mon?dot_danh_gia_id=' + Dot.id + '&khoi_id=' + Grade.id,
    '/danh_gia_hoc_tap/cau_hinh_diem?dot_danh_gia_id=' + Dot.id,
    '/danh_gia_hoc_tap/tieu_chi_danh_gia?nhom_danh_gia=NANG_LUC',
    '/phan_cong_giang_day/mon_hoc?tu_khoa=CI_TIN',
  ];
  for (const Role of ['ADMIN', 'GIAO_VIEN', 'PHU_HUYNH']) for (const Endpoint of Catalogs) {
    const Data = await Call('Đọc danh mục ' + Role + ' ' + Endpoint, 'GET', Endpoint, Role);
    Check('Danh mục trả mảng ' + Role + ' ' + Endpoint, Array.isArray(Data));
  }
  for (const Endpoint of [
    '/phan_cong_giang_day/mon_hoc_khoi?khoi_id=' + Grade.id,
    '/phan_cong_giang_day/phan_cong?lop_hoc_id=' + Class.lop_hoc.id,
    '/to_chuc_lop_hoc/nam_hoc', '/to_chuc_lop_hoc/khoi',
    '/to_chuc_lop_hoc/lop_hoc?nam_hoc_id=' + Year.id + '&khoi_id=' + Grade.id,
    '/to_chuc_lop_hoc/lop_hoc/' + Class.lop_hoc.id,
    '/to_chuc_lop_hoc/hoc_sinh_chua_xep_lop',
  ]) {
    await Call('Danh mục quản trị ' + Endpoint, 'GET', Endpoint, 'ADMIN');
    for (const Role of ['GIAO_VIEN', 'PHU_HUYNH']) await Call('Chặn danh mục quản trị ' + Role + ' ' + Endpoint, 'GET', Endpoint, Role, undefined, 403);
  }
  await Call('Giáo viên đọc lớp chủ nhiệm', 'GET', '/diem_danh_nghi_hoc/lop_chu_nhiem_cua_toi', 'GIAO_VIEN');
  await Call('PH đọc đơn của mình', 'GET', '/diem_danh_nghi_hoc/don_xin_nghi/cua_toi', 'PHU_HUYNH');
  await Call('Sửa lớp', 'PATCH', '/to_chuc_lop_hoc/lop_hoc/' + Class.lop_hoc.id, 'ADMIN', { ghi_chu: 'Ghi chú lớp CI' });
  Check('Sửa lớp lưu đúng', (await Prisma.lop_hoc.findUniqueOrThrow({ where: { id: Class.lop_hoc.id } })).ghi_chu === 'Ghi chú lớp CI');
  const SpareYear = await Call('Tạo năm để sửa', 'POST', '/to_chuc_lop_hoc/nam_hoc', 'ADMIN', { ten_nam_hoc: '2028-2029' }, 201);
  await Call('Sửa năm', 'PATCH', '/to_chuc_lop_hoc/nam_hoc/' + SpareYear.nam_hoc.id, 'ADMIN', { ten_nam_hoc: '2029-2030' });
  Check('Sửa năm lưu đúng', (await Prisma.nam_hoc.findUniqueOrThrow({ where: { id: SpareYear.nam_hoc.id } })).ten_nam_hoc === '2029-2030');
  await Call('Chặn query ID không hợp lệ', 'GET', '/to_chuc_lop_hoc/lop_hoc?nam_hoc_id=x', 'ADMIN', undefined, 400);
  await Call('Chặn query đánh giá ID không hợp lệ', 'GET', '/danh_gia_hoc_tap/dot_danh_gia?nam_hoc_id=x', 'ADMIN', undefined, 400);

  const Routes = JSON.parse(Fs.readFileSync(Path.resolve('../docs/endpoint-map.json'), 'utf8'));
  const Covered = new Set();
  for (const Row of [...Core.ket_qua, ...Results]) {
    if (!Row.dat || !Row.method || Row.thuc_te < 200 || Row.thuc_te >= 300) continue;
    const Matches = Routes.filter(Route => Route.method === Row.method && new RegExp('^' + Route.endpoint.replace(/:[A-Za-z_]+/g, '[^/]+') + '$').test(Row.endpoint.split('?')[0]))
      .sort((A, B) => (A.endpoint.match(/:/g) || []).length - (B.endpoint.match(/:/g) || []).length);
    if (Matches[0]) Covered.add(Matches[0].method + ' ' + Matches[0].endpoint);
  }
  const Missing = Routes.filter(Route => !Covered.has(Route.method + ' ' + Route.endpoint)).map(Route => Route.method + ' ' + Route.endpoint);
  Check('Mọi endpoint có happy path thành công', Missing.length === 0);
  Fs.writeFileSync(Path.resolve('../docs/ci-route-coverage.json'), JSON.stringify({ total: Routes.length, covered: Covered.size, missing: Missing }, null, 2) + '\n');
  console.log('CI_ROUTE_COVERAGE ' + JSON.stringify({ total: Routes.length, covered: Covered.size, missing: Missing }));
  Fs.writeFileSync(FixtureFile, JSON.stringify({
    admin: Admin.ten_dang_nhap, teacher: Teacher.tai_khoan.ten_dang_nhap, teacher_id: Teacher.giao_vien.id,
    parent: Parent.so_dien_thoai, password: Password, student_id: StudentId, student_name: 'Nguyễn Văn Kiểm Thử',
    class_id: Class.lop_hoc.id, class_name: '5 CI', grade_id: Grade.id, year_id: Year.id, subject_id: Subject.mon_hoc.id,
    dot_id: Dot.id, enrollment_id: Enrollment.xep_lop.id, today: LayNgayNghiepVu().toISOString().slice(0, 10),
  }));
}
Main().catch(Error => {
  Results.push({ ten: 'Kiểm thử bổ sung bị gián đoạn', dat: false, thong_bao: Error.message.replace(/Ci@\w+|Bearer \S+/g, '[REDACTED]') });
  console.error(Error.message.replace(/Ci@\w+|Bearer \S+/g, '[REDACTED]'));
  process.exitCode = 1;
}).finally(async () => {
  await Stop();
  await Prisma.$disconnect();
  const Report = { thoi_diem: new Date().toISOString(), database: Database.pathname.slice(1), loai_du_lieu: 'Giả trên MySQL CI riêng', tong: Results.length, dat: Results.filter(Row => Row.dat).length, khong_dat: Results.filter(Row => !Row.dat).length, http: Results.filter(Row => Row.method).length, ket_qua: Results };
  Fs.writeFileSync(Path.resolve('../docs/ci-extra-results.json'), JSON.stringify(Report, null, 2) + '\n');
  console.log('CI_EXTRA_REPORT ' + JSON.stringify(Report));
});
