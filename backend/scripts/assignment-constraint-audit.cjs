// Chỉ dùng trên DB thử nghiệm riêng đã tạo từ Prisma schema.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const argon2 = require('argon2');
const { PrismaService } = require('../dist/prisma.service');
const { Chay, CheckCu, CheckMoi, CheckChuyenTiep, NhanDangCheck, TaoKeHoach } = require('./sua-rang-buoc-phan-cong.cjs');
const Database = new URL(process.env.DATABASE_URL || 'mysql://missing');
assert(process.env.AUDIT_ALLOW_TEST_DATA === '1' && Database.pathname.includes('audit'), 'Chỉ chạy trên DB audit với AUDIT_ALLOW_TEST_DATA=1');
const Prisma = new PrismaService();
const KetQua = [];
const FileHoiQuy = path.join(os.tmpdir(), 'assignment-regression-' + process.pid + '.json');
let Server;

function Ghi(Ten, Dat) { KetQua.push({ ten: Ten, dat: !!Dat }); assert(Dat, Ten); }
async function DocCheck() {
  const [Dong] = await Prisma.$queryRawUnsafe("SELECT CHECK_CLAUSE AS bieu_thuc FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'chk_pc_loai'");
  return Dong.bieu_thuc;
}
async function DocDong() {
  return Prisma.phan_cong_giao_vien.findMany({ orderBy: { id: 'asc' } });
}
async function DoiCheck(BieuThuc) {
  await Prisma.$executeRawUnsafe('ALTER TABLE phan_cong_giao_vien DROP CHECK chk_pc_loai, ADD CONSTRAINT chk_pc_loai CHECK (' + BieuThuc + ')');
}
async function KhoiDongBackend() {
  Server = spawn(process.execPath, ['dist/main.js'], { env: { ...process.env, PORT: '3000' }, stdio: 'ignore' });
  for (let Lan = 0; Lan < 100; Lan++) {
    try { if ((await fetch('http://127.0.0.1:3000/')).ok) return; } catch {}
    if (Server.exitCode !== null) throw new Error('Backend không khởi động');
    await new Promise((Done) => setTimeout(Done, 100));
  }
  throw new Error('Hết thời gian chờ backend');
}
async function DungBackend() {
  const DaDung = new Promise((Done) => Server.once('exit', Done));
  Server.kill();
  await DaDung;
  Server = undefined;
}
async function Main() {
  const [ThongTin] = await Prisma.$queryRawUnsafe('SELECT VERSION() AS server_version');
  const MatKhau = 'Audit@Constraint123';
  const Admin = await Prisma.tai_khoan.create({ data: { ten_dang_nhap: 'constraint_admin', so_dien_thoai: '0980000002', mat_khau_bam: await argon2.hash(MatKhau), vai_tro: 'ADMIN', phai_doi_mat_khau: false } });
  const Tk = await Prisma.tai_khoan.create({ data: { ten_dang_nhap: 'constraint_teacher', so_dien_thoai: '0980000001', mat_khau_bam: await argon2.hash(MatKhau), vai_tro: 'GIAO_VIEN', phai_doi_mat_khau: false } });
  const Gv = await Prisma.giao_vien.create({ data: { ma_giao_vien: 'GV0001', ho_ten: 'Trần Thị B', ngay_sinh: new Date('1990-01-01'), gioi_tinh: 'NU', so_dien_thoai: '0980000001', email: 'demo@example.test', dia_chi_lien_he: 'Địa chỉ giả', ngay_vao_truong: new Date('2015-09-01'), trinh_do_chuyen_mon: 'Đại học', tai_khoan_id: Tk.id } });
  const Khoi = await Prisma.khoi.create({ data: { so_khoi: 1, ten_khoi: 'Khối 1' } });
  const NamCu = await Prisma.nam_hoc.create({ data: { ten_nam_hoc: '2024-2025' } });
  const NamMoi = await Prisma.nam_hoc.create({ data: { ten_nam_hoc: '2025-2026' } });
  const LopCu = await Prisma.lop_hoc.create({ data: { khoi_id: Khoi.id, nam_hoc_id: NamCu.id, ten_lop: 'Lớp cũ' } });
  const LopMoi = await Prisma.lop_hoc.create({ data: { khoi_id: Khoi.id, nam_hoc_id: NamMoi.id, ten_lop: 'Lớp mới' } });
  const MonTuDong = await Prisma.mon_hoc.create({ data: { ma_mon_hoc: 'MIG_TOAN', ten_mon_hoc: 'Môn tự động kiểm thử' } });
  const MonBoSung = await Prisma.mon_hoc.create({ data: { ma_mon_hoc: 'MIG_TA', ten_mon_hoc: 'Môn bổ sung kiểm thử' } });
  await Prisma.mon_hoc_khoi.create({ data: { khoi_id: Khoi.id, mon_hoc_id: MonTuDong.id, mac_dinh_gvcn: true } });
  await Prisma.$executeRawUnsafe('ALTER TABLE phan_cong_giao_vien ADD CONSTRAINT chk_pc_loai CHECK (' + CheckCu + ')');
  const Base = { giao_vien_id: Gv.id, lop_hoc_id: LopCu.id, ngay_bat_dau: new Date('2024-09-01'), ngay_ket_thuc: new Date('2025-06-01') };
  await Prisma.phan_cong_giao_vien.create({ data: { ...Base, loai_phan_cong: 'CHU_NHIEM', mon_hoc_id: null, nguon_phan_cong: null } });
  await Prisma.phan_cong_giao_vien.create({ data: { ...Base, loai_phan_cong: 'GIANG_DAY', mon_hoc_id: MonTuDong.id, nguon_phan_cong: 'TU_DONG_GVCN' } });
  await Prisma.phan_cong_giao_vien.create({ data: { ...Base, loai_phan_cong: 'GIANG_DAY', mon_hoc_id: MonBoSung.id, nguon_phan_cong: 'BO_SUNG' } });
  const Cu = await DocDong();
  const CheckBanDau = await DocCheck();
  await Chay([]);
  Ghi('Mặc định chỉ kiểm tra, giữ nguyên dữ liệu và CHECK', JSON.stringify(await DocDong()) === JSON.stringify(Cu) && await DocCheck() === CheckBanDau);

  await KhoiDongBackend();
  const Login = await fetch('http://127.0.0.1:3000/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ten_dang_nhap_hoac_so_dien_thoai: Admin.ten_dang_nhap, mat_khau: MatKhau }) });
  const { access_token: Token } = await Login.json();
  assert(Token);
  const Body = { giao_vien_id: Gv.id, lop_hoc_id: LopMoi.id, ngay_bat_dau: '2025-09-01' };
  async function PhanCong() {
    return fetch('http://127.0.0.1:3000/phan_cong_giang_day/phan_cong/gvcn', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + Token }, body: JSON.stringify(Body) });
  }
  const TruocSua = await PhanCong();
  Ghi('Tái hiện HTTP 500 với chk_pc_loai cũ', TruocSua.status === 500);
  await TruocSua.text();
  await DungBackend();
  await Chay(['--apply']);
  const Moi = await DocDong();
  Ghi('Chuyển đủ 3 mã cũ và giữ nguyên toàn bộ trường khác', JSON.stringify(Moi) === JSON.stringify(TaoKeHoach(Cu)));
  Ghi('CHECK mới được cài đặt', NhanDangCheck(await DocCheck()) === 'MOI');
  const ThuMuc = path.resolve('backups');
  const Files = fs.readdirSync(ThuMuc).filter((Ten) => Ten.endsWith('.json'));
  const FileMoiNhat = Files.sort().at(-1);
  const BanSao = JSON.parse(fs.readFileSync(path.join(ThuMuc, FileMoiNhat), 'utf8'));
  Ghi('Bản sao chứa DDL thật, CHECK cũ và đủ dữ liệu trước chuyển', BanSao.danh_sach.length === 3 && NhanDangCheck(BanSao.check_cu) === 'CU' && BanSao.create_table.includes('chk_pc_loai'));
  await Chay(['--apply']);
  Ghi('Chạy lại không thay đổi DB hoặc tạo thêm bản sao', JSON.stringify(await DocDong()) === JSON.stringify(Moi) && fs.readdirSync(ThuMuc).filter((Ten) => Ten.endsWith('.json')).length === Files.length);
  for (const Data of [
    { ...Base, loai_phan_cong: 'SAI', mon_hoc_id: null, nguon_phan_cong: null },
    { ...Base, loai_phan_cong: 'GVBM', mon_hoc_id: null, nguon_phan_cong: 'BO_SUNG' },
    { ...Base, loai_phan_cong: 'GVCN', mon_hoc_id: MonBoSung.id, nguon_phan_cong: null },
    { ...Base, loai_phan_cong: 'CHU_NHIEM', mon_hoc_id: null, nguon_phan_cong: null },
  ]) {
    let Loi;
    try { await Prisma.phan_cong_giao_vien.create({ data: Data }); } catch (Error) { Loi = Error; }
    Ghi('CHECK mới vẫn chặn dòng sai: ' + Data.loai_phan_cong + '/' + Data.mon_hoc_id + '/' + Data.nguon_phan_cong, Loi?.message.includes('chk_pc_loai'));
  }
  await DoiCheck(CheckChuyenTiep);
  for (const Dong of Cu) await Prisma.phan_cong_giao_vien.update({ where: { id: Dong.id }, data: { loai_phan_cong: Dong.loai_phan_cong } });
  await Chay(['--apply']);
  Ghi('Tiếp tục được sau gián đoạn ở CHECK chuyển tiếp', NhanDangCheck(await DocCheck()) === 'MOI' && JSON.stringify(await DocDong()) === JSON.stringify(Moi));
  await DoiCheck('1 = 1');
  let BiChan = false;
  try { await Chay(['--apply']); } catch (Loi) { BiChan = Loi.message.includes('khác mẫu'); }
  Ghi('Không sửa ràng buộc khác mẫu', BiChan && await DocCheck() === '(1 = 1)');
  await DoiCheck(CheckMoi);

  await KhoiDongBackend();
  const SauSua = await PhanCong();
  Ghi('Cùng yêu cầu phân công chuyển từ HTTP 500 sang 201 sau sửa', SauSua.status === 201);
  await SauSua.text();
  const PhanCongMoi = await Prisma.phan_cong_giao_vien.findMany({ where: { lop_hoc_id: LopMoi.id } });
  Ghi('Phân công mới lưu đủ dòng chủ nhiệm và môn tự động', PhanCongMoi.length === 2
    && PhanCongMoi.some((Dong) => Dong.loai_phan_cong === 'GVCN' && Dong.mon_hoc_id === null)
    && PhanCongMoi.some((Dong) => Dong.loai_phan_cong === 'GVCN' && Dong.mon_hoc_id === MonTuDong.id && Dong.nguon_phan_cong === 'TU_DONG_GVCN'));
  await DungBackend();

  const Runtime = spawn(process.execPath, ['scripts/runtime-audit.cjs'], { env: { ...process.env, AUDIT_REPORT_FILE: FileHoiQuy }, stdio: 'inherit' });
  await new Promise((Done, Reject) => Runtime.on('exit', (Ma) => Ma === 0 ? Done() : Reject(new Error('API regression failed'))));
  const HoiQuy = JSON.parse(fs.readFileSync(FileHoiQuy, 'utf8'));
  Ghi('Toàn bộ ca API core đạt khi chk_pc_loai mới được thực thi', HoiQuy.tong >= 231 && HoiQuy.khong_dat === 0);
  const Report = { thoi_diem: new Date().toISOString(), mysql: ThongTin.server_version, database: 'DB riêng từ Prisma schema với chk_pc_loai được thực thi', du_lieu: 'Giả; không kết nối DB người dùng', tong: KetQua.length, dat: KetQua.filter((Dong) => Dong.dat).length, ket_qua: KetQua, hoi_quy_api: { tong: HoiQuy.tong, dat: HoiQuy.dat, khong_dat: HoiQuy.khong_dat } };
  fs.writeFileSync(path.resolve('../docs/assignment-constraint-audit-results.json'), JSON.stringify(Report, null, 2) + '\n');
  console.log(JSON.stringify({ migration_checks: Report.tong, passed: Report.dat, api_checks: HoiQuy.tong }));
}
Main().catch((Loi) => { console.error(Loi.message); process.exitCode = 1; }).finally(async () => { Server?.kill(); await Prisma.$disconnect(); });
