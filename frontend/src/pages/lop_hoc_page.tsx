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
  layThongBaoLoi as LayThongBaoLoi,
} from '../utils/loi_api';

interface NamHoc {
  id: number;
  ten_nam_hoc: string;
  trang_thai: string;
}

interface Khoi {
  id: number;
  ten_khoi: string;
  so_khoi: number;
}

interface LopHoc {
  id: number;
  nam_hoc_id: number;
  khoi_id: number;
  ten_lop: string;
  ghi_chu: string | null;
  nam_hoc: NamHoc;
  khoi: Khoi;
  _count: {
    xep_lop: number;
    phan_cong_giao_vien: number;
  };
}

interface HocSinhChuaXep {
  id: number;
  ma_hoc_sinh: string;
  ho_ten: string;
}

function LayNgayHomNay() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

export default function LopHocPage() {
  const [
    NamHoc,
    SetNamHoc,
  ] = useState<NamHoc[]>([]);

  const [
    Khoi,
    SetKhoi,
  ] = useState<Khoi[]>([]);

  const [
    LopHoc,
    SetLopHoc,
  ] = useState<LopHoc[]>([]);

  const [
    HocSinhChuaXep,
    SetHocSinhChuaXep,
  ] = useState<HocSinhChuaXep[]>([]);

  const [
    Loi,
    SetLoi,
  ] = useState('');

  const [
    TenNamHoc,
    SetTenNamHoc,
  ] = useState('');

  const [
    TenLop,
    SetTenLop,
  ] = useState('');

  const [
    NamHocId,
    SetNamHocId,
  ] = useState('');

  const [
    KhoiId,
    SetKhoiId,
  ] = useState('');

  const [
    HocSinhId,
    SetHocSinhId,
  ] = useState('');

  const [
    LopHocId,
    SetLopHocId,
  ] = useState('');

  const [
    NgayBatDau,
    SetNgayBatDau,
  ] = useState(
    LayNgayHomNay(),
  );

  const TaiDuLieu =
    useCallback(
      async () => {
        try {
          SetLoi('');

          const [
            NamHocResponse,
            KhoiResponse,
            LopResponse,
            HocSinhResponse,
          ] =
            await Promise.all([
              api.get<NamHoc[]>(
                '/to_chuc_lop_hoc/nam_hoc',
              ),

              api.get<Khoi[]>(
                '/to_chuc_lop_hoc/khoi',
              ),

              api.get<LopHoc[]>(
                '/to_chuc_lop_hoc/lop_hoc',
              ),

              api.get<HocSinhChuaXep[]>(
                '/to_chuc_lop_hoc/hoc_sinh_chua_xep_lop',
              ),
            ]);

          SetNamHoc(
            NamHocResponse.data,
          );

          SetKhoi(
            KhoiResponse.data,
          );

          SetLopHoc(
            LopResponse.data,
          );

          SetHocSinhChuaXep(
            HocSinhResponse.data,
          );
        } catch (Error: unknown) {
          SetLoi(
            LayThongBaoLoi(
              Error,
            ),
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      void TaiDuLieu();
    },
    [
      TaiDuLieu,
    ],
  );

  async function TaoNamHoc(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      await api.post(
        '/to_chuc_lop_hoc/nam_hoc',
        {
          ten_nam_hoc:
            TenNamHoc.trim(),
        },
      );

      SetTenNamHoc('');
      await TaiDuLieu();
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function TaoLop(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      await api.post(
        '/to_chuc_lop_hoc/lop_hoc',
        {
          nam_hoc_id:
            Number(
              NamHocId,
            ),

          khoi_id:
            Number(
              KhoiId,
            ),

          ten_lop:
            TenLop.trim(),
        },
      );

      SetTenLop('');
      await TaiDuLieu();
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function XepLop(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      await api.post(
        '/to_chuc_lop_hoc/xep_lop',
        {
          hoc_sinh_id:
            Number(
              HocSinhId,
            ),

          lop_hoc_id:
            Number(
              LopHocId,
            ),

          ngay_bat_dau:
            NgayBatDau,
        },
      );

      SetHocSinhId('');
      await TaiDuLieu();
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">
        Tổ chức lớp học
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Quản lý năm học, lớp học và xếp học sinh vào lớp.
      </p>

      {Loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {Loi}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <form
          onSubmit={
            TaoNamHoc
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Tạo năm học
          </h2>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Tên năm học
          </label>

          <input
            value={
              TenNamHoc
            }
            onChange={
              (Event) =>
                SetTenNamHoc(
                  Event.target.value,
                )
            }
            pattern="\d{4}-\d{4}"
            title="Năm học phải có dạng YYYY-YYYY, ví dụ 2026-2027"
            placeholder="VD: 2026-2027"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <p className="mt-1 text-xs text-slate-500">
            Năm sau phải lớn hơn năm trước đúng 1 năm.
          </p>

          <button
            type="submit"
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Tạo năm học
          </button>
        </form>

        <form
          onSubmit={
            TaoLop
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Tạo lớp
          </h2>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Năm học
          </label>

          <select
            value={
              NamHocId
            }
            onChange={
              (Event) =>
                SetNamHocId(
                  Event.target.value,
                )
            }
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn năm học
            </option>

            {NamHoc.map(
              (Item) => (
                <option
                  key={
                    Item.id
                  }
                  value={
                    Item.id
                  }
                >
                  {
                    Item.ten_nam_hoc
                  }
                </option>
              ),
            )}
          </select>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Khối
          </label>

          <select
            value={
              KhoiId
            }
            onChange={
              (Event) =>
                SetKhoiId(
                  Event.target.value,
                )
            }
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn khối
            </option>

            {Khoi.map(
              (Item) => (
                <option
                  key={
                    Item.id
                  }
                  value={
                    Item.id
                  }
                >
                  {
                    Item.ten_khoi
                  }
                </option>
              ),
            )}
          </select>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Tên lớp
          </label>

          <input
            value={
              TenLop
            }
            onChange={
              (Event) =>
                SetTenLop(
                  Event.target.value,
                )
            }
            placeholder="VD: 1A, 2B, 5A"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <button
            type="submit"
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Tạo lớp
          </button>
        </form>

        <form
          onSubmit={
            XepLop
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Xếp học sinh vào lớp
          </h2>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Học sinh
          </label>

          <select
            value={
              HocSinhId
            }
            onChange={
              (Event) =>
                SetHocSinhId(
                  Event.target.value,
                )
            }
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn học sinh chưa có lớp
            </option>

            {HocSinhChuaXep.map(
              (Item) => (
                <option
                  key={
                    Item.id
                  }
                  value={
                    Item.id
                  }
                >
                  {
                    Item.ma_hoc_sinh
                  } - {
                    Item.ho_ten
                  }
                </option>
              ),
            )}
          </select>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Lớp học
          </label>

          <select
            value={
              LopHocId
            }
            onChange={
              (Event) =>
                SetLopHocId(
                  Event.target.value,
                )
            }
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn lớp
            </option>

            {LopHoc.map(
              (Item) => (
                <option
                  key={
                    Item.id
                  }
                  value={
                    Item.id
                  }
                >
                  {
                    Item.nam_hoc
                      .ten_nam_hoc
                  } - {
                    Item.khoi
                      .ten_khoi
                  } - {
                    Item.ten_lop
                  }
                </option>
              ),
            )}
          </select>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Ngày bắt đầu học tại lớp
          </label>

          <input
            type="date"
            value={
              NgayBatDau
            }
            onChange={
              (Event) =>
                SetNgayBatDau(
                  Event.target.value,
                )
            }
            max={
              LayNgayHomNay()
            }
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <p className="mt-1 text-xs text-slate-500">
            Chọn ngày học sinh bắt đầu thuộc lớp này.
          </p>

          <button
            type="submit"
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Xếp lớp
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">
          Danh sách lớp
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-3 py-3">
                  Năm học
                </th>
                <th className="px-3 py-3">
                  Khối
                </th>
                <th className="px-3 py-3">
                  Lớp
                </th>
                <th className="px-3 py-3">
                  Số lượt xếp lớp
                </th>
                <th className="px-3 py-3">
                  Phân công
                </th>
              </tr>
            </thead>

            <tbody>
              {LopHoc.map(
                (Item) => (
                  <tr
                    key={
                      Item.id
                    }
                    className="border-b"
                  >
                    <td className="px-3 py-3">
                      {
                        Item.nam_hoc
                          .ten_nam_hoc
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item.khoi
                          .ten_khoi
                      }
                    </td>

                    <td className="px-3 py-3 font-medium">
                      {
                        Item.ten_lop
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item._count
                          .xep_lop
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item._count
                          .phan_cong_giao_vien
                      }
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
