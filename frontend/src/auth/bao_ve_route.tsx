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
  VaiTroChoPhep?: VaiTro[];
}

export default function BaoVeRoute({
  VaiTroChoPhep,
}: Props) {
  const Location =
    useLocation();

  if (!DaDangNhap()) {
    return (
      <Navigate
        to="/dang_nhap"
        replace
      />
    );
  }

  const NguoiDung =
    DocJwt();

  if (!NguoiDung) {
    return (
      <Navigate
        to="/dang_nhap"
        replace
      />
    );
  }

  if (
    NguoiDung.phai_doi_mat_khau &&
    Location.pathname !==
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
    VaiTroChoPhep &&
    !VaiTroChoPhep.includes(
      NguoiDung.vai_tro,
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
