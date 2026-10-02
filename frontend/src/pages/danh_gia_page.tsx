import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import Api from '../Api/Api';

import {
  DocJwt,
} from '../auth/auth';

import {
  LayThongBaoLoi,
} from '../utils/loi_api';

interface NamHoc {
  id: number;
  ten_nam_hoc: string;
}

interface Khoi {
  id: number;
  ten_khoi: string;
}

interface MonHoc {
  id: number;
  ten_mon_hoc: string;
}

interface DotDanhGia {
  id: number;
  nam_hoc_id: number;
  ma_dot: string;
  ten_dot: string;
  hoc_ky: string;
  thu_tu: number;
  nam_hoc: NamHoc;
}

interface PhanCong {
  id: number;
  lop_hoc_id: number;
  mon_hoc_id: number | null;
  loai_phan_cong: string;
  lop_hoc: {
    id: number;
    ten_lop: string;
    khoi_id: number;
    nam_hoc: NamHoc;
    Khoi: Khoi;
  };
  mon_hoc: MonHoc | null;
}

interface PhanCongCuaToiResponse {
  phan_cong: PhanCong[];
}

interface HocSinhDanhGia {
  id: number;
  hoc_sinh: {
    id: number;
    ma_hoc_sinh: string;
    ho_ten: string;
  };
}

interface HocSinhLopResponse {
  lop_hoc: {
    id: number;
    ten_lop: string;
    khoi_id: number;
    nam_hoc_id: number;
  };
  hoc_sinh: HocSinhDanhGia[];
}

interface CauHinhDiem {
  id: number;
  ma_loai_diem: string;
  ten_hien_thi: string;
  cach_nhap: string;
  mon_hoc: MonHoc;
}

interface TieuChi {
  id: number;
  ma_tieu_chi: string;
  ten_tieu_chi: string;
  nhom_danh_gia: string;
}

export default function DanhGiaPage() {
  const NguoiDung =
    DocJwt();

  const LaAdmin =
    NguoiDung?.vai_tro ===
    'ADMIN';

  const LaGiaoVien =
    NguoiDung?.vai_tro ===
    'GIAO_VIEN';

  const [
    Loi,
    SetLoi,
  ] = useState('');

  const [
    NamHoc,
    SetNamHoc,
  ] = useState<NamHoc[]>([]);

  const [
    Khoi,
    SetKhoi,
  ] = useState<Khoi[]>([]);

  const [
    MonHoc,
    SetMonHoc,
  ] = useState<MonHoc[]>([]);

  const [
    DotDanhGia,
    SetDotDanhGia,
  ] = useState<DotDanhGia[]>([]);

  const [
    PhanCong,
    SetPhanCong,
  ] = useState<PhanCong[]>([]);

  const [
    LopHocId,
    SetLopHocId,
  ] = useState('');

  const [
    HocSinh,
    SetHocSinh,
  ] = useState<HocSinhDanhGia[]>([]);

  const [
    HocSinhId,
    SetHocSinhId,
  ] = useState('');

  const [
    DotId,
    SetDotId,
  ] = useState('');

  const [
    MonId,
    SetMonId,
  ] = useState('');

  const [
    CauHinhDiem,
    SetCauHinhDiem,
  ] = useState<CauHinhDiem[]>([]);

  const [
    CauHinhDiemId,
    SetCauHinhDiemId,
  ] = useState('');

  const [
    DiemNhap,
    SetDiemNhap,
  ] = useState('');

  const [
    NgayKiemTra,
    SetNgayKiemTra,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [
    MucDanhGia,
    SetMucDanhGia,
  ] = useState('');

  const [
    NhanXet,
    SetNhanXet,
  ] = useState('');

  const [
    TieuChi,
    SetTieuChi,
  ] = useState<TieuChi[]>([]);

  const [
    TieuChiId,
    SetTieuChiId,
  ] = useState('');

  const [
    MucNangLuc,
    SetMucNangLuc,
  ] = useState('');

  const [
    AdminNamHocId,
    SetAdminNamHocId,
  ] = useState('');

  const [
    AdminMaDot,
    SetAdminMaDot,
  ] = useState('GIUA_HK1');

  const [
    AdminTenDot,
    SetAdminTenDot,
  ] = useState('');

  const [
    AdminHocKy,
    SetAdminHocKy,
  ] = useState('HK1');

  const [
    AdminThuTu,
    SetAdminThuTu,
  ] = useState('1');

  const [
    AdminDotId,
    SetAdminDotId,
  ] = useState('');

  const [
    AdminKhoiId,
    SetAdminKhoiId,
  ] = useState('');

  const [
    AdminMonId,
    SetAdminMonId,
  ] = useState('');

  const [
    AdminMaLoaiDiem,
    SetAdminMaLoaiDiem,
  ] = useState('');

  const [
    AdminTenLoaiDiem,
    SetAdminTenLoaiDiem,
  ] = useState('');

  const [
    AdminCachNhap,
    SetAdminCachNhap,
  ] = useState('NHAP_TAY');

  const [
    AdminTieuChiMa,
    SetAdminTieuChiMa,
  ] = useState('');

  const [
    AdminTieuChiTen,
    SetAdminTieuChiTen,
  ] = useState('');

  const [
    AdminTieuChiNhom,
    SetAdminTieuChiNhom,
  ] = useState('NANG_LUC');

  const TaiDanhMuc =
    useCallback(
      async () => {
        try {
          SetLoi('');

          const DotResponse =
            await Api.get<DotDanhGia[]>(
              '/danh_gia_hoc_tap/dot_danh_gia',
            );

          SetDotDanhGia(
            DotResponse.data,
          );

          const TieuChiResponse =
            await Api.get<TieuChi[]>(
              '/danh_gia_hoc_tap/tieu_chi_danh_gia',
            );

          SetTieuChi(
            TieuChiResponse.data,
          );

          if (LaAdmin) {
            const [
              NamResponse,
              KhoiResponse,
              MonResponse,
            ] =
              await Promise.all([
                Api.get<NamHoc[]>(
                  '/to_chuc_lop_hoc/nam_hoc',
                ),

                Api.get<Khoi[]>(
                  '/to_chuc_lop_hoc/khoi',
                ),

                Api.get<MonHoc[]>(
                  '/phan_cong_giang_day/mon_hoc',
                ),
              ]);

            SetNamHoc(
              NamResponse.data,
            );

            SetKhoi(
              KhoiResponse.data,
            );

            SetMonHoc(
              MonResponse.data,
            );
          }

          if (LaGiaoVien) {
            const Response =
              await Api.get<PhanCongCuaToiResponse>(
                '/phan_cong_giang_day/phan_cong/cua_toi',
              );

            SetPhanCong(
              Response.data.phan_cong,
            );
          }
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
        LaGiaoVien,
      ],
    );

  useEffect(
    () => {
      void TaiDanhMuc();
    },
    [
      TaiDanhMuc,
    ],
  );

  const LopDuocPhanCong =
    useMemo(
      () => {
        const BanDo =
          new Map<
            number,
            PhanCong['lop_hoc']
          >();

        PhanCong.forEach(
          (Item) => {
            BanDo.set(
              Item.lop_hoc.id,
              Item.lop_hoc,
            );
          },
        );

        return [
          ...BanDo.values(),
        ];
      },
      [
        PhanCong,
      ],
    );

  const MonDuocDay =
    useMemo(
      () =>
        PhanCong
          .filter(
            (Item) =>
              String(
                Item.lop_hoc_id,
              ) ===
                LopHocId &&
              Item.mon_hoc,
          )
          .map(
            (Item) =>
              Item.mon_hoc!,
          )
          .filter(
            (
              Item,
              ViTri,
              DanhSachMon,
            ) =>
              DanhSachMon.findIndex(
                (Mon) =>
                  Mon.id ===
                  Item.id,
              ) === ViTri,
          ),
      [
        PhanCong,
        LopHocId,
      ],
    );

  async function TaiHocSinhLop(
    Id: string,
  ) {
    SetLopHocId(
      Id,
    );

    SetHocSinh(
      [],
    );

    SetHocSinhId('');

    if (!Id) {
      return;
    }

    try {
      const Response =
        await Api.get<HocSinhLopResponse>(
          `/danh_gia_hoc_tap/lop/${Id}/hoc_sinh`,
        );

      SetHocSinh(
        Response.data.hoc_sinh,
      );

      if (
        Response.data.hoc_sinh[0]
      ) {
        SetHocSinhId(
          String(
            Response.data.hoc_sinh[0]
              .hoc_sinh.id,
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

  async function TaiCauHinhDiem() {
    const Lop =
      LopDuocPhanCong.find(
        (Item) =>
          String(Item.id) ===
          LopHocId,
      );

    if (
      !Lop ||
      !DotId ||
      !MonId
    ) {
      return;
    }

    try {
      const Response =
        await Api.get<CauHinhDiem[]>(
          '/danh_gia_hoc_tap/cau_hinh_diem',
          {
            params: {
              dot_danh_gia_id:
                Number(DotId),

              khoi_id:
                Lop.khoi_id,

              mon_hoc_id:
                Number(MonId),
            },
          },
        );

      SetCauHinhDiem(
        Response.data,
      );

      const NhapTay =
        Response.data.find(
          (Item) =>
            Item.cach_nhap ===
            'NHAP_TAY',
        );

      SetCauHinhDiemId(
        NhapTay
          ? String(
              NhapTay.id,
            )
          : '',
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function LuuKetQuaMon(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      await Api.put(
        '/danh_gia_hoc_tap/ket_qua_mon_hoc',
        {
          hoc_sinh_id:
            Number(
              HocSinhId,
            ),

          mon_hoc_id:
            Number(
              MonId,
            ),

          dot_danh_gia_id:
            Number(
              DotId,
            ),

          muc_danh_gia:
            MucDanhGia,

          nhan_xet:
            NhanXet,
        },
      );

      window.alert(
        'Lưu kết quả môn học thành công',
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function LuuDiem(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      await Api.post(
        '/danh_gia_hoc_tap/diem_dinh_ky',
        {
          hoc_sinh_id:
            Number(
              HocSinhId,
            ),

          cau_hinh_diem_id:
            Number(
              CauHinhDiemId,
            ),

          diem:
            Number(
              DiemNhap,
            ),

          ngay_kiem_tra:
            NgayKiemTra,
        },
      );

      SetDiemNhap('');

      window.alert(
        'Nhập điểm thành công',
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function LuuNangLuc(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');

      await Api.put(
        '/danh_gia_hoc_tap/nang_luc_pham_chat',
        {
          hoc_sinh_id:
            Number(
              HocSinhId,
            ),

          dot_danh_gia_id:
            Number(
              DotId,
            ),

          tieu_chi_danh_gia_id:
            Number(
              TieuChiId,
            ),

          muc_danh_gia:
            MucNangLuc,
        },
      );

      window.alert(
        'Lưu năng lực/phẩm chất thành công',
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function TaoDot(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      await Api.post(
        '/danh_gia_hoc_tap/dot_danh_gia',
        {
          nam_hoc_id:
            Number(
              AdminNamHocId,
            ),

          ma_dot:
            AdminMaDot,

          ten_dot:
            AdminTenDot,

          hoc_ky:
            AdminHocKy,

          thu_tu:
            Number(
              AdminThuTu,
            ),
        },
      );

      SetAdminTenDot('');
      await TaiDanhMuc();
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function TaoCauHinhMon(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      await Api.post(
        '/danh_gia_hoc_tap/cau_hinh_danh_gia_mon',
        {
          dot_danh_gia_id:
            Number(
              AdminDotId,
            ),

          khoi_id:
            Number(
              AdminKhoiId,
            ),

          mon_hoc_id:
            Number(
              AdminMonId,
            ),
        },
      );

      window.alert(
        'Đã cấu hình môn cho đợt đánh giá',
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function TaoCauHinhDiem(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      await Api.post(
        '/danh_gia_hoc_tap/cau_hinh_diem',
        {
          dot_danh_gia_id:
            Number(
              AdminDotId,
            ),

          khoi_id:
            Number(
              AdminKhoiId,
            ),

          mon_hoc_id:
            Number(
              AdminMonId,
            ),

          ma_loai_diem:
            AdminMaLoaiDiem,

          ten_hien_thi:
            AdminTenLoaiDiem,

          bat_buoc:
            true,

          thu_tu_hien_thi:
            1,

          cach_nhap:
            AdminCachNhap,
        },
      );

      SetAdminMaLoaiDiem('');
      SetAdminTenLoaiDiem('');

      window.alert(
        'Đã tạo cấu hình điểm',
      );
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function TaoTieuChi(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      await Api.post(
        '/danh_gia_hoc_tap/tieu_chi_danh_gia',
        {
          ma_tieu_chi:
            AdminTieuChiMa,

          ten_tieu_chi:
            AdminTieuChiTen,

          nhom_danh_gia:
            AdminTieuChiNhom,

          thu_tu_hien_thi:
            TieuChi.length + 1,
        },
      );

      SetAdminTieuChiMa('');
      SetAdminTieuChiTen('');
      await TaiDanhMuc();
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  if (LaAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Cấu hình đánh giá học tập
        </h1>

        {Loi && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {Loi}
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <form
            onSubmit={
              TaoDot
            }
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold">
              Tạo đợt đánh giá
            </h2>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Năm học
            </label>

            <select
              value={
                AdminNamHocId
              }
              onChange={
                (Event) =>
                  SetAdminNamHocId(
                    Event.target.value,
                  )
              }
              required
              className="mt-1 w-full rounded-lg border px-3 py-2"
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
              Loại đợt đánh giá
            </label>

            <select
              value={
                AdminMaDot
              }
              onChange={
                (Event) => {
                  const GiaTri =
                    Event.target.value;

                  SetAdminMaDot(
                    GiaTri,
                  );

                  SetAdminHocKy(
                    GiaTri.includes(
                      'HK1',
                    )
                      ? 'HK1'
                      : 'HK2',
                  );
                }
              }
              className="mt-3 w-full rounded-lg border px-3 py-2"
            >
              <option value="GIUA_HK1">
                Giữa HK1
              </option>
              <option value="CUOI_HK1">
                Cuối HK1
              </option>
              <option value="GIUA_HK2">
                Giữa HK2
              </option>
              <option value="CUOI_NAM">
                Cuối năm
              </option>
            </select>

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Tên đợt đánh giá
            </label>

            <input
              value={
                AdminTenDot
              }
              onChange={
                (Event) =>
                  SetAdminTenDot(
                    Event.target.value,
                  )
              }
              placeholder="VD: Giữa học kỳ I năm học 2026-2027"
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Thứ tự hiển thị
            </label>

            <input
              type="number"
              min="1"
              max="4"
              value={
                AdminThuTu
              }
              onChange={
                (Event) =>
                  SetAdminThuTu(
                    Event.target.value,
                  )
              }
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <button
              type="submit"
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Tạo đợt
            </button>
          </form>

          <form
            onSubmit={
              TaoCauHinhMon
            }
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold">
              Cấu hình môn đánh giá
            </h2>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Đợt đánh giá
            </label>

            <select
              value={
                AdminDotId
              }
              onChange={
                (Event) =>
                  SetAdminDotId(
                    Event.target.value,
                  )
              }
              required
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Chọn đợt
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

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Khối
            </label>

            <select
              value={
                AdminKhoiId
              }
              onChange={
                (Event) =>
                  SetAdminKhoiId(
                    Event.target.value,
                  )
              }
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
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
              Môn học
            </label>

            <select
              value={
                AdminMonId
              }
              onChange={
                (Event) =>
                  SetAdminMonId(
                    Event.target.value,
                  )
              }
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Chọn môn
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

            <button
              type="submit"
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Lưu cấu hình môn
            </button>
          </form>

          <form
            onSubmit={
              TaoCauHinhDiem
            }
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold">
              Cấu hình điểm
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Dùng đợt, khối và môn đang chọn ở khung trên.
            </p>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Mã loại điểm
            </label>

            <input
              value={
                AdminMaLoaiDiem
              }
              onChange={
                (Event) =>
                  SetAdminMaLoaiDiem(
                    Event.target.value,
                  )
              }
              placeholder="VD: DOC, VIET, KT_DINH_KY"
              required
              className="mt-4 w-full rounded-lg border px-3 py-2"
            />

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Tên hiển thị
            </label>

            <input
              value={
                AdminTenLoaiDiem
              }
              onChange={
                (Event) =>
                  SetAdminTenLoaiDiem(
                    Event.target.value,
                  )
              }
              placeholder="VD: Điểm đọc, Điểm viết"
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Cách nhập điểm
            </label>

            <select
              value={
                AdminCachNhap
              }
              onChange={
                (Event) =>
                  SetAdminCachNhap(
                    Event.target.value,
                  )
              }
              className="mt-3 w-full rounded-lg border px-3 py-2"
            >
              <option value="NHAP_TAY">
                Nhập tay
              </option>
              <option value="TU_TINH">
                Tự tính
              </option>
            </select>

            <button
              type="submit"
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Tạo loại điểm
            </button>
          </form>

          <form
            onSubmit={
              TaoTieuChi
            }
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold">
              Tiêu chí năng lực / phẩm chất
            </h2>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Mã tiêu chí
            </label>

            <input
              value={
                AdminTieuChiMa
              }
              onChange={
                (Event) =>
                  SetAdminTieuChiMa(
                    Event.target.value,
                  )
              }
              placeholder="VD: TU_PHUC_VU, CHAM_HOC"
              required
              className="mt-4 w-full rounded-lg border px-3 py-2"
            />

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Tên tiêu chí
            </label>

            <input
              value={
                AdminTieuChiTen
              }
              onChange={
                (Event) =>
                  SetAdminTieuChiTen(
                    Event.target.value,
                  )
              }
              placeholder="VD: Tự phục vụ, Chăm học"
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Nhóm đánh giá
            </label>

            <select
              value={
                AdminTieuChiNhom
              }
              onChange={
                (Event) =>
                  SetAdminTieuChiNhom(
                    Event.target.value,
                  )
              }
              className="mt-3 w-full rounded-lg border px-3 py-2"
            >
              <option value="NANG_LUC">
                Năng lực
              </option>
              <option value="PHAM_CHAT">
                Phẩm chất
              </option>
            </select>

            <button
              type="submit"
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Tạo tiêu chí
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">
        Đánh giá học tập
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Giáo viên nhập nhận xét, điểm định kỳ và năng lực/phẩm chất.
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
              Lớp học
            </label>
          <select
            value={
              LopHocId
            }
            onChange={
              (Event) =>
                void TaiHocSinhLop(
                  Event.target.value,
                )
            }
            className="rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn lớp
            </option>

            {LopDuocPhanCong.map(
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
                    Item.ten_lop
                  }
                </option>
              ),
            )}
          </select>
          </div>

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
            className="rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn học sinh
            </option>

            {HocSinh.map(
              (Item) => (
                <option
                  key={
                    Item.hoc_sinh.id
                  }
                  value={
                    Item.hoc_sinh.id
                  }
                >
                  {
                    Item.hoc_sinh
                      .ma_hoc_sinh
                  } - {
                    Item.hoc_sinh
                      .ho_ten
                  }
                </option>
              ),
            )}
          </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Đợt đánh giá
            </label>
          <select
            value={
              DotId
            }
            onChange={
              (Event) =>
                SetDotId(
                  Event.target.value,
                )
            }
            className="rounded-lg border px-3 py-2"
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
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Môn học
            </label>
          <select
            value={
              MonId
            }
            onChange={
              (Event) => {
                SetMonId(
                  Event.target.value,
                );

                SetCauHinhDiem(
                  [],
                );
              }
            }
            className="rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn môn được phân công
            </option>

            {MonDuocDay.map(
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
          </div>
        </div>

        <button
          type="button"
          onClick={
            () =>
              void TaiCauHinhDiem()
          }
          className="mt-3 rounded-lg border border-slate-300 px-4 py-2"
        >
          Tải cấu hình điểm
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <form
          onSubmit={
            LuuKetQuaMon
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Kết quả môn học
          </h2>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Mức đánh giá môn học
          </label>

          <input
            value={
              MucDanhGia
            }
            onChange={
              (Event) =>
                SetMucDanhGia(
                  Event.target.value,
                )
            }
            placeholder="Nhập mức đánh giá theo quy định của trường"
            required
            className="mt-4 w-full rounded-lg border px-3 py-2"
          />

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Nhận xét
          </label>

          <textarea
            value={
              NhanXet
            }
            onChange={
              (Event) =>
                SetNhanXet(
                  Event.target.value,
                )
            }
            placeholder="Nhập nhận xét ngắn gọn, rõ ràng về học sinh"
            className="mt-3 w-full rounded-lg border px-3 py-2"
          />

          <button
            type="submit"
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Lưu nhận xét
          </button>
        </form>

        <form
          onSubmit={
            LuuDiem
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Điểm định kỳ
          </h2>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Loại điểm
          </label>

          <select
            value={
              CauHinhDiemId
            }
            onChange={
              (Event) =>
                SetCauHinhDiemId(
                  Event.target.value,
                )
            }
            required
            className="mt-4 w-full rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn loại điểm nhập tay
            </option>

            {CauHinhDiem
              .filter(
                (Item) =>
                  Item.cach_nhap ===
                  'NHAP_TAY',
              )
              .map(
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
                      Item.ten_hien_thi
                    }
                  </option>
                ),
              )}
          </select>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Điểm
          </label>

          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={
              DiemNhap
            }
            onChange={
              (Event) =>
                SetDiemNhap(
                  Event.target.value,
                )
            }
            placeholder="Điểm"
            required
            className="mt-3 w-full rounded-lg border px-3 py-2"
          />

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Ngày kiểm tra
          </label>

          <input
            type="date"
            value={
              NgayKiemTra
            }
            onChange={
              (Event) =>
                SetNgayKiemTra(
                  Event.target.value,
                )
            }
            max={
              new Date()
                .toISOString()
                .slice(0, 10)
            }
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />

          <button
            type="submit"
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Nhập điểm
          </button>
        </form>

        <form
          onSubmit={
            LuuNangLuc
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Năng lực / phẩm chất
          </h2>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Tiêu chí
          </label>

          <select
            value={
              TieuChiId
            }
            onChange={
              (Event) =>
                SetTieuChiId(
                  Event.target.value,
                )
            }
            required
            className="mt-4 w-full rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn tiêu chí
            </option>

            {TieuChi.map(
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
                    Item.nhom_danh_gia
                  } - {
                    Item.ten_tieu_chi
                  }
                </option>
              ),
            )}
          </select>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Mức đánh giá
          </label>

          <input
            value={
              MucNangLuc
            }
            onChange={
              (Event) =>
                SetMucNangLuc(
                  Event.target.value,
                )
            }
            placeholder="Nhập mức đánh giá theo quy định của trường"
            required
            className="mt-3 w-full rounded-lg border px-3 py-2"
          />

          <button
            type="submit"
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Lưu đánh giá
          </button>
        </form>
      </div>
    </div>
  );
}
