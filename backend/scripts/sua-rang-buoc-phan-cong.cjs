// Mặc định chỉ kiểm tra. Dùng --apply sau khi dừng backend để sửa DB trong .env.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');

const CheckCu = `
  (loai_phan_cong = 'CHU_NHIEM' AND mon_hoc_id IS NULL AND nguon_phan_cong IS NULL)
  OR (loai_phan_cong = 'GIANG_DAY' AND mon_hoc_id IS NOT NULL
      AND nguon_phan_cong IS NOT NULL AND nguon_phan_cong IN ('TU_DONG_GVCN', 'BO_SUNG'))`;
const CheckMoi = `
  (loai_phan_cong = 'GVCN' AND mon_hoc_id IS NULL
      AND (nguon_phan_cong IS NULL OR nguon_phan_cong = 'BO_SUNG'))
  OR (mon_hoc_id IS NOT NULL AND nguon_phan_cong IS NOT NULL
      AND ((loai_phan_cong = 'GVCN' AND nguon_phan_cong IN ('TU_DONG_GVCN', 'BO_SUNG'))
          OR (loai_phan_cong = 'GVBM' AND nguon_phan_cong = 'BO_SUNG')))`;
const CheckChuyenTiep = `(${CheckCu}) OR (${CheckMoi})`;

function ChuanHoaCheck(GiaTri) {
  return GiaTri.replace(/\\'/g, "'").replace(/_[a-z0-9]+(?=')/gi, '').replace(/[`()\s]/g, '').toUpperCase();
}

function NhanDangCheck(BieuThuc) {
  const Check = ChuanHoaCheck(BieuThuc);
  if (Check === ChuanHoaCheck(CheckCu)) return 'CU';
  if (Check === ChuanHoaCheck(CheckMoi)) return 'MOI';
  if (Check === ChuanHoaCheck(CheckChuyenTiep)) return 'CHUYEN_TIEP';
  throw new Error('chk_pc_loai có biểu thức khác mẫu đã kiểm chứng; dừng để đối chiếu, chưa sửa DB.');
}

function TaoKeHoach(DanhSach) {
  return DanhSach.map((Dong) => {
    let LoaiMoi = Dong.loai_phan_cong;
    if (LoaiMoi === 'CHU_NHIEM' && Dong.mon_hoc_id === null && Dong.nguon_phan_cong === null) {
      LoaiMoi = 'GVCN';
    } else if (LoaiMoi === 'GIANG_DAY' && Dong.mon_hoc_id !== null) {
      if (Dong.nguon_phan_cong === 'TU_DONG_GVCN') LoaiMoi = 'GVCN';
      else if (Dong.nguon_phan_cong === 'BO_SUNG') LoaiMoi = 'GVBM';
      else throw new Error(`Phân công id ${Dong.id} có nguồn không hợp lệ; chưa sửa DB.`);
    }
    const LaGvcnChinh = LoaiMoi === 'GVCN' && Dong.mon_hoc_id === null && [null, 'BO_SUNG'].includes(Dong.nguon_phan_cong);
    const LaMonGvcn = LoaiMoi === 'GVCN' && Dong.mon_hoc_id !== null && ['TU_DONG_GVCN', 'BO_SUNG'].includes(Dong.nguon_phan_cong);
    const LaMonGvbm = LoaiMoi === 'GVBM' && Dong.mon_hoc_id !== null && Dong.nguon_phan_cong === 'BO_SUNG';
    if (!LaGvcnChinh && !LaMonGvcn && !LaMonGvbm) {
      throw new Error(`Phân công id ${Dong.id} không khớp quy ước cũ/mới; chưa sửa DB.`);
    }
    return { ...Dong, loai_phan_cong: LoaiMoi };
  });
}

function ChuoiJson(GiaTri) {
  return JSON.stringify(GiaTri, (_, Item) => typeof Item === 'bigint' ? Item.toString() : Item, 2);
}

async function DocTrangThai(KetNoi, KhoaDong = false) {
  const Checks = await KetNoi.query(`
    SELECT c.CHECK_CLAUSE AS bieu_thuc
    FROM information_schema.CHECK_CONSTRAINTS c
    JOIN information_schema.TABLE_CONSTRAINTS t
      ON t.CONSTRAINT_SCHEMA = c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME = c.CONSTRAINT_NAME
    WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_NAME = 'phan_cong_giao_vien'
      AND t.CONSTRAINT_TYPE = 'CHECK' AND t.CONSTRAINT_NAME = 'chk_pc_loai'`);
  if (Checks.length !== 1) throw new Error('Không tìm thấy chk_pc_loai của bảng phân công trong DB này; chưa sửa DB.');
  const DanhSach = await KetNoi.query('SELECT * FROM phan_cong_giao_vien ORDER BY id' + (KhoaDong ? ' FOR UPDATE' : ''));
  return { BieuThuc: Checks[0].bieu_thuc, DanhSach, LoaiCheck: NhanDangCheck(Checks[0].bieu_thuc) };
}

async function Chay(ThamSo = process.argv.slice(2)) {
  if (ThamSo.some((Item) => !['--apply', '--dry-run'].includes(Item)) || ThamSo.includes('--apply') && ThamSo.includes('--dry-run')) {
    throw new Error('Chỉ dùng --dry-run (mặc định) hoặc --apply.');
  }
  require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
  if (!process.env.DATABASE_URL) throw new Error('Thiếu DATABASE_URL trong backend/.env.');
  const Url = new URL(process.env.DATABASE_URL);
  if (Url.protocol !== 'mysql:') throw new Error('DATABASE_URL phải dùng mysql://.');
  const RequireAdapter = createRequire(require.resolve('@prisma/adapter-mariadb'));
  const Driver = RequireAdapter('mariadb');
  const KetNoi = await Driver.createConnection({
    host: Url.hostname, port: Number(Url.port || 3306), user: decodeURIComponent(Url.username),
    password: decodeURIComponent(Url.password), database: Url.pathname.slice(1), dateStrings: true,
  });
  let TenKhoa;
  let DaKhoa = false;
  let FileSaoLuu;
  let DaBatDauSua = false;
  try {
    const [ThongTin] = await KetNoi.query('SELECT DATABASE() AS database_name, VERSION() AS server_version');
    if (!ThongTin.server_version.startsWith('8.') || /mariadb/i.test(ThongTin.server_version)) {
      throw new Error('Lệnh này được kiểm chứng cho MySQL 8.x; dừng để đối chiếu phiên bản server.');
    }
    const ApDung = ThamSo.includes('--apply');
    if (ApDung) {
      TenKhoa = 'fix_pc_' + createHash('sha256').update(ThongTin.database_name).digest('hex').slice(0, 48);
      const [Khoa] = await KetNoi.query('SELECT GET_LOCK(?, 5) AS da_khoa', [TenKhoa]);
      DaKhoa = Number(Khoa.da_khoa) === 1;
      if (!DaKhoa) throw new Error('Đang có tiến trình sửa phân công khác; chưa sửa DB.');
    }
    const Truoc = await DocTrangThai(KetNoi);
    const KeHoach = TaoKeHoach(Truoc.DanhSach);
    const SoChuyen = KeHoach.filter((Dong, ViTri) => Dong.loai_phan_cong !== Truoc.DanhSach[ViTri].loai_phan_cong).length;
    console.log(`Database: ${ThongTin.database_name}; MySQL: ${ThongTin.server_version}`);
    console.log(`Ràng buộc: ${Truoc.LoaiCheck}; phân công: ${KeHoach.length}; số dòng cần đổi mã: ${SoChuyen}`);
    if (Truoc.LoaiCheck === 'MOI' && SoChuyen === 0) {
      console.log('Ràng buộc và dữ liệu đã đồng bộ. Không có thay đổi.');
      return;
    }
    if (!ApDung) {
      console.log('Chỉ kiểm tra, chưa sửa DB. Dừng backend rồi chạy npm run db:fix-assignments để áp dụng.');
      return;
    }

    const [Ddl] = await KetNoi.query('SHOW CREATE TABLE phan_cong_giao_vien');
    const ThuMuc = path.resolve(__dirname, '../backups');
    fs.mkdirSync(ThuMuc, { recursive: true, mode: 0o700 });
    FileSaoLuu = path.join(ThuMuc, 'phan-cong-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid + '.json');
    fs.writeFileSync(FileSaoLuu, ChuoiJson({
      thoi_diem: new Date().toISOString(), database: ThongTin.database_name,
      create_table: Ddl['Create Table'], check_cu: Truoc.BieuThuc,
      danh_sach: Truoc.DanhSach, ke_hoach: KeHoach,
    }), { flag: 'wx', mode: 0o600 });
    console.log('Bản sao bảng phân công: ' + FileSaoLuu);

    // MySQL DDL tự commit: giữ ràng buộc cũ/mới trong bước chuyển tiếp, không tắt CHECK.
    DaBatDauSua = true;
    if (Truoc.LoaiCheck === 'CU') {
      await KetNoi.query(`ALTER TABLE phan_cong_giao_vien DROP CHECK chk_pc_loai,
        ADD CONSTRAINT chk_pc_loai CHECK (${CheckChuyenTiep})`);
    }
    await KetNoi.beginTransaction();
    try {
      const HienTai = await DocTrangThai(KetNoi, true);
      if (ChuoiJson(HienTai.DanhSach) !== ChuoiJson(Truoc.DanhSach)) {
        throw new Error('Dữ liệu đã thay đổi trong lúc sửa; dừng backend rồi chạy lại.');
      }
      for (const [ViTri, Dong] of KeHoach.entries()) {
        if (Dong.loai_phan_cong === Truoc.DanhSach[ViTri].loai_phan_cong) continue;
        const KetQua = await KetNoi.query('UPDATE phan_cong_giao_vien SET loai_phan_cong = ? WHERE id = ? AND loai_phan_cong = ?',
          [Dong.loai_phan_cong, Dong.id, Truoc.DanhSach[ViTri].loai_phan_cong]);
        if (Number(KetQua.affectedRows) !== 1) throw new Error('Phân công đã thay đổi trong lúc sửa.');
      }
      await KetNoi.commit();
    } catch (Loi) {
      await KetNoi.rollback();
      throw Loi;
    }
    await KetNoi.query(`ALTER TABLE phan_cong_giao_vien DROP CHECK chk_pc_loai,
      ADD CONSTRAINT chk_pc_loai CHECK (${CheckMoi})`);
    const Sau = await DocTrangThai(KetNoi);
    if (Sau.LoaiCheck !== 'MOI' || ChuoiJson(Sau.DanhSach) !== ChuoiJson(KeHoach)) {
      throw new Error('Kết quả sau sửa khác kế hoạch; cần kiểm tra bản sao.');
    }
    console.log(`Đã sửa chk_pc_loai và chuyển ${SoChuyen} dòng. Giữ nguyên id, giáo viên, lớp, môn, ngày và nguồn phân công.`);
    console.log('Khởi động lại backend rồi thử phân công trên web.');
  } catch (Loi) {
    if (FileSaoLuu) console.error('Bản sao đã lưu: ' + FileSaoLuu);
    if (DaBatDauSua) console.error('Sửa chưa hoàn tất. Có thể chạy lại sau khi dừng backend; lệnh nhận diện trạng thái chuyển tiếp.');
    throw Loi;
  } finally {
    if (DaKhoa) await KetNoi.query('SELECT RELEASE_LOCK(?)', [TenKhoa]).catch(() => {});
    await KetNoi.end();
  }
}

module.exports = { Chay, CheckCu, CheckMoi, CheckChuyenTiep, NhanDangCheck, TaoKeHoach };
if (require.main === module) Chay().catch((Loi) => { console.error(Loi.message); process.exitCode = 1; });
