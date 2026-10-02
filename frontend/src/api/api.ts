import axios from 'axios';

const Api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

Api.interceptors.request.use(
  (Config) => {
    const Token =
      localStorage.getItem(
        'access_token',
      );

    if (Token) {
      Config.headers.Authorization =
        `Bearer ${Token}`;
    }

    return Config;
  },
);

Api.interceptors.response.use(
  (Response) =>
    Response,

  (Error) => {
    if (
      Error.response?.status ===
      401 && Error.config?.url !== '/auth/login'
    ) {
      localStorage.removeItem(
        'access_token',
      );

      window.location.href =
        '/dang_nhap';
    }

    const Message =
      Error.response?.data
        ?.message;

    if (
      Error.response?.status ===
        403 &&
      Message ===
        'Bạn phải đổi mật khẩu trước khi sử dụng hệ thống' &&
      window.location.pathname !==
        '/doi_mat_khau'
    ) {
      window.location.href =
        '/doi_mat_khau';
    }

    return Promise.reject(
      Error,
    );
  },
);

export default Api;
