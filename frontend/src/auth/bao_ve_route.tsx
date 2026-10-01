import {
  Navigate,
  Outlet,
} from 'react-router';

import {
  daDangNhap,
  docJwt,
  type VaiTro,
} from './auth';

interface Props {
  vaiTroChoPhep?: VaiTro[];
}

export default function BaoVeRoute({
  vaiTroChoPhep,
}: Props) {

  if (!daDangNhap()) {
    return (
      <Navigate
        to="/dang_nhap"
        replace
      />
    );
  }

  const nguoiDung =
    docJwt();

  if (!nguoiDung) {
    return (
      <Navigate
        to="/dang_nhap"
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