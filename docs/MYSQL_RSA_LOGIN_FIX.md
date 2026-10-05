# Sửa đăng nhập MySQL local bị lỗi RSA

Log Windows ngày 05/10/2026 ghi HTTP 500 ở `POST /auth/login`, Prisma P2039,
pool timeout 45028 và nguyên nhân sâu hơn 45044:
`RSA public key is not available client side`.

Backend đã nhận HTTP nhưng chưa xác thực được kết nối MySQL khi đọc bảng
`tai_khoan`. `GET /` trả `Hello World!` chỉ kiểm tra HTTP, không kiểm tra database.

## Thay đổi

- Cấu hình Prisma/MariaDB cho phép lấy khóa RSA mặc định khi host là
  `localhost`, `127.0.0.1` hoặc `::1`. Các host khác giữ mặc định tắt.
- Có thể đặt rõ `?allowPublicKeyRetrieval=false` hoặc `true` trong
  `DATABASE_URL`; giá trị sai bị từ chối trước khi truy vấn.
- Host IPv6 bỏ ngoặc trước khi truyền cho driver; thông tin đăng nhập URL có
  ký tự đặc biệt được giải mã.
- Trang đăng nhập hiển thị thông báo tiếng Việt riêng khi mất kết nối,
  hết thời gian chờ hoặc backend trả lỗi 500 mặc định.
- Không đổi mật khẩu, tài khoản, cơ chế phân quyền, schema hay dữ liệu của dự án.

MariaDB Connector hỗ trợ
[`allowPublicKeyRetrieval`](https://mariadb.com/docs/connectors/mariadb-connector-nodejs/node-js-connection-options)
để yêu cầu server gửi khóa nếu client chưa có khóa RSA.
Với database ngoài máy, cấu hình TLS hoặc khóa công khai đã xác minh phù hợp với
môi trường triển khai; việc lấy khóa từ server không thay thế xác minh danh tính server.

## Kiểm thử

- Thêm kiểm thử cấu hình local, remote, IPv6, tắt tùy chọn, ký tự đặc biệt và lỗi URL.
- Tái hiện cục bộ trên MySQL riêng: kết nối TCP bằng tài khoản
  `caching_sha2_password` mới, tắt TLS, cấu hình cũ lỗi thiếu khóa RSA;
  cấu hình mới đọc được `SELECT 1`. Đã xác nhận trên MySQL 8.0.46: mã lỗi
  cũ là 45044, kết nối mới thành công với TLS tắt.
- CI tạo `audit_cold_rsa` mới sau khi tạo schema. Truy vấn đầu tiên dùng tài khoản
  này chạy luồng `AuthService.DangNhap` thật với mật khẩu Argon2 và JWT thật.
  Kiểm tra thành công, trạng thái không TLS và mật khẩu ứng dụng sai vẫn trả 401.
- 12 kiểm thử thông báo lỗi frontend giữ nguyên nội dung lỗi 400/401/403,
  phân biệt lỗi mạng/timeout và chuyển lỗi 500 mặc định sang tiếng Việt.
- Chạy lại bộ kiểm thử chức năng hiện có trên dữ liệu giả trong MySQL CI.

Kết quả CI: commit `be5b4be07b7dc3222f38f0c9ed88d64a56724898`,
[run 37273527616](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37273527616).

| Kiểm thử | Đạt |
| --- | --- |
| MySQL RSA với tài khoản mới | 3/3 |
| Backend unit | 115/115 |
| E2E GET / | 1/1 |
| API chức năng | 599/599 |
| Route có lượt gọi hợp lệ | 78/78 |
| Ràng buộc MySQL | 15/15 |
| Thông báo lỗi frontend | 12/12 |
| Ngày frontend | 16/16 |
| Chromium | 72/72 |

Backend/frontend lint và build đạt; 0 lỗi JavaScript và 0 HTTP 5xx trong
247 phản hồi của kiểm thử trình duyệt. Ba cảnh báo lint backend và các cảnh báo
dependency trước đó vẫn được ghi trong báo cáo; bản sửa không đổi dependency.
Dữ liệu kiểm thử là dữ liệu giả trong MySQL riêng, không kết nối DB Windows.

Artifact `functional-evidence` bao gồm `ci-mysql-rsa-results.json`; bản tóm tắt
được lưu trong `ci-functional-summary.json`.

## Cập nhật Windows

Dừng backend bằng Ctrl+C, sau đó:

```powershell
cd C:\LuanVan
git pull --ff-only origin backend_audit_fix
cd backend
npm run prisma:generate
if ($LASTEXITCODE -eq 0) {
    npm run start:dev
}
```

Giữ backend và frontend chạy. Mở `http://localhost:5173`, tải lại trang và
đăng nhập với tài khoản hiện có. Không cần thay mật khẩu database hay chạy lại seed.
