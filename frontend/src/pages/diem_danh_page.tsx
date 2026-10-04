import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Api from '../api/api';
import { LayNgayHomNay } from '../utils/ngay_local';
import { DoiNgay, LaChuNhat, LayNgayHocGanNhat } from '../utils/ngay_diem_danh';
import { QuyUoc } from '../utils/quy_uoc_nghiep_vu';
import { LayThongBaoLoi } from '../utils/loi_api';
import NhanLopGiaoVien from '../components/nhan_lop_giao_vien';
import type { DanhMucLop } from './hoc_sinh_types';

interface Item {
  id: number;
  hoc_sinh: { id: number; ma_hoc_sinh: string; ho_ten: string };
  diem_danh: Array<{ trang_thai: string; ghi_chu: string | null }>;
}
interface Dong { xep_lop_id: number; ma_hoc_sinh: string; ho_ten: string; trang_thai: string; ghi_chu: string }
const O = 'w-full rounded border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100';
const Nut = 'rounded bg-sky-700 px-4 py-2 font-medium text-white disabled:opacity-40';

export default function DiemDanhPage() {
  const HomNay = LayNgayHomNay();
  const [PhamVi, SetPhamVi] = useState<DanhMucLop | null>(null);
  const [Ngay, SetNgay] = useState(() => LayNgayHocGanNhat(LayNgayHomNay()));
  const [Buoi, SetBuoi] = useState('SANG');
  const [DanhSach, SetDanhSach] = useState<Dong[]>([]);
  const [DaTai, SetDaTai] = useState('');
  const [DaSua, SetDaSua] = useState(false);
  const [DangTai, SetDangTai] = useState(false);
  const [DangLuu, SetDangLuu] = useState(false);
  const [Loi, SetLoi] = useState('');
  const [Tin, SetTin] = useState('');
  const Lan = useRef(0);
  const Lop = PhamVi?.lop_hoc.find(L => L.id === PhamVi.lop_chu_nhiem_id);
  const LopId = Lop?.id;
  const ChuNhat = LaChuNhat(Ngay);
  const Khoa = String(LopId) + '|' + Ngay + '|' + Buoi;
  const HopLe = !!LopId && !!Ngay && !ChuNhat && Ngay <= HomNay;
  const SanSang = HopLe && DaTai === Khoa && !DangTai && !DangLuu;
  const DongHienThi = DaTai === Khoa && HopLe ? DanhSach : [];

  useEffect(() => {
    let Huy = false;
    void Api.get<DanhMucLop>('/ho_so_hoc_sinh/danh_muc').then(R => {
      if (!Huy) SetPhamVi(R.data);
    }).catch(E => { if (!Huy) SetLoi(LayThongBaoLoi(E)); });
    return () => { Huy = true; };
  }, []);
  const Tai = useCallback(async () => {
    const Ma = ++Lan.current;
    SetLoi(''); SetTin(''); SetDangTai(false); SetDaTai(''); SetDanhSach([]); SetDaSua(false);
    if (!LopId || !Ngay || LaChuNhat(Ngay) || Ngay > LayNgayHomNay()) return;
    SetDangTai(true);
    try {
      const R = await Api.get<{ danh_sach: Item[] }>('/diem_danh_nghi_hoc/diem_danh', {
        params: { lop_hoc_id: LopId, ngay_hoc: Ngay, buoi_hoc: Buoi },
      });
      if (Ma !== Lan.current) return;
      SetDanhSach(R.data.danh_sach.map(I => ({ xep_lop_id: I.id, ma_hoc_sinh: I.hoc_sinh.ma_hoc_sinh,
        ho_ten: I.hoc_sinh.ho_ten, trang_thai: I.diem_danh[0]?.trang_thai ?? '', ghi_chu: I.diem_danh[0]?.ghi_chu ?? '' })));
      SetDaTai(Khoa);
    } catch (E) { if (Ma === Lan.current) SetLoi(LayThongBaoLoi(E)); }
    finally { if (Ma === Lan.current) SetDangTai(false); }
  }, [LopId, Ngay, Buoi, Khoa]);
  useEffect(() => {
    let Huy = false;
    void Promise.resolve().then(() => { if (!Huy) return Tai(); });
    return () => { Huy = true; Lan.current++; };
  }, [Tai]);
  useEffect(() => {
    const CanhBao = (E: BeforeUnloadEvent) => { if (DaSua) { E.preventDefault(); E.returnValue = ''; } };
    window.addEventListener('beforeunload', CanhBao);
    return () => window.removeEventListener('beforeunload', CanhBao);
  }, [DaSua]);
  function Chuyen(Work: () => void) {
    if (DangLuu) return;
    if (DaSua && !window.confirm('Điểm danh đang sửa chưa được lưu. Đổi ngày hoặc buổi và bỏ các thay đổi?')) return;
    Lan.current++; SetDaSua(false); SetTin(''); Work();
  }
  function Sua(Id: number, Field: 'trang_thai' | 'ghi_chu', Value: string) {
    if (!SanSang) return;
    SetDanhSach(Cu => Cu.map(D => D.xep_lop_id === Id ? { ...D, [Field]: Value } : D));
    SetDaSua(true); SetTin('');
  }
  async function Luu(E: FormEvent<HTMLFormElement>) {
    E.preventDefault();
    if (!SanSang || !DanhSach.length) return;
    if (DanhSach.some(D => !D.trang_thai)) { SetLoi('Chọn trạng thái cho tất cả học sinh trước khi lưu.'); return; }
    SetDangLuu(true); SetLoi(''); SetTin('');
    try {
      await Api.post('/diem_danh_nghi_hoc/diem_danh', {
        lop_hoc_id: LopId, ngay_hoc: Ngay, buoi_hoc: Buoi,
        danh_sach: DanhSach.map(D => ({ xep_lop_id: D.xep_lop_id, trang_thai: D.trang_thai, ghi_chu: D.ghi_chu })),
      });
      SetDaSua(false); SetTin('Đã lưu điểm danh ' + (Buoi === 'SANG' ? 'buổi sáng' : 'buổi chiều') + ' ngày ' + Ngay + '.');
    } catch (Error) { SetLoi(LayThongBaoLoi(Error)); } finally { SetDangLuu(false); }
  }
  return <div className="min-w-0">
    <h1 className="text-2xl font-bold text-slate-800">Điểm danh</h1>
    <p className="mt-1 text-sm text-slate-600">Điểm danh lớp chủ nhiệm theo ngày và buổi học. Danh sách tự hiển thị khi đổi ngày hoặc buổi.</p>
    <section className="mt-4 rounded-lg border bg-white p-4">
      {PhamVi && <NhanLopGiaoVien Lop={Lop} CheDo={PhamVi.che_do} />}
      <fieldset disabled={DangLuu} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-44 flex-1 text-sm font-medium">Ngày học<input aria-label="Ngày học điểm danh" type="date" value={Ngay} max={HomNay} onChange={E => Chuyen(() => SetNgay(E.target.value))} className={O + ' mt-1'} /></label>
        <div className="flex gap-2"><button type="button" disabled={!Ngay} onClick={() => Chuyen(() => SetNgay(DoiNgay(Ngay, -1)))} className="rounded border px-3 py-2">Ngày trước</button><button type="button" disabled={!Ngay || Ngay >= HomNay} onClick={() => Chuyen(() => SetNgay(DoiNgay(Ngay, 1)))} className="rounded border px-3 py-2">Ngày sau</button></div>
        <label className="min-w-44 flex-1 text-sm font-medium">Buổi học<select aria-label="Buổi học điểm danh" value={Buoi} onChange={E => Chuyen(() => SetBuoi(E.target.value))} className={O + ' mt-1'}><option value="SANG">Sáng</option><option value="CHIEU">Chiều</option></select></label>
        <button type="button" disabled={!SanSang || !DanhSach.length} onClick={() => { SetDanhSach(Cu => Cu.map(D => ({ ...D, trang_thai: 'CO_MAT' }))); SetDaSua(true); SetTin(''); }} className={Nut}>Điểm danh tất cả</button>
      </fieldset>
      {LaChuNhat(HomNay) && Ngay === LayNgayHocGanNhat(HomNay) && <p className="mt-3 text-sm text-slate-600">Hôm nay là Chủ nhật; đang hiển thị ngày học gần nhất.</p>}
      {ChuNhat && <p role="alert" className="mt-3 rounded bg-amber-50 p-3 text-amber-800">Chủ nhật không điểm danh. Chọn ngày học khác để xem danh sách.</p>}
      {Ngay > HomNay && <p role="alert" className="mt-3 text-red-700">Không được điểm danh ngày trong tương lai.</p>}
      {Loi && <p role="alert" className="mt-3 rounded bg-red-50 p-3 text-red-700">{Loi} {HopLe && <button disabled={DangLuu} onClick={() => { void Tai(); }} className="ml-2 underline">Thử lại</button>}</p>}
      {Tin && <p role="status" className="mt-3 rounded bg-green-50 p-3 text-green-700">{Tin}</p>}
      <p className="my-3 text-sm text-slate-600">{DongHienThi.length} học sinh · {QuyUoc.DiemDanh.map(T => T.Ten + ': ' + DongHienThi.filter(D => D.trang_thai === T.Ma).length).join(' · ')}{DaSua ? ' · Chưa lưu thay đổi' : ''}</p>
      <form aria-label="Danh sách điểm danh" onSubmit={E => { void Luu(E); }}>
        <div className="max-h-[650px] overflow-auto rounded border" aria-busy={DangTai}>
          <table aria-label="Bảng điểm danh" className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-sky-700 text-white"><tr>{['STT', 'Có mặt', 'Mã học sinh', 'Họ tên', 'Trạng thái', 'Ghi chú'].map(T => <th key={T} className="border-r border-sky-600 p-3">{T}</th>)}</tr></thead>
            <tbody>{DongHienThi.map((D, I) => <tr key={D.xep_lop_id} className="border-b even:bg-slate-50">
              <td className="p-3">{I + 1}</td>
              <td className="p-3"><input aria-label={'Có mặt ' + D.ho_ten} type="checkbox" disabled={!SanSang} checked={D.trang_thai === 'CO_MAT'} onChange={E => Sua(D.xep_lop_id, 'trang_thai', E.target.checked ? 'CO_MAT' : '')} /></td>
              <td className="p-3">{D.ma_hoc_sinh}</td><td className="p-3 font-medium">{D.ho_ten}</td>
              <td className="p-3"><select aria-label={'Trạng thái điểm danh ' + D.ho_ten} required disabled={!SanSang} value={D.trang_thai} onChange={E => Sua(D.xep_lop_id, 'trang_thai', E.target.value)} className={O}><option value="">Chọn trạng thái</option>{QuyUoc.DiemDanh.map(T => <option key={T.Ma} value={T.Ma}>{T.Ten}</option>)}</select></td>
              <td className="p-3"><input aria-label={'Ghi chú điểm danh ' + D.ho_ten} disabled={!SanSang} value={D.ghi_chu} maxLength={500} onChange={E => Sua(D.xep_lop_id, 'ghi_chu', E.target.value)} className={O} /></td>
            </tr>)}</tbody>
          </table>
          {DangTai && <p role="status" className="p-4 text-center">Đang tải danh sách điểm danh...</p>}
          {!DangTai && !DongHienThi.length && <p className="p-4 text-center">{ChuNhat ? 'Chủ nhật nghỉ học.' : !PhamVi ? 'Đang xác định lớp chủ nhiệm...' : !Lop ? 'Chỉ giáo viên chủ nhiệm được điểm danh lớp.' : 'Không có học sinh tại ngày và buổi đã chọn.'}</p>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">Chọn Có mặt tất cả, sửa các em vắng hoặc đi trễ, rồi lưu.</span><button type="submit" disabled={!SanSang || !DongHienThi.length || !DaSua} className={Nut}>{DangLuu ? 'Đang lưu...' : 'Lưu điểm danh'}</button></div>
      </form>
    </section>
  </div>;
}
