import {
  useEffect,
  useState,
} from 'react';

import api from '../api/api';

import {
  LayThongBaoLoi,
} from '../utils/loi_api';

interface Con {
  id: number;
  ma_hoc_sinh: string;
  ho_ten: string;
  ngay_sinh: string;
  trang_thai: string;
}

interface PhuHuynhMeResponse {
  id: number;
  ho_ten: string;
  so_dien_thoai: string;
  phu_huynh_hoc_sinh: Array<{
    moi_quan_he: string;
    hoc_sinh: Con;
  }>;
}

interface DotDanhGia {
  id: number;
  ten_dot: string;
  ma_dot: string;
  nam_hoc: {
    ten_nam_hoc: string;
  };
}

interface KetQuaResponse {
  ket_qua_mon_hoc: Array<{
    id: number;
    muc_danh_gia: string;
    nhan_xet: string | null;
    mon_hoc: {
      ten_mon_hoc: string;
    };
  }>;

  diem_dinh_ky: Array<{
    id: number;
    diem: string | number;
    cau_hinh_diem: {
      ten_hien_thi: string;
      mon_hoc: {
        ten_mon_hoc: string;
      };
    };
  }>;

  nang_luc_pham_chat: Array<{
    id: number;
    muc_danh_gia: string;
    nhan_xet: string | null;
    tieu_chi_danh_gia: {
      ten_tieu_chi: string;
      nhom_danh_gia: string;
    };
  }>;

  tong_ket_giao_duc: {
    muc_ket_qua_giao_duc?: string | null;
    ket_qua_hoan_thanh_lop?: string | null;
  } | null;
}

interface DiemDanhResponse {
  diem_danh: Array<{
    id: number;
    ngay_hoc: string;
    buoi_hoc: string;
    trang_thai: string;
    ghi_chu: string | null;
    xep_lop: {
      lop_hoc: {
        ten_lop: string;
      };
    };
  }>;
}

export default function ConCuaToiPage() {
  const [
    phuHuynh,
    setPhuHuynh,
  ] = useState<PhuHuynhMeResponse | null>(
    null,
  );

  const [
    hocSinhId,
    setHocSinhId,
  ] = useState('');

  const [
    dotDanhGia,
    setDotDanhGia,
  ] = useState<DotDanhGia[]>([]);

  const [
    dotDanhGiaId,
    setDotDanhGiaId,
  ] = useState('');

  const [
    ketQua,
    setKetQua,
  ] = useState<KetQuaResponse | null>(
    null,
  );

  const [
    diemDanh,
    setDiemDanh,
  ] = useState<DiemDanhResponse | null>(
    null,
  );

  const [
    loi,
    setLoi,
  ] = useState('');

  useEffect(
    () => {
      async function taiDuLieu() {
        try {
          const [
            phuHuynhResponse,
            dotResponse,
          ] =
            await Promise.all([
              api.get<PhuHuynhMeResponse>(
                '/ho_so_hoc_sinh/phu_huynh/me',
              ),

              api.get<DotDanhGia[]>(
                '/danh_gia_hoc_tap/dot_danh_gia',
              ),
            ]);

          setPhuHuynh(
            phuHuynhResponse.data,
          );

          setDotDanhGia(
            dotResponse.data,
          );

          const conDau =
            phuHuynhResponse.data
              .phu_huynh_hoc_sinh[0]
              ?.hoc_sinh;

          if (conDau) {
            setHocSinhId(
              String(
                conDau.id,
              ),
            );
          }

          if (
            dotResponse.data[0]
          ) {
            setDotDanhGiaId(
              String(
                dotResponse.data[0].id,
              ),
            );
          }
        } catch (error: unknown) {
          setLoi(
            LayThongBaoLoi(
              error,
            ),
          );
        }
      }

      void taiDuLieu();
    },
    [],
  );

  async function taiKetQua() {
    if (
      !hocSinhId ||
      !dotDanhGiaId
    ) {
      return;
    }

    try {
      setLoi('');

      const response =
        await api.get<KetQuaResponse>(
          `/danh_gia_hoc_tap/con/${hocSinhId}/dot/${dotDanhGiaId}`,
        );

      setKetQua(
        response.data,
      );
    } catch (error: unknown) {
      setLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function taiDiemDanh() {
    if (!hocSinhId) {
      return;
    }

    try {
      setLoi('');

      const response =
        await api.get<DiemDanhResponse>(
          `/diem_danh_nghi_hoc/diem_danh/con/${hocSinhId}`,
        );

      setDiemDanh(
        response.data,
      );
    } catch (error: unknown) {
      setLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  const danhSachCon =
    phuHuynh
      ?.phu_huynh_hoc_sinh
      .map(
        (item) =>
          item.hoc_sinh,
      ) ??
    [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">
        Con của tôi
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Xem thông tin học tập và điểm danh của học sinh được liên kết.
      </p>

      {loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {loi}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <p className="font-semibold">
          Phụ huynh: {
            phuHuynh?.ho_ten ??
            '...'
          }
        </p>

        <select
          value={
            hocSinhId
          }
          onChange={
            (event) => {
              setHocSinhId(
                event.target.value,
              );

              setKetQua(
                null,
              );

              setDiemDanh(
                null,
              );
            }
          }
          className="mt-4 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">
            Chọn học sinh
          </option>

          {danhSachCon.map(
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
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">
            Điểm danh
          </h2>

          <button
            type="button"
            onClick={
              () =>
                void taiDiemDanh()
            }
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Xem điểm danh
          </button>

          {diemDanh && (
            <div className="mt-4 max-h-80 overflow-auto">
              {diemDanh.diem_danh.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="border-b py-2 text-sm"
                  >
                    {
                      item.ngay_hoc
                        .slice(
                          0,
                          10,
                        )
                    } - {
                      item.buoi_hoc
                    } - {
                      item.trang_thai
                    } {
                      item.ghi_chu
                        ? `(${item.ghi_chu})`
                        : ''
                    }
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">
            Kết quả học tập
          </h2>

          <select
            value={
              dotDanhGiaId
            }
            onChange={
              (event) =>
                setDotDanhGiaId(
                  event.target.value,
                )
            }
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn đợt đánh giá
            </option>

            {dotDanhGia.map(
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
                    item.ten_dot
                  }
                </option>
              ),
            )}
          </select>

          <button
            type="button"
            onClick={
              () =>
                void taiKetQua()
            }
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Xem kết quả
          </button>
        </div>
      </div>

      {ketQua && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">
              Môn học
            </h2>

            {ketQua.ket_qua_mon_hoc.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="border-b py-3 text-sm"
                >
                  <strong>
                    {
                      item.mon_hoc
                        .ten_mon_hoc
                    }
                  </strong>
                  : {
                    item.muc_danh_gia
                  }

                  {item.nhan_xet && (
                    <span>
                      {' - '}
                      {
                        item.nhan_xet
                      }
                    </span>
                  )}
                </div>
              ),
            )}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">
              Điểm định kỳ
            </h2>

            {ketQua.diem_dinh_ky.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="border-b py-3 text-sm"
                >
                  {
                    item.cau_hinh_diem
                      .mon_hoc
                      .ten_mon_hoc
                  } - {
                    item.cau_hinh_diem
                      .ten_hien_thi
                  }: {' '}
                  <strong>
                    {
                      String(
                        item.diem,
                      )
                    }
                  </strong>
                </div>
              ),
            )}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">
              Năng lực / phẩm chất
            </h2>

            {ketQua.nang_luc_pham_chat.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="border-b py-3 text-sm"
                >
                  {
                    item.tieu_chi_danh_gia
                      .ten_tieu_chi
                  }: {' '}
                  <strong>
                    {
                      item.muc_danh_gia
                    }
                  </strong>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
