import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import api from '../api/api';

import {
  docJwt,
} from '../auth/auth';

import {
  layThongBaoLoi,
} from '../utils/loi_api';

interface XepLopTomTat {
  id: number;
  lop_hoc_id: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string | null;
  trang_thai: string;
}

interface HocSinh {
  id: number;
  ma_hoc_sinh: string;
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  so_dien_thoai_lien_he: string;
  trang_thai: string;
  chieu_cao_cm: string | number | null;
  can_nang_kg: string | number | null;
  ngay_do: string | null;
  xep_lop: XepLopTomTat[];
}

interface DanhSachResponse {
  tong_so: number;
  danh_sach: HocSinh[];
}

interface PhuHuynhMoi {
  ho_ten: string;
  nam_sinh: string;
  so_dien_thoai: string;
  nghe_nghiep: string;
  moi_quan_he: string;
  tao_tai_khoan: boolean;
}

interface HocSinhMoi {
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  dan_toc: string;
  quoc_tich: string;
  noi_sinh: string;
  so_dien_thoai_lien_he: string;
  dia_chi_thuong_tru: string;
  dia_chi_hien_tai: string;
  ngay_nhap_hoc: string;
  ghi_chu: string;
}

const hocSinhRong: HocSinhMoi = {
  ho_ten: '',
  ngay_sinh: '',
  gioi_tinh: '',
  dan_toc: 'Kinh',
  quoc_tich: 'Việt Nam',
  noi_sinh: '',
  so_dien_thoai_lien_he: '',
  dia_chi_thuong_tru: '',
  dia_chi_hien_tai: '',
  ngay_nhap_hoc: '',
  ghi_chu: '',
};

const phuHuynhRong: PhuHuynhMoi = {
  ho_ten: '',
  nam_sinh: '',
  so_dien_thoai: '',
  nghe_nghiep: '',
  moi_quan_he: 'CHA',
  tao_tai_khoan: true,
};

export default function HocSinhPage() {
  const nguoiDung =
    docJwt();

  const laAdmin =
    nguoiDung?.vai_tro ===
    'ADMIN';

  const [
    danhSach,
    setDanhSach,
  ] = useState<HocSinh[]>([]);

  const [
    tuKhoa,
    setTuKhoa,
  ] = useState('');

  const [
    loi,
    setLoi,
  ] = useState('');

  const [
    dangTai,
    setDangTai,
  ] = useState(false);

  const [
    hienForm,
    setHienForm,
  ] = useState(false);

  const [
    hocSinhMoi,
    setHocSinhMoi,
  ] = useState<HocSinhMoi>(
    hocSinhRong,
  );

  const [
    phuHuynhMoi,
    setPhuHuynhMoi,
  ] = useState<PhuHuynhMoi>(
    phuHuynhRong,
  );

  const [
    taiKhoanMoi,
    setTaiKhoanMoi,
  ] = useState<
    Array<{
      ten_dang_nhap: string;
      mat_khau_ban_dau: string;
      ho_ten: string;
    }>
  >([]);

  const taiDanhSach =
    useCallback(
      async () => {
        try {
          setDangTai(true);
          setLoi('');

          const response =
            await api.get<DanhSachResponse>(
              '/ho_so_hoc_sinh/hoc_sinh',
              {
                params: {
                  ...(tuKhoa.trim()
                    ? {
                        tu_khoa:
                          tuKhoa.trim(),
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

  async function taoHocSinh(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');
      setTaiKhoanMoi(
        [],
      );

      const response =
        await api.post(
          '/ho_so_hoc_sinh/hoc_sinh',
          {
            hoc_sinh: {
              ...hocSinhMoi,
            },

            phu_huynh: [
              {
                ho_ten:
                  phuHuynhMoi.ho_ten,

                nam_sinh:
                  phuHuynhMoi.nam_sinh
                    ? Number(
                        phuHuynhMoi.nam_sinh,
                      )
                    : undefined,

                so_dien_thoai:
                  phuHuynhMoi.so_dien_thoai,

                nghe_nghiep:
                  phuHuynhMoi.nghe_nghiep,

                moi_quan_he:
                  phuHuynhMoi.moi_quan_he,

                tao_tai_khoan:
                  phuHuynhMoi.tao_tai_khoan,
              },
            ],
          },
        );

      setTaiKhoanMoi(
        response.data
          .tai_khoan_phu_huynh_moi ??
          [],
      );

      setHocSinhMoi(
        hocSinhRong,
      );

      setPhuHuynhMoi(
        phuHuynhRong,
      );

      await taiDanhSach();
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function capNhatSucKhoe(
    hocSinh: HocSinh,
  ) {
    const chieuCao =
      window.prompt(
        'Chiều cao (cm)',
        String(
          hocSinh.chieu_cao_cm ??
          '',
        ),
      );

    if (chieuCao === null) {
      return;
    }

    const canNang =
      window.prompt(
        'Cân nặng (kg)',
        String(
          hocSinh.can_nang_kg ??
          '',
        ),
      );

    if (canNang === null) {
      return;
    }

    const ngayDo =
      window.prompt(
        'Ngày đo (YYYY-MM-DD)',
        new Date()
          .toISOString()
          .slice(0, 10),
      );

    if (!ngayDo) {
      return;
    }

    try {
      setLoi('');

      await api.patch(
        `/ho_so_hoc_sinh/hoc_sinh/${hocSinh.id}/suc_khoe`,
        {
          chieu_cao_cm:
            Number(chieuCao),

          can_nang_kg:
            Number(canNang),

          ngay_do:
            ngayDo,
        },
      );

      await taiDanhSach();
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
            Quản lý học sinh
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Danh sách học sinh theo phạm vi quyền của tài khoản.
          </p>
        </div>

        {laAdmin && (
          <button
            type="button"
            onClick={
              () =>
                setHienForm(
                  (giaTri) =>
                    !giaTri,
                )
            }
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
          >
            {hienForm
              ? 'Đóng form'
              : 'Thêm học sinh'}
          </button>
        )}
      </div>

      {loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {loi}
        </div>
      )}

      {taiKhoanMoi.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-semibold">
            Tài khoản phụ huynh vừa tạo
          </p>

          {taiKhoanMoi.map(
            (taiKhoan) => (
              <p
                key={
                  taiKhoan.ten_dang_nhap
                }
                className="mt-1"
              >
                {taiKhoan.ho_ten}: {' '}
                <strong>
                  {taiKhoan.ten_dang_nhap}
                </strong>
                {' / '}
                <strong>
                  {taiKhoan.mat_khau_ban_dau}
                </strong>
              </p>
            ),
          )}
        </div>
      )}

      {laAdmin &&
        hienForm && (
        <form
          onSubmit={
            taoHocSinh
          }
          className="mt-6 rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">
            Thông tin học sinh
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {([
              ['ho_ten', 'Họ tên'],
              ['ngay_sinh', 'Ngày sinh'],
              ['noi_sinh', 'Nơi sinh'],
              ['so_dien_thoai_lien_he', 'SĐT liên hệ'],
              ['dia_chi_thuong_tru', 'Địa chỉ thường trú'],
              ['dia_chi_hien_tai', 'Địa chỉ hiện tại'],
              ['ngay_nhap_hoc', 'Ngày nhập học'],
              ['dan_toc', 'Dân tộc'],
              ['quoc_tich', 'Quốc tịch'],
            ] as const).map(
              ([
                ten,
                nhan,
              ]) => (
                <input
                  key={
                    ten
                  }
                  type={
                    ten.includes(
                      'ngay_',
                    )
                      ? 'date'
                      : 'text'
                  }
                  value={
                    hocSinhMoi[ten]
                  }
                  onChange={
                    (event) =>
                      setHocSinhMoi(
                        (cu) => ({
                          ...cu,
                          [ten]:
                            event
                              .target
                              .value,
                        }),
                      )
                  }
                  placeholder={
                    nhan
                  }
                  required={
                    ten !==
                    'ghi_chu'
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              ),
            )}

            <select
              value={
                hocSinhMoi.gioi_tinh
              }
              onChange={
                (event) =>
                  setHocSinhMoi(
                    (cu) => ({
                      ...cu,
                      gioi_tinh:
                        event.target.value,
                    }),
                  )
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
          </div>

          <h2 className="mt-6 text-lg font-semibold">
            Phụ huynh / người giám hộ
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={
                phuHuynhMoi.ho_ten
              }
              onChange={
                (event) =>
                  setPhuHuynhMoi(
                    (cu) => ({
                      ...cu,
                      ho_ten:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Họ tên phụ huynh"
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <input
              value={
                phuHuynhMoi.so_dien_thoai
              }
              onChange={
                (event) =>
                  setPhuHuynhMoi(
                    (cu) => ({
                      ...cu,
                      so_dien_thoai:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Số điện thoại"
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <input
              type="number"
              value={
                phuHuynhMoi.nam_sinh
              }
              onChange={
                (event) =>
                  setPhuHuynhMoi(
                    (cu) => ({
                      ...cu,
                      nam_sinh:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Năm sinh"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <input
              value={
                phuHuynhMoi.nghe_nghiep
              }
              onChange={
                (event) =>
                  setPhuHuynhMoi(
                    (cu) => ({
                      ...cu,
                      nghe_nghiep:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Nghề nghiệp"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <select
              value={
                phuHuynhMoi.moi_quan_he
              }
              onChange={
                (event) =>
                  setPhuHuynhMoi(
                    (cu) => ({
                      ...cu,
                      moi_quan_he:
                        event.target.value,
                    }),
                  )
              }
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="CHA">
                Cha
              </option>
              <option value="ME">
                Mẹ
              </option>
              <option value="NGUOI_GIAM_HO">
                Người giám hộ
              </option>
            </select>

            <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
              <input
                type="checkbox"
                checked={
                  phuHuynhMoi.tao_tai_khoan
                }
                onChange={
                  (event) =>
                    setPhuHuynhMoi(
                      (cu) => ({
                        ...cu,
                        tao_tai_khoan:
                          event.target.checked,
                      }),
                    )
                }
              />

              Tạo tài khoản phụ huynh
            </label>
          </div>

          <button
            type="submit"
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
          >
            Lưu học sinh
          </button>
        </form>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
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
          placeholder="Tìm mã, họ tên hoặc số điện thoại"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 md:max-w-lg"
        />

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-3 py-3">
                  Mã
                </th>
                <th className="px-3 py-3">
                  Họ tên
                </th>
                <th className="px-3 py-3">
                  Ngày sinh
                </th>
                <th className="px-3 py-3">
                  SĐT
                </th>
                <th className="px-3 py-3">
                  Trạng thái
                </th>
                <th className="px-3 py-3">
                  Lớp gần nhất
                </th>
                {laAdmin && (
                  <th className="px-3 py-3">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {danhSach.map(
                (hocSinh) => (
                  <tr
                    key={
                      hocSinh.id
                    }
                    className="border-b"
                  >
                    <td className="px-3 py-3 font-medium">
                      {
                        hocSinh.ma_hoc_sinh
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        hocSinh.ho_ten
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        hocSinh.ngay_sinh
                          .slice(
                            0,
                            10,
                          )
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        hocSinh.so_dien_thoai_lien_he
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        hocSinh.trang_thai
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        hocSinh.xep_lop[0]
                          ?.lop_hoc_id ??
                        'Chưa xếp'
                      }
                    </td>

                    {laAdmin && (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={
                            () =>
                              void capNhatSucKhoe(
                                hocSinh,
                              )
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Cập nhật sức khỏe
                        </button>
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {dangTai && (
            <p className="py-6 text-center text-slate-500">
              Đang tải...
            </p>
          )}

          {!dangTai &&
            danhSach.length === 0 && (
            <p className="py-6 text-center text-slate-500">
              Không có học sinh.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
