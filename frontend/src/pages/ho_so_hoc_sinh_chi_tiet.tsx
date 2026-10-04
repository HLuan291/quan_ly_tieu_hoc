import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Api from '../api/api';
import { LayThongBaoLoi } from '../utils/loi_api';
import { LayNgayHomNay } from '../utils/ngay_local';
import HopThoai from '../components/hop_thoai';
import type { HoSoHocSinh } from './hoc_sinh_types';

const O = 'mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2';
const Nut = 'rounded bg-blue-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-50';
const Truong = [
  ['ho_ten', 'Họ tên', 'text', 100], ['ngay_sinh', 'Ngày sinh', 'date', 10],
  ['dan_toc', 'Dân tộc', 'text', 50], ['quoc_tich', 'Quốc tịch', 'text', 50],
  ['noi_sinh', 'Nơi sinh', 'text', 255], ['so_dien_thoai_lien_he', 'SĐT liên hệ', 'tel', 10],
  ['dia_chi_thuong_tru', 'Địa chỉ thường trú', 'text', 255], ['dia_chi_hien_tai', 'Địa chỉ hiện tại', 'text', 255],
  ['ngay_nhap_hoc', 'Ngày nhập học', 'date', 10],
] as const;
const TrangThai: Record<string, string> = { DANG_HOC: 'Đang học', CHUYEN_TRUONG: 'Chuyển trường', THOI_HOC: 'Thôi học', DA_XOA: 'Đã xóa' };
function Ngay(Value: string | null | undefined) { return Value?.slice(0, 10) || ''; }

export default function HoSoHocSinhChiTiet({ Id, LaAdmin, Dong, CapNhat }: { Id: number; LaAdmin: boolean; Dong: () => void; CapNhat: () => void }) {
  const [HS, SetHS] = useState<HoSoHocSinh | null>(null);
  const [Loi, SetLoi] = useState('');
  const [Tin, SetTin] = useState('');
  const [DangLuu, SetDangLuu] = useState(false);
  const [DaSua, SetDaSua] = useState(false);
  const [PhienForm, SetPhienForm] = useState(0);
  const LanYeuCau = useRef(0);
  const Tai = useCallback(async () => {
    const Lan = ++LanYeuCau.current;
    try {
      const R = await Api.get<HoSoHocSinh>(`/ho_so_hoc_sinh/hoc_sinh/${Id}`);
      if (Lan === LanYeuCau.current) { SetHS(R.data); SetPhienForm(V => V + 1); }
    } catch (E) { if (Lan === LanYeuCau.current) SetLoi(LayThongBaoLoi(E)); }
  }, [Id]);
  useEffect(() => {
    let Huy = false;
    void Promise.resolve().then(() => { if (!Huy) void Tai(); });
    return () => { Huy = true; LanYeuCau.current++; };
  }, [Tai]);
  useEffect(() => {
    const CanhBao = (E: BeforeUnloadEvent) => { if (DaSua) { E.preventDefault(); E.returnValue = ''; } };
    window.addEventListener('beforeunload', CanhBao);
    return () => window.removeEventListener('beforeunload', CanhBao);
  }, [DaSua]);
  function DongHoSo() { if (!DaSua || window.confirm('Bạn có thay đổi chưa lưu. Đóng hồ sơ?')) Dong(); }
  async function Luu(Event: FormEvent<HTMLFormElement>) {
    Event.preventDefault();
    if (!HS || DangLuu) return;
    const F = new FormData(Event.currentTarget);
    const Lay = (Key: string) => String(F.get(Key) ?? '').trim();
    SetLoi(''); SetTin('');
    const HocSinh: Record<string, string> = {};
    for (const [Key] of Truong) HocSinh[Key] = Lay(Key);
    HocSinh.gioi_tinh = Lay('gioi_tinh'); HocSinh.ghi_chu = Lay('ghi_chu');
    const Data: Record<string, unknown> = {
      hoc_sinh: HocSinh,
      phu_huynh: HS.phu_huynh_hoc_sinh.map(LK => {
        const Prefix = 'ph_' + LK.phu_huynh.id + '_';
        return { id: LK.phu_huynh.id, ho_ten: Lay(Prefix + 'ho_ten'), so_dien_thoai: Lay(Prefix + 'so_dien_thoai'),
          nam_sinh: Lay(Prefix + 'nam_sinh') ? Number(Lay(Prefix + 'nam_sinh')) : null,
          nghe_nghiep: Lay(Prefix + 'nghe_nghiep') || null, moi_quan_he: Lay(Prefix + 'moi_quan_he') };
      }),
    };
    if (LaAdmin) Data.trang_thai = Lay('trang_thai');
    const SucKhoe = ['chieu_cao_cm', 'can_nang_kg', 'ngay_do'];
    if (SucKhoe.some(Key => Lay(Key))) {
      if (!SucKhoe.every(Key => Lay(Key))) { SetLoi('Vui lòng điền đủ chiều cao, cân nặng và ngày đo, hoặc để trống cả ba.'); return; }
      Data.suc_khoe = { chieu_cao_cm: Number(Lay('chieu_cao_cm')), can_nang_kg: Number(Lay('can_nang_kg')), ngay_do: Lay('ngay_do') };
    }
    const GiamHo = ['ho_ten', 'nam_sinh', 'so_dien_thoai', 'nghe_nghiep'];
    if (GiamHo.some(Key => Lay('giam_ho_' + Key))) {
      if (!Lay('giam_ho_ho_ten') || !Lay('giam_ho_so_dien_thoai')) { SetLoi('Người giám hộ cần họ tên và số điện thoại.'); return; }
      Data.nguoi_giam_ho = { ho_ten: Lay('giam_ho_ho_ten'), so_dien_thoai: Lay('giam_ho_so_dien_thoai'),
        nam_sinh: Lay('giam_ho_nam_sinh') ? Number(Lay('giam_ho_nam_sinh')) : null, nghe_nghiep: Lay('giam_ho_nghe_nghiep') || null };
    }
    SetDangLuu(true);
    try {
      await Api.patch(`/ho_so_hoc_sinh/hoc_sinh/${Id}/ho_so`, Data);
      await Tai(); SetDaSua(false); SetTin('Đã lưu toàn bộ hồ sơ học sinh, phụ huynh và người giám hộ.'); CapNhat();
    } catch (E) { SetLoi(LayThongBaoLoi(E)); } finally { SetDangLuu(false); }
  }
  return <HopThoai TieuDe={HS ? 'Hồ sơ học sinh: ' + HS.ho_ten : 'Hồ sơ học sinh'} Dong={DongHoSo} DangLuu={DangLuu} Rong>
    <div className="space-y-5 text-sm">
      {Loi && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{Loi}</p>}
      {Tin && <p role="status" className="rounded bg-green-50 p-3 text-green-700">{Tin}</p>}
      {!HS && !Loi && <p>Đang tải hồ sơ...</p>}
      {HS && <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
          ['Mã học sinh', HS.ma_hoc_sinh], ['Ngày có vắng', HS.thong_ke_nghi.so_ngay_co_vang],
          ['Buổi vắng có phép', HS.thong_ke_nghi.so_buoi_co_phep], ['Buổi vắng không phép', HS.thong_ke_nghi.so_buoi_khong_phep],
        ].map(([Ten, GiaTri]) => <div key={Ten} className="rounded bg-sky-50 p-3"><p className="text-slate-600">{Ten}</p><strong className="text-xl text-sky-800">{GiaTri}</strong></div>)}</div>
        <p className="text-xs text-slate-500">Thống kê toàn bộ lịch sử điểm danh: {HS.thong_ke_nghi.so_buoi_vang} buổi vắng. Một ngày có vắng được đếm một lần; đơn xin nghỉ chưa có điểm danh chưa được cộng vào.</p>
        <form key={PhienForm} aria-label="Hồ sơ học sinh" onSubmit={E => { void Luu(E); }} onChange={() => { SetDaSua(true); SetTin(''); }} className="space-y-5">
          <fieldset disabled={DangLuu} className="space-y-5">
          <section aria-label="Thông tin học sinh">
            <h3 className="mb-3 text-base font-semibold text-sky-800">Thông tin học sinh</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Truong.map(([Key, Ten, Type, Max]) => <label key={Key}>{Ten}<input name={Key} type={Type} required defaultValue={Type === 'date' ? Ngay(HS[Key]) : HS[Key]} max={Type === 'date' ? LayNgayHomNay() : undefined} pattern={Type === 'tel' ? '[0-9]{10}' : undefined} maxLength={Max} className={O} /></label>)}
              <label>Giới tính<select name="gioi_tinh" defaultValue={HS.gioi_tinh} className={O}><option value="NAM">Nam</option><option value="NU">Nữ</option></select></label>
              {LaAdmin ? <label>Trạng thái học sinh<select name="trang_thai" defaultValue={HS.trang_thai} className={O}>{[...new Set([HS.trang_thai, 'DANG_HOC', 'CHUYEN_TRUONG', 'THOI_HOC'])].map(T => <option key={T} value={T}>{TrangThai[T] || T}</option>)}</select></label>
                : <label>Trạng thái học sinh<input value={TrangThai[HS.trang_thai] || HS.trang_thai} readOnly className={O + ' !bg-slate-100'} /><span className="text-xs text-slate-500">Admin quản lý trạng thái.</span></label>}
              <label className="sm:col-span-2">Ghi chú<textarea name="ghi_chu" defaultValue={HS.ghi_chu || ''} className={O} rows={2} /></label>
            </div>
            <p className="mt-2 text-xs text-slate-500">ID: {HS.id} · Tạo: {HS.ngay_tao} · Cập nhật: {HS.ngay_cap_nhat}</p>
          </section>
          <section aria-label="Sức khỏe học sinh">
            <h3 className="mb-3 text-base font-semibold text-sky-800">Sức khỏe</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <label>Chiều cao (cm)<input name="chieu_cao_cm" type="number" min={0.1} max={9999.9} step={0.1} defaultValue={HS.chieu_cao_cm ?? ''} className={O} /></label>
              <label>Cân nặng (kg)<input name="can_nang_kg" type="number" min={0.01} max={999.99} step={0.01} defaultValue={HS.can_nang_kg ?? ''} className={O} /></label>
              <label>Ngày đo<input name="ngay_do" type="date" defaultValue={Ngay(HS.ngay_do)} max={LayNgayHomNay()} className={O} /></label>
            </div>
          </section>
          <section aria-label="Phụ huynh và người giám hộ">
            <h3 className="mb-3 text-base font-semibold text-sky-800">Phụ huynh và người giám hộ</h3>
            <p className="mb-3 text-xs text-slate-500">Thông tin phụ huynh được dùng chung nếu có nhiều con. Mối quan hệ áp dụng cho học sinh đang xem.</p>
            <div className="grid gap-4 xl:grid-cols-2">{HS.phu_huynh_hoc_sinh.map(LK => {
              const PH = LK.phu_huynh; const Prefix = 'ph_' + PH.id + '_';
              return <fieldset key={PH.id} aria-label={'Phụ huynh ' + PH.id} className="rounded border border-slate-200 p-3">
                <legend className="px-1 font-semibold">{PH.ho_ten}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>Họ tên phụ huynh<input name={Prefix + 'ho_ten'} required maxLength={100} defaultValue={PH.ho_ten} className={O} /></label>
                  <label>Năm sinh phụ huynh<input name={Prefix + 'nam_sinh'} type="number" min={1900} max={Number(LayNgayHomNay().slice(0, 4)) - 18} defaultValue={PH.nam_sinh ?? ''} className={O} /></label>
                  <label>SĐT phụ huynh<input name={Prefix + 'so_dien_thoai'} type="tel" pattern="[0-9]{10}" maxLength={10} required defaultValue={PH.so_dien_thoai} className={O} /></label>
                  <label>Nghề nghiệp<input name={Prefix + 'nghe_nghiep'} defaultValue={PH.nghe_nghiep ?? ''} maxLength={100} className={O} /></label>
                  <label>Mối quan hệ<select name={Prefix + 'moi_quan_he'} defaultValue={LK.moi_quan_he} className={O}><option value="CHA">Cha</option><option value="ME">Mẹ</option><option value="NGUOI_GIAM_HO">Người giám hộ</option></select></label>
                </div>
                <p className="mt-2 text-xs text-slate-500">{PH.tai_khoan_id ? 'Đã có tài khoản' : 'Chưa có tài khoản'} · Liên kết: {Ngay(LK.ngay_lien_ket)}</p>
              </fieldset>;
            })}</div>
            <fieldset aria-label="Người giám hộ khác" className="mt-4 rounded border border-sky-200 bg-sky-50/50 p-3">
              <legend className="px-1 font-semibold">Người giám hộ khác (nếu có)</legend>
              <p className="mb-3 text-xs text-slate-600">Điền thông tin để ghi thêm người giám hộ cùng lần lưu hồ sơ. Để trống nếu không cần bổ sung.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>Họ tên người giám hộ<input name="giam_ho_ho_ten" maxLength={100} className={O} /></label>
                <label>Năm sinh người giám hộ<input name="giam_ho_nam_sinh" type="number" min={1900} max={Number(LayNgayHomNay().slice(0, 4)) - 18} className={O} /></label>
                <label>SĐT người giám hộ<input name="giam_ho_so_dien_thoai" type="tel" pattern="[0-9]{10}" maxLength={10} className={O} /></label>
                <label>Nghề nghiệp người giám hộ<input name="giam_ho_nghe_nghiep" maxLength={100} className={O} /></label>
              </div>
            </fieldset>
          </section>
          </fieldset>
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white py-3">
            <span className="text-xs text-slate-500">{DaSua ? 'Có thay đổi chưa lưu' : 'Hồ sơ đã được lưu'}</span>
            <button type="submit" disabled={DangLuu || !DaSua} className={Nut}>{DangLuu ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </div>
        </form>
        <section><h3 className="mb-3 text-base font-semibold text-sky-800">Lịch sử lớp học</h3><div className="overflow-auto"><table className="min-w-[700px] w-full text-left"><thead className="bg-sky-700 text-white"><tr>{['Lớp', 'Khối', 'Năm học', 'Bắt đầu', 'Kết thúc', 'Trạng thái', 'Ghi chú'].map(T => <th key={T} className="p-2">{T}</th>)}</tr></thead><tbody>{HS.xep_lop.map(X => <tr key={X.id} className="border-b"><td className="p-2">{X.lop_hoc.ten_lop}</td><td className="p-2">{X.lop_hoc.khoi.ten_khoi}</td><td className="p-2">{X.lop_hoc.nam_hoc.ten_nam_hoc}</td><td className="p-2">{Ngay(X.ngay_bat_dau)}</td><td className="p-2">{Ngay(X.ngay_ket_thuc) || '—'}</td><td className="p-2">{X.trang_thai}</td><td className="p-2">{X.ghi_chu || '—'}</td></tr>)}</tbody></table>{!HS.xep_lop.length && <p className="p-3">Chưa xếp lớp.</p>}</div></section>
      </>}
    </div>
  </HopThoai>;
}
