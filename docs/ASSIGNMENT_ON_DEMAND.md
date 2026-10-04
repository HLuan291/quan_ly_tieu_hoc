# Phân công giảng dạy: mở chức năng khi cần

Nhánh `backend_audit_fix`; mã kiểm thử `d7816ab99e88d31c67165d9b462a232190b41e22`.
[Functional checks](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37222525284) thành công ngày 05/10/2026 (giờ Việt Nam).

## Giao diện

Trang mặc định hiển thị danh sách phân công và bốn nút:

| Nút | Khi bấm |
|---|---|
| Tạo môn học | Mở hộp thoại nhập mã và tên môn |
| Gắn môn cho khối | Mở hộp thoại chọn môn, khối và mặc định GVCN |
| Tạo phân công | Mở hộp thoại chọn giáo viên, lớp, loại, môn nếu cần và ngày bắt đầu |
| Cấu hình môn theo khối | Mở hộp thoại xem cấu hình, có lọc khối |

Mỗi hộp thoại có một nút Đóng. Form có một nút thao tác chính; khóa sửa/đóng khi đang lưu, lỗi ở lại form. Form và cấu hình không xuất hiện bên dưới danh sách khi chưa bấm nút.

## GVCN

Bảng chỉ hiển thị dòng chủ nhiệm chính của GVCN, không lặp thêm các dòng Toán/Tiếng Việt/các môn GVCN. Giáo viên bộ môn vẫn theo từng môn; các đợt lịch sử chủ nhiệm vẫn theo khoảng ngày.

Cấu hình mỗi khối gộp các môn mặc định vào một nhãn GVCN, các môn bộ môn hiển thị riêng.

Không xóa phân công môn trong database. Quyền nhập đánh giá tiếp tục dùng các môn được giao. Nút Kết thúc ở dòng chủ nhiệm dùng ID phân công chính; backend kết thúc cả các môn GVCN đi kèm.

## Kiểm thử

72/72 ca Chromium, 599/599 ca API, 78/78 route có luồng thành công, 96/96 unit backend, E2E GET / 1/1, CHECK MySQL 15/15, ngày frontend 16/16. Chromium có 248 phản hồi HTTP, 0 lỗi JavaScript và 0 API 5xx trong các ca đã chạy.

Các ca mới kiểm tra mặc định không mở form, chỉ một dialog/form khi bấm, Đóng/Escape/khóa cuộn, bản nhập môn khi đóng/mở lại, cấu hình một nhãn GVCN, giữ dòng bộ môn, môn GVCN còn trong MySQL, kết thúc đúng dòng chủ nhiệm và viewport 390×844.

[Artifact functional-evidence](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37222525284/artifacts/11310379484) có 16 ảnh; giữ đến 2026-10-18T18:00:03Z. Báo cáo JSON lưu trong Git. Dữ liệu giả trên MySQL CI riêng; chưa kiểm tra database Windows.

## Cập nhật

```powershell
cd C:\LuanVan
git pull --ff-only origin backend_audit_fix
```

Khởi động lại frontend. Backend/API, Prisma schema và package lock không đổi; không reset database.
