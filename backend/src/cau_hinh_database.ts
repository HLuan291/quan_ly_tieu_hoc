export function TaoCauHinhMySql(DatabaseUrlText: string | undefined) {
  if (!DatabaseUrlText) {
    throw new Error('Thiếu DATABASE_URL trong cấu hình backend');
  }

  let DatabaseUrl: URL;
  try {
    DatabaseUrl = new URL(DatabaseUrlText);
  } catch {
    throw new Error('DATABASE_URL không đúng định dạng kết nối MySQL');
  }

  const Host = DatabaseUrl.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const Database = decodeURIComponent(DatabaseUrl.pathname.slice(1));
  if (!['mysql:', 'mariadb:'].includes(DatabaseUrl.protocol) || !Host || !Database) {
    throw new Error('DATABASE_URL phải là kết nối MySQL có tên database');
  }

  const LayKhoa = DatabaseUrl.searchParams.get('allowPublicKeyRetrieval');
  if (LayKhoa !== null && LayKhoa !== 'true' && LayKhoa !== 'false') {
    throw new Error('allowPublicKeyRetrieval chỉ nhận true hoặc false');
  }

  // MySQL 8 cần RSA khi xác thực caching_sha2_password qua TCP không có TLS.
  // Chỉ mặc định lấy khóa từ server chạy trên chính máy này.
  const LaMayCucBo = ['localhost', '127.0.0.1', '::1'].includes(Host);

  return {
    host: Host,
    port: Number(DatabaseUrl.port || 3306),
    user: decodeURIComponent(DatabaseUrl.username),
    password: decodeURIComponent(DatabaseUrl.password),
    database: Database,
    connectionLimit: 5,
    allowPublicKeyRetrieval: LayKhoa === null ? LaMayCucBo : LayKhoa === 'true',
  };
}
