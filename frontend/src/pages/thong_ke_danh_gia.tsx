import { useEffect, useRef, useState } from 'react';
import Api from '../api/api';
import { LayThongBaoLoi } from '../utils/loi_api';
import type { LopHoc } from './hoc_sinh_types';

interface Dot { id: number; ten_dot: string }
interface Muc { muc_danh_gia: string; so_luong: number; ty_le: number; so_nu: number; dan_toc_thieu_so: number }
interface Dong { lop_hoc_id: number | null; ten_lop: string; si_so: number; mon_hoc: Array<{ id: number; ten_mon_hoc: string; si_so_ap_dung: number; muc_do: Muc[] }> }
const TenMuc: Record<string, string> = { HOAN_THANH_TOT: 'Hoàn thành tốt', HOAN_THANH: 'Hoàn thành', CHUA_HOAN_THANH: 'Chưa hoàn thành', CHUA_DANH_GIA: 'Chưa đánh giá' };
const O = 'mt-1 w-full rounded border border-slate-300 p-2';
export default function ThongKeDanhGia() {
  const [Lop, SetLop] = useState<LopHoc[]>([]);
  const [Nam, SetNam] = useState('');
  const [Khoi, SetKhoi] = useState('');
  const [LopId, SetLopId] = useState('');
  const [Dot, SetDot] = useState<Dot[]>([]);
  const [DotId, SetDotId] = useState('');
  const [DanhSach, SetDanhSach] = useState<Dong[]>([]);
  const [Loi, SetLoi] = useState('');
  const [DangTai, SetDangTai] = useState(false);
  const Lan = useRef(0);
  useEffect(() => {
    let Huy = false;
    void Api.get<{ lop_hoc: LopHoc[] }>('/ho_so_hoc_sinh/danh_muc').then(R => {
      if (!Huy) { SetLop(R.data.lop_hoc); SetNam(String(R.data.lop_hoc[0]?.nam_hoc_id ?? '')); }
    }).catch(E => { if (!Huy) SetLoi(LayThongBaoLoi(E)); });
    return () => { Huy = true; };
  }, []);
  useEffect(() => {
    let Huy = false;
    if (Nam) void Api.get<Dot[]>('/danh_gia_hoc_tap/dot_danh_gia', { params: { nam_hoc_id: Nam } }).then(R => {
      if (!Huy) { SetDot(R.data); SetDotId(String(R.data[0]?.id ?? '')); }
    }).catch(E => { if (!Huy) SetLoi(LayThongBaoLoi(E)); });
    return () => { Huy = true; };
  }, [Nam]);
  useEffect(() => {
    const Ma = ++Lan.current;
    void Promise.resolve().then(async () => {
      if (Ma !== Lan.current) return;
      SetDanhSach([]); SetLoi('');
      if (!DotId) return;
      SetDangTai(true);
      try {
        const R = await Api.get<{ danh_sach: Dong[] }>('/danh_gia_hoc_tap/thong_ke_danh_gia', {
          params: { dot_danh_gia_id: DotId, khoi_id: Khoi || undefined, lop_hoc_id: LopId || undefined },
        });
        if (Ma === Lan.current) SetDanhSach(R.data.danh_sach);
      } catch (E) { if (Ma === Lan.current) SetLoi(LayThongBaoLoi(E)); }
      finally { if (Ma === Lan.current) SetDangTai(false); }
    });
    return () => { Lan.current++; };
  }, [DotId, Khoi, LopId]);
  const NamHoc = [...new Map(Lop.map(L => [L.nam_hoc.id, L.nam_hoc])).values()];
  const KhoiHoc = [...new Map(Lop.filter(L => String(L.nam_hoc_id) === Nam).map(L => [L.khoi.id, L.khoi])).values()];
  const LopLoc = Lop.filter(L => String(L.nam_hoc_id) === Nam && (!Khoi || String(L.khoi_id) === Khoi));
  return <section className="mt-5 min-w-0 rounded-lg border bg-white p-4">
    <h2 className="text-lg font-semibold text-sky-800">Thống kê đánh giá môn học</h2>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label>Năm học<select aria-label="Năm học thống kê" className={O} value={Nam} onChange={E => { SetNam(E.target.value); SetKhoi(''); SetLopId(''); SetDot([]); SetDotId(''); }}>{NamHoc.map(N => <option key={N.id} value={N.id}>{N.ten_nam_hoc}</option>)}</select></label>
      <label>Khối<select aria-label="Khối thống kê" className={O} value={Khoi} onChange={E => { SetKhoi(E.target.value); SetLopId(''); }}><option value="">Tất cả khối trong phạm vi</option>{KhoiHoc.map(K => <option key={K.id} value={K.id}>{K.ten_khoi}</option>)}</select></label>
      <label>Lớp<select aria-label="Lớp thống kê" className={O} value={LopId} onChange={E => SetLopId(E.target.value)}><option value="">Tất cả lớp trong phạm vi</option>{LopLoc.map(L => <option key={L.id} value={L.id}>{L.ten_lop}</option>)}</select></label>
      <label>Đợt đánh giá<select aria-label="Đợt thống kê" className={O} value={DotId} onChange={E => SetDotId(E.target.value)}><option value="">Chọn đợt đánh giá</option>{Dot.map(D => <option key={D.id} value={D.id}>{D.ten_dot}</option>)}</select></label>
    </div>
    <p className="my-3 text-xs text-slate-600">Sĩ số áp dụng gồm học sinh đang học ở khối đã cấu hình môn trong đợt và trong phạm vi được phép xem. Tỷ lệ tính trên sĩ số áp dụng; cột dân tộc thiểu số đếm học sinh có dân tộc khác Kinh.</p>
    {Loi && <p role="alert" className="p-3 text-red-700">{Loi}</p>}
    <div className="max-h-[650px] overflow-auto">
      <table aria-label="Bảng thống kê đánh giá" className="w-full min-w-[850px] text-left text-sm">
        <thead className="sticky top-0 bg-sky-700 text-white"><tr>{['Lớp / Phạm vi', 'Sĩ số áp dụng', 'Môn học', 'Mức độ', 'Số lượng', 'Tỷ lệ (%)', 'Nữ', 'Dân tộc thiểu số'].map(T => <th key={T} className="border-r border-sky-600 p-3">{T}</th>)}</tr></thead>
        <tbody>{DanhSach.flatMap(D => D.mon_hoc.flatMap(M => M.muc_do.map((K, I) => <tr key={String(D.lop_hoc_id) + '/' + M.id + '/' + K.muc_danh_gia} className={'border-b ' + (D.lop_hoc_id === null ? 'bg-sky-50 font-medium' : 'even:bg-slate-50')}>
          <td className="p-3">{I === 0 ? D.ten_lop : ''}</td><td className="p-3">{I === 0 ? M.si_so_ap_dung : ''}</td><td className="p-3">{I === 0 ? M.ten_mon_hoc : ''}</td><td className="p-3">{TenMuc[K.muc_danh_gia] || K.muc_danh_gia}</td><td className="p-3">{K.so_luong}</td><td className="p-3">{K.ty_le}</td><td className="p-3">{K.so_nu}</td><td className="p-3">{K.dan_toc_thieu_so}</td>
        </tr>)))}</tbody>
      </table>
      {DangTai && <p role="status" className="p-4">Đang tải thống kê...</p>}
      {!DangTai && (!DotId || !DanhSach.some(D => D.mon_hoc.length)) && <p className="p-4">Chọn đợt có cấu hình môn học để xem thống kê.</p>}
    </div>
  </section>;
}
