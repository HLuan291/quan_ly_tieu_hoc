import {
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import api from '../api/api';

import {
  LayThongBaoLoi,
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
    LopHoc,
    SetLopHoc,
  ] = useState<LopChuNhiem[]>([]);

  const [
    LopHocId,
    SetLopHocId,
  ] = useState('');

  const [
    NgayHoc,
    SetNgayHoc,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [
    BuoiHoc,
    SetBuoiHoc,
  ] = useState('SANG');

  const [
    DanhSach,
    SetDanhSach,
  ] = useState<DongDiemDanh[]>([]);

  const [
    Loi,
    SetLoi,
  ] = useState('');

  useEffect(
    () => {
      async function TaiLop() {
        try {
          const Response =
            await api.get<LopChuNhiem[]>(
              '/diem_danh_nghi_hoc/lop_chu_nhiem_cua_toi',
            );

          SetLopHoc(
            Response.data,
          );

          if (
            Response.data[0]
          ) {
            SetLopHocId(
              String(
                Response.data[0]
                  .lop_hoc_id,
              ),
            );
          }
        } catch (Error: unknown) {
          SetLoi(
            LayThongBaoLoi(
              Error,
            ),
          );
        }
      }

      void TaiLop();
    },
    [],
  );

  async function TaiSoDiemDanh() {
    if (!LopHocId) {
      return;
    }

    try {
      SetLoi('');

      const Response =
        await api.get<SoDiemDanhResponse>(
          '/diem_danh_nghi_hoc/diem_danh',
          {
            params: {
              lop_hoc_id:
                Number(LopHocId),

              ngay_hoc:
                NgayHoc,

              buoi_hoc:
                BuoiHoc,
            },
          },
        );

      SetDanhSach(
        Response.data.danh_sach.map(
          (Item) => ({
            xep_lop_id:
              Item.id,

            ma_hoc_sinh:
              Item.hoc_sinh
                .ma_hoc_sinh,

            ho_ten:
              Item.hoc_sinh
                .ho_ten,

            trang_thai:
              Item.diem_danh[0]
                ?.trang_thai ??
              '',

            ghi_chu:
              Item.diem_danh[0]
                ?.ghi_chu ??
              '',
          }),
        ),
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function LuuDiemDanh(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    if (
      DanhSach.some(
        (Item) =>
          !Item.trang_thai
            .trim(),
      )
    ) {
      SetLoi(
        'Hãy nhập trạng thái cho tất cả học sinh.',
      );
      return;
    }

    try {
      SetLoi('');

      await api.post(
        '/diem_danh_nghi_hoc/diem_danh',
        {
          lop_hoc_id:
            Number(LopHocId),

          ngay_hoc:
            NgayHoc,

          buoi_hoc:
            BuoiHoc,

          danh_sach:
            DanhSach.map(
              (Item) => ({
                xep_lop_id:
                  Item.xep_lop_id,

                trang_thai:
                  Item.trang_thai,

                ghi_chu:
                  Item.ghi_chu,
              }),
            ),
        },
      );

      window.alert(
        'Lưu điểm danh thành công',
      );

      await TaiSoDiemDanh();
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
        Điểm danh
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        GVCN điểm danh học sinh theo ngày và buổi học.
      </p>

      {Loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {Loi}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Lớp chủ nhiệm
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
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn lớp chủ nhiệm
            </option>

            {LopHoc.map(
              (Item) => (
                <option
                  key={
                    Item.id
                  }
                  value={
                    Item.lop_hoc_id
                  }
                >
                  {
                    Item.lop_hoc
                      .nam_hoc
                      .ten_nam_hoc
                  } - {
                    Item.lop_hoc
                      .ten_lop
                  }
                </option>
              ),
            )}
          </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ngày học
            </label>

          <input
            type="date"
            value={
              NgayHoc
            }
            onChange={
              (Event) =>
                SetNgayHoc(
                  Event.target.value,
                )
            }
            max={
              new Date()
                .toISOString()
                .slice(0, 10)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Buổi học
            </label>

          <select
            value={
              BuoiHoc
            }
            onChange={
              (Event) =>
                SetBuoiHoc(
                  Event.target.value,
                )
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="SANG">
              Sáng
            </option>
            <option value="CHIEU">
              Chiều
            </option>
          </select>
          </div>

          <div className="flex items-end">
          <button
            type="button"
            onClick={
              () =>
                void TaiSoDiemDanh()
            }
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Tải sổ điểm danh
          </button>
          </div>
        </div>
      </div>

      {DanhSach.length > 0 && (
        <form
          onSubmit={
            LuuDiemDanh
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
                {DanhSach.map(
                  (
                    Item,
                    Index,
                  ) => (
                    <tr
                      key={
                        Item.xep_lop_id
                      }
                      className="border-b"
                    >
                      <td className="px-3 py-3">
                        {
                          Item.ma_hoc_sinh
                        }
                      </td>

                      <td className="px-3 py-3">
                        {
                          Item.ho_ten
                        }
                      </td>

                      <td className="px-3 py-3">
                        <input
                          value={
                            Item.trang_thai
                          }
                          onChange={
                            (Event) =>
                              SetDanhSach(
                                (Cu) =>
                                  Cu.map(
                                    (
                                      Dong,
                                      ViTri,
                                    ) =>
                                      ViTri ===
                                      Index
                                        ? {
                                            ...Dong,
                                            trang_thai:
                                              Event
                                                .target
                                                .value,
                                          }
                                        : Dong,
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
                            Item.ghi_chu
                          }
                          onChange={
                            (Event) =>
                              SetDanhSach(
                                (Cu) =>
                                  Cu.map(
                                    (
                                      Dong,
                                      ViTri,
                                    ) =>
                                      ViTri ===
                                      Index
                                        ? {
                                            ...Dong,
                                            ghi_chu:
                                              Event
                                                .target
                                                .value,
                                          }
                                        : Dong,
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
