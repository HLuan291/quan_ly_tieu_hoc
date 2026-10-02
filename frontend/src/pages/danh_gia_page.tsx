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
    diem,
    SetDiem,
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

          const dotResponse =
            await Api.get<DotDanhGia[]>(
              '/danh_gia_hoc_tap/dot_danh_gia',
            );

          SetDotDanhGia(
            dotResponse.data,
          );

          const tieuChiResponse =
            await Api.get<TieuChi[]>(
              '/danh_gia_hoc_tap/tieu_chi_danh_gia',
            );

          SetTieuChi(
            tieuChiResponse.data,
          );

          if (LaAdmin) {
            const [
              namResponse,
              khoiResponse,
              monResponse,
            ] =
              await Promise.all([
                Api.get<NamHoc[]>(
                  '/to_chuc_lop_hoc/nam_hoc',
                ),

                Api.get<Khoi[]>(
                  '/to_chuc_lop_hoc/Khoi',
                ),

                Api.get<MonHoc[]>(
                  '/phan_cong_giang_day/mon_hoc',
                ),
              ]);

            SetNamHoc(
              namResponse.data,
            );

            SetKhoi(
              khoiResponse.data,
            );

            SetMonHoc(
              monResponse.data,
            );
          }

          if (LaGiaoVien) {
            const response =
              await Api.get<PhanCongCuaToiResponse>(
                '/phan_cong_giang_day/phan_cong/cua_toi',
              );

            SetPhanCong(
              response.data.phan_cong,
            );
          }
        } catch (error: unknown) {
          SetLoi(
            LayThongBaoLoi(
              error,
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
        const map =
          new Map<
            number,
            PhanCong['lop_hoc']
          >();

        PhanCong.forEach(
          (item) => {
            map.set(
              item.lop_hoc.id,
              item.lop_hoc,
            );
          },
        );

        return [
          ...map.values(),
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
            (item) =>
              String(
                item.lop_hoc_id,
              ) ===
                LopHocId &&
              item.mon_hoc,
          )
          .map(
            (item) =>
              item.mon_hoc!,
          )
          .filter(
            (
              item,
              index,
              array,
            ) =>
              array.findIndex(
                (mon) =>
                  mon.id ===
                  item.id,
              ) === index,
          ),
      [
        PhanCong,
        LopHocId,
      ],
    );

  async function TaiHocSinhLop(
    id: string,
  ) {
    SetLopHocId(
      id,
    );

    SetHocSinh(
      [],
    );

    SetHocSinhId('');

    if (!id) {
      return;
    }

    try {
      const response =
        await Api.get<HocSinhLopResponse>(
          `/danh_gia_hoc_tap/lop/${id}/hoc_sinh`,
        );

      SetHocSinh(
        response.data.hoc_sinh,
      );

      if (
        response.data.hoc_sinh[0]
      ) {
        SetHocSinhId(
          String(
            response.data.hoc_sinh[0]
              .hoc_sinh.id,
          ),
        );
      }
    } catch (error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function TaiCauHinhDiem() {
    const lop =
      LopDuocPhanCong.find(
        (item) =>
          String(item.id) ===
          LopHocId,
      );

    if (
      !lop ||
      !DotId ||
      !MonId
    ) {
      return;
    }

    try {
      const response =
        await Api.get<CauHinhDiem[]>(
          '/danh_gia_hoc_tap/cau_hinh_diem',
          {
            params: {
              dot_danh_gia_id:
                Number(DotId),

              khoi_id:
                lop.khoi_id,

              mon_hoc_id:
                Number(MonId),
            },
          },
        );

      SetCauHinhDiem(
        response.data,
      );

      const NhapTay =
        response.data.find(
          (item) =>
            item.cach_nhap ===
            'NHAP_TAY',
        );

      SetCauHinhDiemId(
        NhapTay
          ? String(
              NhapTay.id,
            )
          : '',
      );
    } catch (error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function LuuKetQuaMon(
    event: FormEvent,
  ) {
    event.preventDefault();

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
    } catch (error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function LuuDiem(
    event: FormEvent,
  ) {
    event.preventDefault();

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
              diem,
            ),

          ngay_kiem_tra:
            NgayKiemTra,
        },
      );

      SetDiem('');

      window.alert(
        'Nhập điểm thành công',
      );
    } catch (error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function LuuNangLuc(
    event: FormEvent,
  ) {
    event.preventDefault();

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
    } catch (error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function TaoDot(
    event: FormEvent,
  ) {
    event.preventDefault();

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
    } catch (error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function TaoCauHinhMon(
    event: FormEvent,
  ) {
    event.preventDefault();

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
    } catch (error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function TaoCauHinhDiem(
    event: FormEvent,
  ) {
    event.preventDefault();

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
    } catch (error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function TaoTieuChi(
    event: FormEvent,
  ) {
    event.preventDefault();

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
    } catch (error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          error,
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
                (event) =>
                  SetAdminNamHocId(
                    event.target.value,
                  )
              }
              required
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Chọn năm học
              </option>

              {NamHoc.map(
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

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Loại đợt đánh giá
            </label>

            <select
              value={
                AdminMaDot
              }
              onChange={
                (event) => {
                  const GiaTri =
                    event.target.value;

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
                (event) =>
                  SetAdminTenDot(
                    event.target.value,
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
                (event) =>
                  SetAdminThuTu(
                    event.target.value,
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
                (event) =>
                  SetAdminDotId(
                    event.target.value,
                  )
              }
              required
              className="mt-4 w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Chọn đợt
              </option>

              {DotDanhGia.map(
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

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Khối
            </label>

            <select
              value={
                AdminKhoiId
              }
              onChange={
                (event) =>
                  SetAdminKhoiId(
                    event.target.value,
                  )
              }
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Chọn khối
              </option>

              {Khoi.map(
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

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Môn học
            </label>

            <select
              value={
                AdminMonId
              }
              onChange={
                (event) =>
                  SetAdminMonId(
                    event.target.value,
                  )
              }
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Chọn môn
              </option>

              {MonHoc.map(
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

            <input
              value={
                AdminMaLoaiDiem
              }
              onChange={
                (event) =>
                  SetAdminMaLoaiDiem(
                    event.target.value,
                  )
              }
              placeholder="Mã loại điểm, ví dụ DOC"
              required
              className="mt-4 w-full rounded-lg border px-3 py-2"
            />

            <input
              value={
                AdminTenLoaiDiem
              }
              onChange={
                (event) =>
                  SetAdminTenLoaiDiem(
                    event.target.value,
                  )
              }
              placeholder="Tên hiển thị"
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <select
              value={
                AdminCachNhap
              }
              onChange={
                (event) =>
                  SetAdminCachNhap(
                    event.target.value,
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

            <input
              value={
                AdminTieuChiMa
              }
              onChange={
                (event) =>
                  SetAdminTieuChiMa(
                    event.target.value,
                  )
              }
              placeholder="Mã tiêu chí"
              required
              className="mt-4 w-full rounded-lg border px-3 py-2"
            />

            <input
              value={
                AdminTieuChiTen
              }
              onChange={
                (event) =>
                  SetAdminTieuChiTen(
                    event.target.value,
                  )
              }
              placeholder="Tên tiêu chí"
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <select
              value={
                AdminTieuChiNhom
              }
              onChange={
                (event) =>
                  SetAdminTieuChiNhom(
                    event.target.value,
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
              (event) =>
                void TaiHocSinhLop(
                  event.target.value,
                )
            }
            className="rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn lớp
            </option>

            {LopDuocPhanCong.map(
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
              (event) =>
                SetHocSinhId(
                  event.target.value,
                )
            }
            className="rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn học sinh
            </option>

            {HocSinh.map(
              (item) => (
                <option
                  key={
                    item.hoc_sinh.id
                  }
                  value={
                    item.hoc_sinh.id
                  }
                >
                  {
                    item.hoc_sinh
                      .ma_hoc_sinh
                  } - {
                    item.hoc_sinh
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
              (event) =>
                SetDotId(
                  event.target.value,
                )
            }
            className="rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn đợt đánh giá
            </option>

            {DotDanhGia.map(
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
              (event) => {
                SetMonId(
                  event.target.value,
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

          <input
            value={
              MucDanhGia
            }
            onChange={
              (event) =>
                SetMucDanhGia(
                  event.target.value,
                )
            }
            placeholder="Nhập mức đánh giá theo quy định của trường"
            required
            className="mt-4 w-full rounded-lg border px-3 py-2"
          />

          <textarea
            value={
              NhanXet
            }
            onChange={
              (event) =>
                SetNhanXet(
                  event.target.value,
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

          <select
            value={
              CauHinhDiemId
            }
            onChange={
              (event) =>
                SetCauHinhDiemId(
                  event.target.value,
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
                (item) =>
                  item.cach_nhap ===
                  'NHAP_TAY',
              )
              .map(
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
                      item.ten_hien_thi
                    }
                  </option>
                ),
              )}
          </select>

          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={
              diem
            }
            onChange={
              (event) =>
                SetDiem(
                  event.target.value,
                )
            }
            placeholder="Điểm"
            required
            className="mt-3 w-full rounded-lg border px-3 py-2"
          />

          <input
            type="date"
            value={
              NgayKiemTra
            }
            onChange={
              (event) =>
                SetNgayKiemTra(
                  event.target.value,
                )
            }
            required
            className="mt-3 w-full rounded-lg border px-3 py-2"
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

          <select
            value={
              TieuChiId
            }
            onChange={
              (event) =>
                SetTieuChiId(
                  event.target.value,
                )
            }
            required
            className="mt-4 w-full rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn tiêu chí
            </option>

            {TieuChi.map(
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
                    item.nhom_danh_gia
                  } - {
                    item.ten_tieu_chi
                  }
                </option>
              ),
            )}
          </select>

          <input
            value={
              MucNangLuc
            }
            onChange={
              (event) =>
                SetMucNangLuc(
                  event.target.value,
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
