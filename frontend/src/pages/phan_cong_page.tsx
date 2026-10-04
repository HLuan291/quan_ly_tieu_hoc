import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Api from '../api/api';
import { DocJwt } from '../auth/auth';
import HopThoai from '../components/hop_thoai';
import { LayNgayHomNay } from '../utils/ngay_local';
import { LayThongBaoLoi } from '../utils/loi_api';

interface GiaoVien { id: number; ma_giao_vien: string; ho_ten: string }
interface Khoi { id: number; ten_khoi: string; so_khoi: number }
interface LopHoc { id: number; ten_lop: string; khoi_id: number; nam_hoc: { ten_nam_hoc: string }; khoi: Khoi }
interface MonHoc { id: number; ma_mon_hoc: string; ten_mon_hoc: string; trang_thai: string }
interface MonHocKhoi { id: number; mon_hoc_id: number; khoi_id: number; mac_dinh_gvcn: boolean; mon_hoc: MonHoc; khoi: Khoi }
interface PhanCong {
  id: number; giao_vien_id: number; lop_hoc_id: number; mon_hoc_id: number | null;
  loai_phan_cong: string; nguon_phan_cong: string | null; ngay_bat_dau: string; ngay_ket_thuc: string | null;
  giao_vien?: GiaoVien; lop_hoc: LopHoc; mon_hoc: MonHoc | null;
}
type ChucNang = 'tao_mon' | 'gan_mon' | 'phan_cong' | 'cau_hinh';
const TieuDe: Record<ChucNang, string> = { tao_mon: 'Tạo môn học', gan_mon: 'Gắn môn cho khối', phan_cong: 'Tạo phân công', cau_hinh: 'Cấu hình môn theo khối' };
const O = 'mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2';
const Nut = 'rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50';

export default function PhanCongPage() {
  const LaAdmin = DocJwt()?.vai_tro === 'ADMIN';
  const [GiaoVien, SetGiaoVien] = useState<GiaoVien[]>([]);
  const [Khoi, SetKhoi] = useState<Khoi[]>([]);
  const [LopHoc, SetLopHoc] = useState<LopHoc[]>([]);
  const [MonHoc, SetMonHoc] = useState<MonHoc[]>([]);
  const [MonHocKhoi, SetMonHocKhoi] = useState<MonHocKhoi[]>([]);
  const [PhanCong, SetPhanCong] = useState<PhanCong[]>([]);
  const [Loi, SetLoi] = useState('');
  const [LoiForm, SetLoiForm] = useState('');
  const [Tin, SetTin] = useState('');
  const [ChucNang, SetChucNang] = useState<ChucNang | null>(null);
  const [DangLuu, SetDangLuu] = useState(false);
  const [DangTai, SetDangTai] = useState(true);
  const [MaMonHoc, SetMaMonHoc] = useState('');
  const [TenMonHoc, SetTenMonHoc] = useState('');
  const [MonHocId, SetMonHocId] = useState('');
  const [KhoiId, SetKhoiId] = useState('');
  const [MacDinhGvcn, SetMacDinhGvcn] = useState(false);
  const [GiaoVienId, SetGiaoVienId] = useState('');
  const [LopHocId, SetLopHocId] = useState('');
  const [MonPhanCongId, SetMonPhanCongId] = useState('');
  const [LoaiPhanCong, SetLoaiPhanCong] = useState('GVCN_CHINH');
  const [NgayBatDau, SetNgayBatDau] = useState(LayNgayHomNay());
  const [KhoiCauHinhId, SetKhoiCauHinhId] = useState('');

  const TaiDuLieu = useCallback(async () => {
    if (!LaAdmin) { SetDangTai(false); return; }
    SetDangTai(true); SetLoi('');
    try {
      const [GV, K, L, M, MK, PC] = await Promise.all([
        Api.get<{ danh_sach: GiaoVien[] }>('/giao_vien'),
        Api.get<Khoi[]>('/to_chuc_lop_hoc/khoi'),
        Api.get<LopHoc[]>('/to_chuc_lop_hoc/lop_hoc'),
        Api.get<MonHoc[]>('/phan_cong_giang_day/mon_hoc'),
        Api.get<MonHocKhoi[]>('/phan_cong_giang_day/mon_hoc_khoi'),
        Api.get<PhanCong[]>('/phan_cong_giang_day/phan_cong'),
      ]);
      SetGiaoVien(GV.data.danh_sach); SetKhoi(K.data); SetLopHoc(L.data);
      SetMonHoc(M.data); SetMonHocKhoi(MK.data); SetPhanCong(PC.data);
    } catch (E) { SetLoi(LayThongBaoLoi(E)); } finally { SetDangTai(false); }
  }, [LaAdmin]);
  useEffect(() => {
    let Huy = false;
    void Promise.resolve().then(() => { if (!Huy) void TaiDuLieu(); });
    return () => { Huy = true; };
  }, [TaiDuLieu]);

  const LopDangChon = LopHoc.find(L => String(L.id) === LopHocId);
  const MonDuocPhanCong = useMemo(() => {
    if (!LopDangChon) return [];
    const Ids = new Set(MonHocKhoi.filter(M => M.khoi_id === LopDangChon.khoi_id && !M.mac_dinh_gvcn).map(M => M.mon_hoc_id));
    return MonHoc.filter(M => Ids.has(M.id) && M.trang_thai === 'HOAT_DONG');
  }, [LopDangChon, MonHoc, MonHocKhoi]);

  // Môn GVCN vẫn có trong dữ liệu phục vụ đánh giá; bảng chỉ hiển thị dòng chủ nhiệm.
  const PhanCongHienThi = useMemo(() => PhanCong.filter(P => P.loai_phan_cong !== 'GVCN' || P.mon_hoc_id === null), [PhanCong]);
  const CauHinhHienThi = MonHocKhoi.filter(M => !KhoiCauHinhId || String(M.khoi_id) === KhoiCauHinhId);
  const CacKhoiCauHinh = [...new Map(CauHinhHienThi.map(M => [M.khoi_id, M.khoi])).values()].sort((A, B) => A.so_khoi - B.so_khoi);
  function Mo(Loai: ChucNang) { SetLoiForm(''); SetChucNang(Loai); }
  async function Luu(E: FormEvent<HTMLFormElement>) {
    E.preventDefault();
    if (DangLuu || !ChucNang || ChucNang === 'cau_hinh') return;
    SetDangLuu(true); SetLoiForm(''); SetTin('');
    try {
      if (ChucNang === 'tao_mon') {
        await Api.post('/phan_cong_giang_day/mon_hoc', { ma_mon_hoc: MaMonHoc.trim(), ten_mon_hoc: TenMonHoc.trim() });
        SetMaMonHoc(''); SetTenMonHoc(''); SetTin('Đã tạo môn học.');
      } else if (ChucNang === 'gan_mon') {
        await Api.post('/phan_cong_giang_day/mon_hoc_khoi', { mon_hoc_id: Number(MonHocId), khoi_id: Number(KhoiId), mac_dinh_gvcn: MacDinhGvcn });
        SetTin('Đã lưu cấu hình môn theo khối.');
      } else if (LoaiPhanCong === 'GVCN_CHINH') {
        await Api.post('/phan_cong_giang_day/phan_cong/gvcn', { giao_vien_id: Number(GiaoVienId), lop_hoc_id: Number(LopHocId), ngay_bat_dau: NgayBatDau });
        SetTin('Đã phân công giáo viên chủ nhiệm.');
      } else {
        await Api.post('/phan_cong_giang_day/phan_cong/mon_hoc', { giao_vien_id: Number(GiaoVienId), lop_hoc_id: Number(LopHocId), mon_hoc_id: Number(MonPhanCongId), loai_phan_cong: LoaiPhanCong, ngay_bat_dau: NgayBatDau });
        SetTin('Đã phân công môn học.');
      }
      SetMonPhanCongId(''); SetChucNang(null); await TaiDuLieu();
    } catch (Err) { SetLoiForm(LayThongBaoLoi(Err)); } finally { SetDangLuu(false); }
  }
  async function KetThuc(Item: PhanCong) {
    const Ngay = window.prompt('Ngày kết thúc (YYYY-MM-DD)', LayNgayHomNay());
    if (!Ngay || DangLuu) return;
    SetDangLuu(true); SetLoi(''); SetTin('');
    try {
      await Api.patch(`/phan_cong_giang_day/phan_cong/${Item.id}/ket_thuc`, { ngay_ket_thuc: Ngay });
      SetTin('Đã kết thúc phân công.'); await TaiDuLieu();
    } catch (E) { SetLoi(LayThongBaoLoi(E)); } finally { SetDangLuu(false); }
  }

  return <div className="space-y-4">
    <div className="rounded border border-slate-200 bg-white p-4">
      <h1 className="text-xl font-semibold text-sky-800">Phân công giảng dạy</h1>
      <p className="mt-1 text-sm text-slate-600">Danh sách giáo viên chủ nhiệm và giáo viên bộ môn.</p>
      {LaAdmin && <div aria-label="Chức năng phân công" className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(TieuDe) as ChucNang[]).map(Loai => <button key={Loai} type="button" disabled={DangTai || DangLuu} aria-haspopup="dialog" onClick={() => Mo(Loai)} className={Loai === 'phan_cong' ? Nut : 'rounded border border-sky-700 bg-white px-4 py-2 text-sm text-sky-800 disabled:opacity-50'}>{TieuDe[Loai]}</button>)}
      </div>}
    </div>
    {Loi && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{Loi}</p>}
    {Tin && <p role="status" className="rounded bg-green-50 p-3 text-sm text-green-700">{Tin}</p>}
    <section aria-label="Danh sách phân công" className="rounded border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-sky-800">Danh sách phân công</h2>
      {DangTai && <p role="status" className="mt-3 text-sm text-slate-500">Đang tải phân công...</p>}
      <div className="mt-3 overflow-x-auto">
        <table aria-label="Bảng phân công giáo viên" className="w-full min-w-[850px] text-left text-sm">
          <thead><tr>{['Giáo viên', 'Lớp', 'Môn / nhiệm vụ', 'Loại', 'Bắt đầu', 'Kết thúc', 'Thao tác'].map(T => <th key={T} className="px-3 py-3">{T}</th>)}</tr></thead>
          <tbody>{PhanCongHienThi.map(P => <tr key={P.id} data-testid={'phan-cong-' + P.id} className="border-b">
            <td className="px-3 py-3">{P.giao_vien?.ho_ten}</td>
            <td className="px-3 py-3">{P.lop_hoc.ten_lop}<span className="mt-1 block text-xs text-slate-500">{P.lop_hoc.nam_hoc.ten_nam_hoc}</span></td>
            <td className="px-3 py-3">{P.loai_phan_cong === 'GVCN' ? 'Chủ nhiệm' : P.mon_hoc?.ten_mon_hoc || '—'}</td>
            <td className="px-3 py-3">{P.loai_phan_cong}</td>
            <td className="px-3 py-3">{P.ngay_bat_dau.slice(0, 10)}</td>
            <td className="px-3 py-3">{P.ngay_ket_thuc?.slice(0, 10) || 'Đang hiệu lực'}</td>
            <td className="px-3 py-3">{LaAdmin && !P.ngay_ket_thuc && <button type="button" disabled={DangLuu || DangTai} onClick={() => { void KetThuc(P); }} className="text-red-700 hover:underline disabled:opacity-50">Kết thúc</button>}</td>
          </tr>)}</tbody>
        </table>
        {!DangTai && !PhanCongHienThi.length && <p className="p-3 text-sm text-slate-500">Chưa có phân công.</p>}
      </div>
    </section>
    {LaAdmin && ChucNang && <HopThoai TieuDe={TieuDe[ChucNang]} Dong={() => SetChucNang(null)} DangLuu={DangLuu} Rong={ChucNang === 'cau_hinh'}>
      {LoiForm && <p role="alert" className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{LoiForm}</p>}
      {ChucNang === 'cau_hinh' ? <div className="space-y-4 text-sm">
        <label className="block max-w-sm">Khối áp dụng<select aria-label="Khối cấu hình" value={KhoiCauHinhId} onChange={E => SetKhoiCauHinhId(E.target.value)} className={O}>
          <option value="">Tất cả khối</option>{Khoi.map(K => <option key={K.id} value={K.id}>{K.ten_khoi}</option>)}
        </select></label>
        {CacKhoiCauHinh.map(K => <section key={K.id} aria-label={'Cấu hình ' + K.ten_khoi} className="rounded border border-slate-200 p-3">
          <h3 className="font-semibold text-sky-800">{K.ten_khoi}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {CauHinhHienThi.some(M => M.khoi_id === K.id && M.mac_dinh_gvcn) && <span className="rounded bg-sky-100 px-3 py-2 font-medium text-sky-800">GVCN</span>}
            {CauHinhHienThi.filter(M => M.khoi_id === K.id && !M.mac_dinh_gvcn).map(M => <span key={M.id} className="rounded bg-slate-100 px-3 py-2">{M.mon_hoc.ten_mon_hoc}</span>)}
          </div>
        </section>)}
        {!CacKhoiCauHinh.length && <p>Chưa cấu hình môn cho khối này.</p>}
      </div> : <form aria-label={TieuDe[ChucNang]} onSubmit={E => { void Luu(E); }} className="text-sm">
        <fieldset disabled={DangLuu} className="grid gap-4 sm:grid-cols-2">
          {ChucNang === 'tao_mon' && <>
            <label>Mã môn học<input aria-label="Mã môn học" value={MaMonHoc} onChange={E => SetMaMonHoc(E.target.value.toUpperCase())} placeholder="VD: TOAN, TV, TA" required className={O} /></label>
            <label>Tên môn học<input aria-label="Tên môn học" value={TenMonHoc} onChange={E => SetTenMonHoc(E.target.value)} placeholder="VD: Toán, Tiếng Việt, Tiếng Anh" required className={O} /></label>
          </>}
          {ChucNang === 'gan_mon' && <>
            <label>Môn học<select aria-label="Môn học cấu hình" value={MonHocId} onChange={E => SetMonHocId(E.target.value)} required className={O}>
              <option value="">Chọn môn học</option>{MonHoc.map(M => <option key={M.id} value={M.id}>{M.ten_mon_hoc}</option>)}
            </select></label>
            <label>Khối áp dụng<select aria-label="Khối áp dụng" value={KhoiId} onChange={E => SetKhoiId(E.target.value)} required className={O}>
              <option value="">Chọn khối</option>{Khoi.map(K => <option key={K.id} value={K.id}>{K.ten_khoi}</option>)}
            </select></label>
            <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" checked={MacDinhGvcn} onChange={E => SetMacDinhGvcn(E.target.checked)} />Môn mặc định do GVCN phụ trách</label>
          </>}
          {ChucNang === 'phan_cong' && <>
            <label>Giáo viên<select aria-label="Giáo viên phân công" value={GiaoVienId} onChange={E => SetGiaoVienId(E.target.value)} required className={O}>
              <option value="">Chọn giáo viên</option>{GiaoVien.map(G => <option key={G.id} value={G.id}>{G.ma_giao_vien} - {G.ho_ten}</option>)}
            </select></label>
            <label>Lớp học<select aria-label="Lớp phân công" value={LopHocId} onChange={E => { SetLopHocId(E.target.value); SetMonPhanCongId(''); }} required className={O}>
              <option value="">Chọn lớp học</option>{LopHoc.map(L => <option key={L.id} value={L.id}>{L.nam_hoc.ten_nam_hoc} - {L.khoi.ten_khoi} - {L.ten_lop}</option>)}
            </select></label>
            <label>Loại phân công<select aria-label="Loại phân công" value={LoaiPhanCong} onChange={E => { SetLoaiPhanCong(E.target.value); SetMonPhanCongId(''); }} className={O}>
              <option value="GVCN_CHINH">Giáo viên chủ nhiệm chính</option><option value="GVBM">Giáo viên bộ môn</option><option value="GVCN">GVCN dạy môn bổ sung</option>
            </select></label>
            {LoaiPhanCong !== 'GVCN_CHINH' && <label>Môn được phân công<select aria-label="Môn được phân công" value={MonPhanCongId} onChange={E => SetMonPhanCongId(E.target.value)} required className={O}>
              <option value="">Chọn môn đã cấu hình cho khối của lớp</option>{MonDuocPhanCong.map(M => <option key={M.id} value={M.id}>{M.ten_mon_hoc}</option>)}
            </select></label>}
            <label>Ngày bắt đầu phân công<input aria-label="Ngày bắt đầu phân công" type="date" value={NgayBatDau} onChange={E => SetNgayBatDau(E.target.value)} required className={O} /></label>
          </>}
        </fieldset>
        <div className="mt-5 flex justify-end border-t pt-4"><button type="submit" disabled={DangLuu} className={Nut}>{DangLuu ? 'Đang lưu...' : ChucNang === 'phan_cong' ? 'Phân công' : ChucNang === 'tao_mon' ? 'Tạo môn' : 'Lưu cấu hình'}</button></div>
      </form>}
    </HopThoai>}
  </div>;
}
