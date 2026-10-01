import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router';

import {
  dangXuat,
  docJwt,
} from '../auth/auth';

export default function MainLayout() {
  const navigate =
    useNavigate();

  const nguoiDung =
    docJwt();

  function xuLyDangXuat() {
    dangXuat();

    navigate(
      '/dang_nhap',
      {
        replace: true,
      },
    );
  }

  const menu = [
    {
      ten: 'Tổng quan',
      duong_dan: '/dashboard',
      vai_tro: [
        'ADMIN',
        'GIAO_VIEN',
        'PHU_HUYNH',
      ],
    },

    {
      ten: 'Giáo viên',
      duong_dan: '/giao_vien',
      vai_tro: ['ADMIN'],
    },

    {
      ten: 'Học sinh',
      duong_dan: '/hoc_sinh',
      vai_tro: [
        'ADMIN',
        'GIAO_VIEN',
      ],
    },

    {
      ten: 'Tổ chức lớp học',
      duong_dan: '/lop_hoc',
      vai_tro: ['ADMIN'],
    },

    {
      ten: 'Phân công giảng dạy',
      duong_dan: '/phan_cong',
      vai_tro: [
        'ADMIN',
        'GIAO_VIEN',
      ],
    },

    {
      ten: 'Điểm danh',
      duong_dan: '/diem_danh',
      vai_tro: ['GIAO_VIEN'],
    },

    {
      ten: 'Đơn xin nghỉ',
      duong_dan: '/don_xin_nghi',
      vai_tro: [
        'GIAO_VIEN',
        'PHU_HUYNH',
      ],
    },

    {
      ten: 'Đánh giá học tập',
      duong_dan: '/danh_gia',
      vai_tro: [
        'ADMIN',
        'GIAO_VIEN',
      ],
    },

    {
      ten: 'Con của tôi',
      duong_dan: '/con_cua_toi',
      vai_tro: ['PHU_HUYNH'],
    },
  ];

  const menuHienThi =
    menu.filter(
      (item) =>
        nguoiDung &&
        item.vai_tro.includes(
          nguoiDung.vai_tro,
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
            {nguoiDung?.vai_tro}
          </p>
        </div>

        <nav className="p-3">
          {menuHienThi.map(
            (item) => (
              <NavLink
                key={
                  item.duong_dan
                }
                to={
                  item.duong_dan
                }
                className={({
                  isActive,
                }) =>
                  `
                    mb-1
                    block
                    rounded-lg
                    px-4
                    py-3
                    text-sm
                    ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }
                  `
                }
              >
                {item.ten}
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
              xuLyDangXuat
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