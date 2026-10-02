import {
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';

import Api from '../api/api';
import { LayNhanQuyUoc, QuyUoc } from '../utils/quy_uoc_nghiep_vu';

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
  const LanTaiKetQua = useRef(0);
  const LanTaiDiemDanh = useRef(0);
  const [
    PhuHuynh,
    SetPhuHuynh,
  ] = useState<PhuHuynhMeResponse | null>(
    null,
  );

  const [
    HocSinhId,
    SetHocSinhId,
  ] = useState('');

  const [
    DotDanhGia,
    SetDotDanhGia,
  ] = useState<DotDanhGia[]>([]);

  const [
    DotDanhGiaId,
    SetDotDanhGiaId,
  ] = useState('');

  const [
    KetQua,
    SetKetQua,
  ] = useState<KetQuaResponse | null>(
    null,
  );

  const [
    DiemDanh,
    SetDiemDanh,
  ] = useState<DiemDanhResponse | null>(
    null,
  );

  const [
    Loi,
    SetLoi,
  ] = useState('');

  useEffect(
    () => {
      async function TaiDuLieu() {
        try {
          SetLoi('');

          const [
            PhuHuynhResponse,
            DotResponse,
          ] =
            await Promise.all([
              Api.get<PhuHuynhMeResponse>(
                '/ho_so_hoc_sinh/phu_huynh/me',
              ),

              Api.get<DotDanhGia[]>(
                '/danh_gia_hoc_tap/dot_danh_gia',
              ),
            ]);

          SetPhuHuynh(
            PhuHuynhResponse.data,
          );

          SetDotDanhGia(
            DotResponse.data,
          );

          const ConDau =
            PhuHuynhResponse.data
              .phu_huynh_hoc_sinh[0]
              ?.hoc_sinh;

          if (ConDau) {
            SetHocSinhId(
              String(
                ConDau.id,
              ),
            );
          }

          if (
            DotResponse.data[0]
          ) {
            SetDotDanhGiaId(
              String(
                DotResponse.data[0].id,
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

      void TaiDuLieu();
    },
    [],
  );

  const DanhSachCon =
    useMemo(
      () =>
        PhuHuynh
          ?.phu_huynh_hoc_sinh
          .map(
            (Item) =>
              Item.hoc_sinh,
          ) ??
        [],
      [
        PhuHuynh,
      ],
    );

  const ConDangChon =
    useMemo(
      () =>
        DanhSachCon.find(
          (Item) =>
            String(
              Item.id,
            ) ===
            HocSinhId,
        ),
      [
        DanhSachCon,
        HocSinhId,
      ],
    );

  async function TaiKetQua() {
    const LanTai = ++LanTaiKetQua.current;
    if (
      !HocSinhId ||
      !DotDanhGiaId
    ) {
      SetLoi(
        'Vui lòng chọn học sinh và đợt đánh giá.',
      );
      return;
    }

    try {
      SetLoi('');

      const Response =
        await Api.get<KetQuaResponse>(
          `/danh_gia_hoc_tap/con/${HocSinhId}/dot/${DotDanhGiaId}`,
        );

      if (LanTai !== LanTaiKetQua.current) return;
      SetKetQua(
        Response.data,
      );
    } catch (Error: unknown) {
      if (LanTai !== LanTaiKetQua.current) return;
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function TaiDiemDanh() {
    const LanTai = ++LanTaiDiemDanh.current;
    if (!HocSinhId) {
      SetLoi(
        'Vui lòng chọn học sinh.',
      );
      return;
    }

    try {
      SetLoi('');

      const Response =
        await Api.get<DiemDanhResponse>(
          `/diem_danh_nghi_hoc/diem_danh/con/${HocSinhId}`,
        );

      if (LanTai !== LanTaiDiemDanh.current) return;
      SetDiemDanh(
        Response.data,
      );
    } catch (Error: unknown) {
      if (LanTai !== LanTaiDiemDanh.current) return;
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
        Con của tôi
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Xem thông tin, điểm danh và kết quả học tập của học sinh được liên kết.
      </p>

      {Loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {Loi}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <p className="font-semibold">
          Phụ huynh: {
            PhuHuynh?.ho_ten ??
            'Đang tải...'
          }
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Số điện thoại: {
            PhuHuynh?.so_dien_thoai ??
            '...'
          }
        </p>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Chọn học sinh
        </label>

        <select
          value={
            HocSinhId
          }
          onChange={
            (Event) => {
              LanTaiKetQua.current++;
              LanTaiDiemDanh.current++;
              SetHocSinhId(
                Event.target.value,
              );

              SetKetQua(
                null,
              );

              SetDiemDanh(
                null,
              );
            }
          }
          className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">
            Chọn học sinh
          </option>

          {DanhSachCon.map(
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

        {ConDangChon && (
          <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-3">
            <div>
              <span className="text-slate-500">
                Mã học sinh:
              </span>{' '}
              <strong>
                {
                  ConDangChon.ma_hoc_sinh
                }
              </strong>
            </div>

            <div>
              <span className="text-slate-500">
                Ngày sinh:
              </span>{' '}
              <strong>
                {
                  ConDangChon.ngay_sinh
                    .slice(
                      0,
                      10,
                    )
                }
              </strong>
            </div>

            <div>
              <span className="text-slate-500">
                Trạng thái:
              </span>{' '}
              <strong>
                {
                  ConDangChon.trang_thai
                }
              </strong>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">
            Điểm danh
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Xem lịch sử điểm danh theo ngày và buổi học.
          </p>

          <button
            type="button"
            onClick={
              () =>
                void TaiDiemDanh()
            }
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Xem điểm danh
          </button>

          {DiemDanh && (
            <div className="mt-4 max-h-80 overflow-auto">
              {DiemDanh.diem_danh.length === 0 && (
                <p className="py-4 text-sm text-slate-500">
                  Chưa có dữ liệu điểm danh.
                </p>
              )}

              {DiemDanh.diem_danh.map(
                (Item) => (
                  <div
                    key={
                      Item.id
                    }
                    className="border-b py-2 text-sm"
                  >
                    <strong>
                      {
                        Item.ngay_hoc
                          .slice(
                            0,
                            10,
                          )
                      }
                    </strong>
                    {' - '}
                    {
                      Item.buoi_hoc
                    }
                    {' - '}
                    {
                      LayNhanQuyUoc(QuyUoc.DiemDanh, Item.trang_thai)
                    }
                    {' - Lớp '}
                    {
                      Item.xep_lop
                        .lop_hoc
                        .ten_lop
                    }

                    {Item.ghi_chu && (
                      <span>
                        {' - '}
                        {
                          Item.ghi_chu
                        }
                      </span>
                    )}
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

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Đợt đánh giá
          </label>

          <select
            value={
              DotDanhGiaId
            }
            onChange={
              (Event) => {
                LanTaiKetQua.current++;
                SetDotDanhGiaId(
                  Event.target.value,
                );

                SetKetQua(
                  null,
                );
              }
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn đợt đánh giá
            </option>

            {DotDanhGia.map(
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
                    Item.ten_dot
                  }
                </option>
              ),
            )}
          </select>

          <button
            type="button"
            onClick={
              () =>
                void TaiKetQua()
            }
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Xem kết quả
          </button>
        </div>
      </div>

      {KetQua && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">
              Kết quả môn học
            </h2>

            {KetQua.ket_qua_mon_hoc.length === 0 && (
              <p className="mt-3 text-sm text-slate-500">
                Chưa có kết quả môn học.
              </p>
            )}

            {KetQua.ket_qua_mon_hoc.map(
              (Item) => (
                <div
                  key={
                    Item.id
                  }
                  className="border-b py-3 text-sm"
                >
                  <strong>
                    {
                      Item.mon_hoc
                        .ten_mon_hoc
                    }
                  </strong>
                  : {
                    LayNhanQuyUoc(QuyUoc.DanhGiaMon, Item.muc_danh_gia)
                  }

                  {Item.nhan_xet && (
                    <span>
                      {' - '}
                      {
                        Item.nhan_xet
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

            {KetQua.diem_dinh_ky.length === 0 && (
              <p className="mt-3 text-sm text-slate-500">
                Chưa có điểm định kỳ.
              </p>
            )}

            {KetQua.diem_dinh_ky.map(
              (Item) => (
                <div
                  key={
                    Item.id
                  }
                  className="border-b py-3 text-sm"
                >
                  {
                    Item.cau_hinh_diem
                      .mon_hoc
                      .ten_mon_hoc
                  } - {
                    Item.cau_hinh_diem
                      .ten_hien_thi
                  }: {' '}
                  <strong>
                    {
                      String(
                        Item.diem,
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

            {KetQua.nang_luc_pham_chat.length === 0 && (
              <p className="mt-3 text-sm text-slate-500">
                Chưa có đánh giá năng lực/phẩm chất.
              </p>
            )}

            {KetQua.nang_luc_pham_chat.map(
              (Item) => (
                <div
                  key={
                    Item.id
                  }
                  className="border-b py-3 text-sm"
                >
                  {
                    Item.tieu_chi_danh_gia
                      .ten_tieu_chi
                  }: {' '}
                  <strong>
                    {
                      LayNhanQuyUoc(QuyUoc.NangLucPhamChat, Item.muc_danh_gia)
                    }
                  </strong>

                  {Item.nhan_xet && (
                    <span>
                      {' - '}
                      {
                        Item.nhan_xet
                      }
                    </span>
                  )}
                </div>
              ),
            )}
          </div>

          {KetQua.tong_ket_giao_duc && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="font-semibold">
                Tổng kết giáo dục
              </h2>

              <p className="mt-3 text-sm">
                Mức kết quả giáo dục:{' '}
                <strong>
                  {
                    KetQua.tong_ket_giao_duc
                      .muc_ket_qua_giao_duc ??
                    'Chưa có'
                  }
                </strong>
              </p>

              <p className="mt-2 text-sm">
                Kết quả hoàn thành lớp:{' '}
                <strong>
                  {
                    KetQua.tong_ket_giao_duc
                      .ket_qua_hoan_thanh_lop ??
                    'Chưa có'
                  }
                </strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
