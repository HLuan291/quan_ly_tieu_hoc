import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
} from 'react';

import Api from '../api/api';

import {
  DocJwt,
} from '../auth/auth';

import {
  LayThongBaoLoi,
} from '../utils/loi_api';

interface XepLopTomTat {
  id: number;
  lop_hoc_id: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string | null;
  trang_thai: string;
}

interface HocSinh {
  id: number;
  ma_hoc_sinh: string;
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  so_dien_thoai_lien_he: string;
  trang_thai: string;
  chieu_cao_cm: string | number | null;
  can_nang_kg: string | number | null;
  ngay_do: string | null;
  xep_lop: XepLopTomTat[];
}

interface DanhSachResponse {
  tong_so: number;
  danh_sach: HocSinh[];
}

interface PhuHuynhMoi {
  ho_ten: string;
  nam_sinh: string;
  so_dien_thoai: string;
  nghe_nghiep: string;
  moi_quan_he: string;
  tao_tai_khoan: boolean;
}

interface HocSinhMoi {
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  dan_toc: string;
  quoc_tich: string;
  noi_sinh: string;
  so_dien_thoai_lien_he: string;
  dia_chi_thuong_tru: string;
  dia_chi_hien_tai: string;
  ngay_nhap_hoc: string;
  ghi_chu: string;
}

const HocSinhRong: HocSinhMoi = {
  ho_ten: '',
  ngay_sinh: '',
  gioi_tinh: '',
  dan_toc: 'Kinh',
  quoc_tich: 'Việt Nam',
  noi_sinh: '',
  so_dien_thoai_lien_he: '',
  dia_chi_thuong_tru: '',
  dia_chi_hien_tai: '',
  ngay_nhap_hoc: '',
  ghi_chu: '',
};

const PhuHuynhRong: PhuHuynhMoi = {
  ho_ten: '',
  nam_sinh: '',
  so_dien_thoai: '',
  nghe_nghiep: '',
  moi_quan_he: 'CHA',
  tao_tai_khoan: true,
};

const DanhSachDanToc = [
  'Kinh',
  'Tày',
  'Thái',
  'Hoa',
  'Khmer',
  'Mường',
  'Nùng',
  'H\'Mông',
  'Dao',
] as const;

function LayNgayHomNay() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function LayNamPhuHuynhToiDa() {
  return (
    new Date()
      .getFullYear() - 18
  );
}

export default function HocSinhPage() {
  const NguoiDung =
    DocJwt();

  const LaAdmin =
    NguoiDung?.vai_tro ===
    'ADMIN';

  const [
    DanhSach,
    SetDanhSach,
  ] = useState<HocSinh[]>([]);

  const [
    TuKhoa,
    SetTuKhoa,
  ] = useState('');

  const [
    Loi,
    SetLoi,
  ] = useState('');

  const [
    DangTai,
    SetDangTai,
  ] = useState(false);

  const [
    HienForm,
    SetHienForm,
  ] = useState(false);

  const [
    HocSinhMoi,
    SetHocSinhMoi,
  ] = useState<HocSinhMoi>(
    HocSinhRong,
  );

  const [
    PhuHuynhMoi,
    SetPhuHuynhMoi,
  ] = useState<PhuHuynhMoi>(
    PhuHuynhRong,
  );

  const [
    DanTocLuaChon,
    SetDanTocLuaChon,
  ] = useState('Kinh');

  const [
    DanTocKhac,
    SetDanTocKhac,
  ] = useState('');

  const [
    QuocTichLuaChon,
    SetQuocTichLuaChon,
  ] = useState('Việt Nam');

  const [
    QuocTichKhac,
    SetQuocTichKhac,
  ] = useState('');

  const [
    TaiKhoanMoi,
    SetTaiKhoanMoi,
  ] = useState<
    Array<{
      ten_dang_nhap: string;
      mat_khau_ban_dau: string;
      ho_ten: string;
    }>
  >([]);

  const TaiDanhSach =
    useCallback(
      async () => {
        try {
          SetDangTai(true);
          SetLoi('');

          const Response =
            await Api.get<DanhSachResponse>(
              '/ho_so_hoc_sinh/hoc_sinh',
              {
                params: {
                  ...(TuKhoa.trim()
                    ? {
                        tu_khoa:
                          TuKhoa.trim(),
                      }
                    : {}),
                },
              },
            );

          SetDanhSach(
            Response.data.danh_sach,
          );
        } catch (Error: unknown) {
          SetLoi(
            LayThongBaoLoi(
              Error,
            ),
          );
        } finally {
          SetDangTai(false);
        }
      },
      [
        TuKhoa,
      ],
    );

  useEffect(
    () => {
      void TaiDanhSach();
    },
    [
      TaiDanhSach,
    ],
  );

  function CapNhatHocSinh(
    Event:
      ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
      >,
  ) {
    const {
      name: TenTruong,
      value: GiaTri,
    } = Event.target;

    SetHocSinhMoi(
      (GiaTriCu) => ({
        ...GiaTriCu,
        [TenTruong]:
          GiaTri,
      }),
    );
  }

  function CapNhatSoDienThoaiHocSinh(
    Event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const SoDienThoai =
      Event.target.value
        .replace(
          /\D/g,
          '',
        )
        .slice(
          0,
          10,
        );

    SetHocSinhMoi(
      (GiaTriCu) => ({
        ...GiaTriCu,
        so_dien_thoai_lien_he:
          SoDienThoai,
      }),
    );
  }

  function CapNhatSoDienThoaiPhuHuynh(
    Event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const SoDienThoai =
      Event.target.value
        .replace(
          /\D/g,
          '',
        )
        .slice(
          0,
          10,
        );

    SetPhuHuynhMoi(
      (GiaTriCu) => ({
        ...GiaTriCu,
        so_dien_thoai:
          SoDienThoai,
      }),
    );
  }

  function CapNhatDanToc(
    Event:
      ChangeEvent<HTMLSelectElement>,
  ) {
    const GiaTri =
      Event.target.value;

    SetDanTocLuaChon(
      GiaTri,
    );

    if (
      GiaTri ===
      'Khác'
    ) {
      SetHocSinhMoi(
        (GiaTriCu) => ({
          ...GiaTriCu,
          dan_toc:
            DanTocKhac,
        }),
      );

      return;
    }

    SetDanTocKhac('');

    SetHocSinhMoi(
      (GiaTriCu) => ({
        ...GiaTriCu,
        dan_toc:
          GiaTri,
      }),
    );
  }

  function CapNhatDanTocKhac(
    Event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const GiaTri =
      Event.target.value;

    SetDanTocKhac(
      GiaTri,
    );

    SetHocSinhMoi(
      (GiaTriCu) => ({
        ...GiaTriCu,
        dan_toc:
          GiaTri,
      }),
    );
  }

  function CapNhatQuocTich(
    Event:
      ChangeEvent<HTMLSelectElement>,
  ) {
    const GiaTri =
      Event.target.value;

    SetQuocTichLuaChon(
      GiaTri,
    );

    if (
      GiaTri ===
      'Khác'
    ) {
      SetHocSinhMoi(
        (GiaTriCu) => ({
          ...GiaTriCu,
          quoc_tich:
            QuocTichKhac,
        }),
      );

      return;
    }

    SetQuocTichKhac('');

    SetHocSinhMoi(
      (GiaTriCu) => ({
        ...GiaTriCu,
        quoc_tich:
          GiaTri,
      }),
    );
  }

  function CapNhatQuocTichKhac(
    Event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const GiaTri =
      Event.target.value;

    SetQuocTichKhac(
      GiaTri,
    );

    SetHocSinhMoi(
      (GiaTriCu) => ({
        ...GiaTriCu,
        quoc_tich:
          GiaTri,
      }),
    );
  }

  async function TaoHocSinh(
    Event: FormEvent,
  ) {
    Event.preventDefault();

    try {
      SetLoi('');
      SetTaiKhoanMoi(
        [],
      );

      const Response =
        await Api.post(
          '/ho_so_hoc_sinh/hoc_sinh',
          {
            hoc_sinh: {
              ...HocSinhMoi,
            },

            phu_huynh: [
              {
                ho_ten:
                  PhuHuynhMoi.ho_ten,

                nam_sinh:
                  PhuHuynhMoi.nam_sinh
                    ? Number(
                        PhuHuynhMoi.nam_sinh,
                      )
                    : undefined,

                so_dien_thoai:
                  PhuHuynhMoi.so_dien_thoai,

                nghe_nghiep:
                  PhuHuynhMoi.nghe_nghiep,

                moi_quan_he:
                  PhuHuynhMoi.moi_quan_he,

                tao_tai_khoan:
                  PhuHuynhMoi.tao_tai_khoan,
              },
            ],
          },
        );

      SetTaiKhoanMoi(
        Response.data
          .tai_khoan_phu_huynh_moi ??
          [],
      );

      SetHocSinhMoi({
        ...HocSinhRong,
      });

      SetPhuHuynhMoi({
        ...PhuHuynhRong,
      });

      SetDanTocLuaChon(
        'Kinh',
      );

      SetDanTocKhac('');
      SetQuocTichLuaChon(
        'Việt Nam',
      );
      SetQuocTichKhac('');

      await TaiDanhSach();
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    }
  }

  async function CapNhatSucKhoe(
    HocSinhItem: HocSinh,
  ) {
    const ChieuCao =
      window.prompt(
        'Chiều cao (cm)',
        String(
          HocSinhItem.chieu_cao_cm ??
          '',
        ),
      );

    if (ChieuCao === null) {
      return;
    }

    const CanNang =
      window.prompt(
        'Cân nặng (kg)',
        String(
          HocSinhItem.can_nang_kg ??
          '',
        ),
      );

    if (CanNang === null) {
      return;
    }

    const NgayDo =
      window.prompt(
        'Ngày đo (YYYY-MM-DD)',
        LayNgayHomNay(),
      );

    if (!NgayDo) {
      return;
    }

    try {
      SetLoi('');

      await Api.patch(
        `/ho_so_hoc_sinh/hoc_sinh/${HocSinhItem.id}/suc_khoe`,
        {
          chieu_cao_cm:
            Number(
              ChieuCao,
            ),

          can_nang_kg:
            Number(
              CanNang,
            ),

          ngay_do:
            NgayDo,
        },
      );

      await TaiDanhSach();
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản lý học sinh
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Danh sách học sinh theo phạm vi quyền của tài khoản.
          </p>
        </div>

        {LaAdmin && (
          <button
            type="button"
            onClick={
              () =>
                SetHienForm(
                  (GiaTri) =>
                    !GiaTri,
                )
            }
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
          >
            {HienForm
              ? 'Đóng form'
              : 'Thêm học sinh'}
          </button>
        )}
      </div>

      {Loi && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {Loi}
        </div>
      )}

      {TaiKhoanMoi.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-semibold">
            Tài khoản phụ huynh vừa tạo
          </p>

          {TaiKhoanMoi.map(
            (TaiKhoan) => (
              <p
                key={
                  TaiKhoan.ten_dang_nhap
                }
                className="mt-1"
              >
                {TaiKhoan.ho_ten}: {' '}
                <strong>
                  {TaiKhoan.ten_dang_nhap}
                </strong>
                {' / '}
                <strong>
                  {TaiKhoan.mat_khau_ban_dau}
                </strong>
              </p>
            ),
          )}
        </div>
      )}

      {LaAdmin &&
        HienForm && (
        <form
          onSubmit={
            TaoHocSinh
          }
          className="mt-6 rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">
            Thông tin học sinh
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Họ tên
              </label>

              <input
                name="ho_ten"
                value={
                  HocSinhMoi.ho_ten
                }
                onChange={
                  CapNhatHocSinh
                }
                placeholder="VD: Nguyễn Văn An - viết hoa chữ cái đầu mỗi từ"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Ngày sinh
              </label>

              <input
                name="ngay_sinh"
                type="date"
                value={
                  HocSinhMoi.ngay_sinh
                }
                onChange={
                  CapNhatHocSinh
                }
                max={
                  LayNgayHomNay()
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <p className="mt-1 text-xs text-slate-500">
                Ngày sinh không được lớn hơn ngày hiện tại.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Giới tính
              </label>

              <select
                name="gioi_tinh"
                value={
                  HocSinhMoi.gioi_tinh
                }
                onChange={
                  CapNhatHocSinh
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">
                  Chọn giới tính
                </option>

                <option value="NAM">
                  Nam
                </option>

                <option value="NU">
                  Nữ
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nơi sinh
              </label>

              <input
                name="noi_sinh"
                value={
                  HocSinhMoi.noi_sinh
                }
                onChange={
                  CapNhatHocSinh
                }
                placeholder="VD: TP.Hồ Chí Minh"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Số điện thoại liên hệ
              </label>

              <input
                name="so_dien_thoai_lien_he"
                value={
                  HocSinhMoi.so_dien_thoai_lien_he
                }
                onChange={
                  CapNhatSoDienThoaiHocSinh
                }
                inputMode="numeric"
                minLength={10}
                maxLength={10}
                pattern="[0-9]{10}"
                title="Số điện thoại phải gồm đúng 10 chữ số"
                placeholder="Gồm đúng 10 số, VD: 0901234567"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Ngày nhập học
              </label>

              <input
                name="ngay_nhap_hoc"
                type="date"
                value={
                  HocSinhMoi.ngay_nhap_hoc
                }
                onChange={
                  CapNhatHocSinh
                }
                min={
                  HocSinhMoi.ngay_sinh ||
                  undefined
                }
                max={
                  LayNgayHomNay()
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <p className="mt-1 text-xs text-slate-500">
                Không được trước ngày sinh và không lớn hơn hôm nay.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Dân tộc
              </label>

              <select
                value={
                  DanTocLuaChon
                }
                onChange={
                  CapNhatDanToc
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {DanhSachDanToc.map(
                  (DanToc) => (
                    <option
                      key={
                        DanToc
                      }
                      value={
                        DanToc
                      }
                    >
                      {DanToc}
                    </option>
                  ),
                )}

                <option value="Khác">
                  Khác
                </option>
              </select>

              {DanTocLuaChon ===
                'Khác' && (
                <input
                  value={
                    DanTocKhac
                  }
                  onChange={
                    CapNhatDanTocKhac
                  }
                  placeholder="Nhập dân tộc khác"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Quốc tịch
              </label>

              <select
                value={
                  QuocTichLuaChon
                }
                onChange={
                  CapNhatQuocTich
                }
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="Việt Nam">
                  Việt Nam
                </option>

                <option value="Khác">
                  Khác
                </option>
              </select>

              {QuocTichLuaChon ===
                'Khác' && (
                <input
                  value={
                    QuocTichKhac
                  }
                  onChange={
                    CapNhatQuocTichKhac
                  }
                  placeholder="Nhập quốc tịch khác"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Địa chỉ thường trú
              </label>

              <input
                name="dia_chi_thuong_tru"
                value={
                  HocSinhMoi.dia_chi_thuong_tru
                }
                onChange={
                  CapNhatHocSinh
                }
                placeholder="VD: 123 Nguyễn Trãi, Quận 5, TP.HCM"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Địa chỉ hiện tại
              </label>

              <input
                name="dia_chi_hien_tai"
                value={
                  HocSinhMoi.dia_chi_hien_tai
                }
                onChange={
                  CapNhatHocSinh
                }
                placeholder="Địa chỉ đang sinh sống hiện tại"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Ghi chú
              </label>

              <textarea
                name="ghi_chu"
                value={
                  HocSinhMoi.ghi_chu
                }
                onChange={
                  CapNhatHocSinh
                }
                placeholder="Thông tin cần lưu ý về học sinh (nếu có)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <h2 className="mt-7 text-lg font-semibold">
            Phụ huynh / người giám hộ
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Họ tên phụ huynh
              </label>

              <input
                value={
                  PhuHuynhMoi.ho_ten
                }
                onChange={
                  (Event) =>
                    SetPhuHuynhMoi(
                      (GiaTriCu) => ({
                        ...GiaTriCu,
                        ho_ten:
                          Event.target.value,
                      }),
                    )
                }
                placeholder="VD: Nguyễn Văn Bình - viết hoa chữ cái đầu mỗi từ"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Số điện thoại phụ huynh
              </label>

              <input
                value={
                  PhuHuynhMoi.so_dien_thoai
                }
                onChange={
                  CapNhatSoDienThoaiPhuHuynh
                }
                inputMode="numeric"
                minLength={10}
                maxLength={10}
                pattern="[0-9]{10}"
                title="Số điện thoại phải gồm đúng 10 chữ số"
                placeholder="Gồm đúng 10 số, VD: 0912345678"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Năm sinh phụ huynh
              </label>

              <input
                type="number"
                min={1900}
                max={
                  LayNamPhuHuynhToiDa()
                }
                value={
                  PhuHuynhMoi.nam_sinh
                }
                onChange={
                  (Event) =>
                    SetPhuHuynhMoi(
                      (GiaTriCu) => ({
                        ...GiaTriCu,
                        nam_sinh:
                          Event.target.value,
                      }),
                    )
                }
                placeholder={`Từ 1900 đến ${LayNamPhuHuynhToiDa()}`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nghề nghiệp
              </label>

              <input
                value={
                  PhuHuynhMoi.nghe_nghiep
                }
                onChange={
                  (Event) =>
                    SetPhuHuynhMoi(
                      (GiaTriCu) => ({
                        ...GiaTriCu,
                        nghe_nghiep:
                          Event.target.value,
                      }),
                    )
                }
                placeholder="VD: Nhân viên văn phòng"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mối quan hệ
              </label>

              <select
                value={
                  PhuHuynhMoi.moi_quan_he
                }
                onChange={
                  (Event) =>
                    SetPhuHuynhMoi(
                      (GiaTriCu) => ({
                        ...GiaTriCu,
                        moi_quan_he:
                          Event.target.value,
                      }),
                    )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="CHA">
                  Cha
                </option>

                <option value="ME">
                  Mẹ
                </option>

                <option value="NGUOI_GIAM_HO">
                  Người giám hộ
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tài khoản đăng nhập
              </label>

              <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
                <input
                  type="checkbox"
                  checked={
                    PhuHuynhMoi.tao_tai_khoan
                  }
                  onChange={
                    (Event) =>
                      SetPhuHuynhMoi(
                        (GiaTriCu) => ({
                          ...GiaTriCu,
                          tao_tai_khoan:
                            Event.target.checked,
                        }),
                      )
                  }
                />

                Tạo tài khoản phụ huynh ngay
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
          >
            Lưu học sinh
          </button>
        </form>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <input
          value={
            TuKhoa
          }
          onChange={
            (Event) =>
              SetTuKhoa(
                Event.target.value,
              )
          }
          placeholder="Tìm theo mã, họ tên hoặc số điện thoại"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 md:max-w-lg"
        />

        <div className="mt-5 overflow-x-auto">
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
                  Ngày sinh
                </th>
                <th className="px-3 py-3">
                  SĐT
                </th>
                <th className="px-3 py-3">
                  Trạng thái
                </th>
                <th className="px-3 py-3">
                  Lớp gần nhất
                </th>

                {LaAdmin && (
                  <th className="px-3 py-3">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {DanhSach.map(
                (HocSinhItem) => (
                  <tr
                    key={
                      HocSinhItem.id
                    }
                    className="border-b"
                  >
                    <td className="px-3 py-3 font-medium">
                      {
                        HocSinhItem.ma_hoc_sinh
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        HocSinhItem.ho_ten
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        HocSinhItem.ngay_sinh
                          .slice(
                            0,
                            10,
                          )
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        HocSinhItem.so_dien_thoai_lien_he
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        HocSinhItem.trang_thai
                      }
                    </td>

                    <td className="px-3 py-3">
                      {
                        HocSinhItem.xep_lop[0]
                          ?.lop_hoc_id ??
                        'Chưa xếp'
                      }
                    </td>

                    {LaAdmin && (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={
                            () =>
                              void CapNhatSucKhoe(
                                HocSinhItem,
                              )
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Cập nhật sức khỏe
                        </button>
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {DangTai && (
            <p className="py-6 text-center text-slate-500">
              Đang tải...
            </p>
          )}

          {!DangTai &&
            DanhSach.length === 0 && (
            <p className="py-6 text-center text-slate-500">
              Không có học sinh.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
