const Assert = require('node:assert/strict');
const Fs = require('node:fs');
const Path = require('node:path');
const Vm = require('node:vm');
const { spawnSync: SpawnSync } = require('node:child_process');
const Ts = require('typescript');

const Cases = [
  ['Asia/Ho_Chi_Minh', '2026-10-03T17:30:00Z', '2026-10-04'],
  ['Asia/Ho_Chi_Minh', '2026-10-03T23:59:00Z', '2026-10-04'],
  ['Asia/Ho_Chi_Minh', '2026-10-04T00:00:00Z', '2026-10-04'],
  ['Asia/Ho_Chi_Minh', '2026-12-31T17:30:00Z', '2027-01-01'],
  ['Asia/Ho_Chi_Minh', '2026-10-31T17:30:00Z', '2026-11-01'],
  ['Asia/Ho_Chi_Minh', '2024-02-28T17:30:00Z', '2024-02-29'],
  ['America/Los_Angeles', '2026-10-04T06:30:00Z', '2026-10-03'],
  ['America/Los_Angeles', '2026-01-01T07:30:00Z', '2025-12-31'],
  ['America/Los_Angeles', '2024-03-01T07:30:00Z', '2024-02-29'],
];

if (process.argv[2] === 'case') {
  const Index = Number(process.argv[3]);
  const [, Time, Expected] = Cases[Index];
  const OriginalDate = Date;
  class FrozenDate extends OriginalDate {
    constructor(...Args) { super(...(Args.length ? Args : [Time])); }
    static now() { return new OriginalDate(Time).getTime(); }
  }
  const Source = Fs.readFileSync(Path.resolve(__dirname, '../src/utils/ngay_local.ts'), 'utf8');
  const Output = Ts.transpileModule(Source, { compilerOptions: { module: Ts.ModuleKind.CommonJS } }).outputText;
  const Exports = {};
  Vm.runInNewContext(Output, { exports: Exports, Date: FrozenDate, String });
  Assert.equal(Exports.LayNgayHomNay(), Expected);
  const BirthYear = String(Number(Expected.slice(0, 4)) - 18);
  const BirthMonthDay = Expected.slice(4) === '-02-29' ? '-02-28' : Expected.slice(4);
  Assert.equal(Exports.LayNgaySinhToiDa(), BirthYear + BirthMonthDay);
  process.stdout.write('PASS ' + Cases[Index][0] + ' ' + Time + '\n');
} else {
  Cases.forEach(([Zone], Index) => {
    const Run = SpawnSync(process.execPath, [__filename, 'case', String(Index)], {
      env: { ...process.env, TZ: Zone }, encoding: 'utf8',
    });
    process.stdout.write(Run.stdout || '');
    if (Run.status !== 0) throw new Error(Run.stderr || 'Date regression failed');
  });
  const Source = Fs.readFileSync(Path.resolve(__dirname, '../src/utils/ngay_diem_danh.ts'), 'utf8');
  const Output = Ts.transpileModule(Source, { compilerOptions: { module: Ts.ModuleKind.CommonJS } }).outputText;
  const Exports = {};
  Vm.runInNewContext(Output, { exports: Exports, Date, String });
  const Calendar = [
    () => Assert.equal(Exports.LaChuNhat('2026-10-04'), true),
    () => Assert.equal(Exports.LaChuNhat('2026-10-03'), false),
    () => Assert.equal(Exports.LaChuNhat(''), false),
    () => Assert.equal(Exports.LayNgayHocGanNhat('2026-10-04'), '2026-10-03'),
    () => Assert.equal(Exports.LayNgayHocGanNhat('2026-10-05'), '2026-10-05'),
    () => Assert.equal(Exports.DoiNgay('2027-01-01', -1), '2026-12-31'),
    () => Assert.equal(Exports.DoiNgay('2024-03-01', -1), '2024-02-29'),
  ];
  Calendar.forEach(Work => Work());
  console.log(JSON.stringify({ total: Cases.length + Calendar.length, passed: Cases.length + Calendar.length }));
}
