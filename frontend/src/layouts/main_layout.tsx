import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router';

import {
  DangXuat,
  DocJwt,
  LayTenVaiTro,
} from '../auth/auth';

export default function MainLayout() {
  const Navigate =
    useNavigate();

  const NguoiDung =
    DocJwt();

  function XuLyDangXuat() {
    DangXuat();

    Navigate(
      '/dang_nhap',
      {
        replace: true,
      },
    );
  }

  const Menu = [
    {
      Ten: 'Tổng quan',
      DuongDan: '/dashboard',
      VaiTro: [
        'ADMIN',
        'GIAO_VIEN',
        'PHU_HUYNH',
      ],
    },

    {
      Ten: 'Giáo viên',
      DuongDan: '/giao_vien',
      VaiTro: ['ADMIN'],
    },

    {
      Ten: 'Học sinh',
      DuongDan: '/hoc_sinh',
      VaiTro: [
        'ADMIN',
        'GIAO_VIEN',
      ],
    },

    {
      Ten: 'Tổ chức lớp học',
      DuongDan: '/lop_hoc',
      VaiTro: ['ADMIN'],
    },

    {
      Ten: 'Phân công giảng dạy',
      DuongDan: '/phan_cong',
      VaiTro: ['ADMIN'],
    },

    {
      Ten: 'Điểm danh',
      DuongDan: '/diem_danh',
      VaiTro: ['GIAO_VIEN'],
    },

    {
      Ten: 'Đơn xin nghỉ',
      DuongDan: '/don_xin_nghi',
      VaiTro: [
        'GIAO_VIEN',
        'PHU_HUYNH',
      ],
    },

    {
      Ten: 'Đánh giá học tập',
      DuongDan: '/danh_gia',
      VaiTro: [
        'ADMIN',
        'GIAO_VIEN',
      ],
    },

    {
      Ten: 'Con của tôi',
      DuongDan: '/con_cua_toi',
      VaiTro: ['PHU_HUYNH'],
    },
  ];

  const MenuHienThi =
    Menu.filter(
      (Item) =>
        NguoiDung &&
        Item.VaiTro.includes(
          NguoiDung.vai_tro,
        ),
    );

  return (
    <div className="min-h-screen min-w-0 bg-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-sky-600 px-4 py-3 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-white/70 bg-sky-700 text-xl">🎓</span>
          <div><p className="text-base font-bold uppercase tracking-wide">Quản lý giáo dục tiểu học</p><p className="text-xs text-sky-100">Hệ thống quản lý học sinh tiểu học</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm"><span>{LayTenVaiTro(NguoiDung?.vai_tro)}</span><button onClick={XuLyDangXuat} className="rounded border border-white/70 px-3 py-2 hover:bg-sky-700">Đăng xuất</button></div>
      </header>
      <nav aria-label="Menu chức năng" className="flex w-full gap-1 overflow-x-auto border-b border-slate-300 bg-white px-2 py-1">
        {MenuHienThi.map((Item, I) => <NavLink key={Item.DuongDan} to={Item.DuongDan}
          className={({ isActive: IsActive }) => 'shrink-0 whitespace-nowrap rounded px-3 py-3 text-sm font-medium ' + (IsActive ? 'bg-sky-100 text-sky-800' : 'text-slate-700 hover:bg-slate-100')}>
          <span aria-hidden="true" className="mr-2 text-sky-600">{I + 1}.</span>{Item.Ten}
        </NavLink>)}
      </nav>
      <main className="min-w-0 p-3 md:p-5"><Outlet /></main>
    </div>
  );
}
