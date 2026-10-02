import {
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

interface Con {
  id: number;
  ma_hoc_sinh: string;
  ho_ten: string;
}

interface PhuHuynhMeResponse {
  phu_huynh_hoc_sinh: Array<{
    moi_quan_he: string;
    hoc_sinh: Con;
  }>;
}

interface DonXinNghi {
  id: number;
  hoc_sinh_id: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  buoi_nghi: string;
  ly_do: string;
  trang_thai: string;
  ly_do_tu_choi?: string | null;
  hoc_sinh?: Con;
  phu_huynh?: {
    ho_ten: string;
    so_dien_thoai: string;
  };
}

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

export default function DonXinNghiPage() {
  const nguoiDung =
    docJwt();

  const laPhuHuynh =
    nguoiDung?.vai_tro ===
    'PHU_HUYNH';

  const laGiaoVien =
    nguoiDung?.vai_tro ===
    'GIAO_VIEN';

  const [
    con,
    setCon,
  ] = useState<Con[]>([]);

  const [
    hocSinhId,
    setHocSinhId,
  ] = useState('');

  const [
    ngayBatDau,
    setNgayBatDau,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [
    ngayKetThuc,
    setNgayKetThuc,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [
    buoiNghi,
    setBuoiNghi,
  ] = useState('CA_NGAY');

  const [
    lyDo,
    setLyDo,
  ] = useState('');

  const [
    don,
    setDon,
  ] = useState<DonXinNghi[]>([]);

  const [
    lop,
    setLop,
  ] = useState<LopChuNhiem[]>([]);

  const [
    lopHocId,
    setLopHocId,
  ] = useState('');

  const [
    loi,
    setLoi,
  ] = useState('');

  useEffect(
    () => {
      async function khoiTao() {
        try {
          setLoi('');

          if (laPhuHuynh) {
            const [
              phuHuynhResponse,
              donResponse,
            ] =
              await Promise.all([
                api.get<PhuHuynhMeResponse>(
                  '/ho_so_hoc_sinh/phu_huynh/me',
                ),

                api.get<DonXinNghi[]>(
                  '/diem_danh_nghi_hoc/don_xin_nghi/cua_toi',
                ),
              ]);

            const danhSachCon =
              phuHuynhResponse.data
                .phu_huynh_hoc_sinh
                .map(
                  (item) =>
                    item.hoc_sinh,
                );

            setCon(
              danhSachCon,
            );

            if (
              danhSachCon[0]
            ) {
              setHocSinhId(
                String(
                  danhSachCon[0].id,
                ),
              );
            }

            setDon(
              donResponse.data,
            );
          }

          if (laGiaoVien) {
            const response =
              await api.get<LopChuNhiem[]>(
                '/diem_danh_nghi_hoc/lop_chu_nhiem_cua_toi',
              );

            setLop(
              response.data,
            );

            if (
              response.data[0]
            ) {
              const id =
                String(
                  response.data[0]
                    .lop_hoc_id,
                );

              setLopHocId(
                id,
              );

              await taiDonCuaLop(
                id,
              );
            }
          }
        } catch (error: unknown) {
          setLoi(
            layThongBaoLoi(
              error,
            ),
          );
        }
      }

      void khoiTao();
    },
    [
      laGiaoVien,
      laPhuHuynh,
    ],
  );

  async function taiDonCuaLop(
    id: string,
  ) {
    if (!id) {
      setDon([]);
      return;
    }

    try {
      const response =
        await api.get<DonXinNghi[]>(
          `/diem_danh_nghi_hoc/don_xin_nghi/lop/${id}`,
        );

      setDon(
        response.data,
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function guiDon(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      await api.post(
        '/diem_danh_nghi_hoc/don_xin_nghi',
        {
          hoc_sinh_id:
            Number(
              hocSinhId,
            ),

          ngay_bat_dau:
            ngayBatDau,

          ngay_ket_thuc:
            ngayKetThuc,

          buoi_nghi:
            buoiNghi,

          ly_do:
            lyDo,
        },
      );

      setLyDo('');

      const response =
        await api.get<DonXinNghi[]>(
          '/diem_danh_nghi_hoc/don_xin_nghi/cua_toi',
        );

      setDon(
        response.data,
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function xuLyDon(
    item: DonXinNghi,
    trangThai: 'DA_DUYET' | 'TU_CHOI',
  ) {
    let lyDoTuChoi:
      string | undefined;

    if (
      trangThai ===
      'TU_CHOI'
    ) {
      const giaTri =
        window.prompt(
          'Nhập lý do từ chối',
        );

      if (!giaTri) {
        return;
      }

      lyDoTuChoi =
        giaTri;
    }

    try {
      setLoi('');

      await api.patch(
        `/diem_danh_nghi_hoc/don_xin_nghi/${item.id}/xu_ly`,
        {
          trang_thai:
            trangThai,

          ly_do_tu_choi:
            lyDoTuChoi,
        },
      );

      await taiDonCuaLop(
        lopHocId,
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
      <h1 className="text-2xl font-bold text-slate-800">
        Đơn xin nghỉ
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        {laPhuHuynh
          ? 'Phụ huynh gửi và theo dõi đơn xin nghỉ của con.'
          : 'GVCN xem và xử lý đơn xin nghỉ của học sinh.'}
      </p>

      {loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {loi}
        </div>
      )}

      {laPhuHuynh && (
        <form
          onSubmit={
            guiDon
          }
          className="mt-6 rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Gửi đơn xin nghỉ
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
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
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">
                Chọn học sinh
              </option>

              {con.map(
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
                buoiNghi
              }
              onChange={
                (event) =>
                  setBuoiNghi(
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
              <option value="CA_NGAY">
                Cả ngày
              </option>
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
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <input
              type="date"
              value={
                ngayKetThuc
              }
              onChange={
                (event) =>
                  setNgayKetThuc(
                    event.target.value,
                  )
              }
              required
              className="rounded-lg border border-slate-300 px-3 py-2"
            />

            <textarea
              value={
                lyDo
              }
              onChange={
                (event) =>
                  setLyDo(
                    event.target.value,
                  )
              }
              placeholder="Lý do xin nghỉ"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
            />
          </div>

          <button
            type="submit"
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Gửi đơn
          </button>
        </form>
      )}

      {laGiaoVien && (
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <label className="text-sm font-medium">
            Lớp chủ nhiệm
          </label>

          <select
            value={
              lopHocId
            }
            onChange={
              (event) => {
                setLopHocId(
                  event.target.value,
                );

                void taiDonCuaLop(
                  event.target.value,
                );
              }
            }
            className="mt-2 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn lớp
            </option>

            {lop.map(
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
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">
          Danh sách đơn
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-3 py-3">
                  Học sinh
                </th>
                <th className="px-3 py-3">
                  Thời gian
                </th>
                <th className="px-3 py-3">
                  Buổi
                </th>
                <th className="px-3 py-3">
                  Lý do
                </th>
                <th className="px-3 py-3">
                  Trạng thái
                </th>
                {laGiaoVien && (
                  <th className="px-3 py-3">
                    Xử lý
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {don.map(
                (item) => (
                  <tr
                    key={
                      item.id
                    }
                    className="border-b"
                  >
                    <td className="px-3 py-3">
                      {
                        item.hoc_sinh
                          ?.ho_ten ??
                        con.find(
                          (hocSinh) =>
                            hocSinh.id ===
                            item.hoc_sinh_id,
                        )
                          ?.ho_ten ??
                        item.hoc_sinh_id
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item.ngay_bat_dau
                          .slice(
                            0,
                            10,
                          )
                      } - {
                        item.ngay_ket_thuc
                          .slice(
                            0,
                            10,
                          )
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item.buoi_nghi
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item.ly_do
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        item.trang_thai
                      }
                    </td>

                    {laGiaoVien && (
                      <td className="px-3 py-3">
                        {item.trang_thai ===
                          'CHO_DUYET' && (
                          <>
                            <button
                              type="button"
                              onClick={
                                () =>
                                  void xuLyDon(
                                    item,
                                    'DA_DUYET',
                                  )
                              }
                              className="mr-3 text-green-700 hover:underline"
                            >
                              Duyệt
                            </button>

                            <button
                              type="button"
                              onClick={
                                () =>
                                  void xuLyDon(
                                    item,
                                    'TU_CHOI',
                                  )
                              }
                              className="text-red-600 hover:underline"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {don.length === 0 && (
            <p className="py-6 text-center text-slate-500">
              Chưa có đơn xin nghỉ.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
