# Cấp mật khẩu giáo viên

Cập nhật ngày 03/10/2026 trên nhánh `backend_audit_fix`.

## Sử dụng trên giao diện

1. Đăng nhập tài khoản ADMIN, mở trang Giáo viên.
2. Khi thêm giáo viên, nhập **Mật khẩu ban đầu** hoặc để trống để hệ thống tự sinh.
3. Với giáo viên đã có tài khoản, chọn **Cấp lại mật khẩu**, nhập mật khẩu mới hoặc để trống, rồi chọn **Cấp mật khẩu mới**.
4. Sau khi tạo/cấp lại thành công, thông tin đăng nhập xuất hiện trong thẻ phía trên. Chọn **Sao chép tài khoản** để bàn giao hoặc thử đăng nhập; chọn **Ẩn thông tin** để đóng thẻ.
5. Giáo viên đăng nhập ở `/dang_nhap` bằng tên đăng nhập được cấp hoặc số điện thoại đã ghi trong hồ sơ. Sau đó phải tự đổi mật khẩu trước khi sử dụng các chức năng nghiệp vụ.

Mật khẩu do ADMIN nhập cần có từ 8 đến 128 ký tự, không được chỉ chứa khoảng trắng. Hệ thống giữ nguyên mật khẩu đã nhập, kể cả khoảng trắng đầu/cuối. Ô mật khẩu có nút hiện/ẩn. Khi để trống, hệ thống sinh mật khẩu ngẫu nhiên với 16 byte từ `crypto.randomBytes`.

Dữ liệu demo có thể dùng số điện thoại giả gồm đúng 10 chữ số và không trùng tài khoản khác. Luồng này không dùng SMS hay xác minh số điện thoại. Địa chỉ email trong hồ sơ chỉ cần đúng định dạng; chưa dùng để gửi thư.

## Hợp đồng API

Các route và response hiện có được giữ nguyên. Chỉ ADMIN được tạo/cấp lại mật khẩu.

| Thao tác | Trường tùy chọn mới | Kết quả |
|---|---|---|
| `POST /giao_vien` | `mat_khau_ban_dau: string` | Trả mật khẩu tạm thời trong `tai_khoan.mat_khau_ban_dau` |
| `POST /giao_vien/:id/cap_lai_mat_khau` | `mat_khau_moi: string` | Trả mật khẩu tạm thời trong `mat_khau_moi` |

Bỏ trường mật khẩu hoặc gửi chuỗi rỗng sẽ tự sinh. Route cấp lại vẫn chấp nhận request cũ không có body và request có body `{}`. Sai kiểu, `null`, quá ngắn, quá dài hoặc chỉ có khoảng trắng trả HTTP 400 trước khi ghi dữ liệu.

Database chỉ lưu Argon2 hash. Mật khẩu tạm thời được trả trong response tạo/cấp lại cho ADMIN; API danh sách không trả mật khẩu hoặc hash. Giao diện giữ thông tin mới cấp trong state của trang, không ghi thêm mật khẩu vào localStorage. Nút sao chép chỉ ghi clipboard khi ADMIN bấm; nếu trình duyệt không cho phép, có thể chọn và sao chép văn bản hiển thị.

Sau cấp lại, mật khẩu và token cũ không còn dùng được. Tài khoản luôn có `phai_doi_mat_khau = true` và cần đổi mật khẩu lần đầu. Bản sửa không đổi Prisma schema hoặc dependencies.

## Email

Bản này chưa gửi email. Nếu bổ sung cho dữ liệu thật, cần địa chỉ nhận thật và dịch vụ gửi thư. Luồng phù hợp là email có liên kết để giáo viên tự đặt mật khẩu, với token hết hạn và dùng một lần. Xem [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## Xác minh

| Kiểm tra | Kết quả ngày 03/10/2026 |
|---|---|
| Backend build và lint | Đạt; lint còn 3 cảnh báo có sẵn ở các service khác |
| Unit/regression test | 58/58 đạt, 5 suites |
| E2E HTTP trang gốc | 1/1 đạt |
| API qua Nest và MySQL 8.0 riêng | 231/231 đạt, gồm 33 ca mới về mật khẩu |
| Frontend lint và build | Đạt; vẫn có cảnh báo kích thước bundle |
| Vite dev transform trang Giáo viên | Đạt |

Các ca mới kiểm tra mật khẩu ADMIN đặt, đăng nhập bằng username/SĐT giả, Argon2 hash, không lộ mật khẩu trong danh sách, đổi mật khẩu bắt buộc, quyền ADMIN, đầu vào sai không ghi DB, thu hồi token/mật khẩu cũ và cấp lại tự sinh. Báo cáo máy nằm trong `teacher-password-runtime-results.json`. Báo cáo `AUDIT_REPORT.md` và `runtime-audit-results.json` giữ kết quả lần kiểm tra trước.

Kiểm tra sử dụng database mới có tên chứa `audit` và dữ liệu giả, không kết nối database của người dùng. Chưa xác minh thao tác trực tiếp trong trình duyệt hoặc trên Windows của người dùng.

Để chạy lại sau khi build backend, dùng DB kiểm thử riêng đã có schema, thiết lập `AUDIT_ALLOW_TEST_DATA=1`, `DATABASE_URL`, `JWT_SECRET`, rồi chạy `node scripts/runtime-audit.cjs` trong `backend`. Có thể đặt `AUDIT_REPORT_FILE=../docs/teacher-password-runtime-results.json` để chọn file báo cáo. Script tạo dữ liệu giả; không chạy trên DB đang sử dụng.

## Kéo bản sửa về Windows

```powershell
git -C C:\LuanVan pull --ff-only origin backend_audit_fix
```

Khởi động lại backend (`npm run start:dev`) và frontend (`npm run dev`) trong hai cửa sổ PowerShell tương ứng. Không cần cài lại package hoặc cập nhật schema cho bản sửa này. Bản sao `backup-local-before-audit` trong Git stash được giữ nguyên.
