import {
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import {
  useNavigate,
} from 'react-router';

import Api from '../api/api';

import {
  DangXuat,
  LuuToken,
} from '../auth/auth';

import {
  LayThongBaoLoi,
} from '../utils/loi_api';

interface DoiMatKhauResponse {
  access_token: string;
}

export default function DoiMatKhauPage() {
  const Navigate =
    useNavigate();

  const [
    MatKhauCu,
    SetMatKhauCu,
  ] = useState('');

  const [
    MatKhauMoi,
    SetMatKhauMoi,
  ] = useState('');

  const [
    XacNhan,
    SetXacNhan,
  ] = useState('');

  const [
    Loi,
    SetLoi,
  ] = useState('');

  const [
    DangGui,
    SetDangGui,
  ] = useState(false);

  async function XuLyDoiMatKhau(
    Event: FormEvent,
  ) {
    Event.preventDefault();
    SetLoi('');

    if (
      MatKhauMoi.length < 8
    ) {
      SetLoi(
        'Mật khẩu mới phải có ít nhất 8 ký tự',
      );
      return;
    }

    if (
      MatKhauMoi !==
      XacNhan
    ) {
      SetLoi(
        'Mật khẩu xác nhận không khớp',
      );
      return;
    }

    try {
      SetDangGui(true);

      const Response =
        await Api.post<DoiMatKhauResponse>(
          '/auth/doi-mat-khau',
          {
            mat_khau_cu:
              MatKhauCu,

            mat_khau_moi:
              MatKhauMoi,
          },
        );

      LuuToken(
        Response.data.access_token,
      );

      Navigate(
        '/dashboard',
        {
          replace: true,
        },
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    } finally {
      SetDangGui(false);
    }
  }

  function XuLyDangXuat() {
    DangXuat();

    Navigate(
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
            XuLyDoiMatKhau
          }
          className="mt-6 space-y-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mật khẩu hiện tại
            </label>
          <input
            type="password"
            value={
              MatKhauCu
            }
            onChange={
              (Event) =>
                SetMatKhauCu(
                  Event.target.value,
                )
            }
            placeholder="Nhập mật khẩu hiện tại"
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
            required
          />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mật khẩu mới
            </label>
          <input
            type="password"
            value={
              MatKhauMoi
            }
            onChange={
              (Event) =>
                SetMatKhauMoi(
                  Event.target.value,
                )
            }
            minLength={8}
            placeholder="Ít nhất 8 ký tự"
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
            required
          />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Xác nhận mật khẩu mới
            </label>
          <input
            type="password"
            value={
              XacNhan
            }
            onChange={
              (Event) =>
                SetXacNhan(
                  Event.target.value,
                )
            }
            minLength={8}
            placeholder="Nhập lại đúng mật khẩu mới"
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
            required
          />
          </div>

          {Loi && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {Loi}
            </div>
          )}

          <button
            type="submit"
            disabled={
              DangGui
            }
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {DangGui
              ? 'Đang đổi mật khẩu...'
              : 'Đổi mật khẩu'}
          </button>

          <button
            type="button"
            onClick={
              XuLyDangXuat
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
