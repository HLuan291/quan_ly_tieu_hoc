import {
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

interface LopChuNhiem {
  id: number;
  lop_hoc_id: number;
  lop_hoc: {
    id: number;
    ten_lop: string;
    nam_hoc: {
      ten_nam_hoc: string;
    };
  };
}

interface SoDiemDanhItem {
  id: number;
  hoc_sinh: {
    id: number;
    ma_hoc_sinh: string;
    ho_ten: string;
  };
  diem_danh: Array<{
    trang_thai: string;
    ghi_chu: string | null;
  }>;
}

interface SoDiemDanhResponse {
  danh_sach: SoDiemDanhItem[];
}

interface DongDiemDanh {
  xep_lop_id: number;
  ma_hoc_sinh: string;
  ho_ten: string;
  trang_thai: string;
  ghi_chu: string;
}

export default function DiemDanhPage() {
  const [
    lopHoc,
    setLopHoc,
  ] = useState<LopChuNhiem[]>([]);

  const [
    lopHocId,
    setLopHocId,
  ] = useState('');

  const [
    ngayHoc,
    setNgayHoc,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [
    buoiHoc,
    setBuoiHoc,
  ] = useState('SANG');

  const [
    danhSach,
    setDanhSach,
  ] = useState<DongDiemDanh[]>([]);

  const [
    loi,
    setLoi,
  ] = useState('');

  useEffect(
    () => {
      async function taiLop() {
        try {
          const response =
            await api.get<LopChuNhiem[]>(
              '/diem_danh_nghi_hoc/lop_chu_nhiem_cua_toi',
            );

          setLopHoc(
            response.data,
          );

          if (
            response.data[0]
          ) {
            setLopHocId(
              String(
                response.data[0]
                  .lop_hoc_id,
              ),
            );
          }
        } catch (error: unknown) {
          setLoi(
            layThongBaoLoi(
              error,
            ),
          );
        }
      }

      void taiLop();
    },
    [],
  );

  async function taiSoDiemDanh() {
    if (!lopHocId) {
      return;
    }

    try {
      setLoi('');

      const response =
        await api.get<SoDiemDanhResponse>(
          '/diem_danh_nghi_hoc/diem_danh',
          {
            params: {
              lop_hoc_id:
                Number(lopHocId),

              ngay_hoc:
                ngayHoc,

              buoi_hoc:
                buoiHoc,
            },
          },
        );

      setDanhSach(
        response.data.danh_sach.map(
          (item) => ({
            xep_lop_id:
              item.id,

            ma_hoc_sinh:
              item.hoc_sinh
                .ma_hoc_sinh,

            ho_ten:
              item.hoc_sinh
                .ho_ten,

            trang_thai:
              item.diem_danh[0]
                ?.trang_thai ??
              '',

            ghi_chu:
              item.diem_danh[0]
                ?.ghi_chu ??
              '',
          }),
        ),
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function luuDiemDanh(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      danhSach.some(
        (item) =>
          !item.trang_thai
            .trim(),
      )
    ) {
      setLoi(
        'Hãy nhập trạng thái cho tất cả học sinh.',
      );
      return;
    }

    try {
      setLoi('');

      await api.post(
        '/diem_danh_nghi_hoc/diem_danh',
        {
          lop_hoc_id:
            Number(lopHocId),

          ngay_hoc:
            ngayHoc,

          buoi_hoc:
            buoiHoc,

          danh_sach:
            danhSach.map(
              (item) => ({
                xep_lop_id:
                  item.xep_lop_id,

                trang_thai:
                  item.trang_thai,

                ghi_chu:
                  item.ghi_chu,
              }),
            ),
        },
      );

      window.alert(
        'Lưu điểm danh thành công',
      );

      await taiSoDiemDanh();
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
        Điểm danh
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        GVCN điểm danh học sinh theo ngày và buổi học.
      </p>

      {loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {loi}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
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
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn lớp chủ nhiệm
            </option>

            {lopHoc.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.lop_hoc_id
                  }
                >
                  {
                    item.lop_hoc
                      .nam_hoc
                      .ten_nam_hoc
                  } - {
                    item.lop_hoc
                      .ten_lop
                  }
                </option>
              ),
            )}
          </select>

          <input
            type="date"
            value={
              ngayHoc
            }
            onChange={
              (event) =>
                setNgayHoc(
                  event.target.value,
                )
            }
            className="rounded-lg border border-slate-300 px-3 py-2"
          />

          <select
            value={
              buoiHoc
            }
            onChange={
              (event) =>
                setBuoiHoc(
                  event.target.value,
                )
            }
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="SANG">
              Sáng
            </option>
            <option value="CHIEU">
              Chiều
            </option>
          </select>

          <button
            type="button"
            onClick={
              () =>
                void taiSoDiemDanh()
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Tải sổ điểm danh
          </button>
        </div>
      </div>

      {danhSach.length > 0 && (
        <form
          onSubmit={
            luuDiemDanh
          }
          className="mt-6 rounded-xl bg-white p-5 shadow-sm"
        >
          <div className="overflow-x-auto">
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
                    Trạng thái
                  </th>
                  <th className="px-3 py-3">
                    Ghi chú
                  </th>
                </tr>
              </thead>

              <tbody>
                {danhSach.map(
                  (
                    item,
                    index,
                  ) => (
                    <tr
                      key={
                        item.xep_lop_id
                      }
                      className="border-b"
                    >
                      <td className="px-3 py-3">
                        {
                          item.ma_hoc_sinh
                        }
                      </td>

                      <td className="px-3 py-3">
                        {
                          item.ho_ten
                        }
                      </td>

                      <td className="px-3 py-3">
                        <input
                          value={
                            item.trang_thai
                          }
                          onChange={
                            (event) =>
                              setDanhSach(
                                (cu) =>
                                  cu.map(
                                    (
                                      dong,
                                      viTri,
                                    ) =>
                                      viTri ===
                                      index
                                        ? {
                                            ...dong,
                                            trang_thai:
                                              event
                                                .target
                                                .value,
                                          }
                                        : dong,
                                  ),
                              )
                          }
                          placeholder="Trạng thái theo quy ước trường"
                          className="w-56 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          value={
                            item.ghi_chu
                          }
                          onChange={
                            (event) =>
                              setDanhSach(
                                (cu) =>
                                  cu.map(
                                    (
                                      dong,
                                      viTri,
                                    ) =>
                                      viTri ===
                                      index
                                        ? {
                                            ...dong,
                                            ghi_chu:
                                              event
                                                .target
                                                .value,
                                          }
                                        : dong,
                                  ),
                              )
                          }
                          className="w-64 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
          >
            Lưu điểm danh
          </button>
        </form>
      )}
    </div>
  );
}
