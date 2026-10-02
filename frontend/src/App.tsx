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

import HocSinhPage
  from './pages/hoc_sinh_page';

import LopHocPage
  from './pages/lop_hoc_page';

import PhanCongPage
  from './pages/phan_cong_page';

import DiemDanhPage
  from './pages/diem_danh_page';

import DonXinNghiPage
  from './pages/don_xin_nghi_page';

import DanhGiaPage
  from './pages/danh_gia_page';

import ConCuaToiPage
  from './pages/con_cua_toi_page';

import KhongCoQuyenPage
  from './pages/khong_co_quyen_page';

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
              <HocSinhPage />
            }
          />

          <Route
            path="/lop_hoc"
            element={
              <LopHocPage />
            }
          />

          <Route
            path="/phan_cong"
            element={
              <PhanCongPage />
            }
          />

          <Route
            path="/diem_danh"
            element={
              <DiemDanhPage />
            }
          />

          <Route
            path="/don_xin_nghi"
            element={
              <DonXinNghiPage />
            }
          />

          <Route
            path="/danh_gia"
            element={
              <DanhGiaPage />
            }
          />

          <Route
            path="/con_cua_toi"
            element={
              <ConCuaToiPage />
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
