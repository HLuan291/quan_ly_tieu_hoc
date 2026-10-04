export function DinhDangNgayLocal(Ngay: Date): string {
  const Nam = Ngay.getFullYear();
  const Thang = String(Ngay.getMonth() + 1).padStart(2, '0');
  const NgayTrongThang = String(Ngay.getDate()).padStart(2, '0');
  return `${Nam}-${Thang}-${NgayTrongThang}`;
}

export function LayNgayHomNay(): string {
  return DinhDangNgayLocal(new Date());
}
