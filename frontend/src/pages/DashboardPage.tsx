import {
  docJwt,
} from '../auth/auth';

export default function DashboardPage() {
  const nguoiDung =
    docJwt();

  return (
    <div>
      <h1
        className="
          text-2xl
          font-bold
          text-slate-800
        "
      >
        Tổng quan
      </h1>

      <p
        className="
          mt-2
          text-slate-500
        "
      >
        Xin chào. Bạn đang đăng nhập
        với vai trò{' '}

        <strong>
          {nguoiDung?.vai_tro}
        </strong>
      </p>

      <div
        className="
          mt-6
          grid
          gap-5
          md:grid-cols-3
        "
      >
        <div
          className="
            rounded-xl
            bg-white
            p-6
            shadow-sm
          "
        >
          <p className="text-slate-500">
            Trạng thái
          </p>

          <p
            className="
              mt-2
              text-xl
              font-bold
              text-green-600
            "
          >
            Hoạt động
          </p>
        </div>

        <div
          className="
            rounded-xl
            bg-white
            p-6
            shadow-sm
          "
        >
          <p className="text-slate-500">
            ID tài khoản
          </p>

          <p
            className="
              mt-2
              text-xl
              font-bold
            "
          >
            {nguoiDung?.sub}
          </p>
        </div>

        <div
          className="
            rounded-xl
            bg-white
            p-6
            shadow-sm
          "
        >
          <p className="text-slate-500">
            Vai trò
          </p>

          <p
            className="
              mt-2
              text-xl
              font-bold
            "
          >
            {nguoiDung?.vai_tro}
          </p>
        </div>
      </div>
    </div>
  );
}