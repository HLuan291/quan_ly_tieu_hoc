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

export function layToken() {
  return localStorage.getItem(
    'access_token',
  );
}

export function luuToken(
  token: string,
) {
  localStorage.setItem(
    'access_token',
    token,
  );
}

export function dangXuat() {
  localStorage.removeItem(
    'access_token',
  );
}

export function docJwt():
  JwtPayload | null {

  const token =
    layToken();

  if (!token) {
    return null;
  }

  try {
    const phanPayload =
      token.split('.')[1];

    if (!phanPayload) {
      return null;
    }

    let base64 =
      phanPayload
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    while (
      base64.length % 4 !== 0
    ) {
      base64 += '=';
    }

    const json =
      decodeURIComponent(
        atob(base64)
          .split('')
          .map(
            (kyTu) =>
              `%${(
                '00' +
                kyTu
                  .charCodeAt(0)
                  .toString(16)
              ).slice(-2)}`,
          )
          .join(''),
      );

    const payload =
      JSON.parse(
        json,
      ) as Partial<JwtPayload>;

    if (
      !Number.isInteger(
        payload.sub,
      ) ||
      ![
        'ADMIN',
        'GIAO_VIEN',
        'PHU_HUYNH',
      ].includes(
        payload.vai_tro ?? '',
      ) ||
      typeof
        payload.phai_doi_mat_khau !==
        'boolean'
    ) {
      return null;
    }

    return payload as JwtPayload;

  } catch {
    return null;
  }
}

export function daDangNhap() {
  const nguoiDung =
    docJwt();

  if (!nguoiDung) {
    return false;
  }

  if (
    nguoiDung.exp &&
    nguoiDung.exp * 1000 <
      Date.now()
  ) {
    dangXuat();

    return false;
  }

  return true;
}
