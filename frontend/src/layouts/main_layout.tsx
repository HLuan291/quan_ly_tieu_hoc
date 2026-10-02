import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router';

import {
  DangXuat,
  DocJwt,
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
      VaiTro: [
        'ADMIN',
        'GIAO_VIEN',
      ],
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
    <div
      className="
        flex
        min-h-screen
        bg-slate-100
      "
    >
      <aside
        className="
          w-64
          bg-slate-900
          text-white
        "
      >
        <div
          className="
            border-b
            border-slate-700
            p-6
          "
        >
          <h1 className="text-lg font-bold">
            QL Học Sinh
          </h1>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            {NguoiDung?.vai_tro}
          </p>
        </div>

        <nav className="p-3">
          {MenuHienThi.map(
            (Item) => (
              <NavLink
                key={
                  Item.DuongDan
                }
                to={
                  Item.DuongDan
                }
                className={({ isActive: IsActive }) =>
                  `
                    mb-1
                    block
                    rounded-lg
                    px-4
                    py-3
                    text-sm
                    ${
                      IsActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }
                  `
                }
              >
                {Item.Ten}
              </NavLink>
            ),
          )}
        </nav>
      </aside>

      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
        "
      >
        <header
          className="
            flex
            h-16
            items-center
            justify-between
            border-b
            bg-white
            px-6
          "
        >
          <span
            className="
              font-semibold
              text-slate-700
            "
          >
            Hệ thống quản lý học sinh tiểu học
          </span>

          <button
            onClick={
              XuLyDangXuat
            }
            className="
              rounded-lg
              border
              border-slate-300
              px-4
              py-2
              text-sm
              hover:bg-slate-100
            "
          >
            Đăng xuất
          </button>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}