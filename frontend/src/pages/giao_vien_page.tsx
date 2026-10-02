import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import type {
  ChangeEvent,
} from 'react';

import axios from 'axios';

import api from '../api/api';

interface TaiKhoanGiaoVien {
  ten_dang_nhap: string;
  trang_thai: string;
  lan_dang_nhap_cuoi: string | null;
}

interface GiaoVien {
  id: number;
  ma_giao_vien: string;
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  so_dien_thoai: string;
  email: string;
  dia_chi_lien_he: string;
  ngay_vao_truong: string;
  trinh_do_chuyen_mon: string;
  trang_thai: string;
  tai_khoan: TaiKhoanGiaoVien;
}

interface DanhSachGiaoVienResponse {
  tong_so: number;
  danh_sach: GiaoVien[];
}

interface TaiKhoanMoi {
  ten_dang_nhap: string;
  mat_khau_ban_dau: string;
  phai_doi_mat_khau: boolean;
}

interface TaoGiaoVienResponse {
  thong_bao: string;
  tai_khoan: TaiKhoanMoi;
}

interface CapLaiMatKhauResponse {
  thong_bao: string;
  mat_khau_moi: string;
  phai_doi_mat_khau: boolean;
}

interface FormGiaoVien {
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  so_dien_thoai: string;
  email: string;
  dia_chi_lien_he: string;
  ngay_vao_truong: string;
  trinh_do_chuyen_mon: string;
}

const formRong: FormGiaoVien = {
  ho_ten: '',
  ngay_sinh: '',
  gioi_tinh: '',
  so_dien_thoai: '',
  email: '',
  dia_chi_lien_he: '',
  ngay_vao_truong: '',
  trinh_do_chuyen_mon: '',
};

function layNgayInput(
  giaTri: string,
) {
  return giaTri
    ? giaTri.slice(0, 10)
    : '';
}

function layThongBaoLoi(
  error: unknown,
) {
  if (
    axios.isAxiosError(error)
  ) {
    const message =
      error.response?.data
        ?.message;

    if (
      Array.isArray(message)
    ) {
      return message.join(', ');
    }

    if (
      typeof message ===
      'string'
    ) {
      return message;
    }
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export default function GiaoVienPage() {
  const [
    danhSach,
    setDanhSach,
  ] = useState<GiaoVien[]>([]);

  const [
    tuKhoa,
    setTuKhoa,
  ] = useState('');

  const [
    trangThai,
    setTrangThai,
  ] = useState('');

  const [
    dangTai,
    setDangTai,
  ] = useState(false);

  const [
    loi,
    setLoi,
  ] = useState('');

  const [
    hienForm,
    setHienForm,
  ] = useState(false);

  const [
    dangLuu,
    setDangLuu,
  ] = useState(false);

  const [
    giaoVienDangSua,
    setGiaoVienDangSua,
  ] = useState<GiaoVien | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<FormGiaoVien>(
    formRong,
  );

  const [
    taiKhoanMoi,
    setTaiKhoanMoi,
  ] = useState<TaiKhoanMoi | null>(
    null,
  );

  const taiDanhSach =
    useCallback(
      async () => {
        try {
          setDangTai(true);
          setLoi('');

          const response =
            await api.get<DanhSachGiaoVienResponse>(
              '/giao_vien',
              {
                params: {
                  ...(tuKhoa.trim()
                    ? {
                        tu_khoa:
                          tuKhoa.trim(),
                      }
                    : {}),

                  ...(trangThai
                    ? {
                        trang_thai:
                          trangThai,
                      }
                    : {}),
                },
              },
            );

          setDanhSach(
            response.data.danh_sach,
          );
        } catch (error: unknown) {
          setLoi(
            layThongBaoLoi(
              error,
            ),
          );
        } finally {
          setDangTai(false);
        }
      },
      [
        tuKhoa,
        trangThai,
      ],
    );

  useEffect(
    () => {
      void taiDanhSach();
    },
    [
      taiDanhSach,
    ],
  );

  function moFormThem() {
    setGiaoVienDangSua(
      null,
    );

    setForm(
      formRong,
    );

    setTaiKhoanMoi(
      null,
    );

    setLoi('');
    setHienForm(true);
  }

  function moFormSua(
    giaoVien: GiaoVien,
  ) {
    setGiaoVienDangSua(
      giaoVien,
    );

    setForm({
      ho_ten:
        giaoVien.ho_ten,

      ngay_sinh:
        layNgayInput(
          giaoVien.ngay_sinh,
        ),

      gioi_tinh:
        giaoVien.gioi_tinh,

      so_dien_thoai:
        giaoVien.so_dien_thoai,

      email:
        giaoVien.email,

      dia_chi_lien_he:
        giaoVien.dia_chi_lien_he,

      ngay_vao_truong:
        layNgayInput(
          giaoVien.ngay_vao_truong,
        ),

      trinh_do_chuyen_mon:
        giaoVien.trinh_do_chuyen_mon,
    });

    setTaiKhoanMoi(
      null,
    );

    setLoi('');
    setHienForm(true);
  }

  function dongForm() {
    setHienForm(false);
    setGiaoVienDangSua(
      null,
    );
    setForm(
      formRong,
    );
  }

  function capNhatTruong(
    event:
      ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement
      >,
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (giaTriCu) => ({
        ...giaTriCu,
        [name]:
          value,
      }),
    );
  }

  async function luuGiaoVien(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setDangLuu(true);
      setLoi('');
      setTaiKhoanMoi(
        null,
      );

      if (giaoVienDangSua) {
        await api.patch(
          `/giao_vien/${giaoVienDangSua.id}`,
          form,
        );
      } else {
        const response =
          await api.post<TaoGiaoVienResponse>(
            '/giao_vien',
            form,
          );

        setTaiKhoanMoi(
          response.data.tai_khoan,
        );
      }

      await taiDanhSach();

      if (giaoVienDangSua) {
        dongForm();
      } else {
        setForm(
          formRong,
        );
      }
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    } finally {
      setDangLuu(false);
    }
  }

  async function capLaiMatKhau(
    giaoVien: GiaoVien,
  ) {
    const dongY =
      window.confirm(
        `Cấp lại mật khẩu cho ${giaoVien.ho_ten}?`,
      );

    if (!dongY) {
      return;
    }

    try {
      setLoi('');

      const response =
        await api.post<CapLaiMatKhauResponse>(
          `/giao_vien/${giaoVien.id}/cap_lai_mat_khau`,
        );

      window.alert(
        `Mật khẩu mới: ${response.data.mat_khau_moi}\nGiáo viên sẽ phải đổi mật khẩu khi đăng nhập.`,
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản lý giáo viên
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Thêm, tìm kiếm và cập nhật hồ sơ giáo viên.
          </p>
        </div>

        <button
          type="button"
          onClick={
            moFormThem
          }
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Thêm giáo viên
        </button>
      </div>

      {loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {loi}
        </div>
      )}

      {taiKhoanMoi && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">
            Tài khoản giáo viên mới
          </p>

          <p className="mt-2 text-sm text-amber-900">
            Tên đăng nhập:{' '}
            <strong>
              {taiKhoanMoi.ten_dang_nhap}
            </strong>
          </p>

          <p className="text-sm text-amber-900">
            Mật khẩu ban đầu:{' '}
            <strong>
              {taiKhoanMoi.mat_khau_ban_dau}
            </strong>
          </p>

          <p className="mt-1 text-xs text-amber-700">
            Chỉ hiển thị mật khẩu này để Admin bàn giao cho giáo viên.
          </p>
        </div>
      )}

      {hienForm && (
        <form
          onSubmit={
            luuGiaoVien
          }
          className="mt-6 rounded-xl bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {giaoVienDangSua
                ? 'Cập nhật giáo viên'
                : 'Thêm giáo viên'}
            </h2>

            <button
              type="button"
              onClick={
                dongForm
              }
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Đóng
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="ho_ten"
              value={
                form.ho_ten
              }
              onChange={
                capNhatTruong
              }
              placeholder="Họ tên"
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <input
              name="ngay_sinh"
              type="date"
              value={
                form.ngay_sinh
              }
              onChange={
                capNhatTruong
              }
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <select
              name="gioi_tinh"
              value={
                form.gioi_tinh
              }
              onChange={
                capNhatTruong
              }
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">
                Chọn giới tính
              </option>
              <option value="NAM">
                Nam
              </option>
              <option value="NU">
                Nữ
              </option>
            </select>

            <input
              name="so_dien_thoai"
              value={
                form.so_dien_thoai
              }
              onChange={
                capNhatTruong
              }
              placeholder="Số điện thoại"
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <input
              name="email"
              type="email"
              value={
                form.email
              }
              onChange={
                capNhatTruong
              }
              placeholder="Email"
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <input
              name="ngay_vao_truong"
              type="date"
              value={
                form.ngay_vao_truong
              }
              onChange={
                capNhatTruong
              }
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <input
              name="dia_chi_lien_he"
              value={
                form.dia_chi_lien_he
              }
              onChange={
                capNhatTruong
              }
              placeholder="Địa chỉ liên hệ"
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <input
              name="trinh_do_chuyen_mon"
              value={
                form.trinh_do_chuyen_mon
              }
              onChange={
                capNhatTruong
              }
              placeholder="Trình độ chuyên môn"
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={
                dangLuu
              }
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {dangLuu
                ? 'Đang lưu...'
                : 'Lưu'}
            </button>

            <button
              type="button"
              onClick={
                dongForm
              }
              className="rounded-lg border border-slate-300 px-4 py-2"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            value={
              tuKhoa
            }
            onChange={
              (event) =>
                setTuKhoa(
                  event.target.value,
                )
            }
            placeholder="Tìm mã, họ tên, SĐT, email"
            className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-2"
          />

          <select
            value={
              trangThai
            }
            onChange={
              (event) =>
                setTrangThai(
                  event.target.value,
                )
            }
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Tất cả trạng thái
            </option>
            <option value="HOAT_DONG">
              Hoạt động
            </option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-600">
                <th className="px-3 py-3">
                  Mã
                </th>
                <th className="px-3 py-3">
                  Họ tên
                </th>
                <th className="px-3 py-3">
                  Số điện thoại
                </th>
                <th className="px-3 py-3">
                  Email
                </th>
                <th className="px-3 py-3">
                  Tài khoản
                </th>
                <th className="px-3 py-3">
                  Trạng thái
                </th>
                <th className="px-3 py-3">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {danhSach.map(
                (giaoVien) => (
                  <tr
                    key={
                      giaoVien.id
                    }
                    className="border-b"
                  >
                    <td className="px-3 py-3 font-medium">
                      {
                        giaoVien.ma_giao_vien
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        giaoVien.ho_ten
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        giaoVien.so_dien_thoai
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        giaoVien.email
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        giaoVien.tai_khoan
                          .ten_dang_nhap
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        giaoVien.trang_thai
                      }
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      <button
                        type="button"
                        onClick={
                          () =>
                            moFormSua(
                              giaoVien,
                            )
                        }
                        className="mr-3 text-blue-600 hover:underline"
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        onClick={
                          () =>
                            void capLaiMatKhau(
                              giaoVien,
                            )
                        }
                        className="text-amber-700 hover:underline"
                      >
                        Cấp lại mật khẩu
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {!dangTai &&
            danhSach.length === 0 && (
            <p className="py-8 text-center text-slate-500">
              Không có giáo viên phù hợp.
            </p>
          )}

          {dangTai && (
            <p className="py-8 text-center text-slate-500">
              Đang tải danh sách...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
