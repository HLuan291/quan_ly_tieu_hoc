import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Api from '../api/api';
import { LayThongBaoLoi } from '../utils/loi_api';
import { LayNgayHomNay } from '../utils/ngay_local';
import type { LopHoc } from './hoc_sinh_types';
import ThongKeDanhGia from './thong_ke_danh_gia';

interface KetQua { id: number; muc_danh_gia: string; nhan_xet: string | null; mon_hoc_id?: number; tieu_chi_danh_gia_id?: number }
interface Diem { id: number; cau_hinh_diem_id: number; diem: string | number }
interface HocSinh {
  id: number; ma_hoc_sinh: string; ho_ten: string; ngay_sinh: string;
  ket_qua_mon_hoc: KetQua[]; nang_luc_pham_chat: KetQua[]; diem_dinh_ky: Diem[];
}
interface Bang {
  lop_hoc: LopHoc; dot_danh_gia: { id: number; ten_dot: string };
  mon_hoc: Array<{ id: number; ten_mon_hoc: string; duoc_nhap: boolean }>;
  cau_hinh_diem: Array<{ id: number; ten_hien_thi: string; cach_nhap: string }>;
  tieu_chi: Array<{ id: number; ten_tieu_chi: string; nhom_danh_gia: string }>;
  duoc_nhap_nang_luc: boolean; danh_sach: HocSinh[];
}
interface Nhap { muc: string; nhan: string }
const O = 'w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 disabled:bg-slate-100';
const Nut = 'rounded bg-blue-700 px-3 py-2 font-medium text-white disabled:opacity-40';
const MucMon = [['HOAN_THANH_TOT', 'Hoàn thành tốt'], ['HOAN_THANH', 'Hoàn thành'], ['CHUA_HOAN_THANH', 'Chưa hoàn thành']];
const MucNang = [['TOT', 'Tốt'], ['DAT', 'Đạt'], ['CAN_CO_GANG', 'Cần cố gắng']];

function DiemForm({ HS, CH, DaCo, DuocNhap }: { HS: HocSinh; CH: Bang['cau_hinh_diem'][number]; DaCo?: Diem; DuocNhap: boolean }) {
  const [Loi, SetLoi] = useState('');
  const [Tin, SetTin] = useState('');
  const [DangLuu, SetDangLuu] = useState(false);
  const [Record, SetRecord] = useState<Diem | undefined>(DaCo);
  const [DiemNhap, SetDiemNhap] = useState('');
  async function Luu(E: FormEvent<HTMLFormElement>) {
    E.preventDefault(); const F = new FormData(E.currentTarget);
    SetDangLuu(true); SetLoi(''); SetTin('');
    try {
      const Data = { diem: Number(DiemNhap), ngay_kiem_tra: F.get('ngay_kiem_tra'), ly_do_kiem_tra_lai: F.get('ly_do') };
      if (Record) {
        await Api.post(`/danh_gia_hoc_tap/diem_dinh_ky/${Record.id}/kiem_tra_lai`, Data);
        SetRecord({ ...Record, diem: Data.diem });
        SetTin('Đã lưu lần kiểm tra lại.');
      } else {
        const R = await Api.post('/danh_gia_hoc_tap/diem_dinh_ky', { hoc_sinh_id: HS.id, cau_hinh_diem_id: CH.id, diem: Data.diem, ngay_kiem_tra: Data.ngay_kiem_tra });
        SetRecord(R.data.diem); SetTin('Đã lưu điểm.');
      }
      SetDiemNhap('');
    } catch (Error) { SetLoi(LayThongBaoLoi(Error)); } finally { SetDangLuu(false); }
  }
  if (CH.cach_nhap !== 'NHAP_TAY') return <p>{DaCo?.diem ?? '—'} <span className="text-xs">(Tự tính)</span></p>;
  return <form aria-label={'Điểm ' + CH.id + ' học sinh ' + HS.id} onSubmit={E => { void Luu(E); }} className="min-w-44 space-y-2">
    <p className="text-xs">Điểm đã lưu: <strong>{Record?.diem ?? 'Chưa nhập'}</strong></p>
    {DuocNhap && <>
      <input aria-label={'Điểm ' + CH.ten_hien_thi + ' của ' + HS.ho_ten} type="number" required min={0} max={10} step={0.1} value={DiemNhap} onChange={E => SetDiemNhap(E.target.value)} className={O} />
      <input aria-label={'Ngày kiểm tra ' + CH.id + ' của ' + HS.ho_ten} name="ngay_kiem_tra" type="date" required defaultValue={LayNgayHomNay()} className={O} />
      {Record && <input aria-label={'Lý do kiểm tra lại ' + CH.id + ' của ' + HS.ho_ten} name="ly_do" placeholder="Lý do kiểm tra lại" className={O} />}
      <button disabled={DangLuu} className={Nut + ' text-xs'}>{Record ? 'Lưu kiểm tra lại' : 'Lưu điểm'}</button>
    </>}
    {Loi && <p role="alert" className="text-xs text-red-700">{Loi}</p>}{Tin && <p role="status" className="text-xs text-green-700">{Tin}</p>}
  </form>;
}

export default function BangDanhGiaGiaoVien() {
  const [Lop, SetLop] = useState<LopHoc[]>([]);
  const [Nam, SetNam] = useState('');
  const [Khoi, SetKhoi] = useState('');
  const [LopId, SetLopId] = useState('');
  const [Dot, SetDot] = useState<Array<{ id: number; ten_dot: string }>>([]);
  const [DotId, SetDotId] = useState('');
  const [MonId, SetMonId] = useState('');
  const [TieuChiId, SetTieuChiId] = useState('');
  const [Tab, SetTab] = useState('MON');
  const [Data, SetData] = useState<Bang | null>(null);
  const [Nhap, SetNhap] = useState<Record<number, Nhap>>({});
  const [LoiDong, SetLoiDong] = useState<Record<number, string>>({});
  const [TinDong, SetTinDong] = useState<Record<number, string>>({});
  const [Loi, SetLoi] = useState('');
  const [DangTai, SetDangTai] = useState(false);
  const [DangLuu, SetDangLuu] = useState(false);
  const [Trang, SetTrang] = useState(1);
  const [SoDong, SetSoDong] = useState(25);
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
    if (Nam) void Api.get<typeof Dot>('/danh_gia_hoc_tap/dot_danh_gia', { params: { nam_hoc_id: Nam } }).then(R => {
      if (!Huy) { SetDot(R.data); SetDotId(String(R.data[0]?.id ?? '')); }
    }).catch(E => { if (!Huy) SetLoi(LayThongBaoLoi(E)); });
    return () => { Huy = true; };
  }, [Nam]);
  const Tai = useCallback(async () => {
    const Ma = ++Lan.current;
    SetLoi(''); SetData(null); SetNhap({}); SetLoiDong({}); SetTinDong({}); SetTrang(1); SetDangTai(false);
    if (!LopId || !DotId) return;
    SetDangTai(true);
    try {
      const R = await Api.get<Bang>('/danh_gia_hoc_tap/bang_danh_gia', {
        params: { lop_hoc_id: LopId, dot_danh_gia_id: DotId, mon_hoc_id: MonId || undefined },
      });
      if (Ma !== Lan.current) return;
      SetData(R.data);
      if (!MonId && R.data.mon_hoc.length) SetMonId(String(R.data.mon_hoc.find(M => M.duoc_nhap)?.id ?? R.data.mon_hoc[0].id));
      if (!TieuChiId && R.data.tieu_chi.length) SetTieuChiId(String(R.data.tieu_chi[0].id));
    } catch (E) { if (Ma === Lan.current) SetLoi(LayThongBaoLoi(E)); }
    finally { if (Ma === Lan.current) SetDangTai(false); }
  }, [LopId, DotId, MonId, TieuChiId]);
  useEffect(() => {
    let Huy = false;
    void Promise.resolve().then(() => { if (!Huy) return Tai(); });
    return () => { Huy = true; Lan.current++; };
  }, [Tai]);
  function Chuyen(Work: () => void) {
    if (Object.keys(Nhap).length && !window.confirm('Các nhận xét chưa lưu sẽ bị bỏ khi đổi bộ lọc. Tiếp tục?')) return;
    SetNhap({}); SetLoiDong({}); SetTinDong({}); Work();
  }
  function DaLuu(HS: HocSinh): Nhap {
    const KQ = Tab === 'MON' ? HS.ket_qua_mon_hoc.find(K => K.mon_hoc_id === Number(MonId)) : HS.nang_luc_pham_chat.find(K => K.tieu_chi_danh_gia_id === Number(TieuChiId));
    return { muc: KQ?.muc_danh_gia ?? '', nhan: KQ?.nhan_xet ?? '' };
  }
  async function LuuDong(HS: HocSinh) {
    const GiaTri = Nhap[HS.id] ?? DaLuu(HS);
    if (!GiaTri.muc) { SetLoiDong(Cu => ({ ...Cu, [HS.id]: 'Cần chọn mức đánh giá.' })); return false; }
    try {
      const DataGui = { hoc_sinh_id: HS.id, dot_danh_gia_id: Number(DotId), muc_danh_gia: GiaTri.muc, nhan_xet: GiaTri.nhan };
      const R = Tab === 'MON' ? await Api.put('/danh_gia_hoc_tap/ket_qua_mon_hoc', { ...DataGui, mon_hoc_id: Number(MonId) })
        : await Api.put('/danh_gia_hoc_tap/nang_luc_pham_chat', { ...DataGui, tieu_chi_danh_gia_id: Number(TieuChiId) });
      const KQ: KetQua = R.data.ket_qua;
      SetData(Cu => Cu ? { ...Cu, danh_sach: Cu.danh_sach.map(Item => Item.id !== HS.id ? Item : Tab === 'MON'
        ? { ...Item, ket_qua_mon_hoc: [...Item.ket_qua_mon_hoc.filter(K => K.mon_hoc_id !== Number(MonId)), KQ] }
        : { ...Item, nang_luc_pham_chat: [...Item.nang_luc_pham_chat.filter(K => K.tieu_chi_danh_gia_id !== Number(TieuChiId)), KQ] }) } : Cu);
      SetNhap(Cu => { const Moi = { ...Cu }; delete Moi[HS.id]; return Moi; });
      SetLoiDong(Cu => ({ ...Cu, [HS.id]: '' })); SetTinDong(Cu => ({ ...Cu, [HS.id]: 'Đã lưu.' })); return true;
    } catch (E) { SetLoiDong(Cu => ({ ...Cu, [HS.id]: LayThongBaoLoi(E) })); return false; }
  }
  async function Luu(DanhSach: HocSinh[]) {
    SetDangLuu(true); SetLoi('');
    let Loi = 0;
    for (const HS of DanhSach) if (!(await LuuDong(HS))) Loi++;
    if (Loi) SetLoi(Loi + ' học sinh chưa lưu được. Các dòng đã lưu giữ kết quả; xem lỗi tại từng dòng.');
    SetDangLuu(false);
  }
  function Sua(HS: HocSinh, Field: keyof Nhap, Value: string) {
    SetNhap(Cu => ({ ...Cu, [HS.id]: { ...(Cu[HS.id] ?? DaLuu(HS)), [Field]: Value } }));
    SetTinDong(Cu => ({ ...Cu, [HS.id]: '' }));
  }
  const NamHoc = [...new Map(Lop.map(L => [L.nam_hoc.id, L.nam_hoc])).values()];
  const KhoiHoc = [...new Map(Lop.filter(L => String(L.nam_hoc_id) === Nam).map(L => [L.khoi.id, L.khoi])).values()];
  const LopLoc = Lop.filter(L => String(L.nam_hoc_id) === Nam && (!Khoi || String(L.khoi_id) === Khoi));
  const DuocNhap = !!Data && (Tab === 'MON' ? Data.mon_hoc.find(M => M.id === Number(MonId))?.duoc_nhap : Data.duoc_nhap_nang_luc);
  const SoTrang = Math.max(1, Math.ceil((Data?.danh_sach.length ?? 0) / SoDong));
  return <div className="min-w-0">
    <h1 className="text-2xl font-bold text-slate-800">Đánh giá học tập</h1>
    <p className="mt-1 text-sm text-slate-600">Nhập mức đánh giá, nhận xét và điểm theo danh sách học sinh của lớp được phân công.</p>
    <div className="mt-4 flex flex-wrap gap-2">{[['MON', 'Môn học'], ['NANG', 'Năng lực, phẩm chất'], ['THONG_KE', 'Thống kê']].map(([Key, Ten]) => <button key={Key} disabled={DangLuu} aria-pressed={Tab === Key} onClick={() => Chuyen(() => SetTab(Key))} className={'rounded border px-4 py-2 text-sm ' + (Tab === Key ? 'bg-sky-700 text-white' : 'bg-white')}>{Ten}</button>)}</div>
    {Tab === 'THONG_KE' ? <ThongKeDanhGia /> : <section className="mt-4 rounded-lg border bg-white p-4">
      <fieldset disabled={DangLuu} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label>Năm học<select aria-label="Năm học đánh giá" className={O} value={Nam} onChange={E => Chuyen(() => { SetNam(E.target.value); SetKhoi(''); SetLopId(''); SetDotId(''); SetDot([]); SetMonId(''); })}>{NamHoc.map(N => <option key={N.id} value={N.id}>{N.ten_nam_hoc}</option>)}</select></label>
        <label>Khối<select aria-label="Khối đánh giá" className={O} value={Khoi} onChange={E => Chuyen(() => { SetKhoi(E.target.value); SetLopId(''); SetMonId(''); })}><option value="">Tất cả khối được phân công</option>{KhoiHoc.map(K => <option key={K.id} value={K.id}>{K.ten_khoi}</option>)}</select></label>
        <label>Lớp<select aria-label="Lớp đánh giá" className={O} value={LopId} onChange={E => Chuyen(() => { SetLopId(E.target.value); SetMonId(''); })}><option value="">Chọn lớp</option>{LopLoc.map(L => <option key={L.id} value={L.id}>{L.ten_lop}</option>)}</select></label>
        <label>Đợt đánh giá<select aria-label="Đợt đánh giá danh sách" className={O} value={DotId} onChange={E => Chuyen(() => { SetDotId(E.target.value); SetMonId(''); })}><option value="">Chọn đợt</option>{Dot.map(D => <option key={D.id} value={D.id}>{D.ten_dot}</option>)}</select></label>
        {Tab === 'MON' ? <label>Môn học<select aria-label="Môn đánh giá danh sách" className={O} value={MonId} onChange={E => Chuyen(() => SetMonId(E.target.value))}><option value="">Chọn môn học</option>{Data?.mon_hoc.map(M => <option key={M.id} value={M.id}>{M.ten_mon_hoc}{M.duoc_nhap ? '' : ' (chỉ xem)'}</option>)}</select></label>
          : <label className="xl:col-span-2">Tiêu chí<select aria-label="Tiêu chí đánh giá danh sách" className={O} value={TieuChiId} onChange={E => Chuyen(() => SetTieuChiId(E.target.value))}><option value="">Chọn tiêu chí</option>{Data?.tieu_chi.map(T => <option key={T.id} value={T.id}>{T.ten_tieu_chi} · {T.nhom_danh_gia}</option>)}</select></label>}
      </fieldset>
      {Loi && <p role="alert" className="mt-3 rounded bg-red-50 p-3 text-red-700">{Loi}</p>}
      {!LopId && <p className="mt-4 text-slate-600">Chọn lớp để mở danh sách học sinh.</p>}
      {DangTai && <p role="status" className="mt-4">Đang tải bảng đánh giá...</p>}
      {Data && <>
        <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-sm"><span>{Data.danh_sach.length} học sinh · {Data.dot_danh_gia.ten_dot}{!DuocNhap ? ' · Bạn có quyền xem bảng này' : ''}</span><div className="flex flex-wrap gap-2"><button disabled={DangTai || DangLuu || !!Object.keys(Nhap).length} onClick={() => { void Tai(); }} className="rounded border px-3 py-2">Tải lại bảng</button><button disabled={!DuocNhap || DangLuu || !Object.keys(Nhap).length} onClick={() => { void Luu(Data.danh_sach.filter(H => Nhap[H.id])); }} className={Nut}>Lưu mức và nhận xét đã sửa ({Object.keys(Nhap).length})</button></div></div>
        {Tab === 'MON' && <p className="mb-3 text-xs text-slate-500">Mỗi cột điểm có nút lưu riêng. Điểm đã có sẽ ghi thêm lần kiểm tra lại; điểm tự tính chỉ hiển thị.</p>}
        <div className="max-h-[650px] overflow-auto rounded border">
          <table aria-label="Bảng đánh giá học sinh" className="min-w-[950px] w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-sky-700 text-left text-white"><tr>{['STT', 'Học sinh', 'Ngày sinh', 'Mức đạt được', 'Nhận xét', 'Lưu nhận xét'].map(T => <th key={T} className="border-r border-sky-600 p-3">{T}</th>)}{Tab === 'MON' && Data.cau_hinh_diem.map(C => <th key={C.id} className="border-r border-sky-600 p-3">{C.ten_hien_thi}</th>)}</tr></thead>
            <tbody>{Data.danh_sach.slice((Trang - 1) * SoDong, Trang * SoDong).map((HS, I) => {
              const GiaTri = Nhap[HS.id] ?? DaLuu(HS);
              return <tr key={HS.id} data-testid={'danh-gia-hs-' + HS.id} className="border-b odd:bg-white even:bg-slate-50">
                <td className="p-3 align-top">{(Trang - 1) * SoDong + I + 1}</td><td className="min-w-48 p-3 align-top"><strong>{HS.ho_ten}</strong><p className="text-xs text-slate-500">{HS.ma_hoc_sinh}</p></td><td className="whitespace-nowrap p-3 align-top">{new Date(HS.ngay_sinh).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}</td>
                <td className="min-w-48 p-3 align-top"><select aria-label={'Mức đánh giá của ' + HS.ho_ten} disabled={!DuocNhap || DangLuu} value={GiaTri.muc} onChange={E => Sua(HS, 'muc', E.target.value)} className={O}><option value="">Chưa đánh giá</option>{(Tab === 'MON' ? MucMon : MucNang).map(([Key, Ten]) => <option key={Key} value={Key}>{Ten}</option>)}</select></td>
                <td className="min-w-72 p-3 align-top"><textarea aria-label={'Nhận xét của ' + HS.ho_ten} disabled={!DuocNhap || DangLuu} rows={3} value={GiaTri.nhan} onChange={E => Sua(HS, 'nhan', E.target.value)} className={O} /></td>
                <td className="min-w-32 p-3 align-top"><button disabled={!DuocNhap || DangLuu || !Nhap[HS.id]} onClick={() => { void Luu([HS]); }} className={Nut}>Lưu nhận xét</button>{LoiDong[HS.id] && <p role="alert" className="mt-2 text-red-700">{LoiDong[HS.id]}</p>}{TinDong[HS.id] && <p role="status" className="mt-2 text-green-700">{TinDong[HS.id]}</p>}</td>
                {Tab === 'MON' && Data.cau_hinh_diem.map(CH => <td key={CH.id} className="p-3 align-top"><DiemForm key={HS.id + '/' + CH.id + '/' + DotId} HS={HS} CH={CH} DaCo={HS.diem_dinh_ky.find(D => D.cau_hinh_diem_id === CH.id)} DuocNhap={!!DuocNhap} /></td>)}
              </tr>;
            })}</tbody>
          </table>{!Data.danh_sach.length && <p className="p-4">Lớp chưa có học sinh đang học.</p>}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><span>Trang {Trang}/{SoTrang}</span><div className="flex gap-2"><button disabled={Trang <= 1 || DangLuu} onClick={() => SetTrang(T => T - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trước</button><button disabled={Trang >= SoTrang || DangLuu} onClick={() => SetTrang(T => T + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Sau</button><select aria-label="Số học sinh đánh giá mỗi trang" value={SoDong} onChange={E => { SetSoDong(Number(E.target.value)); SetTrang(1); }} className="rounded border p-2">{[10, 25, 50, 100].map(N => <option key={N} value={N}>{N} dòng/trang</option>)}</select></div></div>
      </>}
    </section>}
  </div>;
}
