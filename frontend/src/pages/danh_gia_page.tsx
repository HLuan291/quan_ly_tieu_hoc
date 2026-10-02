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
  docJwt,
} from '../auth/auth';

import {
  layThongBaoLoi,
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
    khoi: Khoi;
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
  const nguoiDung =
    docJwt();

  const laAdmin =
    nguoiDung?.vai_tro ===
    'ADMIN';

  const laGiaoVien =
    nguoiDung?.vai_tro ===
    'GIAO_VIEN';

  const [
    loi,
    setLoi,
  ] = useState('');

  const [
    namHoc,
    setNamHoc,
  ] = useState<NamHoc[]>([]);

  const [
    khoi,
    setKhoi,
  ] = useState<Khoi[]>([]);

  const [
    monHoc,
    setMonHoc,
  ] = useState<MonHoc[]>([]);

  const [
    dotDanhGia,
    setDotDanhGia,
  ] = useState<DotDanhGia[]>([]);

  const [
    phanCong,
    setPhanCong,
  ] = useState<PhanCong[]>([]);

  const [
    lopHocId,
    setLopHocId,
  ] = useState('');

  const [
    hocSinh,
    setHocSinh,
  ] = useState<HocSinhDanhGia[]>([]);

  const [
    hocSinhId,
    setHocSinhId,
  ] = useState('');

  const [
    dotId,
    setDotId,
  ] = useState('');

  const [
    monId,
    setMonId,
  ] = useState('');

  const [
    cauHinhDiem,
    setCauHinhDiem,
  ] = useState<CauHinhDiem[]>([]);

  const [
    cauHinhDiemId,
    setCauHinhDiemId,
  ] = useState('');

  const [
    diem,
    setDiem,
  ] = useState('');

  const [
    ngayKiemTra,
    setNgayKiemTra,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10),
  );

  const [
    mucDanhGia,
    setMucDanhGia,
  ] = useState('');

  const [
    nhanXet,
    setNhanXet,
  ] = useState('');

  const [
    tieuChi,
    setTieuChi,
  ] = useState<TieuChi[]>([]);

  const [
    tieuChiId,
    setTieuChiId,
  ] = useState('');

  const [
    mucNangLuc,
    setMucNangLuc,
  ] = useState('');

  const [
    adminNamHocId,
    setAdminNamHocId,
  ] = useState('');

  const [
    adminMaDot,
    setAdminMaDot,
  ] = useState('GIUA_HK1');

  const [
    adminTenDot,
    setAdminTenDot,
  ] = useState('');

  const [
    adminHocKy,
    setAdminHocKy,
  ] = useState('HK1');

  const [
    adminThuTu,
    setAdminThuTu,
  ] = useState('1');

  const [
    adminDotId,
    setAdminDotId,
  ] = useState('');

  const [
    adminKhoiId,
    setAdminKhoiId,
  ] = useState('');

  const [
    adminMonId,
    setAdminMonId,
  ] = useState('');

  const [
    adminMaLoaiDiem,
    setAdminMaLoaiDiem,
  ] = useState('');

  const [
    adminTenLoaiDiem,
    setAdminTenLoaiDiem,
  ] = useState('');

  const [
    adminCachNhap,
    setAdminCachNhap,
  ] = useState('NHAP_TAY');

  const [
    adminTieuChiMa,
    setAdminTieuChiMa,
  ] = useState('');

  const [
    adminTieuChiTen,
    setAdminTieuChiTen,
  ] = useState('');

  const [
    adminTieuChiNhom,
    setAdminTieuChiNhom,
  ] = useState('NANG_LUC');

  const taiDanhMuc =
    useCallback(
      async () => {
        try {
          setLoi('');

          const dotResponse =
            await api.get<DotDanhGia[]>(
              '/danh_gia_hoc_tap/dot_danh_gia',
            );

          setDotDanhGia(
            dotResponse.data,
          );

          const tieuChiResponse =
            await api.get<TieuChi[]>(
              '/danh_gia_hoc_tap/tieu_chi_danh_gia',
            );

          setTieuChi(
            tieuChiResponse.data,
          );

          if (laAdmin) {
            const [
              namResponse,
              khoiResponse,
              monResponse,
            ] =
              await Promise.all([
                api.get<NamHoc[]>(
                  '/to_chuc_lop_hoc/nam_hoc',
                ),

                api.get<Khoi[]>(
                  '/to_chuc_lop_hoc/khoi',
                ),

                api.get<MonHoc[]>(
                  '/phan_cong_giang_day/mon_hoc',
                ),
              ]);

            setNamHoc(
              namResponse.data,
            );

            setKhoi(
              khoiResponse.data,
            );

            setMonHoc(
              monResponse.data,
            );
          }

          if (laGiaoVien) {
            const response =
              await api.get<PhanCongCuaToiResponse>(
                '/phan_cong_giang_day/phan_cong/cua_toi',
              );

            setPhanCong(
              response.data.phan_cong,
            );
          }
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
        laGiaoVien,
      ],
    );

  useEffect(
    () => {
      void taiDanhMuc();
    },
    [
      taiDanhMuc,
    ],
  );

  const lopDuocPhanCong =
    useMemo(
      () => {
        const map =
          new Map<
            number,
            PhanCong['lop_hoc']
          >();

        phanCong.forEach(
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
        phanCong,
      ],
    );

  const monDuocDay =
    useMemo(
      () =>
        phanCong
          .filter(
            (item) =>
              String(
                item.lop_hoc_id,
              ) ===
                lopHocId &&
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
        phanCong,
        lopHocId,
      ],
    );

  async function taiHocSinhLop(
    id: string,
  ) {
    setLopHocId(
      id,
    );

    setHocSinh(
      [],
    );

    setHocSinhId('');

    if (!id) {
      return;
    }

    try {
      const response =
        await api.get<HocSinhLopResponse>(
          `/danh_gia_hoc_tap/lop/${id}/hoc_sinh`,
        );

      setHocSinh(
        response.data.hoc_sinh,
      );

      if (
        response.data.hoc_sinh[0]
      ) {
        setHocSinhId(
          String(
            response.data.hoc_sinh[0]
              .hoc_sinh.id,
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

  async function taiCauHinhDiem() {
    const lop =
      lopDuocPhanCong.find(
        (item) =>
          String(item.id) ===
          lopHocId,
      );

    if (
      !lop ||
      !dotId ||
      !monId
    ) {
      return;
    }

    try {
      const response =
        await api.get<CauHinhDiem[]>(
          '/danh_gia_hoc_tap/cau_hinh_diem',
          {
            params: {
              dot_danh_gia_id:
                Number(dotId),

              khoi_id:
                lop.khoi_id,

              mon_hoc_id:
                Number(monId),
            },
          },
        );

      setCauHinhDiem(
        response.data,
      );

      const nhapTay =
        response.data.find(
          (item) =>
            item.cach_nhap ===
            'NHAP_TAY',
        );

      setCauHinhDiemId(
        nhapTay
          ? String(
              nhapTay.id,
            )
          : '',
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function luuKetQuaMon(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      await api.put(
        '/danh_gia_hoc_tap/ket_qua_mon_hoc',
        {
          hoc_sinh_id:
            Number(
              hocSinhId,
            ),

          mon_hoc_id:
            Number(
              monId,
            ),

          dot_danh_gia_id:
            Number(
              dotId,
            ),

          muc_danh_gia:
            mucDanhGia,

          nhan_xet:
            nhanXet,
        },
      );

      window.alert(
        'Lưu kết quả môn học thành công',
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function luuDiem(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      await api.post(
        '/danh_gia_hoc_tap/diem_dinh_ky',
        {
          hoc_sinh_id:
            Number(
              hocSinhId,
            ),

          cau_hinh_diem_id:
            Number(
              cauHinhDiemId,
            ),

          diem:
            Number(
              diem,
            ),

          ngay_kiem_tra:
            ngayKiemTra,
        },
      );

      setDiem('');

      window.alert(
        'Nhập điểm thành công',
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function luuNangLuc(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoi('');

      await api.put(
        '/danh_gia_hoc_tap/nang_luc_pham_chat',
        {
          hoc_sinh_id:
            Number(
              hocSinhId,
            ),

          dot_danh_gia_id:
            Number(
              dotId,
            ),

          tieu_chi_danh_gia_id:
            Number(
              tieuChiId,
            ),

          muc_danh_gia:
            mucNangLuc,
        },
      );

      window.alert(
        'Lưu năng lực/phẩm chất thành công',
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function taoDot(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      await api.post(
        '/danh_gia_hoc_tap/dot_danh_gia',
        {
          nam_hoc_id:
            Number(
              adminNamHocId,
            ),

          ma_dot:
            adminMaDot,

          ten_dot:
            adminTenDot,

          hoc_ky:
            adminHocKy,

          thu_tu:
            Number(
              adminThuTu,
            ),
        },
      );

      setAdminTenDot('');
      await taiDanhMuc();
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function taoCauHinhMon(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      await api.post(
        '/danh_gia_hoc_tap/cau_hinh_danh_gia_mon',
        {
          dot_danh_gia_id:
            Number(
              adminDotId,
            ),

          khoi_id:
            Number(
              adminKhoiId,
            ),

          mon_hoc_id:
            Number(
              adminMonId,
            ),
        },
      );

      window.alert(
        'Đã cấu hình môn cho đợt đánh giá',
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function taoCauHinhDiem(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      await api.post(
        '/danh_gia_hoc_tap/cau_hinh_diem',
        {
          dot_danh_gia_id:
            Number(
              adminDotId,
            ),

          khoi_id:
            Number(
              adminKhoiId,
            ),

          mon_hoc_id:
            Number(
              adminMonId,
            ),

          ma_loai_diem:
            adminMaLoaiDiem,

          ten_hien_thi:
            adminTenLoaiDiem,

          bat_buoc:
            true,

          thu_tu_hien_thi:
            1,

          cach_nhap:
            adminCachNhap,
        },
      );

      setAdminMaLoaiDiem('');
      setAdminTenLoaiDiem('');

      window.alert(
        'Đã tạo cấu hình điểm',
      );
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  async function taoTieuChi(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      await api.post(
        '/danh_gia_hoc_tap/tieu_chi_danh_gia',
        {
          ma_tieu_chi:
            adminTieuChiMa,

          ten_tieu_chi:
            adminTieuChiTen,

          nhom_danh_gia:
            adminTieuChiNhom,

          thu_tu_hien_thi:
            tieuChi.length + 1,
        },
      );

      setAdminTieuChiMa('');
      setAdminTieuChiTen('');
      await taiDanhMuc();
    } catch (error: unknown) {
      setLoi(
        layThongBaoLoi(
          error,
        ),
      );
    }
  }

  if (laAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Cấu hình đánh giá học tập
        </h1>

        {loi && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {loi}
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <form
            onSubmit={
              taoDot
            }
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold">
              Tạo đợt đánh giá
            </h2>

            <select
              value={
                adminNamHocId
              }
              onChange={
                (event) =>
                  setAdminNamHocId(
                    event.target.value,
                  )
              }
              required
              className="mt-4 w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Chọn năm học
              </option>

              {namHoc.map(
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

            <select
              value={
                adminMaDot
              }
              onChange={
                (event) => {
                  const giaTri =
                    event.target.value;

                  setAdminMaDot(
                    giaTri,
                  );

                  setAdminHocKy(
                    giaTri.includes(
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

            <input
              value={
                adminTenDot
              }
              onChange={
                (event) =>
                  setAdminTenDot(
                    event.target.value,
                  )
              }
              placeholder="Tên đợt đánh giá"
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <input
              type="number"
              min="1"
              max="4"
              value={
                adminThuTu
              }
              onChange={
                (event) =>
                  setAdminThuTu(
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
              taoCauHinhMon
            }
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold">
              Cấu hình môn đánh giá
            </h2>

            <select
              value={
                adminDotId
              }
              onChange={
                (event) =>
                  setAdminDotId(
                    event.target.value,
                  )
              }
              required
              className="mt-4 w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Chọn đợt
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

            <select
              value={
                adminKhoiId
              }
              onChange={
                (event) =>
                  setAdminKhoiId(
                    event.target.value,
                  )
              }
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Chọn khối
              </option>

              {khoi.map(
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

            <select
              value={
                adminMonId
              }
              onChange={
                (event) =>
                  setAdminMonId(
                    event.target.value,
                  )
              }
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
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

            <button
              type="submit"
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Lưu cấu hình môn
            </button>
          </form>

          <form
            onSubmit={
              taoCauHinhDiem
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
                adminMaLoaiDiem
              }
              onChange={
                (event) =>
                  setAdminMaLoaiDiem(
                    event.target.value,
                  )
              }
              placeholder="Mã loại điểm, ví dụ DOC"
              required
              className="mt-4 w-full rounded-lg border px-3 py-2"
            />

            <input
              value={
                adminTenLoaiDiem
              }
              onChange={
                (event) =>
                  setAdminTenLoaiDiem(
                    event.target.value,
                  )
              }
              placeholder="Tên hiển thị"
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <select
              value={
                adminCachNhap
              }
              onChange={
                (event) =>
                  setAdminCachNhap(
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
              taoTieuChi
            }
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold">
              Tiêu chí năng lực / phẩm chất
            </h2>

            <input
              value={
                adminTieuChiMa
              }
              onChange={
                (event) =>
                  setAdminTieuChiMa(
                    event.target.value,
                  )
              }
              placeholder="Mã tiêu chí"
              required
              className="mt-4 w-full rounded-lg border px-3 py-2"
            />

            <input
              value={
                adminTieuChiTen
              }
              onChange={
                (event) =>
                  setAdminTieuChiTen(
                    event.target.value,
                  )
              }
              placeholder="Tên tiêu chí"
              required
              className="mt-3 w-full rounded-lg border px-3 py-2"
            />

            <select
              value={
                adminTieuChiNhom
              }
              onChange={
                (event) =>
                  setAdminTieuChiNhom(
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
                void taiHocSinhLop(
                  event.target.value,
                )
            }
            className="rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn lớp
            </option>

            {lopDuocPhanCong.map(
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
              hocSinhId
            }
            onChange={
              (event) =>
                setHocSinhId(
                  event.target.value,
                )
            }
            className="rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn học sinh
            </option>

            {hocSinh.map(
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

          <select
            value={
              dotId
            }
            onChange={
              (event) =>
                setDotId(
                  event.target.value,
                )
            }
            className="rounded-lg border px-3 py-2"
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

          <select
            value={
              monId
            }
            onChange={
              (event) => {
                setMonId(
                  event.target.value,
                );

                setCauHinhDiem(
                  [],
                );
              }
            }
            className="rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn môn được phân công
            </option>

            {monDuocDay.map(
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

        <button
          type="button"
          onClick={
            () =>
              void taiCauHinhDiem()
          }
          className="mt-3 rounded-lg border border-slate-300 px-4 py-2"
        >
          Tải cấu hình điểm
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <form
          onSubmit={
            luuKetQuaMon
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Kết quả môn học
          </h2>

          <input
            value={
              mucDanhGia
            }
            onChange={
              (event) =>
                setMucDanhGia(
                  event.target.value,
                )
            }
            placeholder="Mức đánh giá"
            required
            className="mt-4 w-full rounded-lg border px-3 py-2"
          />

          <textarea
            value={
              nhanXet
            }
            onChange={
              (event) =>
                setNhanXet(
                  event.target.value,
                )
            }
            placeholder="Nhận xét"
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
            luuDiem
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Điểm định kỳ
          </h2>

          <select
            value={
              cauHinhDiemId
            }
            onChange={
              (event) =>
                setCauHinhDiemId(
                  event.target.value,
                )
            }
            required
            className="mt-4 w-full rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn loại điểm nhập tay
            </option>

            {cauHinhDiem
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
                setDiem(
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
              ngayKiemTra
            }
            onChange={
              (event) =>
                setNgayKiemTra(
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
            luuNangLuc
          }
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">
            Năng lực / phẩm chất
          </h2>

          <select
            value={
              tieuChiId
            }
            onChange={
              (event) =>
                setTieuChiId(
                  event.target.value,
                )
            }
            required
            className="mt-4 w-full rounded-lg border px-3 py-2"
          >
            <option value="">
              Chọn tiêu chí
            </option>

            {tieuChi.map(
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
              mucNangLuc
            }
            onChange={
              (event) =>
                setMucNangLuc(
                  event.target.value,
                )
            }
            placeholder="Mức đánh giá"
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
