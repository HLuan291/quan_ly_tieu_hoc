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
  const Log = Fs.openSync(Path.resolve('../docs/ci-profile-server.log'), 'w');
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
  await Start();
  await Login('ADMIN', F.admin);
  await Login('GIAO_VIEN', F.teacher);
  await Login('PHU_HUYNH', F.parent);
  const Parent = await Prisma.phu_huynh.findFirstOrThrow({ where: { so_dien_thoai: F.parent } });
  const Own = '/ho_so_hoc_sinh/hoc_sinh/' + F.student_id;
  const Catalog = await Call('GV đọc danh mục lớp được phân công', 'GET', '/ho_so_hoc_sinh/danh_muc', 'GIAO_VIEN');
  Check('Danh mục GV chỉ gồm lớp được phân công', Catalog.lop_hoc.length === 1 && Catalog.lop_hoc[0].id === F.class_id);
  const AdminCatalog = await Call('ADMIN đọc danh mục toàn trường', 'GET', '/ho_so_hoc_sinh/danh_muc', 'ADMIN');
  Check('Danh mục ADMIN bao gồm các lớp ngoài phạm vi GV', AdminCatalog.lop_hoc.length > Catalog.lop_hoc.length);
  await Call('PH không đọc danh mục lớp', 'GET', '/ho_so_hoc_sinh/danh_muc', 'PHU_HUYNH', undefined, 403);
  const ForeignClass = await Call('Tạo lớp ngoài phân công', 'POST', '/to_chuc_lop_hoc/lop_hoc', 'ADMIN', {
    nam_hoc_id: F.year_id, khoi_id: F.grade_id, ten_lop: '5 Profile Foreign',
  }, 201);
  const StudentBody = {
    hoc_sinh: { ho_ten: 'Nguyễn Văn Ngoài Lớp', ngay_sinh: '2016-02-02', gioi_tinh: 'NAM', dan_toc: 'Tày',
      quoc_tich: 'Việt Nam', noi_sinh: 'Địa chỉ giả', so_dien_thoai_lien_he: '0940000001',
      dia_chi_thuong_tru: 'Địa chỉ giả', dia_chi_hien_tai: 'Địa chỉ giả', ngay_nhap_hoc: '2022-09-01' },
    phu_huynh: [{ ho_ten: 'Nguyễn Văn Ngoài Phạm Vi', so_dien_thoai: '0940000001', nam_sinh: 1985, moi_quan_he: 'CHA', tao_tai_khoan: false }],
  };
  const Foreign = await Call('ADMIN tạo học sinh lớp khác', 'POST', '/ho_so_hoc_sinh/hoc_sinh', 'ADMIN', StudentBody, 201);
  const ForeignId = Foreign.hoc_sinh.id;
  const ForeignParent = await Prisma.phu_huynh.findFirstOrThrow({ where: { so_dien_thoai: '0940000001' } });
  const ForeignEnrollment = await Call('Xếp lớp ngoài phân công', 'POST', '/to_chuc_lop_hoc/xep_lop', 'ADMIN', {
    hoc_sinh_id: ForeignId, lop_hoc_id: ForeignClass.lop_hoc.id, ngay_bat_dau: '2026-09-01',
  }, 201);
  for (const Role of ['ADMIN', 'GIAO_VIEN']) {
    const Filter = await Call('Lọc lớp đúng ' + Role, 'GET', '/ho_so_hoc_sinh/hoc_sinh?nam_hoc_id=' + F.year_id + '&khoi_id=' + F.grade_id + '&lop_hoc_id=' + F.class_id, Role);
    Check('Lọc lớp trả học sinh và tên lớp ' + Role, Filter.danh_sach.some(S => S.id === F.student_id && S.xep_lop[0].lop_hoc.ten_lop === F.class_name) && !Filter.danh_sach.some(S => S.id === ForeignId));
    const Grade = await Call('Lọc khối ' + Role, 'GET', '/ho_so_hoc_sinh/hoc_sinh?khoi_id=' + F.grade_id, Role);
    Check('Lọc khối không mở rộng phạm vi ' + Role, Role === 'ADMIN' ? Grade.danh_sach.some(S => S.id === ForeignId) : !Grade.danh_sach.some(S => S.id === ForeignId));
  }
  const Outside = await Call('GV lọc lớp ngoài quyền', 'GET', '/ho_so_hoc_sinh/hoc_sinh?lop_hoc_id=' + ForeignClass.lop_hoc.id, 'GIAO_VIEN');
  Check('Lọc lớp khác không lộ học sinh', Outside.danh_sach.length === 0);
  for (const Query of ['nam_hoc_id=x', 'khoi_id=0', 'lop_hoc_id=-1', 'lop_hoc_id=1.5']) {
    await Call('Chặn bộ lọc sai ' + Query, 'GET', '/ho_so_hoc_sinh/hoc_sinh?' + Query, 'ADMIN', undefined, 400);
  }
  await Call('GV bổ sung đầy đủ hồ sơ học sinh', 'PATCH', Own, 'GIAO_VIEN', {
    ho_ten: F.student_name, ngay_sinh: '2016-01-01', gioi_tinh: 'NAM', dan_toc: 'Kinh', quoc_tich: 'Việt Nam',
    noi_sinh: 'Nơi Sinh Kiểm Thử', so_dien_thoai_lien_he: F.parent, dia_chi_thuong_tru: 'Thường trú đã sửa',
    dia_chi_hien_tai: 'Hiện tại đã sửa', ngay_nhap_hoc: '2022-09-01', ghi_chu: 'Hồ sơ cập nhật bởi giáo viên',
  });
  const Saved = await Prisma.hoc_sinh.findUniqueOrThrow({ where: { id: F.student_id } });
  Check('Địa chỉ và ghi chú được ghi vào MySQL', Saved.noi_sinh === 'Nơi Sinh Kiểm Thử' && Saved.dia_chi_thuong_tru === 'Thường trú đã sửa' && Saved.ghi_chu === 'Hồ sơ cập nhật bởi giáo viên');
  await Call('GV sửa sức khỏe trong phạm vi', 'PATCH', Own + '/suc_khoe', 'GIAO_VIEN', { chieu_cao_cm: 136, can_nang_kg: 33, ngay_do: F.today });
  await Call('GV sửa trạng thái trong phạm vi', 'PATCH', Own + '/trang_thai', 'GIAO_VIEN', { trang_thai: 'DANG_HOC' });
  await Call('Không dùng sửa trạng thái để xóa', 'PATCH', Own + '/trang_thai', 'GIAO_VIEN', { trang_thai: 'DA_XOA' }, 400);
  await Call('GV sửa phụ huynh liên kết trong phạm vi', 'PATCH', '/ho_so_hoc_sinh/phu_huynh/' + Parent.id, 'GIAO_VIEN', {
    ho_ten: Parent.ho_ten, nam_sinh: 1985, so_dien_thoai: Parent.so_dien_thoai, nghe_nghiep: 'Liên hệ đã cập nhật',
  });
  Check('Nghề nghiệp phụ huynh được lưu', (await Prisma.phu_huynh.findUniqueOrThrow({ where: { id: Parent.id } })).nghe_nghiep === 'Liên hệ đã cập nhật');
  await Call('GV bổ sung người giám hộ mới', 'POST', Own + '/phu_huynh', 'GIAO_VIEN', {
    ho_ten: 'Trần Thị Bổ Sung', nam_sinh: 1985, so_dien_thoai: '0940000002', nghe_nghiep: 'Nghề giả', moi_quan_he: 'ME', tao_tai_khoan: false,
  }, 201);
  const NewParent = await Prisma.phu_huynh.findFirstOrThrow({ where: { so_dien_thoai: '0940000002' } });
  Check('Bổ sung thông tin không tự cấp tài khoản', NewParent.tai_khoan_id === null);
  await Call('GV sửa mối quan hệ', 'PATCH', Own + '/phu_huynh/' + NewParent.id + '/moi_quan_he', 'GIAO_VIEN', { moi_quan_he: 'NGUOI_GIAM_HO' });
  for (const Role of ['GIAO_VIEN', 'PHU_HUYNH']) {
    await Call('Không tạo HS trái vai trò ' + Role, 'POST', '/ho_so_hoc_sinh/hoc_sinh', Role, StudentBody, 403);
    await Call('Không tạo GV trái vai trò ' + Role, 'POST', '/giao_vien', Role, {}, 403);
    await Call('Không xóa HS trái vai trò ' + Role, 'DELETE', Own, Role, undefined, 403);
    await Call('Không xóa GV trái vai trò ' + Role, 'DELETE', '/giao_vien/' + F.teacher_id, Role, undefined, 403);
  }
  await Call('PH không sửa hồ sơ con', 'PATCH', Own, 'PHU_HUYNH', { ghi_chu: 'Không được phép' }, 403);
  await Call('PH không sửa hồ sơ phụ huynh qua API nhân viên', 'PATCH', '/ho_so_hoc_sinh/phu_huynh/' + Parent.id, 'PHU_HUYNH', { nghe_nghiep: 'Không được phép' }, 403);
  for (const [Method, Endpoint, Data] of [
    ['GET', '/ho_so_hoc_sinh/hoc_sinh/' + ForeignId],
    ['PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + ForeignId, { ghi_chu: 'Không được phép' }],
    ['PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + ForeignId + '/suc_khoe', { chieu_cao_cm: 135, can_nang_kg: 32, ngay_do: F.today }],
    ['PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + ForeignId + '/trang_thai', { trang_thai: 'THOI_HOC' }],
    ['PATCH', '/ho_so_hoc_sinh/phu_huynh/' + ForeignParent.id, { nghe_nghiep: 'Không được phép' }],
    ['POST', '/ho_so_hoc_sinh/hoc_sinh/' + ForeignId + '/phu_huynh', { ho_ten: 'Trần Thị Cấm', so_dien_thoai: '0940000003', moi_quan_he: 'ME' }],
    ['PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + ForeignId + '/phu_huynh/' + ForeignParent.id + '/moi_quan_he', { moi_quan_he: 'ME' }],
  ]) await Call('GV bị chặn ngoài phạm vi ' + Method + ' ' + Endpoint, Method, Endpoint, 'GIAO_VIEN', Data, 403);
  Check('Hồ sơ ngoài phạm vi không đổi', (await Prisma.hoc_sinh.findUniqueOrThrow({ where: { id: ForeignId } })).ghi_chu === null);
  await Call('GV không gắn phụ huynh có sẵn theo ID', 'POST', Own + '/phu_huynh', 'GIAO_VIEN', { phu_huynh_id: ForeignParent.id, moi_quan_he: 'CHA' }, 403);
  await Call('GV không cấp TK khi bổ sung phụ huynh', 'POST', Own + '/phu_huynh', 'GIAO_VIEN', { ho_ten: 'Trần Thị Cấm', so_dien_thoai: '0940000003', moi_quan_he: 'ME', tao_tai_khoan: true }, 403);
  await Call('GV không cấp lại mật khẩu PH', 'POST', '/ho_so_hoc_sinh/phu_huynh/' + Parent.id + '/cap_lai_mat_khau', 'GIAO_VIEN', undefined, 403);
  await Call('GV không duyệt danh mục toàn bộ phụ huynh', 'GET', '/ho_so_hoc_sinh/phu_huynh', 'GIAO_VIEN', undefined, 403);
  const AbsenceDate = F.today;
  for (const [Buoi, TrangThai] of [['SANG', 'VANG_CO_PHEP'], ['CHIEU', 'VANG_KHONG_PHEP']]) {
    await Call('Ghi vắng ' + Buoi, 'POST', '/diem_danh_nghi_hoc/diem_danh', 'GIAO_VIEN', {
      lop_hoc_id: F.class_id, ngay_hoc: AbsenceDate, buoi_hoc: Buoi,
      danh_sach: [{ xep_lop_id: F.enrollment_id, trang_thai: TrangThai }],
    }, 201);
  }
  for (const Role of ['ADMIN', 'GIAO_VIEN', 'PHU_HUYNH']) {
    const Detail = await Call('Hồ sơ đầy đủ và thống kê nghỉ ' + Role, 'GET', Own, Role);
    Check('Đếm 1 ngày, 2 buổi vắng ' + Role, Detail.thong_ke_nghi.so_ngay_co_vang === 1 && Detail.thong_ke_nghi.so_buoi_vang === 2 && Detail.thong_ke_nghi.so_buoi_co_phep === 1 && Detail.thong_ke_nghi.so_buoi_khong_phep === 1);
    Check('Chi tiết có tên lớp/khối/năm ' + Role, Detail.xep_lop[0].lop_hoc.khoi.id === F.grade_id && Detail.xep_lop[0].lop_hoc.nam_hoc.id === F.year_id);
    Check('Không lộ hash trong hồ sơ ' + Role, !JSON.stringify(Detail).includes('mat_khau_bam'));
    if (Role === 'PHU_HUYNH') Check('PH chỉ thấy hồ sơ PH của mình', Detail.phu_huynh_hoc_sinh.length === 1 && Detail.phu_huynh_hoc_sinh[0].phu_huynh.id === Parent.id);
  }
  const BangUrl = '/danh_gia_hoc_tap/bang_danh_gia?lop_hoc_id=' + F.class_id + '&dot_danh_gia_id=' + F.dot_id + '&mon_hoc_id=' + F.subject_id;
  await Call('GV nhập một học sinh trong bảng', 'PUT', '/danh_gia_hoc_tap/ket_qua_mon_hoc', 'GIAO_VIEN', {
    hoc_sinh_id: F.student_id, mon_hoc_id: F.subject_id, dot_danh_gia_id: F.dot_id, muc_danh_gia: 'HOAN_THANH_TOT', nhan_xet: 'Đọc lại từ bảng',
  });
  for (const Role of ['ADMIN', 'GIAO_VIEN']) {
    const Bang = await Call('Đọc bảng đánh giá ' + Role, 'GET', BangUrl, Role);
    Check('Bảng đúng học sinh, nạp lại nhận xét ' + Role, Bang.danh_sach.length === 1 && Bang.danh_sach[0].id === F.student_id && Bang.danh_sach[0].ket_qua_mon_hoc[0].nhan_xet === 'Đọc lại từ bảng');
    Check('Cờ quyền nhập đúng vai trò ' + Role, Bang.mon_hoc.find(M => M.id === F.subject_id).duoc_nhap === (Role === 'GIAO_VIEN') && Bang.duoc_nhap_nang_luc === (Role === 'GIAO_VIEN'));
  }
  await Call('PH không đọc bảng nhân viên', 'GET', BangUrl, 'PHU_HUYNH', undefined, 403);
  await Call('GV không đọc bảng lớp khác', 'GET', '/danh_gia_hoc_tap/bang_danh_gia?lop_hoc_id=' + ForeignClass.lop_hoc.id + '&dot_danh_gia_id=' + F.dot_id, 'GIAO_VIEN', undefined, 403);
  const Year = await Prisma.nam_hoc.create({ data: { ten_nam_hoc: '2031-2032' } });
  const DotOther = await Prisma.dot_danh_gia.create({ data: { nam_hoc_id: Year.id, ma_dot: 'GIUA_HK1', ten_dot: 'Đợt năm khác', hoc_ky: 'HK1', thu_tu: 1 } });
  await Call('Không trộn đợt năm khác vào lớp', 'GET', '/danh_gia_hoc_tap/bang_danh_gia?lop_hoc_id=' + F.class_id + '&dot_danh_gia_id=' + DotOther.id, 'GIAO_VIEN', undefined, 400);
  await Call('Không dùng môn chưa cấu hình', 'GET', '/danh_gia_hoc_tap/bang_danh_gia?lop_hoc_id=' + F.class_id + '&dot_danh_gia_id=' + F.dot_id + '&mon_hoc_id=999999', 'GIAO_VIEN', undefined, 400);
  await Call('Thiếu tham số bảng', 'GET', '/danh_gia_hoc_tap/bang_danh_gia', 'GIAO_VIEN', undefined, 400);
  await Call('ID bảng sai', 'GET', '/danh_gia_hoc_tap/bang_danh_gia?lop_hoc_id=x&dot_danh_gia_id=' + F.dot_id, 'GIAO_VIEN', undefined, 400);
  const StatsUrl = '/danh_gia_hoc_tap/thong_ke_danh_gia?dot_danh_gia_id=' + F.dot_id;
  const StatsGV = await Call('GV xem thống kê phạm vi phân công', 'GET', StatsUrl, 'GIAO_VIEN');
  Check('Thống kê GV không chứa lớp khác', StatsGV.danh_sach.length === 2 && StatsGV.danh_sach[1].lop_hoc_id === F.class_id);
  const Level = StatsGV.danh_sach[0].mon_hoc.find(M => M.id === F.subject_id).muc_do.find(M => M.muc_danh_gia === 'HOAN_THANH_TOT');
  Check('Thống kê đúng số lượng và tỷ lệ', Level.so_luong === 1 && Level.ty_le === 100 && StatsGV.danh_sach[0].si_so === 1);
  const StatsAdmin = await Call('ADMIN xem thống kê toàn trường', 'GET', StatsUrl, 'ADMIN');
  const AdminTin = StatsAdmin.danh_sach[0].mon_hoc.find(M => M.id === F.subject_id);
  Check('Thống kê môn không dùng sĩ số của khối chưa cấu hình môn', AdminTin.si_so_ap_dung === 2 && AdminTin.muc_do.find(M => M.muc_danh_gia === 'HOAN_THANH_TOT').ty_le === 50);
  await Call('PH không xem thống kê trường', 'GET', StatsUrl, 'PHU_HUYNH', undefined, 403);
  await Call('GV không dùng thống kê lớp khác', 'GET', StatsUrl + '&lop_hoc_id=' + ForeignClass.lop_hoc.id, 'GIAO_VIEN', undefined, 403);
  await Call('Thống kê thiếu đợt', 'GET', '/danh_gia_hoc_tap/thong_ke_danh_gia', 'ADMIN', undefined, 400);
  const NoAssignment = await Call('Tạo GV chưa phân công', 'POST', '/giao_vien', 'ADMIN', {
    ho_ten: 'Trần Thị Ngoài Lớp', ngay_sinh: '1990-01-01', gioi_tinh: 'NU', so_dien_thoai: '0940000004', email: 'profile@example.test',
    dia_chi_lien_he: 'Địa chỉ giả', ngay_vao_truong: '2015-09-01', trinh_do_chuyen_mon: 'Đại học', mat_khau_ban_dau: 'Ci@InitialPassword123',
  }, 201);
  await Login('GV_KHONG_PHAN_CONG', NoAssignment.tai_khoan.ten_dang_nhap, NoAssignment.tai_khoan.mat_khau_ban_dau);
  await Change('GV_KHONG_PHAN_CONG', NoAssignment.tai_khoan.mat_khau_ban_dau);
  const EmptyCatalog = await Call('GV chưa phân công có danh mục rỗng', 'GET', '/ho_so_hoc_sinh/danh_muc', 'GV_KHONG_PHAN_CONG');
  Check('Không tự thấy toàn trường khi chưa phân công', EmptyCatalog.lop_hoc.length === 0);
  await Call('GV chưa phân công không sửa HS', 'PATCH', Own, 'GV_KHONG_PHAN_CONG', { ghi_chu: 'Không được phép' }, 403);
  const Expired = await Prisma.phan_cong_giao_vien.create({ data: { giao_vien_id: NoAssignment.giao_vien.id, lop_hoc_id: F.class_id, loai_phan_cong: 'GVCN', mon_hoc_id: F.subject_id, ngay_bat_dau: new Date('2026-09-01'), ngay_ket_thuc: new Date('2026-09-02'), nguon_phan_cong: 'THU_CONG' } });
  await Call('Phân công hết hạn không cho sửa PH', 'PATCH', '/ho_so_hoc_sinh/phu_huynh/' + Parent.id, 'GV_KHONG_PHAN_CONG', { nghe_nghiep: 'Không được phép' }, 403);
  await Call('Phân công hết hạn không xem bảng', 'GET', BangUrl, 'GV_KHONG_PHAN_CONG', undefined, 403);
  await Call('Phân công hết hạn không xem kết quả qua endpoint cũ', 'GET', '/danh_gia_hoc_tap/hoc_sinh/' + F.student_id + '/dot/' + F.dot_id, 'GV_KHONG_PHAN_CONG', undefined, 403);
  const Tomorrow = new Date(F.today + 'T00:00:00Z'); Tomorrow.setUTCDate(Tomorrow.getUTCDate() + 1);
  await Prisma.phan_cong_giao_vien.update({ where: { id: Expired.id }, data: { ngay_bat_dau: Tomorrow, ngay_ket_thuc: null } });
  await Call('Phân công chưa bắt đầu không sửa HS', 'PATCH', Own, 'GV_KHONG_PHAN_CONG', { ghi_chu: 'Không được phép' }, 403);
  await Call('ADMIN xóa HS, lưu lịch sử', 'DELETE', '/ho_so_hoc_sinh/hoc_sinh/' + ForeignId, 'ADMIN');
  const Archived = await Prisma.hoc_sinh.findUniqueOrThrow({ where: { id: ForeignId } });
  Check('Xóa HS giữ lịch sử và kết thúc xếp lớp', Archived.trang_thai === 'DA_XOA' && (await Prisma.xep_lop.findUniqueOrThrow({ where: { id: ForeignEnrollment.xep_lop.id } })).trang_thai === 'DA_KET_THUC');
  const All = await Call('Danh sách sau khi xóa HS', 'GET', '/ho_so_hoc_sinh/hoc_sinh', 'ADMIN');
  Check('HS đã xóa không còn trong danh sách mặc định', !All.danh_sach.some(S => S.id === ForeignId));
  await Call('Không cập nhật hồ sơ đã xóa', 'PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + ForeignId, 'ADMIN', { ghi_chu: 'Không được phép' }, 409);
  const DeletedTeacherToken = Tokens.GV_KHONG_PHAN_CONG;
  await Call('ADMIN xóa GV, khóa tài khoản', 'DELETE', '/giao_vien/' + NoAssignment.giao_vien.id, 'ADMIN');
  Check('Hồ sơ GV vẫn được giữ', (await Prisma.giao_vien.findUniqueOrThrow({ where: { id: NoAssignment.giao_vien.id } })).trang_thai === 'DA_XOA');
  Tokens.GV_KHONG_PHAN_CONG = DeletedTeacherToken;
  await Call('Phiên GV đã xóa bị khóa', 'GET', '/ho_so_hoc_sinh/hoc_sinh', 'GV_KHONG_PHAN_CONG', undefined, 403);
  await Call('Không cấp lại mật khẩu GV đã xóa', 'POST', '/giao_vien/' + NoAssignment.giao_vien.id + '/cap_lai_mat_khau', 'ADMIN', {}, 409);
  const Teachers = await Call('Danh sách GV sau xóa', 'GET', '/giao_vien', 'ADMIN');
  Check('GV đã xóa không còn trong danh sách mặc định', !Teachers.danh_sach.some(T => T.id === NoAssignment.giao_vien.id));
  const Core = JSON.parse(Fs.readFileSync(Path.resolve('../docs/ci-core-results.json'), 'utf8'));
  const Extra = JSON.parse(Fs.readFileSync(Path.resolve('../docs/ci-extra-results.json'), 'utf8'));
  const Routes = JSON.parse(Fs.readFileSync(Path.resolve('../docs/endpoint-map.json'), 'utf8'));
  const Covered = new Set();
  for (const Row of [...Core.ket_qua, ...Extra.ket_qua, ...Results]) {
    if (!Row.dat || !Row.method || Row.thuc_te < 200 || Row.thuc_te >= 300) continue;
    const Matches = Routes.filter(Route => Route.method === Row.method && new RegExp('^' + Route.endpoint.replace(/:[A-Za-z_]+/g, '[^/]+') + '$').test(Row.endpoint.split('?')[0]))
      .sort((A, B) => (A.endpoint.match(/:/g) || []).length - (B.endpoint.match(/:/g) || []).length);
    if (Matches[0]) Covered.add(Matches[0].method + ' ' + Matches[0].endpoint);
  }
  const Missing = Routes.filter(Route => !Covered.has(Route.method + ' ' + Route.endpoint)).map(Route => Route.method + ' ' + Route.endpoint);
  Check('Mọi endpoint có happy path thành công', Missing.length === 0);
  const Coverage = { total: Routes.length, covered: Covered.size, missing: Missing };
  Fs.writeFileSync(Path.resolve('../docs/ci-route-coverage.json'), JSON.stringify(Coverage, null, 2) + '\n');
  console.log('CI_ROUTE_COVERAGE ' + JSON.stringify(Coverage));
}
Main().catch(Error => {
  Results.push({ ten: 'Kiểm thử hồ sơ bị gián đoạn', dat: false, thong_bao: Error.message.replace(/Ci@\w+|Bearer \S+/g, '[REDACTED]') });
  console.error(Error.message.replace(/Ci@\w+|Bearer \S+/g, '[REDACTED]')); process.exitCode = 1;
}).finally(async () => {
  await Stop(); await Prisma.$disconnect();
  const Report = { thoi_diem: new Date().toISOString(), database: Database.pathname.slice(1), loai_du_lieu: 'Giả trên MySQL CI riêng', tong: Results.length, dat: Results.filter(Row => Row.dat).length, khong_dat: Results.filter(Row => !Row.dat).length, http: Results.filter(Row => Row.method).length, ket_qua: Results };
  Fs.writeFileSync(Path.resolve('../docs/ci-profile-results.json'), JSON.stringify(Report, null, 2) + '\n');
  console.log('CI_PROFILE_REPORT ' + JSON.stringify(Report));
});
