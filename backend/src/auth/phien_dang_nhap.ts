import { createHash } from 'node:crypto';

// Dấu phiên thay đổi cùng mật khẩu, không đưa mật khẩu hoặc bản băm Argon2 vào JWT.
export function TaoDauPhien(MatKhauBam: string): string {
  return createHash('sha256').update(MatKhauBam).digest('base64url');
}
