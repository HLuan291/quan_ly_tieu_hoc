export function LaChuNhat(GiaTri: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(GiaTri) && new Date(GiaTri + 'T00:00:00Z').getUTCDay() === 0;
}
export function DoiNgay(GiaTri: string, SoNgay: number): string {
  const Ngay = new Date(GiaTri + 'T00:00:00Z');
  Ngay.setUTCDate(Ngay.getUTCDate() + SoNgay);
  return Ngay.toISOString().slice(0, 10);
}
export function LayNgayHocGanNhat(HomNay: string): string {
  return LaChuNhat(HomNay) ? DoiNgay(HomNay, -1) : HomNay;
}
