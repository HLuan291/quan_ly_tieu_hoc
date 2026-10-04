import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
} from 'react';

import axios from 'axios';

import Api from '../api/api';
import { LayNgayHomNay, LayNgaySinhToiDa } from '../utils/ngay_local';

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

const FormRong: FormGiaoVien = {
  ho_ten: '',
  ngay_sinh: '',
  gioi_tinh: '',
  so_dien_thoai: '',
  email: '',
  dia_chi_lien_he: '',
  ngay_vao_truong: '',
  trinh_do_chuyen_mon: '',
};

const DanhSachTrinhDo = [
  'Cao đẳng',
  'Đại học',
  'Thạc sĩ',
  'Tiến sĩ',
] as const;

function LayNgayInput(
  GiaTri: string,
) {
  return GiaTri
    ? GiaTri.slice(0, 10)
    : '';
}

function LayNgayDu18Tuoi(
  NgaySinh: string,
) {
  if (!NgaySinh) {
    return '';
  }

  const Ngay =
    new Date(
      `${NgaySinh}T00:00:00.000Z`,
    );

  if (
    Number.isNaN(
      Ngay.getTime(),
    )
  ) {
    return '';
  }

  Ngay.setUTCFullYear(
    Ngay.getUTCFullYear() + 18,
  );

  return Ngay
    .toISOString()
    .slice(0, 10);
}

function LayThongBaoLoi(
  Error: unknown,
) {
  if (
    axios.isAxiosError(
      Error,
    )
  ) {
    const Message =
      Error.response?.data
        ?.message;

    if (
      Array.isArray(
        Message,
      )
    ) {
      return Message.join(', ');
    }

    if (
      typeof Message ===
      'string'
    ) {
      return Message;
    }
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export default function GiaoVienPage() {
  const [
    DanhSach,
    SetDanhSach,
  ] = useState<GiaoVien[]>([]);

  const [
    TuKhoa,
    SetTuKhoa,
  ] = useState('');

  const [
    TrangThai,
    SetTrangThai,
  ] = useState('');

  const [
    DangTai,
    SetDangTai,
  ] = useState(false);

  const [
    Loi,
    SetLoi,
  ] = useState('');

  const [
    HienForm,
    SetHienForm,
  ] = useState(false);

  const [
    DangLuu,
    SetDangLuu,
  ] = useState(false);

  const [
    GiaoVienDangSua,
    SetGiaoVienDangSua,
  ] = useState<GiaoVien | null>(
    null,
  );

  const [
    Form,
    SetForm,
  ] = useState<FormGiaoVien>(
    FormRong,
  );

  const [
    TrinhDoLuaChon,
    SetTrinhDoLuaChon,
  ] = useState('');

  const [
    TrinhDoKhac,
    SetTrinhDoKhac,
  ] = useState('');

  const [
    TaiKhoanMoi,
    SetTaiKhoanMoi,
  ] = useState<TaiKhoanMoi | null>(
    null,
  );

  const [MatKhauBanDau, SetMatKhauBanDau] = useState('');
  const [HienMatKhauBanDau, SetHienMatKhauBanDau] = useState(false);
  const [GiaoVienCapMatKhau, SetGiaoVienCapMatKhau] = useState<GiaoVien | null>(null);
  const [MatKhauCapLai, SetMatKhauCapLai] = useState('');
  const [HienMatKhauCapLai, SetHienMatKhauCapLai] = useState(false);
  const [DangCapMatKhau, SetDangCapMatKhau] = useState(false);
  const [LoiCapMatKhau, SetLoiCapMatKhau] = useState('');
  const [DaSaoChep, SetDaSaoChep] = useState(false);

  const TaiDanhSach =
    useCallback(
      async () => {
        try {
          SetDangTai(true);
          SetLoi('');

          const Response =
            await Api.get<DanhSachGiaoVienResponse>(
              '/giao_vien',
              {
                params: {
                  ...(TuKhoa.trim()
                    ? {
                        tu_khoa:
                          TuKhoa.trim(),
                      }
                    : {}),

                  ...(TrangThai
                    ? {
                        trang_thai:
                          TrangThai,
                      }
                    : {}),
                },
              },
            );

          SetDanhSach(
            Response.data.danh_sach,
          );
        } catch (Error: unknown) {
          SetLoi(
            LayThongBaoLoi(
              Error,
            ),
          );
        } finally {
          SetDangTai(false);
        }
      },
      [
        TuKhoa,
        TrangThai,
      ],
    );

  useEffect(
    () => {
      // Hủy lần khởi tạo chưa chạy khi effect bị dọn (bao gồm StrictMode).
      let DaHuy = false;
      void Promise.resolve().then(() => {
        if (!DaHuy) return TaiDanhSach();
      });
      return () => { DaHuy = true; };
    },
    [
      TaiDanhSach,
    ],
  );

  function MoFormThem() {
    DongFormCapMatKhau();
    SetMatKhauBanDau('');
    SetHienMatKhauBanDau(false);
    SetDaSaoChep(false);
    SetGiaoVienDangSua(
      null,
    );

    SetForm({
      ...FormRong,
    });

    SetTrinhDoLuaChon('');
    SetTrinhDoKhac('');
    SetTaiKhoanMoi(null);
    SetLoi('');
    SetHienForm(true);
  }

  function MoFormSua(
    GiaoVienItem: GiaoVien,
  ) {
    DongFormCapMatKhau();
    SetMatKhauBanDau('');
    SetHienMatKhauBanDau(false);
    const LaTrinhDoCoSan =
      DanhSachTrinhDo.includes(
        GiaoVienItem.trinh_do_chuyen_mon as
          (typeof DanhSachTrinhDo)[number],
      );

    SetGiaoVienDangSua(
      GiaoVienItem,
    );

    SetForm({
      ho_ten:
        GiaoVienItem.ho_ten,

      ngay_sinh:
        LayNgayInput(
          GiaoVienItem.ngay_sinh,
        ),

      gioi_tinh:
        GiaoVienItem.gioi_tinh,

      so_dien_thoai:
        GiaoVienItem.so_dien_thoai,

      email:
        GiaoVienItem.email,

      dia_chi_lien_he:
        GiaoVienItem.dia_chi_lien_he,

      ngay_vao_truong:
        LayNgayInput(
          GiaoVienItem.ngay_vao_truong,
        ),

      trinh_do_chuyen_mon:
        GiaoVienItem.trinh_do_chuyen_mon,
    });

    SetTrinhDoLuaChon(
      LaTrinhDoCoSan
        ? GiaoVienItem.trinh_do_chuyen_mon
        : 'Khác',
    );

    SetTrinhDoKhac(
      LaTrinhDoCoSan
        ? ''
        : GiaoVienItem.trinh_do_chuyen_mon,
    );

    SetTaiKhoanMoi(null);
    SetLoi('');
    SetHienForm(true);
  }

  function DongForm() {
    SetMatKhauBanDau('');
    SetHienMatKhauBanDau(false);
    SetHienForm(false);
    SetGiaoVienDangSua(null);
    SetForm({
      ...FormRong,
    });
    SetTrinhDoLuaChon('');
    SetTrinhDoKhac('');
  }

  function CapNhatTruong(
    Event:
      ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement
      >,
  ) {
    const {
      name: TenTruong,
      value: GiaTri,
    } = Event.target;

    SetForm(
      (GiaTriCu) => ({
        ...GiaTriCu,
        [TenTruong]:
          GiaTri,
      }),
    );
  }

  function CapNhatSoDienThoai(
    Event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const SoDienThoai =
      Event.target.value
        .replace(
          /\D/g,
          '',
        )
        .slice(
          0,
          10,
        );

    SetForm(
      (GiaTriCu) => ({
        ...GiaTriCu,
        so_dien_thoai:
          SoDienThoai,
      }),
    );
  }

  function CapNhatTrinhDo(
    Event:
      ChangeEvent<HTMLSelectElement>,
  ) {
    const GiaTri =
      Event.target.value;

    SetTrinhDoLuaChon(
      GiaTri,
    );

    if (
      GiaTri !==
      'Khác'
    ) {
      SetTrinhDoKhac('');

      SetForm(
        (GiaTriCu) => ({
          ...GiaTriCu,
          trinh_do_chuyen_mon:
            GiaTri,
        }),
      );
    } else {
      SetForm(
        (GiaTriCu) => ({
          ...GiaTriCu,
          trinh_do_chuyen_mon:
            '',
        }),
      );
    }
  }

  function CapNhatTrinhDoKhac(
    Event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const GiaTri =
      Event.target.value;

    SetTrinhDoKhac(
      GiaTri,
    );

    SetForm(
      (GiaTriCu) => ({
        ...GiaTriCu,
        trinh_do_chuyen_mon:
          GiaTri,
      }),
    );
  }

  async function LuuGiaoVien(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetDangLuu(true);
      SetLoi('');
      SetTaiKhoanMoi(null);

      if (
        GiaoVienDangSua
      ) {
        await Api.patch(
          `/giao_vien/${GiaoVienDangSua.id}`,
          Form,
        );
      } else {
        const Response =
          await Api.post<TaoGiaoVienResponse>(
            '/giao_vien',
            {
              ...Form,
              ...(MatKhauBanDau ? { mat_khau_ban_dau: MatKhauBanDau } : {}),
            },
          );

        SetTaiKhoanMoi(
          Response.data.tai_khoan,
        );
        SetDaSaoChep(false);
        SetMatKhauBanDau('');
        SetHienMatKhauBanDau(false);
      }

      await TaiDanhSach();

      if (
        GiaoVienDangSua
      ) {
        DongForm();
      } else {
        SetForm({
          ...FormRong,
        });

        SetTrinhDoLuaChon('');
        SetTrinhDoKhac('');
      }
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    } finally {
      SetDangLuu(false);
    }
  }

  function MoFormCapMatKhau(GiaoVienItem: GiaoVien) {
    DongForm();
    SetGiaoVienCapMatKhau(GiaoVienItem);
    SetMatKhauCapLai('');
    SetHienMatKhauCapLai(false);
    SetLoiCapMatKhau('');
    SetTaiKhoanMoi(null);
  }

  function DongFormCapMatKhau() {
    SetGiaoVienCapMatKhau(null);
    SetMatKhauCapLai('');
    SetHienMatKhauCapLai(false);
    SetLoiCapMatKhau('');
  }

  async function CapLaiMatKhau(Event: FormEvent) {
    Event.preventDefault();
    if (!GiaoVienCapMatKhau) return;

    try {
      SetDangCapMatKhau(true);
      SetLoiCapMatKhau('');

      const Response =
        await Api.post<CapLaiMatKhauResponse>(
          `/giao_vien/${GiaoVienCapMatKhau.id}/cap_lai_mat_khau`,
          MatKhauCapLai ? { mat_khau_moi: MatKhauCapLai } : {},
        );

      SetTaiKhoanMoi({
        ten_dang_nhap: GiaoVienCapMatKhau.tai_khoan.ten_dang_nhap,
        mat_khau_ban_dau: Response.data.mat_khau_moi,
        phai_doi_mat_khau: Response.data.phai_doi_mat_khau,
      });
      SetDaSaoChep(false);
      DongFormCapMatKhau();
    } catch (Error: unknown) {
      SetLoiCapMatKhau(
        LayThongBaoLoi(
          Error,
        ),
      );
    } finally {
      SetDangCapMatKhau(false);
    }
  }

  async function SaoChepTaiKhoan() {
    if (!TaiKhoanMoi) return;
    try {
      await navigator.clipboard.writeText(
        `Tên đăng nhập: ${TaiKhoanMoi.ten_dang_nhap}\nMật khẩu: ${TaiKhoanMoi.mat_khau_ban_dau}`,
      );
      SetDaSaoChep(true);
    } catch {
      SetLoi('Không thể sao chép. Bạn có thể chọn và sao chép thông tin đăng nhập bên dưới.');
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
          disabled={DangCapMatKhau}
          onClick={
            MoFormThem
          }
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Thêm giáo viên
        </button>
      </div>

      {Loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {Loi}
        </div>
      )}

      {TaiKhoanMoi && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">
            Thông tin đăng nhập giáo viên
          </p>

          <p className="mt-2 text-sm text-amber-900">
            Tên đăng nhập:{' '}
            <strong className="break-all">
              {TaiKhoanMoi.ten_dang_nhap}
            </strong>
          </p>

          <p className="text-sm text-amber-900">
            Mật khẩu tạm thời:{' '}
            <strong className="break-all">
              {TaiKhoanMoi.mat_khau_ban_dau}
            </strong>
          </p>

          <p className="mt-1 text-xs text-amber-700">
            Sao chép để bàn giao hoặc thử đăng nhập. Giáo viên phải đổi mật khẩu khi đăng nhập lần đầu.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={() => void SaoChepTaiKhoan()} className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-medium text-white">
              {DaSaoChep ? 'Đã sao chép' : 'Sao chép tài khoản'}
            </button>
            <button type="button" onClick={() => SetTaiKhoanMoi(null)} className="rounded-lg border border-amber-500 px-3 py-2 text-sm text-amber-900">
              Ẩn thông tin
            </button>
          </div>
        </div>
      )}

      {HienForm && (
        <form
          onSubmit={
            LuuGiaoVien
          }
          className="mt-6 rounded-xl bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {GiaoVienDangSua
                ? 'Cập nhật giáo viên'
                : 'Thêm giáo viên'}
            </h2>

            <button
              type="button"
              onClick={
                DongForm
              }
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Đóng
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Họ tên
              </label>

              <input
                name="ho_ten"
                value={
                  Form.ho_ten
                }
                onChange={
                  CapNhatTruong
                }
                placeholder="VD: Trần Thị Bình - viết hoa chữ cái đầu mỗi từ"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Ngày sinh
              </label>

              <input
                name="ngay_sinh"
                type="date"
                value={
                  Form.ngay_sinh
                }
                onChange={
                  CapNhatTruong
                }
                min="1950-01-01"
                max={
                  LayNgaySinhToiDa()
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <p className="mt-1 text-xs text-slate-500">
                Từ năm 1950 và giáo viên phải đủ 18 tuổi.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Giới tính
              </label>

              <select
                name="gioi_tinh"
                value={
                  Form.gioi_tinh
                }
                onChange={
                  CapNhatTruong
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Số điện thoại
              </label>

              <input
                name="so_dien_thoai"
                value={
                  Form.so_dien_thoai
                }
                onChange={
                  CapNhatSoDienThoai
                }
                inputMode="numeric"
                minLength={10}
                maxLength={10}
                pattern="[0-9]{10}"
                title="Số điện thoại phải gồm đúng 10 chữ số"
                placeholder="Gồm đúng 10 số, VD: 0901234567"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                name="email"
                type="email"
                value={
                  Form.email
                }
                onChange={
                  CapNhatTruong
                }
                pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,63}"
                title="Email phải đúng định dạng, ví dụ: giaovien@truong.edu.vn"
                placeholder="VD: giaovien@truong.edu.vn"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <p className="mt-1 text-xs text-slate-500">
                Kiểm tra định dạng email; không xác minh hộp thư có tồn tại.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Ngày vào trường
              </label>

              <input
                name="ngay_vao_truong"
                type="date"
                value={
                  Form.ngay_vao_truong
                }
                onChange={
                  CapNhatTruong
                }
                min={
                  LayNgayDu18Tuoi(
                    Form.ngay_sinh,
                  ) ||
                  undefined
                }
                max={
                  LayNgayHomNay()
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <p className="mt-1 text-xs text-slate-500">
                Không trước thời điểm đủ 18 tuổi và không lớn hơn hôm nay.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Địa chỉ liên hệ
              </label>

              <input
                name="dia_chi_lien_he"
                value={
                  Form.dia_chi_lien_he
                }
                onChange={
                  CapNhatTruong
                }
                placeholder="VD: 123 Nguyễn Trãi, Quận 5, TP.HCM"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Trình độ chuyên môn
              </label>

              <select
                value={
                  TrinhDoLuaChon
                }
                onChange={
                  CapNhatTrinhDo
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">
                  Chọn trình độ chuyên môn
                </option>

                {DanhSachTrinhDo.map(
                  (TrinhDo) => (
                    <option
                      key={
                        TrinhDo
                      }
                      value={
                        TrinhDo
                      }
                    >
                      {TrinhDo}
                    </option>
                  ),
                )}

                <option value="Khác">
                  Khác
                </option>
              </select>

              {TrinhDoLuaChon ===
                'Khác' && (
                <input
                  value={
                    TrinhDoKhac
                  }
                  onChange={
                    CapNhatTrinhDoKhac
                  }
                  placeholder="Nhập trình độ chuyên môn khác"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              )}
            </div>
          </div>

          {!GiaoVienDangSua && (
            <div className="mt-4">
              <label htmlFor="mat-khau-ban-dau" className="mb-1 block text-sm font-medium text-slate-700">
                Mật khẩu ban đầu (tùy chọn)
              </label>
              <div className="flex gap-2">
                <input
                  id="mat-khau-ban-dau"
                  type={HienMatKhauBanDau ? 'text' : 'password'}
                  value={MatKhauBanDau}
                  onChange={(Event) => SetMatKhauBanDau(Event.target.value)}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Để trống để hệ thống tự sinh"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
                />
                <button type="button" aria-pressed={HienMatKhauBanDau} onClick={() => SetHienMatKhauBanDau(!HienMatKhauBanDau)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {HienMatKhauBanDau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Nếu tự đặt, mật khẩu cần có từ 8 đến 128 ký tự.</p>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={
                DangLuu
              }
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {DangLuu
                ? 'Đang lưu...'
                : 'Lưu'}
            </button>

            <button
              type="button"
              onClick={
                DongForm
              }
              className="rounded-lg border border-slate-300 px-4 py-2"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {GiaoVienCapMatKhau && (
        <form onSubmit={CapLaiMatKhau} aria-labelledby="tieu-de-cap-mat-khau" className="mt-6 rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
          <h2 id="tieu-de-cap-mat-khau" className="text-lg font-semibold text-slate-800">
            Cấp lại mật khẩu cho {GiaoVienCapMatKhau.ho_ten}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tài khoản: {GiaoVienCapMatKhau.tai_khoan.ten_dang_nhap}. Mật khẩu hiện tại sẽ được thay thế; giáo viên cần đổi mật khẩu khi đăng nhập.
          </p>
          {LoiCapMatKhau && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{LoiCapMatKhau}</p>}
          <label htmlFor="mat-khau-cap-lai" className="mb-1 mt-4 block text-sm font-medium text-slate-700">
            Mật khẩu mới (tùy chọn)
          </label>
          <div className="flex gap-2">
            <input
              id="mat-khau-cap-lai"
              type={HienMatKhauCapLai ? 'text' : 'password'}
              value={MatKhauCapLai}
              onChange={(Event) => SetMatKhauCapLai(Event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              autoFocus
              disabled={DangCapMatKhau}
              placeholder="Để trống để hệ thống tự sinh"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
            />
            <button type="button" aria-pressed={HienMatKhauCapLai} onClick={() => SetHienMatKhauCapLai(!HienMatKhauCapLai)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {HienMatKhauCapLai ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">Nhập từ 8 đến 128 ký tự hoặc để trống để tự sinh mật khẩu mới.</p>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={DangCapMatKhau} className="rounded-lg bg-amber-700 px-4 py-2 font-medium text-white disabled:opacity-50">
              {DangCapMatKhau ? 'Đang cấp mật khẩu...' : 'Cấp mật khẩu mới'}
            </button>
            <button type="button" disabled={DangCapMatKhau} onClick={DongFormCapMatKhau} className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50">Hủy</button>
          </div>
        </form>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            value={
              TuKhoa
            }
            onChange={
              (Event) =>
                SetTuKhoa(
                  Event.target.value,
                )
            }
            placeholder="Tìm theo mã, họ tên, SĐT hoặc email"
            className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-2"
          />

          <select
            value={
              TrangThai
            }
            onChange={
              (Event) =>
                SetTrangThai(
                  Event.target.value,
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
              {DanhSach.map(
                (GiaoVienItem) => (
                  <tr
                    key={
                      GiaoVienItem.id
                    }
                    className="border-b"
                  >
                    <td className="px-3 py-3 font-medium">
                      {
                        GiaoVienItem.ma_giao_vien
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        GiaoVienItem.ho_ten
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        GiaoVienItem.so_dien_thoai
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        GiaoVienItem.email
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        GiaoVienItem.tai_khoan
                          .ten_dang_nhap
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        GiaoVienItem.trang_thai
                      }
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      <button
                        type="button"
                        disabled={DangCapMatKhau}
                        onClick={
                          () =>
                            MoFormSua(
                              GiaoVienItem,
                            )
                        }
                        className="mr-3 text-blue-600 hover:underline"
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        disabled={DangCapMatKhau || DangLuu}
                        onClick={
                          () =>
                            MoFormCapMatKhau(
                              GiaoVienItem,
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

          {!DangTai &&
            DanhSach.length === 0 && (
            <p className="py-8 text-center text-slate-500">
              Không có giáo viên phù hợp.
            </p>
          )}

          {DangTai && (
            <p className="py-8 text-center text-slate-500">
              Đang tải danh sách...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
