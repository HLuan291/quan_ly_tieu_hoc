export type VaiTro =
  | 'ADMIN'
  | 'GIAO_VIEN'
  | 'PHU_HUYNH';

export interface JwtPayload {
  sub: number;
  vai_tro: VaiTro;
  phai_doi_mat_khau: boolean;

  iat?: number;
  exp?: number;
}

export function LayToken() {
  return localStorage.getItem(
    'access_token',
  );
}

export function LuuToken(
  Token: string,
) {
  localStorage.setItem(
    'access_token',
    Token,
  );
}

export function DangXuat() {
  localStorage.removeItem(
    'access_token',
  );
}

export function DocJwt():
  JwtPayload | null {

  const Token =
    LayToken();

  if (!Token) {
    return null;
  }

  try {
    const PhanPayload =
      Token.split('.')[1];

    if (!PhanPayload) {
      return null;
    }

    let Base64 =
      PhanPayload
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    while (
      Base64.length % 4 !== 0
    ) {
      Base64 += '=';
    }

    const Json =
      decodeURIComponent(
        atob(Base64)
          .split('')
          .map(
            (KyTu) =>
              `%${(
                '00' +
                KyTu
                  .charCodeAt(0)
                  .toString(16)
              ).slice(-2)}`,
          )
          .join(''),
      );

    const Payload =
      JSON.parse(
        Json,
      ) as Partial<JwtPayload>;

    if (
      !Number.isInteger(
        Payload.sub,
      ) ||
      ![
        'ADMIN',
        'GIAO_VIEN',
        'PHU_HUYNH',
      ].includes(
        Payload.vai_tro ?? '',
      ) ||
      typeof
        Payload.phai_doi_mat_khau !==
        'boolean'
    ) {
      return null;
    }

    return Payload as JwtPayload;

  } catch {
    return null;
  }
}

export function DaDangNhap() {
  const NguoiDung =
    DocJwt();

  if (!NguoiDung) {
    return false;
  }

  if (
    NguoiDung.exp &&
    NguoiDung.exp * 1000 <
      Date.now()
  ) {
    DangXuat();

    return false;
  }

  return true;
}


export function LayTenVaiTro(
  VaiTroNguoiDung: VaiTro | undefined,
) {
  switch (
    VaiTroNguoiDung
  ) {
    case 'ADMIN':
      return 'Quản trị viên';

    case 'GIAO_VIEN':
      return 'Giáo viên';

    case 'PHU_HUYNH':
      return 'Phụ huynh';

    default:
      return 'Không xác định';
  }
}
