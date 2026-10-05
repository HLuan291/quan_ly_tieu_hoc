import {
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router';

import {
  useForm,
} from 'react-hook-form';

import {
  z,
} from 'zod';

import {
  zodResolver,
} from '@hookform/resolvers/zod';

import { LayThongBaoLoi } from '../utils/loi_api';

import Api from '../api/api';

import {
  LuuToken,
} from '../auth/auth';

const Schema = z.object({
  ten_dang_nhap_hoac_so_dien_thoai: z
    .string()
    .min(
      1,
      'Vui lòng nhập tài khoản hoặc số điện thoại',
    ),

  mat_khau: z
    .string()
    .min(
      1,
      'Vui lòng nhập mật khẩu',
    ),
});

type FormData =
  z.infer<typeof Schema>;

interface LoginResponse {
  access_token: string;

  tai_khoan: {
    phai_doi_mat_khau: boolean;
  };
}

export default function DangNhapPage() {
  const Navigate =
    useNavigate();

  const [
    Loi,
    SetLoi,
  ] = useState('');

  const [
    DangGui,
    SetDangGui,
  ] = useState(false);

  const {
    register: Register,
    handleSubmit: HandleSubmit,
    formState: {
      errors: Errors,
    },
  } = useForm<FormData>({
    resolver:
      zodResolver(Schema),
  });

  async function DangNhap(
    DuLieu: FormData,
  ) {
    try {
      SetDangGui(true);
      SetLoi('');

      const Response =
        await Api.post<LoginResponse>(
          '/auth/login',
          DuLieu,
        );

      LuuToken(
        Response.data.access_token,
      );

      Navigate(
        Response.data.tai_khoan
          .phai_doi_mat_khau
          ? '/doi_mat_khau'
          : '/dashboard',
        {
          replace: true,
        },
      );
    } catch (Error: unknown) {
      SetLoi(LayThongBaoLoi(Error));
    } finally {
      SetDangGui(false);
    }
  }

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-slate-100
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          bg-white
          p-8
          shadow-lg
        "
      >
        <div
          className="
            mb-8
            text-center
          "
        >
          <h1
            className="
              text-2xl
              font-bold
              text-slate-800
            "
          >
            Quản lý học sinh tiểu học
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
            "
          >
            Đăng nhập vào hệ thống
          </p>
        </div>

        <form
          onSubmit={
            HandleSubmit(
              DangNhap,
            )
          }
          className="
            space-y-5
          "
        >
          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-700
              "
            >
              Tài khoản / Số điện thoại
            </label>

            <input
              {...Register(
                'ten_dang_nhap_hoac_so_dien_thoai',
              )}
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                px-4
                py-3
                outline-none
                focus:border-blue-500
              "
              placeholder="Nhập tài khoản hoặc số điện thoại"
            />

            {Errors
              .ten_dang_nhap_hoac_so_dien_thoai && (
              <p
                className="
                  mt-1
                  text-sm
                  text-red-500
                "
              >
                {
                  Errors
                    .ten_dang_nhap_hoac_so_dien_thoai
                    .message
                }
              </p>
            )}
          </div>

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-700
              "
            >
              Mật khẩu
            </label>

            <input
              {...Register(
                'mat_khau',
              )}
              type="password"
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                px-4
                py-3
                outline-none
                focus:border-blue-500
              "
              placeholder="Nhập mật khẩu"
            />

            {Errors.mat_khau && (
              <p
                className="
                  mt-1
                  text-sm
                  text-red-500
                "
              >
                {
                  Errors
                    .mat_khau
                    .message
                }
              </p>
            )}
          </div>

          {Loi && (
            <div
              className="
                rounded-lg
                bg-red-50
                p-3
                text-sm
                text-red-600
              "
            >
              {Loi}
            </div>
          )}

          <button
            type="submit"
            disabled={DangGui}
            className="
              w-full
              rounded-lg
              bg-blue-600
              px-4
              py-3
              font-semibold
              text-white
              hover:bg-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {DangGui
              ? 'Đang đăng nhập...'
              : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
