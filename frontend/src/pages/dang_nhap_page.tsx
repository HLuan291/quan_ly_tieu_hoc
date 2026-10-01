import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';

import api from '../api/api';

const schema = z.object({
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
  z.infer<typeof schema>;

interface LoginResponse {
  access_token: string;
}

export default function DangNhapPage() {
  const navigate =
    useNavigate();

  const [
    loi,
    setLoi,
  ] = useState('');

  const [
    dangGui,
    setDangGui,
  ] = useState(false);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
    },
  } = useForm<FormData>({
    resolver:
      zodResolver(schema),
  });

  async function dangNhap(
    duLieu: FormData,
  ) {
    try {
      setDangGui(true);
      setLoi('');

      const response =
        await api.post<LoginResponse>(
          '/auth/login',
          duLieu,
        );

      localStorage.setItem(
        'access_token',
        response.data.access_token,
      );

      navigate(
        '/dashboard',
        {
          replace: true,
        },
      );
    } catch (error: unknown) {
      if (
        axios.isAxiosError(error)
      ) {
        const message =
          error.response?.data
            ?.message;

        if (
          Array.isArray(message)
        ) {
          setLoi(
            message.join(', '),
          );
        } else {
          setLoi(
            message ||
              'Đăng nhập thất bại',
          );
        }
      } else {
        setLoi(
          'Đăng nhập thất bại',
        );
      }
    } finally {
      setDangGui(false);
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
            handleSubmit(
              dangNhap,
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
              {...register(
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
              placeholder="
                Nhập tài khoản hoặc số điện thoại
              "
            />

            {errors
              .ten_dang_nhap_hoac_so_dien_thoai && (
              <p
                className="
                  mt-1
                  text-sm
                  text-red-500
                "
              >
                {
                  errors
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
              {...register(
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
              placeholder="
                Nhập mật khẩu
              "
            />

            {errors.mat_khau && (
              <p
                className="
                  mt-1
                  text-sm
                  text-red-500
                "
              >
                {
                  errors
                    .mat_khau
                    .message
                }
              </p>
            )}
          </div>

          {loi && (
            <div
              className="
                rounded-lg
                bg-red-50
                p-3
                text-sm
                text-red-600
              "
            >
              {loi}
            </div>
          )}

          <button
            type="submit"
            disabled={dangGui}
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
            {dangGui
              ? 'Đang đăng nhập...'
              : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}