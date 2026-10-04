import type { LopHoc } from '../pages/hoc_sinh_types';
export default function NhanLopGiaoVien({ Lop, CheDo }: { Lop?: LopHoc; CheDo: string }) {
  return <div role="status" aria-label="Lớp gắn với giáo viên" className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-900">
    <strong>{CheDo === 'GVCN' ? 'Lớp chủ nhiệm' : 'Lớp được phân công'}{Lop ? ': ' + Lop.ten_lop : ''}</strong>
    {Lop && <><span>{Lop.khoi.ten_khoi}</span><span>Năm học {Lop.nam_hoc.ten_nam_hoc}</span></>}
    {!Lop && <span>{CheDo === 'GVBM' ? 'Tất cả lớp đang được phân công.' : 'Chưa được phân công lớp. Vui lòng liên hệ Admin.'}</span>}
  </div>;
}
