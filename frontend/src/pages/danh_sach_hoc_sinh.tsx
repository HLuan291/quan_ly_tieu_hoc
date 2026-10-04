import { useCallback, useEffect, useRef, useState } from 'react';
import Api from '../api/api';
import { LayThongBaoLoi } from '../utils/loi_api';
import type { DanhMucLop, HocSinhTomTat, LopHoc } from './hoc_sinh_types';
import NhanLopGiaoVien from '../components/nhan_lop_giao_vien';
import HoSoHocSinhChiTiet from './ho_so_hoc_sinh_chi_tiet';

const O = 'w-full rounded border border-slate-300 px-3 py-2';
export default function DanhSachHocSinh({ LanTai, LaAdmin }: { LanTai: number; LaAdmin: boolean }) {
  const [CheDo, SetCheDo] = useState<DanhMucLop['che_do']>(LaAdmin ? 'ADMIN' : 'CHUA_PHAN_CONG');
  const [DaTaiPhamVi, SetDaTaiPhamVi] = useState(false);
  const [Lop, SetLop] = useState<LopHoc[]>([]);
  const [DanhSach, SetDanhSach] = useState<HocSinhTomTat[]>([]);
  const [Nam, SetNam] = useState('');
  const [Khoi, SetKhoi] = useState('');
  const [LopId, SetLopId] = useState('');
  const [TuKhoa, SetTuKhoa] = useState('');
  const [TrangThai, SetTrangThai] = useState('');
  const [Trang, SetTrang] = useState(1);
  const [SoDong, SetSoDong] = useState(25);
  const [Id, SetId] = useState<number | null>(null);
  const [Loi, SetLoi] = useState('');
  const [DangTai, SetDangTai] = useState(false);
  const [DangXoa, SetDangXoa] = useState(false);
  const LanYeuCau = useRef(0);
  const HuyYeuCau = useCallback(() => { LanYeuCau.current++; }, []);
  useEffect(() => {
    let Huy = false;
    void Api.get<DanhMucLop>('/ho_so_hoc_sinh/danh_muc').then(R => {
      if (!Huy) {
        SetLop(R.data.lop_hoc); SetCheDo(R.data.che_do);
        if (!LaAdmin) {
          const L = R.data.lop_hoc.find(L => L.id === R.data.lop_chu_nhiem_id) ?? R.data.lop_hoc[0];
          SetLopId(String(L?.id ?? '')); SetNam(String(L?.nam_hoc_id ?? '')); SetKhoi(String(L?.khoi_id ?? ''));
        }
        SetDaTaiPhamVi(true);
      }
    }).catch(E => { if (!Huy) SetLoi(LayThongBaoLoi(E)); });
    return () => { Huy = true; };
  }, [LaAdmin]);
  const TaiDanhSach = useCallback(async () => {
    const Lan = ++LanYeuCau.current;
    if (!DaTaiPhamVi || (!LaAdmin && !Lop.length)) return;
    SetDangTai(true);
    SetLoi('');
    try {
      const R = await Api.get<{ danh_sach: HocSinhTomTat[] }>('/ho_so_hoc_sinh/hoc_sinh', {
        params: { tu_khoa: TuKhoa || undefined, trang_thai: TrangThai || undefined,
          nam_hoc_id: Nam || undefined, khoi_id: Khoi || undefined, lop_hoc_id: LopId || undefined },
      });
      if (Lan === LanYeuCau.current) { SetDanhSach(R.data.danh_sach); SetTrang(1); }
    } catch (E) { if (Lan === LanYeuCau.current) { SetDanhSach([]); SetLoi(LayThongBaoLoi(E)); } }
    finally { if (Lan === LanYeuCau.current) SetDangTai(false); }
  }, [TuKhoa, TrangThai, Nam, Khoi, LopId, DaTaiPhamVi, LaAdmin, Lop.length]);
  useEffect(() => {
    const Timer = setTimeout(() => { void TaiDanhSach(); }, 150);
    return () => { clearTimeout(Timer); HuyYeuCau(); };
  }, [TaiDanhSach, LanTai, HuyYeuCau]);
  async function Xoa(HS: HocSinhTomTat) {
    if (!window.confirm('Xóa ' + HS.ho_ten + ' khỏi danh sách sử dụng? Lịch sử học tập và điểm danh được lưu giữ.')) return;
    SetDangXoa(true);
    try {
      await Api.delete(`/ho_so_hoc_sinh/hoc_sinh/${HS.id}`);
      if (Id === HS.id) SetId(null);
      await TaiDanhSach();
    } catch (E) { SetLoi(LayThongBaoLoi(E)); }
    finally { SetDangXoa(false); }
  }
  const NamHoc = [...new Map(Lop.map(L => [L.nam_hoc.id, L.nam_hoc])).values()];
  const KhoiHoc = [...new Map(Lop.filter(L => !LaAdmin || !Nam || String(L.nam_hoc_id) === Nam).map(L => [L.khoi.id, L.khoi])).values()].sort((A, B) => A.so_khoi - B.so_khoi);
  const CacLop = Lop.filter(L => (!LaAdmin || !Nam || String(L.nam_hoc_id) === Nam) && (!Khoi || String(L.khoi_id) === Khoi));
  const SoTrang = Math.max(1, Math.ceil(DanhSach.length / SoDong));
  return <section className="mt-6 min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    {!LaAdmin && <NhanLopGiaoVien Lop={Lop.find(L => String(L.id) === LopId)} CheDo={CheDo} />}
    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {LaAdmin && <label className="text-sm font-medium">Năm học<select aria-label="Năm học học sinh" className={O} value={Nam} onChange={E => { SetNam(E.target.value); SetKhoi(''); SetLopId(''); }}><option value="">Tất cả năm học</option>{NamHoc.map(N => <option key={N.id} value={N.id}>{N.ten_nam_hoc}</option>)}</select></label>}
      {(LaAdmin || CheDo === 'GVBM') && <><label className="text-sm font-medium">Khối<select aria-label="Khối học sinh" className={O} value={Khoi} onChange={E => { SetKhoi(E.target.value); const L = Lop.find(L => !E.target.value || String(L.khoi_id) === E.target.value); SetLopId(LaAdmin ? '' : String(L?.id ?? '')); if (!LaAdmin) SetNam(String(L?.nam_hoc_id ?? '')); }}><option value="">Tất cả khối</option>{KhoiHoc.map(K => <option key={K.id} value={K.id}>{K.ten_khoi}</option>)}</select></label>
      <label className="text-sm font-medium">Lớp<select aria-label="Lớp học sinh" className={O} value={LopId} onChange={E => { SetLopId(E.target.value); if (!LaAdmin) SetNam(String(Lop.find(L => String(L.id) === E.target.value)?.nam_hoc_id ?? '')); }}><option value="">{LaAdmin ? 'Toàn trường' : 'Tất cả lớp được phân công'}</option>{CacLop.map(L => <option key={L.id} value={L.id}>{L.ten_lop} · {L.nam_hoc.ten_nam_hoc}</option>)}</select></label></>}
      <label className="text-sm font-medium">Trạng thái<select aria-label="Trạng thái học sinh" className={O} value={TrangThai} onChange={E => SetTrangThai(E.target.value)}><option value="">Tất cả hồ sơ đang sử dụng</option><option value="DANG_HOC">Đang học</option><option value="CHUYEN_TRUONG">Chuyển trường</option><option value="THOI_HOC">Thôi học</option></select></label>
    </div>
    <input aria-label="Tìm học sinh" value={TuKhoa} onChange={E => SetTuKhoa(E.target.value)} placeholder="Tìm theo mã, họ tên hoặc số điện thoại" className={O + ' mt-4 sm:max-w-lg'} />
    <p className="my-3 text-sm text-slate-600">{LaAdmin ? 'Danh sách trong phạm vi toàn trường.' : 'Chỉ hiển thị học sinh thuộc lớp đang được phân công.'} Chọn họ tên để xem hoặc sửa hồ sơ.</p>
    {Loi && <p role="alert" className="mb-3 rounded bg-red-50 p-3 text-red-700">{Loi}</p>}
    <div className="max-h-[600px] overflow-auto rounded border border-slate-200" aria-busy={DangTai}>
      <table className="min-w-[950px] w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-sky-700 text-left text-white"><tr>{['STT', 'Mã học sinh', 'Họ tên', 'Ngày sinh', 'Giới tính', 'Dân tộc', 'Lớp', 'SĐT liên hệ', 'Trạng thái', 'Thao tác'].map(T => <th key={T} className="border-r border-sky-600 px-3 py-3">{T}</th>)}</tr></thead>
        <tbody>{DanhSach.slice((Trang - 1) * SoDong, Trang * SoDong).map((HS, I) => <tr key={HS.id} className="border-b odd:bg-white even:bg-slate-50">
          <td className="px-3 py-3">{(Trang - 1) * SoDong + I + 1}</td><td className="px-3 py-3">{HS.ma_hoc_sinh}</td>
          <td className="px-3 py-3"><button className="text-left font-semibold text-blue-700 hover:underline" onClick={() => SetId(HS.id)}>{HS.ho_ten}</button></td>
          <td className="whitespace-nowrap px-3 py-3">{new Date(HS.ngay_sinh).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}</td>
          <td className="px-3 py-3">{HS.gioi_tinh === 'NU' ? 'Nữ' : 'Nam'}</td><td className="px-3 py-3">{HS.dan_toc}</td>
          <td className="px-3 py-3">{HS.xep_lop[0]?.lop_hoc.ten_lop ?? 'Chưa xếp lớp'}</td><td className="px-3 py-3">{HS.so_dien_thoai_lien_he}</td>
          <td className="px-3 py-3">{HS.trang_thai}</td><td className="whitespace-nowrap px-3 py-3"><button className="text-blue-700 hover:underline" onClick={() => SetId(HS.id)}>Xem / sửa</button>
          {LaAdmin && <button disabled={DangXoa || DangTai} className="ml-3 text-red-700 disabled:opacity-50" onClick={() => { void Xoa(HS); }}>Xóa</button>}</td>
        </tr>)}</tbody>
      </table>
      {DangTai && <p role="status" className="p-4 text-center">Đang tải danh sách...</p>}
      {!DangTai && !DanhSach.length && <p className="p-4 text-center">Không có học sinh.</p>}
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span>{DanhSach.length} học sinh · Trang {Trang}/{SoTrang}</span>
      <div className="flex items-center gap-2"><button aria-label="Trang học sinh trước" disabled={Trang <= 1} onClick={() => SetTrang(T => T - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trước</button><button aria-label="Trang học sinh sau" disabled={Trang >= SoTrang} onClick={() => SetTrang(T => T + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Sau</button>
      <select aria-label="Số học sinh mỗi trang" className="rounded border p-2" value={SoDong} onChange={E => { SetSoDong(Number(E.target.value)); SetTrang(1); }}>{[10, 25, 50, 100].map(N => <option key={N} value={N}>{N} dòng/trang</option>)}</select></div>
    </div>
    {Id !== null && <HoSoHocSinhChiTiet key={Id} Id={Id} LaAdmin={LaAdmin} Dong={() => SetId(null)} CapNhat={() => { void TaiDanhSach(); }} />}
  </section>;
}
