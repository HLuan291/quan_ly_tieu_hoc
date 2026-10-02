import {
  Navigate,
  Route,
  Routes,
} from 'react-router';

import BaoVeRoute
  from './auth/bao_ve_route';

import MainLayout
  from './layouts/main_layout';

import DangNhapPage
  from './pages/dang_nhap_page';

import DoiMatKhauPage
  from './pages/doi_mat_khau_page';

import DashboardPage
  from './pages/dashboard_page';

import GiaoVienPage
  from './pages/giao_vien_page';

import KhongCoQuyenPage
  from './pages/khong_co_quyen_page';

function TrangTam({
  ten,
}: {
  ten: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">
        {ten}
      </h1>

      <p className="mt-2 text-slate-500">
        Màn hình đang được hoàn thiện.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/dang_nhap"
        element={
          <DangNhapPage />
        }
      />

      <Route
        element={
          <BaoVeRoute />
        }
      >
        <Route
          path="/doi_mat_khau"
          element={
            <DoiMatKhauPage />
          }
        />

        <Route
          path="/khong_co_quyen"
          element={
            <KhongCoQuyenPage />
          }
        />

        <Route
          element={
            <MainLayout />
          }
        >
          <Route
            path="/dashboard"
            element={
              <DashboardPage />
            }
          />

          <Route
            path="/giao_vien"
            element={
              <GiaoVienPage />
            }
          />

          <Route
            path="/hoc_sinh"
            element={
              <TrangTam ten="Quản lý học sinh" />
            }
          />

          <Route
            path="/lop_hoc"
            element={
              <TrangTam ten="Tổ chức lớp học" />
            }
          />

          <Route
            path="/phan_cong"
            element={
              <TrangTam ten="Phân công giảng dạy" />
            }
          />

          <Route
            path="/diem_danh"
            element={
              <TrangTam ten="Điểm danh" />
            }
          />

          <Route
            path="/don_xin_nghi"
            element={
              <TrangTam ten="Đơn xin nghỉ" />
            }
          />

          <Route
            path="/danh_gia"
            element={
              <TrangTam ten="Đánh giá học tập" />
            }
          />

          <Route
            path="/con_cua_toi"
            element={
              <TrangTam ten="Con của tôi" />
            }
          />
        </Route>
      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}
