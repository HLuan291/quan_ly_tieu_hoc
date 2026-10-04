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
const RequestContexts = new WeakMap();
const InitialPassword = 'Browser@Initial123', ResetPassword = 'Browser@Reset123', ChangedPassword = 'Browser@Changed123';
let Browser, Page, Context, Teacher, BrowserClass, Student, Enrollment, Leave, FormStudent, FormClass, ScoreConfig, Criterion, FormSubject, SubjectAssignment;
let EvaluationDot = Fixture.dot_id;
let CurrentRole = 'KHACH', Phase = 'normal';
let PromptValues = [], PromptDateDefault;
function Redact(Value) {
  let Text = String(Value);
  for (const Secret of [Fixture.password, InitialPassword, ResetPassword, ChangedPassword]) Text = Text.replaceAll(Secret, '[REDACTED]');
  return Text.replace(/Bearer \S+/g, '[REDACTED]');
}
const IndependentCases = new Set([
  'GVCN duyệt đơn từ form', 'Mất mạng hiện lỗi và phục hồi', 'Viewport điện thoại thao tác được form',
  'Đăng xuất xóa token', 'Token hết hạn được xóa ở frontend', 'Token sai định dạng không crash trang',
  'Không lỗi JavaScript hoặc API 5xx',
]);
async function Case(Name, Work) {
  try { await Work(); Results.push({ ten: Name, dat: true }); console.log('BROWSER PASS ' + Name); }
  catch (Error) {
    Results.push({ ten: Name, dat: false, thong_bao: Redact(Error.message) });
    if (Page) await Page.screenshot({ path: Path.join(Output, 'failure.png'), fullPage: true }).catch(() => {});
    if (IndependentCases.has(Name)) {
      await Context?.setOffline(false).catch(() => {}); process.exitCode = 1; console.error(Redact(Error.message)); return;
    }
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
  PromiseResponse.catch(() => {});
  await Work();
  const Response = await PromiseResponse;
  const Data = await Response.json();
  Assert.equal(Response.status(), Expected, Redact('HTTP ' + Method + ' ' + Endpoint + ': ' + JSON.stringify(Data)));
  return Data;
}
function SelectWithPlaceholder(Text) {
  const Escaped = Text.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  return Page.locator('select').filter({ has: Page.locator('option').filter({ hasText: new RegExp('^\\s*' + Escaped + '\\s*$') }) });
}
async function SelectValue(Placeholder, Value) { await SelectWithPlaceholder(Placeholder).selectOption(String(Value)); }
function FormWithHeading(Heading) { return Page.locator('form').filter({ has: Page.getByRole('heading', { name: Heading, exact: true }) }); }
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
async function Shot(Name) {
  const Bytes = await Page.screenshot({ path: Path.join(Output, Name + '.png'), fullPage: true });
  Screens.push(Name + '.png');
  if (Name === 'parent-mobile') console.log('CI_SCREENSHOT_MOBILE ' + Bytes.toString('base64'));
}

function WithDeadline(PromiseValue) {
  let Timer;
  return Promise.race([
    PromiseValue,
    new Promise((_, Reject) => { Timer = setTimeout(() => Reject(new Error('Không nhận được phản hồi khởi tạo đang trì hoãn')), 10000); }),
  ]).finally(() => clearTimeout(Timer));
}
async function ChooseWhileInitialResponseIsLate(Route, Heading, WithDot = false) {
  let Release, FirstHeld, FirstDone, Count = 0;
  const Gate = new Promise(Resolve => { Release = Resolve; });
  const Held = new Promise(Resolve => { FirstHeld = Resolve; });
  const Done = new Promise(Resolve => { FirstDone = Resolve; });
  const Pattern = '**/ho_so_hoc_sinh/phu_huynh/me';
  const Handler = async Intercepted => {
    const NumberRequest = ++Count;
    const Response = await Intercepted.fetch(); // Gọi backend thật; giữ nguyên status/body/header.
    if (NumberRequest === 1) { FirstHeld(); await Gate; }
    await Intercepted.fulfill({ response: Response });
    if (NumberRequest === 1) FirstDone();
  };
  await Page.route(Pattern, Handler);
  try {
    await Go(Route, Heading);
    await SelectValue('Chọn học sinh', Student.id);
    if (WithDot) await SelectValue('Chọn đợt đánh giá', EvaluationDot);
    await WithDeadline(Held); Release(); await WithDeadline(Done);
    await Page.waitForTimeout(200);
    Assert.equal(await SelectWithPlaceholder('Chọn học sinh').inputValue(), String(Student.id), 'Phản hồi cũ không đổi học sinh đã chọn');
    if (WithDot) Assert.equal(await SelectWithPlaceholder('Chọn đợt đánh giá').inputValue(), String(EvaluationDot), 'Phản hồi cũ không đổi đợt đã chọn');
    Assert(Count >= 2, 'Đã thử phản hồi muộn của hai lượt khởi tạo StrictMode');
  } finally {
    Release(); await Page.unroute(Pattern, Handler);
  }
}

async function Main() {
  BrowserClass = await Prisma.lop_hoc.create({ data: { nam_hoc_id: Fixture.year_id, khoi_id: Fixture.grade_id, ten_lop: '5 Browser' } });
  const LastStudent = await Prisma.hoc_sinh.findFirst({ orderBy: { id: 'desc' }, select: { ma_hoc_sinh: true } });
  const LastCode = LastStudent?.ma_hoc_sinh.match(/^HS(\d+)$/);
  Assert(LastCode, 'Fixture học sinh phải theo định dạng mã HS đang dùng');
  const StudentCode = 'HS' + String(Number(LastCode[1]) + 1).padStart(4, '0');
  Student = await Prisma.hoc_sinh.create({ data: {
    ma_hoc_sinh: StudentCode, ho_ten: 'Nguyễn Văn Trình Duyệt', ngay_sinh: new Date('2016-01-01'), gioi_tinh: 'NAM',
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
  Page.on('dialog', Dialog => {
    if (Dialog.type() === 'prompt') {
      if (Dialog.message() === 'Ngày đo (YYYY-MM-DD)') PromptDateDefault = Dialog.defaultValue();
      void Dialog.accept(PromptValues.shift() ?? Dialog.defaultValue());
    } else void Dialog.accept();
  });
  Page.on('request', Request => {
    if (new URL(Request.url()).port !== '3000') return;
    let TokenRole = 'KHACH';
    try {
      const Token = Request.headers().authorization?.replace(/^Bearer /, '');
      const Payload = JSON.parse(Buffer.from(Token.split('.')[1], 'base64url').toString('utf8'));
      if (['ADMIN', 'GIAO_VIEN', 'PHU_HUYNH'].includes(Payload.vai_tro)) TokenRole = Payload.vai_tro;
    } catch {}
    RequestContexts.set(Request, { vai_tro: TokenRole, phase: Phase });
  });
  Page.on('response', Response => {
    if (new URL(Response.url()).port !== '3000') return;
    const Request = Response.request();
    Requests.push({ method: Request.method(), endpoint: new URL(Response.url()).pathname, status: Response.status(),
      ...(RequestContexts.get(Request) || { vai_tro: 'KHACH', phase: Phase }) });
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

  await Case('ADMIN sửa giáo viên qua form', async () => {
    await Page.locator('tbody tr').filter({ hasText: 'Trần Thị Trình Duyệt' }).getByRole('button', { name: 'Sửa', exact: true }).click();
    const Form = FormWithHeading('Cập nhật giáo viên');
    await Form.locator('input[name="email"]').fill('browser-edit@example.test');
    await HttpAction('PATCH', '/giao_vien/' + Teacher.giao_vien.id, () => Form.getByRole('button', { name: 'Lưu', exact: true }).click());
    Assert.equal((await Prisma.giao_vien.findUniqueOrThrow({ where: { id: Teacher.giao_vien.id } })).email, 'browser-edit@example.test');
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


  await Case('ADMIN tạo môn học qua form', async () => {
    const Form = FormWithHeading('Tạo môn học');
    await Form.getByPlaceholder('VD: TOAN, TV, TA', { exact: true }).fill('CI_BROWSER_M');
    await Form.getByPlaceholder('VD: Toán, Tiếng Việt, Tiếng Anh', { exact: true }).fill('Môn Chromium');
    const Data = await HttpAction('POST', '/phan_cong_giang_day/mon_hoc', () => Form.getByRole('button', { name: 'Tạo môn', exact: true }).click(), 201);
    FormSubject = Data.mon_hoc;
    Assert.equal((await Prisma.mon_hoc.findUniqueOrThrow({ where: { id: FormSubject.id } })).ma_mon_hoc, 'CI_BROWSER_M');
  });
  await Case('ADMIN gắn môn cho khối qua form', async () => {
    const Form = FormWithHeading('Gắn môn cho khối');
    await Form.locator('select').nth(0).selectOption(String(FormSubject.id));
    await Form.locator('select').nth(1).selectOption(String(Fixture.grade_id));
    await Form.locator('input[type="checkbox"]').uncheck();
    await HttpAction('POST', '/phan_cong_giang_day/mon_hoc_khoi', () => Form.getByRole('button', { name: 'Lưu cấu hình', exact: true }).click(), 201);
    Assert(await Prisma.mon_hoc_khoi.findFirst({ where: { mon_hoc_id: FormSubject.id, khoi_id: Fixture.grade_id, mac_dinh_gvcn: false } }));
  });
  await Case('ADMIN phân công giáo viên bộ môn qua form', async () => {
    const Form = FormWithHeading('Tạo phân công');
    await Form.locator('select').nth(0).selectOption(String(Teacher.giao_vien.id));
    await Form.locator('select').nth(1).selectOption(String(BrowserClass.id));
    await Form.locator('select').nth(2).selectOption('GVBM');
    await Form.locator('select').nth(3).selectOption(String(FormSubject.id));
    await HttpAction('POST', '/phan_cong_giang_day/phan_cong/mon_hoc', () => Form.getByRole('button', { name: 'Phân công', exact: true }).click(), 201);
    SubjectAssignment = await Prisma.phan_cong_giao_vien.findFirstOrThrow({ where: { giao_vien_id: Teacher.giao_vien.id, lop_hoc_id: BrowserClass.id, mon_hoc_id: FormSubject.id } });
    Assert.equal(SubjectAssignment.loai_phan_cong, 'GVBM');
  });
  await Case('ADMIN kết thúc phân công qua prompt native', async () => {
    const Row = Page.locator('tbody tr').filter({ hasText: 'Trần Thị Trình Duyệt' }).filter({ hasText: 'Môn Chromium' });
    PromptValues = [Fixture.today];
    await HttpAction('PATCH', '/phan_cong_giang_day/phan_cong/' + SubjectAssignment.id + '/ket_thuc',
      () => Row.getByRole('button', { name: 'Kết thúc', exact: true }).click());
    Assert.equal((await Prisma.phan_cong_giao_vien.findUniqueOrThrow({ where: { id: SubjectAssignment.id } })).ngay_ket_thuc.toISOString().slice(0, 10), Fixture.today);
    Assert.equal(PromptValues.length, 0);
  });

  await Case('ADMIN tạo học sinh qua form', async () => {
    await Go('/hoc_sinh', 'Quản lý học sinh');
    await Page.getByRole('button', { name: 'Thêm học sinh', exact: true }).click();
    const Form = FormWithHeading('Thông tin học sinh');
    for (const [Name, Value] of Object.entries({
      ho_ten: 'Nguyễn Văn Giao Diện', ngay_sinh: '2016-01-01', noi_sinh: 'Địa chỉ giả',
      so_dien_thoai_lien_he: '0950000002', ngay_nhap_hoc: '2022-09-01',
      dia_chi_thuong_tru: 'Địa chỉ giả', dia_chi_hien_tai: 'Địa chỉ giả',
    })) await Form.locator('input[name="' + Name + '"]').fill(Value);
    await Form.locator('select[name="gioi_tinh"]').selectOption('NAM');
    await Form.getByPlaceholder('VD: Nguyễn Văn Bình - viết hoa chữ cái đầu mỗi từ', { exact: true }).fill('Nguyễn Văn Giám Hộ');
    await Form.getByPlaceholder('Gồm đúng 10 số, VD: 0912345678', { exact: true }).fill('0950000002');
    await Form.locator('input[type="number"]').fill('1985');
    await Form.locator('input[type="checkbox"]').uncheck();
    const Data = await HttpAction('POST', '/ho_so_hoc_sinh/hoc_sinh', () => Form.getByRole('button', { name: 'Lưu học sinh', exact: true }).click(), 201);
    FormStudent = Data.hoc_sinh;
    Assert.equal((await Prisma.hoc_sinh.findUniqueOrThrow({ where: { id: FormStudent.id } })).ho_ten, 'Nguyễn Văn Giao Diện');
    Assert.equal((await Prisma.phu_huynh.findFirstOrThrow({ where: { so_dien_thoai: '0950000002' } })).tai_khoan_id, null);
  });

  await Case('ADMIN cập nhật sức khỏe qua hộp thoại native', async () => {
    const Row = Page.locator('tbody tr').filter({ hasText: FormStudent.ho_ten });
    await Row.waitFor();
    PromptValues = ['135', '32', Fixture.today];
    await HttpAction('PATCH', '/ho_so_hoc_sinh/hoc_sinh/' + FormStudent.id + '/suc_khoe',
      () => Row.getByRole('button', { name: 'Cập nhật sức khỏe', exact: true }).click());
    const Record = await Prisma.hoc_sinh.findUniqueOrThrow({ where: { id: FormStudent.id } });
    Assert.equal(Number(Record.chieu_cao_cm), 135); Assert.equal(Number(Record.can_nang_kg), 32);
    Assert.equal(PromptDateDefault, Fixture.today); Assert.equal(PromptValues.length, 0);
  });

  await Case('ADMIN tạo năm học qua form', async () => {
    await Go('/lop_hoc', 'Tổ chức lớp học');
    const Form = FormWithHeading('Tạo năm học');
    await Form.getByPlaceholder('VD: 2026-2027', { exact: true }).fill('2027-2028');
    await HttpAction('POST', '/to_chuc_lop_hoc/nam_hoc', () => Form.getByRole('button', { name: 'Tạo năm học', exact: true }).click(), 201);
    Assert(await Prisma.nam_hoc.findUnique({ where: { ten_nam_hoc: '2027-2028' } }));
  });
  await Case('ADMIN tạo lớp qua form', async () => {
    const Form = FormWithHeading('Tạo lớp');
    await Form.locator('select').nth(0).selectOption(String(Fixture.year_id));
    await Form.locator('select').nth(1).selectOption(String(Fixture.grade_id));
    await Form.getByPlaceholder('VD: 1A, 2B, 5A', { exact: true }).fill('5 UI');
    const Data = await HttpAction('POST', '/to_chuc_lop_hoc/lop_hoc', () => Form.getByRole('button', { name: 'Tạo lớp', exact: true }).click(), 201);
    FormClass = Data.lop_hoc;
    Assert.equal((await Prisma.lop_hoc.findUniqueOrThrow({ where: { id: FormClass.id } })).ten_lop, '5 UI');
  });
  await Case('ADMIN xếp học sinh vào lớp qua form', async () => {
    const Form = FormWithHeading('Xếp học sinh vào lớp');
    await Form.locator('select').nth(0).selectOption(String(FormStudent.id));
    await Form.locator('select').nth(1).selectOption(String(FormClass.id));
    Assert.equal(await Form.locator('input[type="date"]').inputValue(), Fixture.today);
    await HttpAction('POST', '/to_chuc_lop_hoc/xep_lop', () => Form.getByRole('button', { name: 'Xếp lớp', exact: true }).click(), 201);
    Assert(await Prisma.xep_lop.findFirst({ where: { hoc_sinh_id: FormStudent.id, lop_hoc_id: FormClass.id } }));
  });
  await Case('ADMIN tạo đợt đánh giá qua form', async () => {
    await Go('/danh_gia', 'Cấu hình đánh giá học tập');
    const Form = FormWithHeading('Tạo đợt đánh giá');
    await Form.locator('select').nth(0).selectOption(String(Fixture.year_id));
    await Form.locator('select').nth(1).selectOption('GIUA_HK1');
    await Form.getByPlaceholder('VD: Giữa học kỳ I năm học 2026-2027', { exact: true }).fill('Đợt kiểm thử Chromium');
    const Data = await HttpAction('POST', '/danh_gia_hoc_tap/dot_danh_gia', () => Form.getByRole('button', { name: 'Tạo đợt', exact: true }).click(), 201);
    EvaluationDot = Data.dot_danh_gia.id;
    Assert.equal((await Prisma.dot_danh_gia.findUniqueOrThrow({ where: { id: EvaluationDot } })).ma_dot, 'GIUA_HK1');
  });
  await Case('ADMIN cấu hình môn đánh giá qua form', async () => {
    const Form = FormWithHeading('Cấu hình môn đánh giá');
    for (const [Index, Value] of [EvaluationDot, Fixture.grade_id, Fixture.subject_id].entries()) await Form.locator('select').nth(Index).selectOption(String(Value));
    await HttpAction('POST', '/danh_gia_hoc_tap/cau_hinh_danh_gia_mon', () => Form.getByRole('button', { name: 'Lưu cấu hình môn', exact: true }).click(), 201);
    Assert(await Prisma.cau_hinh_danh_gia_mon.findFirst({ where: { dot_danh_gia_id: EvaluationDot, khoi_id: Fixture.grade_id, mon_hoc_id: Fixture.subject_id } }));
  });
  await Case('ADMIN cấu hình điểm qua form', async () => {
    const Form = FormWithHeading('Cấu hình điểm');
    await Form.getByPlaceholder('VD: DOC, VIET, KT_DINH_KY', { exact: true }).fill('BROWSER_SCORE');
    await Form.getByPlaceholder('VD: Điểm đọc, Điểm viết', { exact: true }).fill('Điểm Chromium');
    const Data = await HttpAction('POST', '/danh_gia_hoc_tap/cau_hinh_diem', () => Form.getByRole('button', { name: 'Tạo loại điểm', exact: true }).click(), 201);
    ScoreConfig = Data.cau_hinh_diem;
    Assert.equal((await Prisma.cau_hinh_diem.findUniqueOrThrow({ where: { id: ScoreConfig.id } })).cach_nhap, 'NHAP_TAY');
  });
  await Case('ADMIN tạo tiêu chí qua form', async () => {
    const Form = FormWithHeading('Tiêu chí năng lực / phẩm chất');
    await Form.getByPlaceholder('VD: TU_PHUC_VU, CHAM_HOC', { exact: true }).fill('BROWSER_TC');
    await Form.getByPlaceholder('VD: Tự phục vụ, Chăm học', { exact: true }).fill('Tự phục vụ Chromium');
    const Data = await HttpAction('POST', '/danh_gia_hoc_tap/tieu_chi_danh_gia', () => Form.getByRole('button', { name: 'Tạo tiêu chí', exact: true }).click(), 201);
    Criterion = Data.tieu_chi;
    Assert.equal((await Prisma.tieu_chi_danh_gia.findUniqueOrThrow({ where: { id: Criterion.id } })).ma_tieu_chi, 'BROWSER_TC');
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

  await Case('GV xem học sinh và phân công đúng phạm vi', async () => {
    await Go('/hoc_sinh', 'Quản lý học sinh');
    await Page.locator('tbody tr').filter({ hasText: Student.ho_ten }).waitFor();
    Assert.equal(await Page.getByRole('button', { name: 'Thêm học sinh', exact: true }).count(), 0);
    Assert.equal(await Page.locator('tbody tr').filter({ hasText: FormStudent.ho_ten }).count(), 0);
    await Go('/phan_cong', 'Phân công giảng dạy');
    await Page.getByText(BrowserClass.ten_lop, { exact: true }).first().waitFor();
    Assert.equal(await Page.getByRole('button', { name: 'Phân công', exact: true }).count(), 0);
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
    await SelectValue('Chọn đợt đánh giá', EvaluationDot); await SelectValue('Chọn môn được phân công', Fixture.subject_id);
    await FormWithHeading('Kết quả môn học').locator('select').selectOption('HOAN_THANH_TOT');
    await Page.getByPlaceholder('Nhập nhận xét ngắn gọn, rõ ràng về học sinh', { exact: true }).fill('Nhận xét từ Chromium');
    await HttpAction('PUT', '/danh_gia_hoc_tap/ket_qua_mon_hoc', () => Page.getByRole('button', { name: 'Lưu nhận xét', exact: true }).click());
    Assert.equal((await Prisma.ket_qua_mon_hoc.findFirstOrThrow({ where: { hoc_sinh_id: Student.id, mon_hoc_id: Fixture.subject_id, dot_danh_gia_id: EvaluationDot } })).muc_danh_gia, 'HOAN_THANH_TOT');
  });

  await Case('GV nhập điểm định kỳ qua form', async () => {
    await HttpAction('GET', '/danh_gia_hoc_tap/cau_hinh_diem', () => Page.getByRole('button', { name: 'Tải cấu hình điểm', exact: true }).click());
    const Form = FormWithHeading('Điểm định kỳ');
    await Form.locator('select').selectOption(String(ScoreConfig.id));
    await Form.getByPlaceholder('Điểm', { exact: true }).fill('8.5');
    Assert.equal(await Form.locator('input[type="date"]').inputValue(), Fixture.today);
    await HttpAction('POST', '/danh_gia_hoc_tap/diem_dinh_ky', () => Form.getByRole('button', { name: 'Nhập điểm', exact: true }).click(), 201);
    const Record = await Prisma.diem_kiem_tra_dinh_ky.findFirstOrThrow({ where: { hoc_sinh_id: Student.id, cau_hinh_diem_id: ScoreConfig.id } });
    Assert.equal(Number(Record.diem), 8.5);
  });
  await Case('GV đánh giá năng lực qua form', async () => {
    const Form = FormWithHeading('Năng lực / phẩm chất');
    await Form.locator('select').nth(0).selectOption(String(Criterion.id));
    await Form.locator('select').nth(1).selectOption('TOT');
    await HttpAction('PUT', '/danh_gia_hoc_tap/nang_luc_pham_chat', () => Form.getByRole('button', { name: 'Lưu đánh giá', exact: true }).click());
    const Record = await Prisma.ket_qua_nang_luc_pham_chat.findFirstOrThrow({ where: { hoc_sinh_id: Student.id, dot_danh_gia_id: EvaluationDot, tieu_chi_danh_gia_id: Criterion.id } });
    Assert.equal(Record.muc_danh_gia, 'TOT');
  });

  await Case('PH đăng nhập, menu đúng quyền', async () => {
    await Login(Fixture.parent, Fixture.password, 'PHU_HUYNH'); await Page.getByRole('link', { name: 'Con của tôi', exact: true }).waitFor();
    Assert.equal(await Page.getByRole('link', { name: 'Giáo viên', exact: true }).count(), 0);
  });
  await Case('PH giữ lựa chọn con và đợt khi phản hồi khởi tạo đến muộn', async () => {
    await ChooseWhileInitialResponseIsLate('/con_cua_toi', 'Con của tôi', true);
  });
  await Case('PH chỉ chọn con được liên kết', async () => {
    await Go('/con_cua_toi', 'Con của tôi'); await SelectValue('Chọn học sinh', Student.id);
    const Ids = await SelectWithPlaceholder('Chọn học sinh').locator('option').evaluateAll(Options => Options.filter(Option => Option.value).map(Option => Number(Option.value)));
    Assert.deepEqual(Ids.sort((A, B) => A - B), [Fixture.student_id, Student.id].sort((A, B) => A - B));
  });
  await Case('PH xem điểm danh vừa ghi', async () => {
    await HttpAction('GET', '/diem_danh_nghi_hoc/diem_danh/con/' + Student.id, () => Page.getByRole('button', { name: 'Xem điểm danh', exact: true }).click());
    await Page.getByText('Có mặt', { exact: false }).waitFor();
  });
  await Case('PH xem kết quả vừa ghi', async () => {
    await SelectValue('Chọn đợt đánh giá', EvaluationDot);
    await HttpAction('GET', '/danh_gia_hoc_tap/con/' + Student.id + '/dot/' + EvaluationDot, () => Page.getByRole('button', { name: 'Xem kết quả', exact: true }).click());
    await Page.getByText('Nhận xét từ Chromium', { exact: false }).waitFor(); await Shot('parent-desktop');
  });
  await Case('PH giữ học sinh trong đơn nghỉ khi phản hồi khởi tạo đến muộn', async () => {
    await ChooseWhileInitialResponseIsLate('/don_xin_nghi', 'Đơn xin nghỉ');
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
    Leave = Data.don_xin_nghi; Assert.equal(Leave.hoc_sinh_id, Student.id); Assert.equal((await Prisma.don_xin_nghi.findUniqueOrThrow({ where: { id: Leave.id } })).trang_thai, 'CHO_DUYET');
  });
  await Case('GVCN duyệt đơn từ form', async () => {
    await Login(Teacher.tai_khoan.ten_dang_nhap, ChangedPassword, 'GIAO_VIEN'); await Go('/don_xin_nghi', 'Đơn xin nghỉ');
    await SelectValue('Chọn lớp', BrowserClass.id);
    const Row = Page.locator('tbody tr').filter({ hasText: 'Đơn từ Chromium' }); await Row.waitFor();
    await HttpAction('PATCH', '/diem_danh_nghi_hoc/don_xin_nghi/' + Leave.id + '/xu_ly', () => Row.getByRole('button', { name: 'Duyệt', exact: true }).click());
    const Record = await Prisma.don_xin_nghi.findUniqueOrThrow({ where: { id: Leave.id } });
    Assert(Record.trang_thai === 'DA_DUYET' && Record.giao_vien_duyet_id === Teacher.giao_vien.id);
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
    const Metrics = await Page.evaluate(() => ({
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      mainWidth: document.querySelector('main').getBoundingClientRect().width,
    }));
    Viewports.push({ page: '/con_cua_toi', ...Metrics, horizontalOverflow: Metrics.scrollWidth > Metrics.width + 1 });
    await Shot('parent-mobile');
    Assert(Metrics.scrollWidth <= Metrics.width + 1, 'Không tràn ngang ở viewport điện thoại');
    Assert(Metrics.mainWidth >= Metrics.width - 1, 'Nội dung dùng đủ chiều rộng ở màn hình nhỏ');
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
