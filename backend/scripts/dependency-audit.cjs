// Ghi riêng audit dependency; không trộn cảnh báo dependency với test chức năng.
const Fs = require('node:fs');
const Path = require('node:path');
const { spawnSync: SpawnSync } = require('node:child_process');
const Root = Path.resolve(__dirname, '../..');
const Reports = [];
for (const Project of ['backend', 'frontend']) {
  for (const Scope of ['all', 'production']) {
    const Run = SpawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['audit', '--json', ...(Scope === 'production' ? ['--omit=dev'] : [])],
      { cwd: Path.join(Root, Project), encoding: 'utf8', shell: process.platform === 'win32' });
    if (Run.error) throw Run.error;
    const Data = JSON.parse(Run.stdout);
    if (Data.error || !Data.metadata || ![0, 1].includes(Run.status)) throw new Error('npm audit không hoàn tất: ' + Project + ' ' + Scope);
    Reports.push({ project: Project, scope: Scope, metadata: Data.metadata, vulnerabilities: Data.vulnerabilities || {} });
  }
}
const Report = { thoi_diem: new Date().toISOString(), reports: Reports };
Fs.writeFileSync(Path.join(Root, 'docs/ci-dependency-results.json'), JSON.stringify(Report, null, 2) + '\n');
console.log('CI_DEPENDENCY_REPORT ' + JSON.stringify(Report));
