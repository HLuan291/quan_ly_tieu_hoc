import {
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import Api from '../api/api';

import {
  DocJwt,
} from '../auth/auth';

import {
  LayThongBaoLoi,
} from '../utils/loi_api';

interface Con {
  Id: number;
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
  Id: number;
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
  Id: number;
  lop_hoc_id: number;
  lop_hoc: {
    Id: number;
    ten_lop: string;
    nam_hoc: {
      ten_nam_hoc: string;
    };
  };
}

export default function DonXinNghiPage() {
  const NguoiDung =
    DocJwt();

  const LaPhuHuynh =
    NguoiDung?.vai_tro ===
    'PHU_HUYNH';

  const LaGiaoVien =
    NguoiDung?.vai_tro ===
    'GIAO_VIEN';

  const [
    Con,
    SetCon,
  ] = useState<Con[]>([]);

  const [
    HocSinhId,
    SetHocSinhId,
  ] = useState('');

  const [
    NgayBatDau,
    SetNgayBatDau,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [
    NgayKetThuc,
    SetNgayKetThuc,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [
    BuoiNghi,
    SetBuoiNghi,
  ] = useState('CA_NGAY');

  const [
    LyDo,
    SetLyDo,
  ] = useState('');

  const [
    Don,
    SetDon,
  ] = useState<DonXinNghi[]>([]);

  const [
    Lop,
    SetLop,
  ] = useState<LopChuNhiem[]>([]);

  const [
    LopHocId,
    SetLopHocId,
  ] = useState('');

  const [
    Loi,
    SetLoi,
  ] = useState('');

  useEffect(
    () => {
      async function KhoiTao() {
        try {
          SetLoi('');

          if (LaPhuHuynh) {
            const [
              PhuHuynhResponse,
              DonResponse,
            ] =
              await Promise.all([
                Api.get<PhuHuynhMeResponse>(
                  '/ho_so_hoc_sinh/phu_huynh/me',
                ),

                Api.get<DonXinNghi[]>(
                  '/diem_danh_nghi_hoc/don_xin_nghi/cua_toi',
                ),
              ]);

            const DanhSachCon =
              PhuHuynhResponse.data
                .phu_huynh_hoc_sinh
                .map(
                  (Item) =>
                    Item.hoc_sinh,
                );

            SetCon(
              DanhSachCon,
            );

            if (
              DanhSachCon[0]
            ) {
              SetHocSinhId(
                String(
                  DanhSachCon[0].Id,
                ),
              );
            }

            SetDon(
              DonResponse.data,
            );
          }

          if (LaGiaoVien) {
            const Response =
              await Api.get<LopChuNhiem[]>(
                '/diem_danh_nghi_hoc/lop_chu_nhiem_cua_toi',
              );

            SetLop(
              Response.data,
            );

            if (
              Response.data[0]
            ) {
              const Id =
                String(
                  Response.data[0]
                    .lop_hoc_id,
                );

              SetLopHocId(
                Id,
              );

              await TaiDonCuaLop(
                Id,
              );
            }
          }
        } catch (Error: unknown) {
          SetLoi(
            LayThongBaoLoi(
              Error,
            ),
          );
        }
      }

      void KhoiTao();
    },
    [
      LaGiaoVien,
      LaPhuHuynh,
    ],
  );

  async function TaiDonCuaLop(
    Id: string,
  ) {
    if (!Id) {
      SetDon([]);
      return;
    }

    try {
      const Response =
        await Api.get<DonXinNghi[]>(
          `/diem_danh_nghi_hoc/don_xin_nghi/Lop/${Id}`,
        );

      SetDon(
        Response.data,
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function GuiDon(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      await Api.post(
        '/diem_danh_nghi_hoc/don_xin_nghi',
        {
          hoc_sinh_id:
            Number(
              HocSinhId,
            ),

          ngay_bat_dau:
            NgayBatDau,

          ngay_ket_thuc:
            NgayKetThuc,

          buoi_nghi:
            BuoiNghi,

          ly_do:
            LyDo,
        },
      );

      SetLyDo('');

      const Response =
        await Api.get<DonXinNghi[]>(
          '/diem_danh_nghi_hoc/don_xin_nghi/cua_toi',
        );

      SetDon(
        Response.data,
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function XuLyDon(
    Item: DonXinNghi,
    TrangThai: 'DA_DUYET' | 'TU_CHOI',
  ) {
    let LyDoTuChoi:
      string | undefined;

    if (
      TrangThai ===
      'TU_CHOI'
    ) {
      const GiaTri =
        window.prompt(
          'Nhập lý do từ chối',
        );

      if (!GiaTri) {
        return;
      }

      LyDoTuChoi =
        GiaTri;
    }

    try {
      SetLoi('');

      await Api.patch(
        `/diem_danh_nghi_hoc/don_xin_nghi/${Item.Id}/xu_ly`,
        {
          trang_thai:
            TrangThai,

          ly_do_tu_choi:
            LyDoTuChoi,
        },
      );

      await TaiDonCuaLop(
        LopHocId,
      );
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
        Đơn xin nghỉ
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        {LaPhuHuynh
          ? 'Phụ huynh gửi và theo dõi đơn xin nghỉ của Con.'
          : 'GVCN xem và xử lý đơn xin nghỉ của học sinh.'}
      </p>

      {Loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {Loi}
        </div>
      )}

      {LaPhuHuynh && (
        <form
          onSubmit={
            GuiDon
          }
          className="mt-6 rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Gửi đơn xin nghỉ
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
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
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">
                Chọn học sinh
              </option>

              {Con.map(
                (Item) => (
                  <option
                    key={
                      Item.Id
                    }
                    value={
                      Item.Id
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
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Buổi nghỉ
              </label>
            <select
              value={
                BuoiNghi
              }
              onChange={
                (Event) =>
                  SetBuoiNghi(
                    Event.target.value,
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
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Từ ngày
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
              min={
                new Date()
                  .toISOString()
                  .slice(0, 10)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Đến ngày
              </label>
            <input
              type="date"
              value={
                NgayKetThuc
              }
              onChange={
                (Event) =>
                  SetNgayKetThuc(
                    Event.target.value,
                  )
              }
              min={
                NgayBatDau
              }
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Lý do xin nghỉ
              </label>
            <textarea
              value={
                LyDo
              }
              onChange={
                (Event) =>
                  SetLyDo(
                    Event.target.value,
                  )
              }
              placeholder="VD: Học sinh bị sốt, cần nghỉ để theo dõi sức khỏe"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Gửi đơn
          </button>
        </form>
      )}

      {LaGiaoVien && (
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <label className="text-sm font-medium">
            Lớp chủ nhiệm
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

                void TaiDonCuaLop(
                  Event.target.value,
                );
              }
            }
            className="mt-2 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">
              Chọn lớp
            </option>

            {Lop.map(
              (Item) => (
                <option
                  key={
                    Item.Id
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
                {LaGiaoVien && (
                  <th className="px-3 py-3">
                    Xử lý
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {Don.map(
                (Item) => (
                  <tr
                    key={
                      Item.Id
                    }
                    className="border-b"
                  >
                    <td className="px-3 py-3">
                      {
                        Item.hoc_sinh
                          ?.ho_ten ??
                        Con.find(
                          (HocSinh) =>
                            HocSinh.Id ===
                            Item.hoc_sinh_id,
                        )
                          ?.ho_ten ??
                        Item.hoc_sinh_id
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item.ngay_bat_dau
                          .slice(
                            0,
                            10,
                          )
                      } - {
                        Item.ngay_ket_thuc
                          .slice(
                            0,
                            10,
                          )
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item.buoi_nghi
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item.ly_do
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        Item.trang_thai
                      }
                    </td>

                    {LaGiaoVien && (
                      <td className="px-3 py-3">
                        {Item.trang_thai ===
                          'CHO_DUYET' && (
                          <>
                            <button
                              type="button"
                              onClick={
                                () =>
                                  void XuLyDon(
                                    Item,
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
                                  void XuLyDon(
                                    Item,
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

          {Don.length === 0 && (
            <p className="py-6 text-center text-slate-500">
              Chưa có đơn xin nghỉ.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
