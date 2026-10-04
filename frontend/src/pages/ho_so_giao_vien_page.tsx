import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import Api from '../api/api';
import { LayThongBaoLoi } from '../utils/loi_api';
import { LayNgaySinhToiDa, LayNgayHomNay } from '../utils/ngay_local';

interface HoSoGiaoVien {
  id: number; ma_giao_vien: string; ho_ten: string; ngay_sinh: string; gioi_tinh: string;
  so_dien_thoai: string; email: string; dia_chi_lien_he: string; ngay_vao_truong: string;
  trinh_do_chuyen_mon: string; trang_thai: string; ngay_cap_nhat: string;
  tai_khoan: { ten_dang_nhap: string };
}
const O = 'mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2';
const Truong = [
  ['ho_ten', 'Họ tên', 'text', 100], ['ngay_sinh', 'Ngày sinh', 'date', 10],
  ['so_dien_thoai', 'Số điện thoại', 'tel', 10], ['email', 'Email', 'email', 100],
  ['dia_chi_lien_he', 'Địa chỉ liên hệ', 'text', 255], ['ngay_vao_truong', 'Ngày vào trường', 'date', 10],
  ['trinh_do_chuyen_mon', 'Trình độ chuyên môn', 'text', 100],
] as const;

export default function HoSoGiaoVienPage() {
  const [GV, SetGV] = useState<HoSoGiaoVien | null>(null);
  const [Loi, SetLoi] = useState('');
  const [Tin, SetTin] = useState('');
  const [DangLuu, SetDangLuu] = useState(false);
  const [DaSua, SetDaSua] = useState(false);
  const [PhienForm, SetPhienForm] = useState(0);
  useEffect(() => {
    let Huy = false;
    void Api.get<HoSoGiaoVien>('/giao_vien/me').then(R => { if (!Huy) SetGV(R.data); }).catch(E => { if (!Huy) SetLoi(LayThongBaoLoi(E)); });
    return () => { Huy = true; };
  }, []);
  useEffect(() => {
    const CanhBao = (E: BeforeUnloadEvent) => { if (DaSua) { E.preventDefault(); E.returnValue = ''; } };
    window.addEventListener('beforeunload', CanhBao);
    return () => window.removeEventListener('beforeunload', CanhBao);
  }, [DaSua]);
  async function Luu(E: FormEvent<HTMLFormElement>) {
    E.preventDefault(); if (DangLuu || !GV) return;
    const F = new FormData(E.currentTarget); const Data: Record<string, string> = {};
    for (const [Key] of Truong) Data[Key] = String(F.get(Key) || '').trim();
    Data.gioi_tinh = String(F.get('gioi_tinh'));
    SetDangLuu(true); SetLoi(''); SetTin('');
    try {
      const R = await Api.patch<{ giao_vien: HoSoGiaoVien }>('/giao_vien/me', Data);
      SetGV(R.data.giao_vien); SetPhienForm(V => V + 1); SetDaSua(false); SetTin('Đã lưu thông tin giáo viên.');
    } catch (Err) { SetLoi(LayThongBaoLoi(Err)); } finally { SetDangLuu(false); }
  }
  return <div className="mx-auto max-w-5xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 bg-white p-4">
      <div><h1 className="text-xl font-semibold text-sky-800">Hồ sơ của tôi</h1><p className="mt-1 text-sm text-slate-600">Xem và chỉnh sửa thông tin giáo viên của bạn.</p></div>
      <Link to="/doi_mat_khau" className="rounded border border-sky-700 px-3 py-2 text-sm text-sky-800">Đổi mật khẩu</Link>
    </div>
    {Loi && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{Loi}</p>}
    {Tin && <p role="status" className="rounded bg-green-50 p-3 text-green-700">{Tin}</p>}
    {!GV && !Loi && <p>Đang tải hồ sơ...</p>}
    {GV && <form aria-label="Hồ sơ giáo viên của tôi" key={PhienForm} onSubmit={E => { void Luu(E); }} onChange={() => { SetDaSua(true); SetTin(''); }} className="rounded border border-slate-200 bg-white p-4">
      <div className="mb-5 grid gap-3 rounded bg-sky-50 p-3 text-sm sm:grid-cols-3">
        <p>Mã giáo viên<br /><strong>{GV.ma_giao_vien}</strong></p>
        <p>Tên đăng nhập<br /><strong>{GV.tai_khoan.ten_dang_nhap}</strong></p>
        <p>Trạng thái<br /><strong>{GV.trang_thai === 'HOAT_DONG' ? 'Hoạt động' : GV.trang_thai}</strong></p>
      </div>
      <fieldset disabled={DangLuu} className="grid gap-4 sm:grid-cols-2">
        {Truong.map(([Key, Ten, Type, Max]) => <label key={Key} className="text-sm">{Ten}<input name={Key} type={Type} required maxLength={Max} defaultValue={Type === 'date' ? GV[Key].slice(0, 10) : GV[Key]}
          min={Key === 'ngay_sinh' ? '1950-01-01' : undefined} max={Key === 'ngay_sinh' ? LayNgaySinhToiDa() : Type === 'date' ? LayNgayHomNay() : undefined}
          pattern={Type === 'tel' ? '[0-9]{10}' : undefined} className={O} /></label>)}
        <label className="text-sm">Giới tính<select name="gioi_tinh" defaultValue={GV.gioi_tinh} className={O}><option value="NAM">Nam</option><option value="NU">Nữ</option></select></label>
      </fieldset>
      <p className="mt-4 text-xs text-slate-500">Số điện thoại được đồng bộ với tài khoản để đăng nhập. Trạng thái do Admin quản lý.</p>
      <div className="mt-5 flex items-center justify-end gap-3 border-t pt-4">
        <span className="text-xs text-slate-500">{DaSua ? 'Có thay đổi chưa lưu' : 'Hồ sơ đã được lưu'}</span>
        <button type="submit" disabled={DangLuu || !DaSua} className="rounded bg-blue-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{DangLuu ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </div>
    </form>}
  </div>;
}
