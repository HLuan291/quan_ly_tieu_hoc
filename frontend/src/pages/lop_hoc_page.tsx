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
  layThongBaoLoi,
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

export default function LopHocPage() {
  const [
    namHoc,
    setNamHoc,
  ] = useState<NamHoc[]>([]);

  const [
    khoi,
    setKhoi,
  ] = useState<Khoi[]>([]);

  const [
    lopHoc,
    setLopHoc,
  ] = useState<LopHoc[]>([]);

  const [
    hocSinhChuaXep,
    setHocSinhChuaXep,
  ] = useState<HocSinhChuaXep[]>([]);

  const [
    loi,
    setLoi,
  ] = useState('');

  const [
    tenNamHoc,
    setTenNamHoc,
  ] = useState('');

  const [
    tenLop,
    setTenLop,
  ] = useState('');

  const [
    namHocId,
    setNamHocId,
  ] = useState('');

  const [
    khoiId,
    setKhoiId,
  ] = useState('');

  const [
    hocSinhId,
    setHocSinhId,
  ] = useState('');

  const [
    lopHocId,
    setLopHocId,
  ] = useState('');

  const [
    ngayBatDau,
    setNgayBatDau,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const taiDuLieu =
    useCallback(
      async () => {
        try {
          setLoi('');

          const [
            namHocResponse,
            khoiResponse,
            lopResponse,
            hocSinhResponse,
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

          setNamHoc(
            namHocResponse.data,
          );

          setKhoi(
            khoiResponse.data,
          );

          setLopHoc(
            lopResponse.data,
          );

          setHocSinhChuaXep(
            hocSinhResponse.data,
          );
        } catch (error: unknown) {
          setLoi(
            layThongBaoLoi(
              error,
            ),
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      void taiDuLieu();
    },
    [
      taiDuLieu,
    ],
  );

  async function taoNamHoc(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      await api.post(
        '/to_chuc_lop_hoc/nam_hoc',
        {
          ten_nam_hoc:
            tenNamHoc,
        },
      );

      setTenNamHoc('');
      await taiDuLieu();
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function taoLop(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      await api.post(
        '/to_chuc_lop_hoc/lop_hoc',
        {
          nam_hoc_id:
            Number(
              namHocId,
            ),

          khoi_id:
            Number(
              khoiId,
            ),

          ten_lop:
            tenLop,
        },
      );

      setTenLop('');
      await taiDuLieu();
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function xepLop(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      await api.post(
        '/to_chuc_lop_hoc/xep_lop',
        {
          hoc_sinh_id:
            Number(
              hocSinhId,
            ),

          lop_hoc_id:
            Number(
              lopHocId,
            ),

          ngay_bat_dau:
            ngayBatDau,
        },
      );

      setHocSinhId('');
      await taiDuLieu();
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
      <h1 className="text-2xl font-bold text-slate-800">
        Tổ chức lớp học
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Quản lý năm học, lớp học và xếp học sinh vào lớp.
      </p>

      {loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {loi}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <form
          onSubmit={
            taoNamHoc
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Tạo năm học
          </h2>

          <input
            value={
              tenNamHoc
            }
            onChange={
              (event) =>
                setTenNamHoc(
                  event.target.value,
                )
            }
            placeholder="Ví dụ: 2026-2027"
            required
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <button
            type="submit"
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Tạo năm học
          </button>
        </form>

        <form
          onSubmit={
            taoLop
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Tạo lớp
          </h2>

          <select
            value={
              namHocId
            }
            onChange={
              (event) =>
                setNamHocId(
                  event.target.value,
                )
            }
            required
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn năm học
            </option>

            {namHoc.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {
                    item.ten_nam_hoc
                  }
                </option>
              ),
            )}
          </select>

          <select
            value={
              khoiId
            }
            onChange={
              (event) =>
                setKhoiId(
                  event.target.value,
                )
            }
            required
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn khối
            </option>

            {khoi.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {
                    item.ten_khoi
                  }
                </option>
              ),
            )}
          </select>

          <input
            value={
              tenLop
            }
            onChange={
              (event) =>
                setTenLop(
                  event.target.value,
                )
            }
            placeholder="Tên lớp"
            required
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
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
            xepLop
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Xếp học sinh vào lớp
          </h2>

          <select
            value={
              hocSinhId
            }
            onChange={
              (event) =>
                setHocSinhId(
                  event.target.value,
                )
            }
            required
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn học sinh
            </option>

            {hocSinhChuaXep.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {
                    item.ma_hoc_sinh
                  } - {
                    item.ho_ten
                  }
                </option>
              ),
            )}
          </select>

          <select
            value={
              lopHocId
            }
            onChange={
              (event) =>
                setLopHocId(
                  event.target.value,
                )
            }
            required
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn lớp
            </option>

            {lopHoc.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {
                    item.nam_hoc
                      .ten_nam_hoc
                  } - {
                    item.ten_lop
                  }
                </option>
              ),
            )}
          </select>

          <input
            type="date"
            value={
              ngayBatDau
            }
            onChange={
              (event) =>
                setNgayBatDau(
                  event.target.value,
                )
            }
            required
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
          />

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
              {lopHoc.map(
                (item) => (
                  <tr
                    key={
                      item.id
                    }
                    className="border-b"
                  >
                    <td className="px-3 py-3">
                      {
                        item.nam_hoc
                          .ten_nam_hoc
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item.khoi
                          .ten_khoi
                      }
                    </td>

                    <td className="px-3 py-3 font-medium">
                      {
                        item.ten_lop
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item._count
                          .xep_lop
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item._count
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
