import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import api from '../api/api';

import {
  docJwt as DocJwt,
} from '../auth/auth';

import {
  layThongBaoLoi as LayThongBaoLoi,
} from '../utils/loi_api';

interface GiaoVien {
  id: number;
  ma_giao_vien: string;
  ho_ten: string;
}

interface Khoi {
  id: number;
  ten_khoi: string;
  so_khoi: number;
}

interface LopHoc {
  id: number;
  ten_lop: string;
  khoi_id: number;
  nam_hoc: {
    ten_nam_hoc: string;
  };
  khoi: Khoi;
}

interface MonHoc {
  id: number;
  ma_mon_hoc: string;
  ten_mon_hoc: string;
  trang_thai: string;
}

interface MonHocKhoi {
  id: number;
  mon_hoc_id: number;
  khoi_id: number;
  mac_dinh_gvcn: boolean;
  mon_hoc: MonHoc;
  khoi: Khoi;
}

interface PhanCong {
  id: number;
  giao_vien_id: number;
  lop_hoc_id: number;
  mon_hoc_id: number | null;
  loai_phan_cong: string;
  nguon_phan_cong: string | null;
  ngay_bat_dau: string;
  ngay_ket_thuc: string | null;
  giao_vien?: GiaoVien;
  lop_hoc: LopHoc;
  mon_hoc: MonHoc | null;
}

interface PhanCongCuaToiResponse {
  giao_vien: GiaoVien;
  phan_cong: PhanCong[];
}

function LayNgayHomNay() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

export default function PhanCongPage() {
  const NguoiDung =
    DocJwt();

  const LaAdmin =
    NguoiDung?.vai_tro ===
    'ADMIN';

  const [
    GiaoVien,
    SetGiaoVien,
  ] = useState<GiaoVien[]>([]);

  const [
    Khoi,
    SetKhoi,
  ] = useState<Khoi[]>([]);

  const [
    LopHoc,
    SetLopHoc,
  ] = useState<LopHoc[]>([]);

  const [
    MonHoc,
    SetMonHoc,
  ] = useState<MonHoc[]>([]);

  const [
    MonHocKhoi,
    SetMonHocKhoi,
  ] = useState<MonHocKhoi[]>([]);

  const [
    PhanCong,
    SetPhanCong,
  ] = useState<PhanCong[]>([]);

  const [
    Loi,
    SetLoi,
  ] = useState('');

  const [
    MaMonHoc,
    SetMaMonHoc,
  ] = useState('');

  const [
    TenMonHoc,
    SetTenMonHoc,
  ] = useState('');

  const [
    MonHocId,
    SetMonHocId,
  ] = useState('');

  const [
    KhoiId,
    SetKhoiId,
  ] = useState('');

  const [
    MacDinhGvcn,
    SetMacDinhGvcn,
  ] = useState(false);

  const [
    GiaoVienId,
    SetGiaoVienId,
  ] = useState('');

  const [
    LopHocId,
    SetLopHocId,
  ] = useState('');

  const [
    MonPhanCongId,
    SetMonPhanCongId,
  ] = useState('');

  const [
    LoaiPhanCong,
    SetLoaiPhanCong,
  ] = useState('GVBM');

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

          if (
            NguoiDung?.vai_tro ===
            'GIAO_VIEN'
          ) {
            const Response =
              await api.get<PhanCongCuaToiResponse>(
                '/phan_cong_giang_day/phan_cong/cua_toi',
              );

            SetPhanCong(
              Response.data.phan_cong,
            );

            return;
          }

          if (!LaAdmin) {
            return;
          }

          const [
            GiaoVienResponse,
            KhoiResponse,
            LopResponse,
            MonResponse,
            MonKhoiResponse,
            PhanCongResponse,
          ] =
            await Promise.all([
              api.get<{
                danh_sach: GiaoVien[];
              }>(
                '/giao_vien',
              ),

              api.get<Khoi[]>(
                '/to_chuc_lop_hoc/khoi',
              ),

              api.get<LopHoc[]>(
                '/to_chuc_lop_hoc/lop_hoc',
              ),

              api.get<MonHoc[]>(
                '/phan_cong_giang_day/mon_hoc',
              ),

              api.get<MonHocKhoi[]>(
                '/phan_cong_giang_day/mon_hoc_khoi',
              ),

              api.get<PhanCong[]>(
                '/phan_cong_giang_day/phan_cong',
              ),
            ]);

          SetGiaoVien(
            GiaoVienResponse.data
              .danh_sach,
          );

          SetKhoi(
            KhoiResponse.data,
          );

          SetLopHoc(
            LopResponse.data,
          );

          SetMonHoc(
            MonResponse.data,
          );

          SetMonHocKhoi(
            MonKhoiResponse.data,
          );

          SetPhanCong(
            PhanCongResponse.data,
          );
        } catch (Error: unknown) {
          SetLoi(
            LayThongBaoLoi(
              Error,
            ),
          );
        }
      },
      [
        LaAdmin,
        NguoiDung?.vai_tro,
      ],
    );

  useEffect(
    () => {
      void TaiDuLieu();
    },
    [
      TaiDuLieu,
    ],
  );

  const LopDangChon =
    useMemo(
      () =>
        LopHoc.find(
          (Item) =>
            String(
              Item.id,
            ) ===
            LopHocId,
        ),
      [
        LopHoc,
        LopHocId,
      ],
    );

  const MonDuocPhanCong =
    useMemo(
      () => {
        if (!LopDangChon) {
          return [];
        }

        const IdMonHopLe =
          new Set(
            MonHocKhoi
              .filter(
                (Item) =>
                  Item.khoi_id ===
                    LopDangChon.khoi_id &&
                  !Item.mac_dinh_gvcn,
              )
              .map(
                (Item) =>
                  Item.mon_hoc_id,
              ),
          );

        return MonHoc.filter(
          (Item) =>
            IdMonHopLe.has(
              Item.id,
            ),
        );
      },
      [
        LopDangChon,
        MonHoc,
        MonHocKhoi,
      ],
    );

  async function TaoMon(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      await api.post(
        '/phan_cong_giang_day/mon_hoc',
        {
          ma_mon_hoc:
            MaMonHoc.trim(),

          ten_mon_hoc:
            TenMonHoc.trim(),
        },
      );

      SetMaMonHoc('');
      SetTenMonHoc('');
      await TaiDuLieu();
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function GanMonKhoi(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      await api.post(
        '/phan_cong_giang_day/mon_hoc_khoi',
        {
          mon_hoc_id:
            Number(
              MonHocId,
            ),

          khoi_id:
            Number(
              KhoiId,
            ),

          mac_dinh_gvcn:
            MacDinhGvcn,
        },
      );

      await TaiDuLieu();
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function TaoPhanCong(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      if (
        LoaiPhanCong ===
        'GVCN_CHINH'
      ) {
        await api.post(
          '/phan_cong_giang_day/phan_cong/gvcn',
          {
            giao_vien_id:
              Number(
                GiaoVienId,
              ),

            lop_hoc_id:
              Number(
                LopHocId,
              ),

            ngay_bat_dau:
              NgayBatDau,
          },
        );
      } else {
        await api.post(
          '/phan_cong_giang_day/phan_cong/mon_hoc',
          {
            giao_vien_id:
              Number(
                GiaoVienId,
              ),

            lop_hoc_id:
              Number(
                LopHocId,
              ),

            mon_hoc_id:
              Number(
                MonPhanCongId,
              ),

            loai_phan_cong:
              LoaiPhanCong,

            ngay_bat_dau:
              NgayBatDau,
          },
        );
      }

      SetMonPhanCongId('');
      await TaiDuLieu();
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function KetThuc(
    Item: PhanCong,
  ) {
    const Ngay =
      window.prompt(
        'Ngày kết thúc (YYYY-MM-DD)',
        LayNgayHomNay(),
      );

    if (!Ngay) {
      return;
    }

    try {
      SetLoi('');

      await api.patch(
        `/phan_cong_giang_day/phan_cong/${Item.id}/ket_thuc`,
        {
          ngay_ket_thuc:
            Ngay,
        },
      );

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
        Phân công giảng dạy
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        {LaAdmin
          ? 'Cấu hình môn học và phân công giáo viên.'
          : 'Các phân công giảng dạy của bạn.'}
      </p>

      {Loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {Loi}
        </div>
      )}

      {LaAdmin && (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <form
              onSubmit={
                TaoMon
              }
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold">
                Tạo môn học
              </h2>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                Mã môn học
              </label>

              <input
                value={
                  MaMonHoc
                }
                onChange={
                  (Event) =>
                    SetMaMonHoc(
                      Event.target.value
                        .toUpperCase(),
                    )
                }
                placeholder="VD: TOAN, TV, TA"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <label className="mt-3 block text-sm font-medium text-slate-700">
                Tên môn học
              </label>

              <input
                value={
                  TenMonHoc
                }
                onChange={
                  (Event) =>
                    SetTenMonHoc(
                      Event.target.value,
                    )
                }
                placeholder="VD: Toán, Tiếng Việt, Tiếng Anh"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <button
                type="submit"
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                Tạo môn
              </button>
            </form>

            <form
              onSubmit={
                GanMonKhoi
              }
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold">
                Gắn môn cho khối
              </h2>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                Môn học
              </label>

              <select
                value={
                  MonHocId
                }
                onChange={
                  (Event) =>
                    SetMonHocId(
                      Event.target.value,
                    )
                }
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">
                  Chọn môn học
                </option>

                {MonHoc.map(
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
                        Item.ten_mon_hoc
                      }
                    </option>
                  ),
                )}
              </select>

              <label className="mt-3 block text-sm font-medium text-slate-700">
                Khối áp dụng
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

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    MacDinhGvcn
                  }
                  onChange={
                    (Event) =>
                      SetMacDinhGvcn(
                        Event.target.checked,
                      )
                  }
                />

                Môn mặc định do GVCN phụ trách
              </label>

              <button
                type="submit"
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                Lưu cấu hình
              </button>
            </form>

            <form
              onSubmit={
                TaoPhanCong
              }
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold">
                Tạo phân công
              </h2>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                Giáo viên
              </label>

              <select
                value={
                  GiaoVienId
                }
                onChange={
                  (Event) =>
                    SetGiaoVienId(
                      Event.target.value,
                    )
                }
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">
                  Chọn giáo viên
                </option>

                {GiaoVien.map(
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
                        Item.ma_giao_vien
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
                  (Event) => {
                    SetLopHocId(
                      Event.target.value,
                    );

                    SetMonPhanCongId('');
                  }
                }
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">
                  Chọn lớp học
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
                Loại phân công
              </label>

              <select
                value={
                  LoaiPhanCong
                }
                onChange={
                  (Event) => {
                    SetLoaiPhanCong(
                      Event.target.value,
                    );

                    SetMonPhanCongId('');
                  }
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="GVCN_CHINH">
                  Giáo viên chủ nhiệm chính
                </option>

                <option value="GVBM">
                  Giáo viên bộ môn
                </option>

                <option value="GVCN">
                  GVCN dạy môn bổ sung
                </option>
              </select>

              {LoaiPhanCong !==
                'GVCN_CHINH' && (
                <>
                  <label className="mt-3 block text-sm font-medium text-slate-700">
                    Môn được phân công
                  </label>

                  <select
                    value={
                      MonPhanCongId
                    }
                    onChange={
                      (Event) =>
                        SetMonPhanCongId(
                          Event.target.value,
                        )
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">
                      Chọn môn đã cấu hình cho khối của lớp
                    </option>

                    {MonDuocPhanCong.map(
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
                            Item.ten_mon_hoc
                          }
                        </option>
                      ),
                    )}
                  </select>
                </>
              )}

              <label className="mt-3 block text-sm font-medium text-slate-700">
                Ngày bắt đầu phân công
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
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <button
                type="submit"
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                Phân công
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">
              Cấu hình môn theo khối
            </h2>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {MonHocKhoi.map(
                (Item) => (
                  <span
                    key={
                      Item.id
                    }
                    className="rounded-full bg-slate-100 px-3 py-1"
                  >
                    {
                      Item.khoi
                        .ten_khoi
                    } - {
                      Item.mon_hoc
                        .ten_mon_hoc
                    } {
                      Item.mac_dinh_gvcn
                        ? '(GVCN)'
                        : ''
                    }
                  </span>
                ),
              )}
            </div>
          </div>
        </>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">
          Danh sách phân công
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                {LaAdmin && (
                  <th className="px-3 py-3">
                    Giáo viên
                  </th>
                )}

                <th className="px-3 py-3">
                  Lớp
                </th>
                <th className="px-3 py-3">
                  Môn
                </th>
                <th className="px-3 py-3">
                  Loại
                </th>
                <th className="px-3 py-3">
                  Bắt đầu
                </th>
                <th className="px-3 py-3">
                  Kết thúc
                </th>

                {LaAdmin && (
                  <th className="px-3 py-3">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {PhanCong.map(
                (Item) => (
                  <tr
                    key={
                      Item.id
                    }
                    className="border-b"
                  >
                    {LaAdmin && (
                      <td className="px-3 py-3">
                        {
                          Item.giao_vien
                            ?.ho_ten
                        }
                      </td>
                    )}

                    <td className="px-3 py-3">
                      {
                        Item.lop_hoc
                          .ten_lop
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item.mon_hoc
                          ?.ten_mon_hoc ??
                        'Chủ nhiệm'
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item.loai_phan_cong
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item.ngay_bat_dau
                          .slice(
                            0,
                            10,
                          )
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item.ngay_ket_thuc
                          ?.slice(
                            0,
                            10,
                          ) ??
                        'Đang hiệu lực'
                      }
                    </td>

                    {LaAdmin && (
                      <td className="px-3 py-3">
                        {!Item.ngay_ket_thuc && (
                          <button
                            type="button"
                            onClick={
                              () =>
                                void KetThuc(
                                  Item,
                                )
                            }
                            className="text-red-600 hover:underline"
                          >
                            Kết thúc
                          </button>
                        )}
                      </td>
                    )}
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
