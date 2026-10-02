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

interface GiaoVien {
  id: number;
  ma_giao_vien: string;
  ho_ten: string;
}

interface LopHoc {
  id: number;
  ten_lop: string;
  khoi_id: number;
  nam_hoc: {
    ten_nam_hoc: string;
  };
  khoi: {
    ten_khoi: string;
  };
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
  khoi: {
    id: number;
    ten_khoi: string;
  };
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

export default function PhanCongPage() {
  const nguoiDung =
    docJwt();

  const laAdmin =
    nguoiDung?.vai_tro ===
    'ADMIN';

  const [
    giaoVien,
    setGiaoVien,
  ] = useState<GiaoVien[]>([]);

  const [
    lopHoc,
    setLopHoc,
  ] = useState<LopHoc[]>([]);

  const [
    monHoc,
    setMonHoc,
  ] = useState<MonHoc[]>([]);

  const [
    monHocKhoi,
    setMonHocKhoi,
  ] = useState<MonHocKhoi[]>([]);

  const [
    phanCong,
    setPhanCong,
  ] = useState<PhanCong[]>([]);

  const [
    loi,
    setLoi,
  ] = useState('');

  const [
    maMonHoc,
    setMaMonHoc,
  ] = useState('');

  const [
    tenMonHoc,
    setTenMonHoc,
  ] = useState('');

  const [
    monHocId,
    setMonHocId,
  ] = useState('');

  const [
    khoiId,
    setKhoiId,
  ] = useState('');

  const [
    macDinhGvcn,
    setMacDinhGvcn,
  ] = useState(false);

  const [
    giaoVienId,
    setGiaoVienId,
  ] = useState('');

  const [
    lopHocId,
    setLopHocId,
  ] = useState('');

  const [
    monPhanCongId,
    setMonPhanCongId,
  ] = useState('');

  const [
    loaiPhanCong,
    setLoaiPhanCong,
  ] = useState('GVBM');

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

          if (
            nguoiDung?.vai_tro ===
            'GIAO_VIEN'
          ) {
            const response =
              await api.get<PhanCongCuaToiResponse>(
                '/phan_cong_giang_day/phan_cong/cua_toi',
              );

            setPhanCong(
              response.data.phan_cong,
            );

            return;
          }

          if (!laAdmin) {
            return;
          }

          const [
            giaoVienResponse,
            lopResponse,
            monResponse,
            monKhoiResponse,
            phanCongResponse,
          ] =
            await Promise.all([
              api.get<{
                danh_sach: GiaoVien[];
              }>(
                '/giao_vien',
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

          setGiaoVien(
            giaoVienResponse.data
              .danh_sach,
          );

          setLopHoc(
            lopResponse.data,
          );

          setMonHoc(
            monResponse.data,
          );

          setMonHocKhoi(
            monKhoiResponse.data,
          );

          setPhanCong(
            phanCongResponse.data,
          );
        } catch (error: unknown) {
          setLoi(
            layThongBaoLoi(
              error,
            ),
          );
        }
      },
      [
        laAdmin,
        nguoiDung?.vai_tro,
      ],
    );

  useEffect(
    () => {
      void taiDuLieu();
    },
    [
      taiDuLieu,
    ],
  );

  async function taoMon(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      await api.post(
        '/phan_cong_giang_day/mon_hoc',
        {
          ma_mon_hoc:
            maMonHoc,

          ten_mon_hoc:
            tenMonHoc,
        },
      );

      setMaMonHoc('');
      setTenMonHoc('');
      await taiDuLieu();
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function ganMonKhoi(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      await api.post(
        '/phan_cong_giang_day/mon_hoc_khoi',
        {
          mon_hoc_id:
            Number(monHocId),

          khoi_id:
            Number(khoiId),

          mac_dinh_gvcn:
            macDinhGvcn,
        },
      );

      await taiDuLieu();
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function taoPhanCong(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      if (
        loaiPhanCong ===
        'GVCN_CHINH'
      ) {
        await api.post(
          '/phan_cong_giang_day/phan_cong/gvcn',
          {
            giao_vien_id:
              Number(
                giaoVienId,
              ),

            lop_hoc_id:
              Number(
                lopHocId,
              ),

            ngay_bat_dau:
              ngayBatDau,
          },
        );
      } else {
        await api.post(
          '/phan_cong_giang_day/phan_cong/mon_hoc',
          {
            giao_vien_id:
              Number(
                giaoVienId,
              ),

            lop_hoc_id:
              Number(
                lopHocId,
              ),

            mon_hoc_id:
              Number(
                monPhanCongId,
              ),

            loai_phan_cong:
              loaiPhanCong,

            ngay_bat_dau:
              ngayBatDau,
          },
        );
      }

      await taiDuLieu();
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function ketThuc(
    item: PhanCong,
  ) {
    const ngay =
      window.prompt(
        'Ngày kết thúc (YYYY-MM-DD)',
        new Date()
          .toISOString()
          .slice(0, 10),
      );

    if (!ngay) {
      return;
    }

    try {
      setLoi('');

      await api.patch(
        `/phan_cong_giang_day/phan_cong/${item.id}/ket_thuc`,
        {
          ngay_ket_thuc:
            ngay,
        },
      );

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
        Phân công giảng dạy
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        {laAdmin
          ? 'Cấu hình môn học và phân công giáo viên.'
          : 'Các phân công giảng dạy của bạn.'}
      </p>

      {loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {loi}
        </div>
      )}

      {laAdmin && (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <form
              onSubmit={
                taoMon
              }
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold">
                Tạo môn học
              </h2>

              <input
                value={
                  maMonHoc
                }
                onChange={
                  (event) =>
                    setMaMonHoc(
                      event.target.value,
                    )
                }
                placeholder="Mã môn"
                required
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <input
                value={
                  tenMonHoc
                }
                onChange={
                  (event) =>
                    setTenMonHoc(
                      event.target.value,
                    )
                }
                placeholder="Tên môn"
                required
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
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
                ganMonKhoi
              }
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold">
                Gắn môn cho khối
              </h2>

              <select
                value={
                  monHocId
                }
                onChange={
                  (event) =>
                    setMonHocId(
                      event.target.value,
                    )
                }
                required
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">
                  Chọn môn
                </option>

                {monHoc.map(
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
                        item.ten_mon_hoc
                      }
                    </option>
                  ),
                )}
              </select>

              <input
                type="number"
                min="1"
                max="5"
                value={
                  khoiId
                }
                onChange={
                  (event) =>
                    setKhoiId(
                      event.target.value,
                    )
                }
                placeholder="ID khối"
                required
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <label className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    macDinhGvcn
                  }
                  onChange={
                    (event) =>
                      setMacDinhGvcn(
                        event.target.checked,
                      )
                  }
                />

                Mặc định do GVCN dạy
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
                taoPhanCong
              }
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold">
                Tạo phân công
              </h2>

              <select
                value={
                  giaoVienId
                }
                onChange={
                  (event) =>
                    setGiaoVienId(
                      event.target.value,
                    )
                }
                required
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">
                  Chọn giáo viên
                </option>

                {giaoVien.map(
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
                        item.ma_giao_vien
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

              <select
                value={
                  loaiPhanCong
                }
                onChange={
                  (event) =>
                    setLoaiPhanCong(
                      event.target.value,
                    )
                }
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="GVCN_CHINH">
                  GVCN chính
                </option>
                <option value="GVBM">
                  Giáo viên bộ môn
                </option>
                <option value="GVCN">
                  GVCN dạy môn bổ sung
                </option>
              </select>

              {loaiPhanCong !==
                'GVCN_CHINH' && (
                <select
                  value={
                    monPhanCongId
                  }
                  onChange={
                    (event) =>
                      setMonPhanCongId(
                        event.target.value,
                      )
                  }
                  required
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">
                    Chọn môn
                  </option>

                  {monHoc.map(
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
                          item.ten_mon_hoc
                        }
                      </option>
                    ),
                  )}
                </select>
              )}

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
                Phân công
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">
              Cấu hình môn theo khối
            </h2>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {monHocKhoi.map(
                (item) => (
                  <span
                    key={
                      item.id
                    }
                    className="rounded-full bg-slate-100 px-3 py-1"
                  >
                    {
                      item.khoi
                        .ten_khoi
                    } - {
                      item.mon_hoc
                        .ten_mon_hoc
                    } {
                      item.mac_dinh_gvcn
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
                {laAdmin && (
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
                {laAdmin && (
                  <th className="px-3 py-3">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {phanCong.map(
                (item) => (
                  <tr
                    key={
                      item.id
                    }
                    className="border-b"
                  >
                    {laAdmin && (
                      <td className="px-3 py-3">
                        {
                          item.giao_vien
                            ?.ho_ten
                        }
                      </td>
                    )}

                    <td className="px-3 py-3">
                      {
                        item.lop_hoc
                          .ten_lop
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item.mon_hoc
                          ?.ten_mon_hoc ??
                        'Chủ nhiệm'
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item.loai_phan_cong
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item.ngay_bat_dau
                          .slice(
                            0,
                            10,
                          )
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item.ngay_ket_thuc
                          ?.slice(
                            0,
                            10,
                          ) ??
                        'Đang hiệu lực'
                      }
                    </td>

                    {laAdmin && (
                      <td className="px-3 py-3">
                        {!item.ngay_ket_thuc && (
                          <button
                            type="button"
                            onClick={
                              () =>
                                void ketThuc(
                                  item,
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
