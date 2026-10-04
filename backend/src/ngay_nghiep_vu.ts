// Ngày nghiệp vụ của trường tại Việt Nam; cột DATE vẫn biểu diễn bằng UTC 00:00.
const DinhDangNgayNghiepVu = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function LayNgayNghiepVu(ThoiDiem: Date = new Date()): Date {
  const ThanhPhan = DinhDangNgayNghiepVu.formatToParts(ThoiDiem);
  const Nam = Number(ThanhPhan.find((Phan) => Phan.type === 'year')!.value);
  const Thang = Number(ThanhPhan.find((Phan) => Phan.type === 'month')!.value);
  const Ngay = Number(ThanhPhan.find((Phan) => Phan.type === 'day')!.value);
  return new Date(Date.UTC(Nam, Thang - 1, Ngay));
}
