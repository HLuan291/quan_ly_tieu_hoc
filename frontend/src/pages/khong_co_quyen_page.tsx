import {
  Link,
} from 'react-router';

export default function KhongCoQuyenPage() {
  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-slate-100
      "
    >
      <div
        className="
          rounded-xl
          bg-white
          p-8
          text-center
          shadow
        "
      >
        <h1
          className="
            text-2xl
            font-bold
            text-red-600
          "
        >
          Không có quyền truy cập
        </h1>

        <Link
          to="/dashboard"
          className="
            mt-5
            inline-block
            text-blue-600
          "
        >
          Quay về tổng quan
        </Link>
      </div>
    </div>
  );
}