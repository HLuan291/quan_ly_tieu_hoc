import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router';

import {
  DaDangNhap,
  DocJwt,
  type VaiTro,
} from './auth';

interface Props {
  vaiTroChoPhep?: VaiTro[];
}

export default function BaoVeRoute({
  vaiTroChoPhep,
}: Props) {
  const location =
    useLocation();

  if (!DaDangNhap()) {
    return (
      <Navigate
        to="/dang_nhap"
        replace
      />
    );
  }

  const nguoiDung =
    DocJwt();

  if (!nguoiDung) {
    return (
      <Navigate
        to="/dang_nhap"
        replace
      />
    );
  }

  if (
    nguoiDung.phai_doi_mat_khau &&
    location.pathname !==
      '/doi_mat_khau'
  ) {
    return (
      <Navigate
        to="/doi_mat_khau"
        replace
      />
    );
  }

  if (
    vaiTroChoPhep &&
    !vaiTroChoPhep.includes(
      nguoiDung.vai_tro,
    )
  ) {
    return (
      <Navigate
        to="/khong_co_quyen"
        replace
      />
    );
  }

  return <Outlet />;
}
