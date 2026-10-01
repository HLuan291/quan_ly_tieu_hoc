import {
  FormEvent,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router';

import api from '../api/api';

import {
  dangXuat,
  luuToken,
} from '../auth/auth';

interface DoiMatKhauResponse {
  access_token: string;
}

export default function DoiMatKhauPage() {
  const navigate =
    useNavigate();

  const [
    matKhauCu,
    setMatKhauCu,
  ] = useState('');

  const [
    matKhauMoi,
    setMatKhauMoi,
  ] = useState('');

  const [
    xacNhan,
    setXacNhan,
  ] = useState('');

  const [
    loi,
    setLoi,
  ] = useState('');

  const [
    dangGui,
    setDangGui,
  ] = useState(false);

  async function xuLyDoiMatKhau(
    event: FormEvent,
  ) {
    event.preventDefault();
    setLoi('');

    if (
      matKhauMoi.length < 8
    ) {
      setLoi(
        'Mật khẩu mới phải có ít nhất 8 ký tự',
      );
      return;
    }

    if (
      matKhauMoi !==
      xacNhan
    ) {
      setLoi(
        'Mật khẩu xác nhận không khớp',
      );
      return;
    }

    try {
      setDangGui(true);

      const response =
        await api.post<DoiMatKhauResponse>(
          '/auth/doi-mat-khau',
          {
            mat_khau_cu:
              matKhauCu,

            mat_khau_moi:
              matKhauMoi,
          },
        );

      luuToken(
        response.data.access_token,
      );

      navigate(
        '/dashboard',
        {
          replace: true,
        },
      );
    } catch {
      setLoi(
        'Đổi mật khẩu thất bại',
      );
    } finally {
      setDangGui(false);
    }
  }

  function xuLyDangXuat() {
    dangXuat();

    navigate(
      '/dang_nhap',
      {
        replace: true,
      },
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-800">
          Đổi mật khẩu
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Bạn cần đổi mật khẩu trước khi sử dụng hệ thống.
        </p>

        <form
          onSubmit={
            xuLyDoiMatKhau
          }
          className="mt-6 space-y-5"
        >
          <input
            type="password"
            value={
              matKhauCu
            }
            onChange={
              (event) =>
                setMatKhauCu(
                  event.target.value,
                )
            }
            placeholder="Mật khẩu hiện tại"
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
            required
          />

          <input
            type="password"
            value={
              matKhauMoi
            }
            onChange={
              (event) =>
                setMatKhauMoi(
                  event.target.value,
                )
            }
            placeholder="Mật khẩu mới"
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
            required
          />

          <input
            type="password"
            value={
              xacNhan
            }
            onChange={
              (event) =>
                setXacNhan(
                  event.target.value,
                )
            }
            placeholder="Xác nhận mật khẩu mới"
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
            required
          />

          {loi && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {loi}
            </div>
          )}

          <button
            type="submit"
            disabled={
              dangGui
            }
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {dangGui
              ? 'Đang đổi mật khẩu...'
              : 'Đổi mật khẩu'}
          </button>

          <button
            type="button"
            onClick={
              xuLyDangXuat
            }
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          >
            Đăng xuất
          </button>
        </form>
      </div>
    </div>
  );
}
