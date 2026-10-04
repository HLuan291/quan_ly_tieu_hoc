import {
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
} from 'react';

import Api from '../api/api';
import { LayNgayHomNay } from '../utils/ngay_local';
import HopThoai from '../components/hop_thoai';
import DanhSachHocSinh from './danh_sach_hoc_sinh';

import {
  DocJwt,
} from '../auth/auth';

import {
  LayThongBaoLoi,
} from '../utils/loi_api';

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

function LayNamPhuHuynhToiDa() {
  return (
    new Date()
      .getFullYear() - 18
  );
}

export default function HocSinhPage() {
  const [DangLuu, SetDangLuu] = useState(false);
  const NguoiDung =
    DocJwt();

  const LaAdmin =
    NguoiDung?.vai_tro ===
    'ADMIN';

  const [LanTai, SetLanTai] = useState(0);

  const [
    Loi,
    SetLoi,
  ] = useState('');

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
      so_dien_thoai: string;
      mat_khau_ban_dau: string;
      ho_ten: string;
    }>
  >([]);

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
    SetDangLuu(true);

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

      SetLanTai(Value => Value + 1);
      SetHienForm(false);
    } catch (Error: unknown) {
      SetLoi(
        LayThongBaoLoi(
          Error,
        ),
      );
    } finally { SetDangLuu(false); }
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

      {Loi && !HienForm && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {Loi}
        </div>
      )}

      {TaiKhoanMoi.length > 0 && (
        <HopThoai TieuDe="Tài khoản phụ huynh vừa tạo" Dong={() => SetTaiKhoanMoi([])}><div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm">
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
                  {TaiKhoan.so_dien_thoai}
                </strong>
                {' / '}
                <strong>
                  {TaiKhoan.mat_khau_ban_dau}
                </strong>
              </p>
            ),
          )}
        </div></HopThoai>
      )}

      {LaAdmin &&
        HienForm && (
        <HopThoai TieuDe="Thêm học sinh và phụ huynh" Dong={() => SetHienForm(false)} DangLuu={DangLuu} Rong>
        {Loi && <p role="alert" className="mb-3 rounded bg-red-50 p-3 text-red-700">{Loi}</p>}
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
            disabled={DangLuu}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
          >
            Lưu học sinh
          </button>
        </form></HopThoai>
      )}

      <DanhSachHocSinh LanTai={LanTai} LaAdmin={LaAdmin} />
    </div>
  );
}
