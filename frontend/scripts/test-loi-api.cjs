const Assert = require('node:assert/strict');
const Fs = require('node:fs');
const Path = require('node:path');
const Vm = require('node:vm');
const Ts = require('typescript');
const Axios = require('axios');

const Source = Fs.readFileSync(Path.resolve(__dirname, '../src/utils/loi_api.ts'), 'utf8');
const Output = Ts.transpileModule(Source, {
  compilerOptions: { module: Ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const Exports = {};
Vm.runInNewContext(Output, { exports: Exports, require, Array, String });

function Loi(Status, Message, Code) {
  const Error = new Axios.AxiosError('Axios error', Code);
  if (Status !== undefined) Error.response = { status: Status, data: { message: Message } };
  return Error;
}
const Cases = [
  ['mất kết nối', Loi(undefined), 'Không kết nối được máy chủ. Vui lòng thử lại.'],
  ['hết thời gian chờ', Loi(undefined, undefined, 'ECONNABORTED'), 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.'],
  ['timeout kết nối', Loi(undefined, undefined, 'ETIMEDOUT'), 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.'],
  ['lỗi 500 mặc định', Loi(500, 'Internal server error'), 'Máy chủ tạm thời gặp sự cố. Vui lòng thử lại sau.'],
  ['lỗi 503 không có thông báo', Loi(503), 'Máy chủ tạm thời gặp sự cố. Vui lòng thử lại sau.'],
  ['lỗi 502 trả HTML', Loi(502, { html: 'gateway error' }), 'Máy chủ tạm thời gặp sự cố. Vui lòng thử lại sau.'],
  ['mật khẩu sai', Loi(401, 'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng'), 'Tên đăng nhập, số điện thoại hoặc mật khẩu không đúng'],
  ['tài khoản khóa', Loi(403, 'Tài khoản đã bị khóa'), 'Tài khoản đã bị khóa'],
  ['thiếu dữ liệu', Loi(400, ['Thiếu tài khoản', 'Thiếu mật khẩu']), 'Thiếu tài khoản, Thiếu mật khẩu'],
  ['thông báo riêng từ backend', Loi(503, 'Database tạm thời chưa sẵn sàng'), 'Database tạm thời chưa sẵn sàng'],
  ['không có thông báo', Loi(400, ''), 'Có lỗi xảy ra. Vui lòng thử lại.'],
  ['lỗi ngoài axios', new Error('private debug data'), 'Có lỗi xảy ra. Vui lòng thử lại.'],
];
for (const [Name, Error, Expected] of Cases) {
  Assert.equal(Exports.LayThongBaoLoi(Error), Expected, Name);
}
console.log(JSON.stringify({ total: Cases.length, passed: Cases.length }));
