// Chỉ chạy trên MySQL CI riêng. Tài khoản audit_cold_rsa phải vừa được tạo,
// chưa từng đăng nhập để bắt buộc thực hiện xác thực RSA đầy đủ.
const Assert = require('node:assert/strict');
const Fs = require('node:fs');
const Path = require('node:path');
const { randomBytes: RandomBytes } = require('node:crypto');
const Argon2 = require('argon2');
const { JwtService } = require('@nestjs/jwt');
const { PrismaService } = require('../dist/prisma.service');
const { AuthService } = require('../dist/auth/auth.service');

const BaseUrl = new URL(process.env.DATABASE_URL || 'mysql://missing');
const ColdUrl = new URL(process.env.AUDIT_MYSQL_RSA_URL || 'mysql://missing');
Assert(process.env.AUDIT_ALLOW_TEST_DATA === '1' && BaseUrl.pathname.includes('audit'), 'Chỉ dùng database audit riêng');
Assert(ColdUrl.hostname === BaseUrl.hostname && ColdUrl.port === BaseUrl.port && ColdUrl.pathname === BaseUrl.pathname, 'Kết nối RSA phải dùng cùng database audit');
Assert(ColdUrl.username === 'audit_cold_rsa', 'Chỉ dùng tài khoản MySQL riêng của kiểm thử RSA');

const Seed = new PrismaService();
const OriginalUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = ColdUrl.href;
const Cold = new PrismaService();
process.env.DATABASE_URL = OriginalUrl;
const Results = [], Secrets = [];
function Redact(Text) {
  let Value = String(Text);
  for (const Secret of Secrets) Value = Value.replaceAll(Secret, '[REDACTED]');
  return Value;
}
let Account, Version;

async function Main() {
  const Password = 'Audit@Rsa' + RandomBytes(8).toString('hex');
  const Hash = await Argon2.hash(Password);
  Secrets.push(Password, Hash);
  Account = await Seed.tai_khoan.create({ data: {
    ten_dang_nhap: 'rsa_audit_' + process.pid + '_' + RandomBytes(4).toString('hex'),
    so_dien_thoai: '0999990999', mat_khau_bam: Hash, vai_tro: 'ADMIN', phai_doi_mat_khau: false,
  } });
  const Jwt = new JwtService({ secret: process.env.JWT_SECRET });
  const Auth = new AuthService(Cold, Jwt);

  // Đây là truy vấn đầu tiên của Cold: đọc tai_khoan trong luồng đăng nhập thật.
  const Login = await Auth.DangNhap(Account.ten_dang_nhap, Password);
  Secrets.push(Login.access_token);
  Assert.equal(Login.tai_khoan.id, Account.id);
  Assert.equal(Jwt.verify(Login.access_token).sub, Account.id);
  const Persisted = await Seed.tai_khoan.findUniqueOrThrow({ where: { id: Account.id } });
  Assert(Persisted.lan_dang_nhap_cuoi);
  Results.push({ ten: 'Đăng nhập thật qua MySQL caching_sha2_password chưa có cache RSA', dat: true });

  const [Info] = await Cold.$queryRawUnsafe('SELECT VERSION() AS server_version, CURRENT_USER() AS db_user');
  const [Ssl] = await Cold.$queryRawUnsafe("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
  Assert(Info.db_user.startsWith('audit_cold_rsa@'));
  Assert.equal(Ssl.Value, '');
  Version = Info.server_version;
  Results.push({ ten: 'Xác thực bằng tài khoản MySQL riêng qua TCP không có TLS', dat: true });

  await Assert.rejects(Auth.DangNhap(Account.ten_dang_nhap, 'Wrong@Password123'), Error => Error.getStatus?.() === 401);
  Results.push({ ten: 'Mật khẩu ứng dụng sai vẫn bị từ chối bằng 401', dat: true });
}
Main().catch(Error => {
  Results.push({ ten: 'Kiểm thử RSA thất bại', dat: false, thong_bao: Redact(Error.message) });
  console.error(Redact(Error.message));
  process.exitCode = 1;
}).finally(async () => {
  if (Account) await Seed.tai_khoan.delete({ where: { id: Account.id } }).catch(() => { process.exitCode = 1; });
  await Promise.all([Seed.$disconnect(), Cold.$disconnect()]);
  const Report = {
    thoi_diem: new Date().toISOString(), mysql: Version, du_lieu: 'Giả trên MySQL CI riêng',
    tong: Results.length, dat: Results.filter(Row => Row.dat).length,
    khong_dat: Results.filter(Row => !Row.dat).length, ket_qua: Results,
  };
  Fs.writeFileSync(Path.resolve('../docs/ci-mysql-rsa-results.json'), JSON.stringify(Report, null, 2) + '\n');
  console.log('CI_MYSQL_RSA_REPORT ' + JSON.stringify(Report));
});
