import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { LayNgayNghiepVu } from './ngay_nghiep_vu';

export async function LayPhamViGiaoVien(Prisma: PrismaService, DieuKien: { id: number } | { tai_khoan_id: number }) {
  const GV = await Prisma.giao_vien.findUnique({ where: DieuKien });
  if (!GV || GV.trang_thai !== 'HOAT_DONG') throw new ForbiddenException('Không tìm thấy hồ sơ giáo viên đang hoạt động');
  const HomNay = LayNgayNghiepVu();
  const PC = await Prisma.phan_cong_giao_vien.findMany({
    where: { giao_vien_id: GV.id, ngay_bat_dau: { lte: HomNay },
      OR: [{ ngay_ket_thuc: null }, { ngay_ket_thuc: { gte: HomNay } }] },
    include: { lop_hoc: { include: { nam_hoc: true, khoi: true } } },
    orderBy: [{ ngay_bat_dau: 'desc' }, { lop_hoc_id: 'asc' }],
  });
  const ChuNhiem = PC.filter(P => P.loai_phan_cong === 'GVCN' && P.mon_hoc_id === null);
  const IdChuNhiem = [...new Set(ChuNhiem.map(P => P.lop_hoc_id))];
  if (IdChuNhiem.length > 1) throw new ConflictException('Giáo viên đang chủ nhiệm nhiều lớp. Admin cần kết thúc phân công cũ để xác định lớp chủ nhiệm.');
  const CheDo = IdChuNhiem.length ? 'GVCN' : PC.length ? 'GVBM' : 'CHUA_PHAN_CONG';
  const PhanCong = IdChuNhiem.length ? PC.filter(P => P.lop_hoc_id === IdChuNhiem[0]) : PC;
  const Lop = [...new Map(PhanCong.map(P => [P.lop_hoc_id, P.lop_hoc])).values()]
    .sort((A, B) => B.nam_hoc_id - A.nam_hoc_id || A.ten_lop.localeCompare(B.ten_lop, 'vi'));
  return { che_do: CheDo, lop_chu_nhiem_id: IdChuNhiem[0] ?? null, lop_hoc: Lop,
    phan_cong: PhanCong, giao_vien: { id: GV.id, ho_ten: GV.ho_ten } };
}

export async function KiemTraLopTrongPhamVi(Prisma: PrismaService, GiaoVienId: number, LopHocId: number) {
  const PhamVi = await LayPhamViGiaoVien(Prisma, { id: GiaoVienId });
  if (!PhamVi.lop_hoc.some(L => L.id === LopHocId)) throw new ForbiddenException('Lớp không thuộc phạm vi của giáo viên');
  return PhamVi;
}
