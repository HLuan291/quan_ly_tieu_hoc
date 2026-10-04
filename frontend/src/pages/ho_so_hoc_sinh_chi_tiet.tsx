import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Api from '../api/api';
import { LayThongBaoLoi } from '../utils/loi_api';
import { LayNgayHomNay } from '../utils/ngay_local';
import type { HoSoHocSinh, PhuHuynh } from './hoc_sinh_types';

const O = 'mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2';
const Nut = 'rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50';
const Truong = [
  ['ho_ten', 'Họ tên', 'text'], ['ngay_sinh', 'Ngày sinh', 'date'],
  ['dan_toc', 'Dân tộc', 'text'], ['quoc_tich', 'Quốc tịch', 'text'],
  ['noi_sinh', 'Nơi sinh', 'text'], ['so_dien_thoai_lien_he', 'SĐT liên hệ', 'tel'],
  ['dia_chi_thuong_tru', 'Địa chỉ thường trú', 'text'], ['dia_chi_hien_tai', 'Địa chỉ hiện tại', 'text'],
  ['ngay_nhap_hoc', 'Ngày nhập học', 'date'],
] as const;
function Ngay(Value: string | null | undefined) { return Value?.slice(0, 10) || ''; }
function DuLieu(Event: FormEvent<HTMLFormElement>) { return new FormData(Event.currentTarget); }

function PhuHuynhForm({ PH, MoiQuanHe, HocSinhId, Luu }: { PH: PhuHuynh; MoiQuanHe: string; HocSinhId: number; Luu: () => void }) {
  const [Loi, SetLoi] = useState('');
  const [Tin, SetTin] = useState('');
  const [DangLuu, SetDangLuu] = useState(false);
  async function Sua(Event: FormEvent<HTMLFormElement>) {
    Event.preventDefault(); const F = DuLieu(Event);
    SetDangLuu(true); SetLoi(''); SetTin('');
    try {
      await Api.patch(`/ho_so_hoc_sinh/phu_huynh/${PH.id}`, {
        ho_ten: F.get('ho_ten'), nam_sinh: F.get('nam_sinh') ? Number(F.get('nam_sinh')) : null,
        so_dien_thoai: F.get('so_dien_thoai'), nghe_nghiep: F.get('nghe_nghiep') || null,
      });
      SetTin('Đã lưu thông tin phụ huynh.'); Luu();
    } catch (E) { SetLoi(LayThongBaoLoi(E)); } finally { SetDangLuu(false); }
  }
  async function SuaQuanHe(Event: FormEvent<HTMLFormElement>) {
    Event.preventDefault(); const F = DuLieu(Event);
    SetDangLuu(true); SetLoi(''); SetTin('');
    try {
      await Api.patch(`/ho_so_hoc_sinh/hoc_sinh/${HocSinhId}/phu_huynh/${PH.id}/moi_quan_he`, { moi_quan_he: F.get('moi_quan_he') });
      SetTin('Đã lưu mối quan hệ.'); Luu();
    } catch (E) { SetLoi(LayThongBaoLoi(E)); } finally { SetDangLuu(false); }
  }
  return <article className="rounded border border-slate-200 p-4">
    <h4 className="font-semibold">{PH.ho_ten} · #{PH.id}</h4>
    <p className="mb-3 text-xs text-slate-500">{PH.tai_khoan_id ? 'Đã có tài khoản phụ huynh #' + PH.tai_khoan_id : 'Chưa có tài khoản đăng nhập'} · Tạo: {PH.ngay_tao} · Cập nhật: {PH.ngay_cap_nhat}</p>
    {Loi && <p role="alert" className="mb-3 text-red-700">{Loi}</p>}{Tin && <p role="status" className="mb-3 text-green-700">{Tin}</p>}
    <p className="mb-3 text-xs text-slate-500">Thông tin liên hệ dùng chung cho các học sinh liên kết cùng phụ huynh này.</p>
    <form aria-label={'Thông tin phụ huynh ' + PH.id} onSubmit={Sua}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Họ tên phụ huynh<input name="ho_ten" defaultValue={PH.ho_ten} required maxLength={100} className={O} /></label>
        <label>Năm sinh phụ huynh<input name="nam_sinh" type="number" min={1900} max={Number(LayNgayHomNay().slice(0, 4)) - 18} defaultValue={PH.nam_sinh ?? ''} className={O} /></label>
        <label>SĐT phụ huynh<input name="so_dien_thoai" type="tel" pattern="[0-9]{10}" maxLength={10} required defaultValue={PH.so_dien_thoai} className={O} /></label>
        <label>Nghề nghiệp<input name="nghe_nghiep" defaultValue={PH.nghe_nghiep ?? ''} maxLength={100} className={O} /></label>
      </div><button type="submit" disabled={DangLuu} className={Nut + ' mt-3'}>Lưu phụ huynh</button>
    </form>
    <form aria-label={'Mối quan hệ ' + PH.id} onSubmit={SuaQuanHe} className="mt-4 flex flex-wrap items-end gap-3">
      <label>Mối quan hệ<select name="moi_quan_he" defaultValue={MoiQuanHe} className={O}><option value="CHA">Cha</option><option value="ME">Mẹ</option><option value="NGUOI_GIAM_HO">Người giám hộ</option></select></label>
      <button disabled={DangLuu} className={Nut}>Lưu mối quan hệ</button>
    </form>
  </article>;
}

export default function HoSoHocSinhChiTiet({ Id, LaAdmin, Dong, CapNhat }: { Id: number; LaAdmin: boolean; Dong: () => void; CapNhat: () => void }) {
  const [HS, SetHS] = useState<HoSoHocSinh | null>(null);
  const [Loi, SetLoi] = useState('');
  const [Tin, SetTin] = useState('');
  const [DangLuu, SetDangLuu] = useState(false);
  const [ThemPH, SetThemPH] = useState(false);
  const [MatKhauMoi, SetMatKhauMoi] = useState<string | null>(null);
  const Panel = useRef<HTMLDivElement>(null);
  const LanYeuCau = useRef(0);
  const Tai = useCallback(async () => {
    const Lan = ++LanYeuCau.current;
    try {
      const R = await Api.get<HoSoHocSinh>(`/ho_so_hoc_sinh/hoc_sinh/${Id}`);
      if (Lan === LanYeuCau.current) SetHS(R.data);
    } catch (E) { if (Lan === LanYeuCau.current) SetLoi(LayThongBaoLoi(E)); }
  }, [Id]);
  useEffect(() => {
    let Huy = false;
    void Promise.resolve().then(async () => {
      if (Huy) return;
      await Tai();
      if (!Huy) { Panel.current?.focus(); Panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    return () => { Huy = true; LanYeuCau.current++; };
  }, [Tai]);
  async function Luu(Event: FormEvent<HTMLFormElement>, Loai: 'ho_so' | 'suc_khoe' | 'trang_thai') {
    Event.preventDefault(); const F = DuLieu(Event);
    SetDangLuu(true); SetLoi(''); SetTin('');
    try {
      if (Loai === 'ho_so') {
        const Data: Record<string, string> = {};
        for (const [Key] of Truong) Data[Key] = String(F.get(Key) ?? '');
        Data.gioi_tinh = String(F.get('gioi_tinh')); Data.ghi_chu = String(F.get('ghi_chu') ?? '');
        await Api.patch(`/ho_so_hoc_sinh/hoc_sinh/${Id}`, Data);
      } else if (Loai === 'suc_khoe') {
        await Api.patch(`/ho_so_hoc_sinh/hoc_sinh/${Id}/suc_khoe`, {
          chieu_cao_cm: Number(F.get('chieu_cao_cm')), can_nang_kg: Number(F.get('can_nang_kg')), ngay_do: F.get('ngay_do'),
        });
      } else {
        await Api.patch(`/ho_so_hoc_sinh/hoc_sinh/${Id}/trang_thai`, { trang_thai: F.get('trang_thai') });
      }
      SetTin('Đã lưu ' + (Loai === 'ho_so' ? 'hồ sơ học sinh.' : Loai === 'suc_khoe' ? 'sức khỏe.' : 'trạng thái.'));
      await Tai(); CapNhat();
    } catch (E) { SetLoi(LayThongBaoLoi(E)); } finally { SetDangLuu(false); }
  }
  async function TaoPH(Event: FormEvent<HTMLFormElement>) {
    Event.preventDefault(); const F = DuLieu(Event);
    SetDangLuu(true); SetLoi(''); SetTin(''); SetMatKhauMoi(null);
    try {
      const R = await Api.post(`/ho_so_hoc_sinh/hoc_sinh/${Id}/phu_huynh`, {
        ho_ten: F.get('ho_ten'), nam_sinh: F.get('nam_sinh') ? Number(F.get('nam_sinh')) : undefined,
        so_dien_thoai: F.get('so_dien_thoai'), nghe_nghiep: F.get('nghe_nghiep'),
        moi_quan_he: F.get('moi_quan_he'), tao_tai_khoan: LaAdmin && F.get('tao_tai_khoan') === 'on',
      });
      if (R.data.tai_khoan_phu_huynh_moi) SetMatKhauMoi(R.data.tai_khoan_phu_huynh_moi.ten_dang_nhap + ' / ' + R.data.tai_khoan_phu_huynh_moi.mat_khau_ban_dau);
      SetThemPH(false); SetTin('Đã bổ sung phụ huynh.'); await Tai(); CapNhat();
    } catch (E) { SetLoi(LayThongBaoLoi(E)); } finally { SetDangLuu(false); }
  }
  return <div ref={Panel} tabIndex={-1} role="region" aria-label="Hồ sơ chi tiết học sinh" className="mt-6 scroll-mt-4 rounded-lg border-2 border-sky-700 text-sm outline-none">
    <div className="flex flex-wrap items-center justify-between gap-3 bg-sky-700 p-4 text-white"><h2 className="text-lg font-semibold">Hồ sơ học sinh{HS ? ': ' + HS.ho_ten : ''}</h2><button disabled={DangLuu} onClick={Dong} className="rounded border border-white/60 px-3 py-1">Đóng hồ sơ</button></div>
    <div className="space-y-6 p-4">
      {Loi && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{Loi}</p>}
      {Tin && <p role="status" className="rounded bg-green-50 p-3 text-green-700">{Tin}</p>}
      {MatKhauMoi && <p className="rounded bg-amber-50 p-3">Tài khoản vừa cấp (hiển thị một lần): <strong>{MatKhauMoi}</strong></p>}
      {!HS && !Loi && <p>Đang tải hồ sơ...</p>}
      {HS && <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
          ['Mã học sinh', HS.ma_hoc_sinh], ['Ngày có vắng', HS.thong_ke_nghi.so_ngay_co_vang],
          ['Buổi vắng có phép', HS.thong_ke_nghi.so_buoi_co_phep], ['Buổi vắng không phép', HS.thong_ke_nghi.so_buoi_khong_phep],
        ].map(([Ten, GiaTri]) => <div key={Ten} className="rounded bg-sky-50 p-3"><p className="text-slate-600">{Ten}</p><strong className="text-xl text-sky-800">{GiaTri}</strong></div>)}</div>
        <p className="text-xs text-slate-500">Thống kê toàn bộ lịch sử điểm danh: {HS.thong_ke_nghi.so_buoi_vang} buổi vắng. Một ngày có ít nhất một buổi vắng được đếm một lần; đơn xin nghỉ chưa có điểm danh không được cộng vào.</p>
        <form aria-label="Thông tin học sinh" onSubmit={E => { void Luu(E, 'ho_so'); }}>
          <h3 className="mb-3 text-base font-semibold text-sky-800">Thông tin học sinh</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Truong.map(([Key, Ten, Type]) => <label key={Key}>{Ten}<input name={Key} type={Type} required defaultValue={Type === 'date' ? Ngay(HS[Key]) : HS[Key]} max={Type === 'date' ? LayNgayHomNay() : undefined} pattern={Type === 'tel' ? '[0-9]{10}' : undefined} maxLength={Key === 'ho_ten' ? 100 : Type === 'tel' ? 10 : 255} className={O} /></label>)}
            <label>Giới tính<select name="gioi_tinh" defaultValue={HS.gioi_tinh} className={O}><option value="NAM">Nam</option><option value="NU">Nữ</option></select></label>
            <label className="sm:col-span-2">Ghi chú<textarea name="ghi_chu" defaultValue={HS.ghi_chu || ''} className={O} rows={2} /></label>
          </div><button disabled={DangLuu} className={Nut + ' mt-4'}>Lưu hồ sơ học sinh</button>
          <p className="mt-2 text-xs text-slate-500">ID: {HS.id} · Tạo: {HS.ngay_tao} · Cập nhật: {HS.ngay_cap_nhat}</p>
        </form>
        <form aria-label="Trạng thái hồ sơ" onSubmit={E => { void Luu(E, 'trang_thai'); }} className="flex flex-wrap items-end gap-3">
          <label>Trạng thái học sinh<select name="trang_thai" defaultValue={HS.trang_thai} className={O}>{[...new Set([HS.trang_thai, 'DANG_HOC', 'CHUYEN_TRUONG', 'THOI_HOC'])].map(T => <option key={T} value={T}>{T}</option>)}</select></label><button disabled={DangLuu} className={Nut}>Lưu trạng thái</button>
        </form>
        <form aria-label="Sức khỏe học sinh" onSubmit={E => { void Luu(E, 'suc_khoe'); }}>
          <h3 className="mb-3 text-base font-semibold text-sky-800">Sức khỏe</h3><div className="grid gap-3 sm:grid-cols-3">
            <label>Chiều cao (cm)<input name="chieu_cao_cm" type="number" min={0.1} max={9999} step={0.1} required defaultValue={HS.chieu_cao_cm ?? ''} className={O} /></label>
            <label>Cân nặng (kg)<input name="can_nang_kg" type="number" min={0.01} max={999} step={0.01} required defaultValue={HS.can_nang_kg ?? ''} className={O} /></label>
            <label>Ngày đo<input name="ngay_do" type="date" required defaultValue={Ngay(HS.ngay_do) || LayNgayHomNay()} max={LayNgayHomNay()} className={O} /></label>
          </div><button disabled={DangLuu} className={Nut + ' mt-3'}>Lưu sức khỏe</button>
        </form>
        <section><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="text-base font-semibold text-sky-800">Phụ huynh và người giám hộ</h3><button disabled={DangLuu} onClick={() => SetThemPH(V => !V)} className="rounded border border-blue-700 px-3 py-2 text-blue-700">{ThemPH ? 'Hủy bổ sung' : 'Bổ sung phụ huynh'}</button></div>
          <div className="grid gap-4 xl:grid-cols-2">{HS.phu_huynh_hoc_sinh.map(LK => <PhuHuynhForm key={LK.phu_huynh.id} PH={LK.phu_huynh} MoiQuanHe={LK.moi_quan_he} HocSinhId={Id} Luu={() => { void Tai(); }} />)}</div>
          {ThemPH && <form aria-label="Bổ sung phụ huynh" onSubmit={E => { void TaoPH(E); }} className="mt-4 rounded border bg-slate-50 p-4">
            <h4 className="mb-3 font-semibold">Thông tin phụ huynh mới</h4><div className="grid gap-3 sm:grid-cols-2">
              <label>Họ tên<input name="ho_ten" required maxLength={100} className={O} /></label>
              <label>Năm sinh<input name="nam_sinh" type="number" min={1900} max={Number(LayNgayHomNay().slice(0, 4)) - 18} className={O} /></label>
              <label>SĐT<input name="so_dien_thoai" required type="tel" pattern="[0-9]{10}" maxLength={10} className={O} /></label>
              <label>Nghề nghiệp<input name="nghe_nghiep" maxLength={100} className={O} /></label>
              <label>Mối quan hệ<select name="moi_quan_he" className={O}><option value="CHA">Cha</option><option value="ME">Mẹ</option><option value="NGUOI_GIAM_HO">Người giám hộ</option></select></label>
            </div>{LaAdmin && <label className="mt-3 block"><input type="checkbox" name="tao_tai_khoan" /> Tạo tài khoản đăng nhập</label>}
            <button disabled={DangLuu} className={Nut + ' mt-3'}>Lưu phụ huynh mới</button>
          </form>}
        </section>
        <section><h3 className="mb-3 text-base font-semibold text-sky-800">Lịch sử lớp học</h3><div className="overflow-auto"><table className="min-w-[700px] w-full text-left"><thead className="bg-sky-700 text-white"><tr>{['Lớp', 'Khối', 'Năm học', 'Bắt đầu', 'Kết thúc', 'Trạng thái', 'Ghi chú'].map(T => <th key={T} className="p-2">{T}</th>)}</tr></thead><tbody>{HS.xep_lop.map(X => <tr key={X.id} className="border-b"><td className="p-2">{X.lop_hoc.ten_lop}</td><td className="p-2">{X.lop_hoc.khoi.ten_khoi}</td><td className="p-2">{X.lop_hoc.nam_hoc.ten_nam_hoc}</td><td className="p-2">{Ngay(X.ngay_bat_dau)}</td><td className="p-2">{Ngay(X.ngay_ket_thuc) || '—'}</td><td className="p-2">{X.trang_thai}</td><td className="p-2">{X.ghi_chu || '—'}</td></tr>)}</tbody></table>{!HS.xep_lop.length && <p className="p-3">Chưa xếp lớp.</p>}</div></section>
      </>}
    </div>
  </div>;
}
