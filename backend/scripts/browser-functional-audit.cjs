// Chromium thật + API thật + MySQL riêng; không mock API.
const Assert = require('node:assert/strict');
const Fs = require('node:fs');
const Path = require('node:path');
const { spawn: Spawn } = require('node:child_process');
const Argon2 = require('argon2');
const { JwtService } = require('@nestjs/jwt');
const { PrismaService } = require('../dist/prisma.service');
const { chromium: Chromium } = require(Path.join(process.env.AUDIT_BROWSER_MODULES || '', 'playwright'));
const Database = new URL(process.env.DATABASE_URL || 'mysql://missing');
Assert(process.env.AUDIT_ALLOW_TEST_DATA === '1' && Database.pathname.includes('audit'), 'Chỉ dùng DB audit riêng');
const Fixture = JSON.parse(Fs.readFileSync(process.env.AUDIT_COMPLETE_FIXTURE_FILE, 'utf8'));
const Prisma = new PrismaService();
const Results = [], Requests = [], PageErrors = [], Screens = [], Viewports = [], Children = [];
const Root = Path.resolve('..'), Output = Path.join(Root, 'docs/ci-browser');
Fs.mkdirSync(Output, { recursive: true });
const InitialPassword = 'Browser@Initial123', ResetPassword = 'Browser@Reset123', ChangedPassword = 'Browser@Changed123';
let Browser, Page, Context, Teacher, BrowserClass, Student, Enrollment, Leave;
let CurrentRole = 'KHACH', Phase = 'normal';
function Redact(Value) {
  let Text = String(Value);
  for (const Secret of [Fixture.password, InitialPassword, ResetPassword, ChangedPassword]) Text = Text.replaceAll(Secret, '[REDACTED]');
  return Text.replace(/Bearer \S+/g, '[REDACTED]');
}
async function Case(Name, Work) {
  try { await Work(); Results.push({ ten: Name, dat: true }); console.log('BROWSER PASS ' + Name); }
  catch (Error) {
    Results.push({ ten: Name, dat: false, thong_bao: Redact(Error.message) });
    if (Page) await Page.screenshot({ path: Path.join(Output, 'failure.png'), fullPage: true }).catch(() => {});
    throw Error;
  }
}
async function StartServer(Name, Args, Cwd, Env, Url) {
  const Log = Fs.openSync(Path.join(Output, Name + '.log'), 'w');
  const Child = Spawn(process.execPath, Args, { cwd: Cwd, env: { ...process.env, ...Env }, stdio: ['ignore', Log, Log] });
  Children.push(Child);
  for (let Attempt = 0; Attempt < 150; Attempt++) {
    try { if ((await fetch(Url)).ok) return; } catch {}
    if (Child.exitCode !== null) throw new Error(Name + ' không khởi động');
    await new Promise(Done => setTimeout(Done, 100));
  }
  throw new Error(Name + ' hết thời gian khởi động');
}
async function StopServers() {
  for (const Child of Children.reverse()) {
    if (Child.exitCode !== null) continue;
    const Exit = new Promise(Done => Child.once('exit', Done));
    Child.kill(); await Exit;
  }
}
async function HttpAction(Method, Endpoint, Work, Expected = 200) {
  const PromiseResponse = Page.waitForResponse(Response => Response.request().method() === Method && new URL(Response.url()).pathname === Endpoint);
  await Work();
  const Response = await PromiseResponse;
  Assert.equal(Response.status(), Expected, 'HTTP ' + Method + ' ' + Endpoint);
  return Response.json();
}
function SelectWithPlaceholder(Text) {
  const Escaped = Text.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  return Page.locator('select').filter({ has: Page.locator('option').filter({ hasText: new RegExp('^\\s*' + Escaped + '\\s*$') }) });
}
async function SelectValue(Placeholder, Value) { await SelectWithPlaceholder(Placeholder).selectOption(String(Value)); }
async function Login(Username, Password, Role, Destination = '/dashboard') {
  CurrentRole = Role;
  await Page.goto('http://localhost:5173/dang_nhap');
  await Page.locator('input[name="ten_dang_nhap_hoac_so_dien_thoai"]').fill(Username);
  await Page.locator('input[name="mat_khau"]').fill(Password);
  await HttpAction('POST', '/auth/login', () => Page.getByRole('button', { name: 'Đăng nhập', exact: true }).click(), 201);
  await Page.waitForURL('**' + Destination);
}
async function Go(Route, Heading) {
  await Page.goto('http://localhost:5173' + Route);
  await Page.getByRole('heading', { name: Heading, exact: true }).waitFor();
}
async function Shot(Name) { await Page.screenshot({ path: Path.join(Output, Name + '.png'), fullPage: true }); Screens.push(Name + '.png'); }
async function Main() {
  BrowserClass = await Prisma.lop_hoc.create({ data: { nam_hoc_id: Fixture.year_id, khoi_id: Fixture.grade_id, ten_lop: '5 Browser' } });
  Student = await Prisma.hoc_sinh.create({ data: {
    ma_hoc_sinh: 'HS_BROWSER_CI', ho_ten: 'Nguyễn Văn Trình Duyệt', ngay_sinh: new Date('2016-01-01'), gioi_tinh: 'NAM',
    dan_toc: 'Kinh', quoc_tich: 'Việt Nam', noi_sinh: 'Địa chỉ giả', so_dien_thoai_lien_he: Fixture.parent,
    dia_chi_thuong_tru: 'Địa chỉ giả', dia_chi_hien_tai: 'Địa chỉ giả', ngay_nhap_hoc: new Date('2022-09-01'),
  } });
  const Parent = await Prisma.phu_huynh.findFirstOrThrow({ where: { so_dien_thoai: Fixture.parent } });
  await Prisma.phu_huynh_hoc_sinh.create({ data: { hoc_sinh_id: Student.id, phu_huynh_id: Parent.id, moi_quan_he: 'CHA' } });
  Enrollment = await Prisma.xep_lop.create({ data: { hoc_sinh_id: Student.id, lop_hoc_id: BrowserClass.id, ngay_bat_dau: new Date('2026-09-01') } });
  await StartServer('backend', ['dist/main.js'], Path.join(Root, 'backend'), { PORT: '3000' }, 'http://localhost:3000/');
  await StartServer('frontend', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
    Path.join(Root, 'frontend'), { VITE_API_URL: 'http://localhost:3000' }, 'http://localhost:5173/');
  Browser = await Chromium.launch({ headless: true });
  Context = await Browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Ho_Chi_Minh', permissions: ['clipboard-read', 'clipboard-write'] });
  await Context.addInitScript(({ Time }) => {
    const OriginalDate = Date;
    class FrozenDate extends OriginalDate {
      constructor(...Args) { super(...(Args.length ? Args : [Time])); }
      static now() { return new OriginalDate(Time).getTime(); }
    }
    window.Date = FrozenDate;
  }, { Time: Fixture.today + 'T00:30:00+07:00' });
  Page = await Context.newPage(); Page.setDefaultTimeout(20000);
  Page.on('pageerror', Error => PageErrors.push(Redact(Error.message)));
  Page.on('dialog', Dialog => Dialog.accept());
  Page.on('response', Response => {
    if (new URL(Response.url()).port !== '3000') return;
    Requests.push({ method: Response.request().method(), endpoint: new URL(Response.url()).pathname, status: Response.status(), vai_tro: CurrentRole, phase: Phase });
  });
  await Case('Khách bị chuyển tới đăng nhập', async () => {
    await Page.goto('http://localhost:5173/giao_vien'); await Page.waitForURL('**/dang_nhap');
  });
  await Case('Đăng nhập sai hiện lỗi', async () => {
    await Page.locator('input[name="ten_dang_nhap_hoac_so_dien_thoai"]').fill(Fixture.admin);
    await Page.locator('input[name="mat_khau"]').fill('Wrong@Password123');
    await HttpAction('POST', '/auth/login', () => Page.getByRole('button', { name: 'Đăng nhập', exact: true }).click(), 401);
    await Page.locator('.bg-red-50').waitFor(); Assert(Page.url().endsWith('/dang_nhap'));
  });
  await Case('ADMIN đăng nhập và thấy menu', async () => {
    await Login(Fixture.admin, Fixture.password, 'ADMIN'); await Page.getByRole('link', { name: 'Giáo viên', exact: true }).waitFor();
  });
  await Case('Tạo GV qua form và đối chiếu hash', async () => {
    await Go('/giao_vien', 'Quản lý giáo viên'); await Page.getByRole('button', { name: 'Thêm giáo viên', exact: true }).click();
    for (const [Name, Value] of Object.entries({
      ho_ten: 'Trần Thị Trình Duyệt', ngay_sinh: '1990-01-01', so_dien_thoai: '0950000001',
      email: 'browser@example.test', ngay_vao_truong: '2015-09-01', dia_chi_lien_he: 'Địa chỉ giả',
    })) await Page.locator('input[name="' + Name + '"]').fill(Value);
    await Page.locator('select[name="gioi_tinh"]').selectOption('NU');
    await Page.locator('form select').nth(1).selectOption('Đại học');
    await Page.locator('#mat-khau-ban-dau').fill(InitialPassword);
    const Form = Page.locator('form').filter({ has: Page.locator('input[name="ho_ten"]') });
    Teacher = await HttpAction('POST', '/giao_vien', () => Form.locator('button[type="submit"]').click(), 201);
    const Record = await Prisma.tai_khoan.findUniqueOrThrow({ where: { ten_dang_nhap: Teacher.tai_khoan.ten_dang_nhap } });
    Assert(await Argon2.verify(Record.mat_khau_bam, InitialPassword)); Assert(!JSON.stringify(Teacher).includes('mat_khau_bam'));
  });
  await Case('Clipboard native và ẩn mật khẩu', async () => {
    await Page.getByRole('button', { name: 'Sao chép tài khoản', exact: true }).click();
    await Page.getByRole('button', { name: 'Đã sao chép', exact: true }).waitFor();
    const Clipboard = await Page.evaluate(() => navigator.clipboard.readText());
    Assert(Clipboard.includes(Teacher.tai_khoan.ten_dang_nhap) && Clipboard.includes(InitialPassword));
    await Page.getByRole('button', { name: 'Ẩn thông tin', exact: true }).click();
    await Page.getByText('Thông tin đăng nhập giáo viên', { exact: true }).waitFor({ state: 'hidden' });
  });
  await Case('Ngày sinh tối đa đúng trước 07:00', async () => {
    Assert.equal(await Page.locator('input[name="ngay_sinh"]').getAttribute('max'), String(Number(Fixture.today.slice(0, 4)) - 18) + Fixture.today.slice(4));
    await Page.getByRole('button', { name: 'Đóng', exact: true }).click();
  });
  await Case('Cấp lại mật khẩu qua form', async () => {
    await Page.locator('tbody tr').filter({ hasText: 'Trần Thị Trình Duyệt' }).getByRole('button', { name: /Cấp lại mật khẩu/ }).click();
    await Page.locator('#mat-khau-cap-lai').fill(ResetPassword);
    await HttpAction('POST', '/giao_vien/' + Teacher.giao_vien.id + '/cap_lai_mat_khau',
      () => Page.getByRole('button', { name: 'Cấp mật khẩu mới', exact: true }).click(), 201);
    const Record = await Prisma.tai_khoan.findUniqueOrThrow({ where: { ten_dang_nhap: Teacher.tai_khoan.ten_dang_nhap } });
    Assert(Record.phai_doi_mat_khau && await Argon2.verify(Record.mat_khau_bam, ResetPassword));
    await Page.getByRole('button', { name: 'Ẩn thông tin', exact: true }).click();
  });
  await Case('Phân công GVCN qua form và môn tự động', async () => {
    await Go('/phan_cong', 'Phân công giảng dạy'); await SelectValue('Chọn giáo viên', Teacher.giao_vien.id);
    await SelectValue('Chọn lớp học', BrowserClass.id);
    await Page.locator('select').filter({ has: Page.locator('option[value="GVCN_CHINH"]') }).selectOption('GVCN_CHINH');
    const Form = Page.locator('form').filter({ has: Page.getByRole('button', { name: 'Phân công', exact: true }) });
    Assert.equal(await Form.locator('input[type="date"]').inputValue(), Fixture.today);
    await HttpAction('POST', '/phan_cong_giang_day/phan_cong/gvcn', () => Form.getByRole('button', { name: 'Phân công', exact: true }).click(), 201);
    const Records = await Prisma.phan_cong_giao_vien.findMany({ where: { lop_hoc_id: BrowserClass.id, giao_vien_id: Teacher.giao_vien.id } });
    Assert(Records.length === 2 && Records.some(Row => Row.mon_hoc_id === Fixture.subject_id && Row.nguon_phan_cong === 'TU_DONG_GVCN'));
  });
  await Case('GV bắt buộc đổi mật khẩu', async () => {
    await Login(Teacher.tai_khoan.ten_dang_nhap, ResetPassword, 'GIAO_VIEN', '/doi_mat_khau');
    await Page.goto('http://localhost:5173/diem_danh'); await Page.waitForURL('**/doi_mat_khau');
  });
  await Case('Chặn xác nhận mật khẩu sai', async () => {
    await Page.getByPlaceholder('Nhập mật khẩu hiện tại', { exact: true }).fill(ResetPassword);
    await Page.getByPlaceholder('Ít nhất 8 ký tự', { exact: true }).fill(ChangedPassword);
    await Page.getByPlaceholder('Nhập lại đúng mật khẩu mới', { exact: true }).fill('Mismatch@Password123');
    await Page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
    await Page.getByText('Mật khẩu xác nhận không khớp', { exact: true }).waitFor();
  });
  await Case('Đổi mật khẩu GV và kiểm tra MySQL', async () => {
    await Page.getByPlaceholder('Nhập lại đúng mật khẩu mới', { exact: true }).fill(ChangedPassword);
    await HttpAction('POST', '/auth/doi-mat-khau', () => Page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click(), 201);
    await Page.waitForURL('**/dashboard');
    const Record = await Prisma.tai_khoan.findUniqueOrThrow({ where: { ten_dang_nhap: Teacher.tai_khoan.ten_dang_nhap } });
    Assert(!Record.phai_doi_mat_khau && await Argon2.verify(Record.mat_khau_bam, ChangedPassword));
  });
  await Case('Chặn GV vào trang quản trị', async () => {
    Assert.equal(await Page.getByRole('link', { name: 'Giáo viên', exact: true }).count(), 0);
    await Page.goto('http://localhost:5173/giao_vien'); await Page.waitForURL('**/khong_co_quyen');
  });
  await Case('Ngày điểm danh đúng và tải sổ', async () => {
    await Go('/diem_danh', 'Điểm danh');
    Assert.equal(await Page.locator('input[type="date"]').inputValue(), Fixture.today);
    Assert.equal(await Page.locator('input[type="date"]').getAttribute('max'), Fixture.today);
    await SelectValue('Chọn lớp chủ nhiệm', BrowserClass.id);
    await HttpAction('GET', '/diem_danh_nghi_hoc/diem_danh', () => Page.getByRole('button', { name: 'Tải sổ điểm danh', exact: true }).click());
    await Page.locator('tbody tr').filter({ hasText: Student.ho_ten }).waitFor();
  });
  await Case('Native validation chặn thiếu trạng thái', async () => {
    const Select = Page.getByRole('combobox', { name: 'Trạng thái điểm danh ' + Student.ho_ten, exact: true });
    Assert(await Select.evaluate(Element => Element.required && Element.validity.valueMissing));
    const Before = Requests.filter(Row => Row.method === 'POST' && Row.endpoint === '/diem_danh_nghi_hoc/diem_danh').length;
    await Page.getByRole('button', { name: 'Lưu điểm danh', exact: true }).click(); await Page.waitForTimeout(300);
    Assert.equal(Requests.filter(Row => Row.method === 'POST' && Row.endpoint === '/diem_danh_nghi_hoc/diem_danh').length, Before);
  });
  await Case('Lưu điểm danh từ form', async () => {
    await Page.getByRole('combobox', { name: 'Trạng thái điểm danh ' + Student.ho_ten, exact: true }).selectOption('CO_MAT');
    await HttpAction('POST', '/diem_danh_nghi_hoc/diem_danh', () => Page.getByRole('button', { name: 'Lưu điểm danh', exact: true }).click(), 201);
    Assert.equal((await Prisma.diem_danh.findFirstOrThrow({ where: { xep_lop_id: Enrollment.id } })).trang_thai, 'CO_MAT');
  });
  await Case('Lưu nhận xét môn từ form', async () => {
    await Go('/danh_gia', 'Đánh giá học tập'); await SelectValue('Chọn lớp', BrowserClass.id); await SelectValue('Chọn học sinh', Student.id);
    await SelectValue('Chọn đợt đánh giá', Fixture.dot_id); await SelectValue('Chọn môn được phân công', Fixture.subject_id);
    await SelectValue('Chọn mức đánh giá', 'HOAN_THANH_TOT');
    await Page.getByPlaceholder('Nhập nhận xét ngắn gọn, rõ ràng về học sinh', { exact: true }).fill('Nhận xét từ Chromium');
    await HttpAction('PUT', '/danh_gia_hoc_tap/ket_qua_mon_hoc', () => Page.getByRole('button', { name: 'Lưu nhận xét', exact: true }).click());
    Assert.equal((await Prisma.ket_qua_mon_hoc.findFirstOrThrow({ where: { hoc_sinh_id: Student.id, mon_hoc_id: Fixture.subject_id, dot_danh_gia_id: Fixture.dot_id } })).muc_danh_gia, 'HOAN_THANH_TOT');
  });
  await Case('PH đăng nhập, menu đúng quyền', async () => {
    await Login(Fixture.parent, Fixture.password, 'PHU_HUYNH'); await Page.getByRole('link', { name: 'Con của tôi', exact: true }).waitFor();
    Assert.equal(await Page.getByRole('link', { name: 'Giáo viên', exact: true }).count(), 0);
  });
  await Case('PH chỉ chọn con được liên kết', async () => {
    await Go('/con_cua_toi', 'Con của tôi'); await SelectValue('Chọn học sinh', Student.id);
    const Ids = await SelectWithPlaceholder('Chọn học sinh').locator('option').evaluateAll(Options => Options.filter(Option => Option.value).map(Option => Number(Option.value)));
    Assert.deepEqual(Ids.sort((A, B) => A - B), [Fixture.student_id, Student.id].sort((A, B) => A - B));
  });
  await Case('PH xem điểm danh vừa ghi', async () => {
    await HttpAction('GET', '/diem_danh_nghi_hoc/diem_danh/con/' + Student.id, () => Page.getByRole('button', { name: 'Xem điểm danh', exact: true }).click());
    await Page.getByText('Có mặt', { exact: true }).waitFor();
  });
  await Case('PH xem kết quả vừa ghi', async () => {
    await SelectValue('Chọn đợt đánh giá', Fixture.dot_id);
    await HttpAction('GET', '/danh_gia_hoc_tap/con/' + Student.id + '/dot/' + Fixture.dot_id, () => Page.getByRole('button', { name: 'Xem kết quả', exact: true }).click());
    await Page.getByText('Nhận xét từ Chromium', { exact: true }).waitFor(); await Shot('parent-desktop');
  });
  await Case('Ngày đơn nghỉ đúng trước 07:00', async () => {
    await Go('/don_xin_nghi', 'Đơn xin nghỉ');
    const Dates = Page.locator('input[type="date"]');
    Assert.equal(await Dates.nth(0).inputValue(), Fixture.today); Assert.equal(await Dates.nth(0).getAttribute('min'), Fixture.today);
    Assert.equal(await Dates.nth(1).inputValue(), Fixture.today);
  });
  await Case('PH gửi đơn và lưu CHO_DUYET', async () => {
    await SelectValue('Chọn học sinh', Student.id);
    await Page.getByPlaceholder('VD: Học sinh bị sốt, cần nghỉ để theo dõi sức khỏe', { exact: true }).fill('Đơn từ Chromium');
    const Data = await HttpAction('POST', '/diem_danh_nghi_hoc/don_xin_nghi', () => Page.getByRole('button', { name: 'Gửi đơn', exact: true }).click(), 201);
    Leave = Data.don_xin_nghi; Assert.equal((await Prisma.don_xin_nghi.findUniqueOrThrow({ where: { id: Leave.id } })).trang_thai, 'CHO_DUYET');
  });
  await Case('GVCN duyệt đơn từ form', async () => {
    await Login(Teacher.tai_khoan.ten_dang_nhap, ChangedPassword, 'GIAO_VIEN'); await Go('/don_xin_nghi', 'Đơn xin nghỉ');
    await SelectValue('Chọn lớp', BrowserClass.id);
    const Row = Page.locator('tbody tr').filter({ hasText: 'Đơn từ Chromium' }); await Row.waitFor();
    await HttpAction('PATCH', '/diem_danh_nghi_hoc/don_xin_nghi/' + Leave.id + '/xu_ly', () => Row.getByRole('button', { name: 'Duyệt', exact: true }).click());
    const Record = await Prisma.don_xin_nghi.findUniqueOrThrow({ where: { id: Leave.id } });
    Assert(Record.trang_thai === 'DA_DUYET' && Record.giao_vien_xu_ly_id === Teacher.giao_vien.id);
  });
  await Case('Mất mạng hiện lỗi và phục hồi', async () => {
    await Login(Fixture.parent, Fixture.password, 'PHU_HUYNH'); await Go('/con_cua_toi', 'Con của tôi'); await SelectValue('Chọn học sinh', Student.id);
    Phase = 'offline'; await Context.setOffline(true); await Page.getByRole('button', { name: 'Xem điểm danh', exact: true }).click();
    await Page.locator('main .bg-red-50').waitFor(); await Context.setOffline(false); Phase = 'normal';
    await Page.reload(); await Page.getByRole('heading', { name: 'Con của tôi', exact: true }).waitFor(); await SelectValue('Chọn học sinh', Student.id);
    await HttpAction('GET', '/diem_danh_nghi_hoc/diem_danh/con/' + Student.id, () => Page.getByRole('button', { name: 'Xem điểm danh', exact: true }).click());
  });
  await Case('Viewport điện thoại thao tác được form', async () => {
    await Page.setViewportSize({ width: 390, height: 844 }); await SelectValue('Chọn học sinh', Student.id);
    await HttpAction('GET', '/diem_danh_nghi_hoc/diem_danh/con/' + Student.id, () => Page.getByRole('button', { name: 'Xem điểm danh', exact: true }).click());
    const Metrics = await Page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    Viewports.push({ page: '/con_cua_toi', ...Metrics, horizontalOverflow: Metrics.scrollWidth > Metrics.width + 1 }); await Shot('parent-mobile');
  });
  await Case('Đăng xuất xóa token', async () => {
    await Page.getByRole('button', { name: 'Đăng xuất', exact: true }).click(); await Page.waitForURL('**/dang_nhap');
    Assert.equal(await Page.evaluate(() => localStorage.getItem('access_token')), null);
  });
  await Case('Token hết hạn được xóa ở frontend', async () => {
    const Admin = await Prisma.tai_khoan.findUniqueOrThrow({ where: { ten_dang_nhap: Fixture.admin } });
    const Expired = new JwtService({ secret: process.env.JWT_SECRET }).sign({
      sub: Admin.id, vai_tro: 'ADMIN', phai_doi_mat_khau: false, exp: Math.floor(Date.parse(Fixture.today + 'T00:30:00+07:00') / 1000) - 1,
    });
    await Page.evaluate(Token => localStorage.setItem('access_token', Token), Expired);
    await Page.goto('http://localhost:5173/giao_vien'); await Page.waitForURL('**/dang_nhap');
    Assert.equal(await Page.evaluate(() => localStorage.getItem('access_token')), null);
  });
  await Case('Token sai định dạng không crash trang', async () => {
    await Page.evaluate(() => localStorage.setItem('access_token', 'bad.token.value'));
    await Page.goto('http://localhost:5173/giao_vien'); await Page.waitForURL('**/dang_nhap');
  });
  await Case('Không lỗi JavaScript hoặc API 5xx', async () => {
    Assert.equal(PageErrors.length, 0, PageErrors.join('\n')); Assert.equal(Requests.filter(Row => Row.status >= 500).length, 0);
  });
}
Main().catch(Error => {
  if (!Results.some(Row => !Row.dat)) Results.push({ ten: 'Browser bị gián đoạn', dat: false, thong_bao: Redact(Error.message) });
  console.error(Redact(Error.message)); process.exitCode = 1;
}).finally(async () => {
  await Context?.close().catch(() => {}); await Browser?.close().catch(() => {}); await StopServers(); await Prisma.$disconnect();
  const Report = {
    thoi_diem: new Date().toISOString(), browser: 'Chromium thật, headless', du_lieu: 'Giả trên MySQL CI riêng',
    tong: Results.length, dat: Results.filter(Row => Row.dat).length, khong_dat: Results.filter(Row => !Row.dat).length,
    http: Requests.length, http_5xx: Requests.filter(Row => Row.status >= 500).length, loi_javascript: PageErrors,
    viewport: Viewports, screenshots: Screens, ket_qua: Results, yeu_cau_http: Requests,
  };
  Fs.writeFileSync(Path.join(Root, 'docs/ci-browser-results.json'), JSON.stringify(Report, null, 2) + '\n');
  console.log('CI_BROWSER_REPORT ' + JSON.stringify(Report));
});
