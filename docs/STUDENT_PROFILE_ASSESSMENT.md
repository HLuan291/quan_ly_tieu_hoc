# Hồ sơ học sinh và bảng đánh giá giáo viên

Phạm vi: nhánh `backend_audit_fix`. GVCN tự mở lớp chủ nhiệm; GVBM chọn khối/lớp trong phân công đang hiệu lực; ADMIN quản lý toàn trường. Backend áp dụng cùng phạm vi với giao diện.

## Sử dụng

- ADMIN lọc học sinh theo năm/khối/lớp/trạng thái, tìm kiếm và phân trang. GVCN không có ô chọn năm/khối/lớp; GVBM chọn các lớp được giao, năm học tự theo lớp.
- Chọn họ tên hoặc Xem / sửa để mở **hộp thoại hồ sơ**, gồm thông tin cá nhân, liên hệ/địa chỉ, ghi chú, sức khỏe, trạng thái, phụ huynh/người giám hộ, lịch sử lớp và thống kê nghỉ.
- Thêm học sinh và bổ sung phụ huynh mở **hộp thoại nổi**. Các phần hồ sơ, sức khỏe, trạng thái và từng phụ huynh có nút lưu riêng.
- Giáo viên được sửa hồ sơ/phụ huynh trong phạm vi và bổ sung phụ huynh mới. ADMIN quản lý tài khoản; giáo viên không gắn hồ sơ phụ huynh bất kỳ theo ID hoặc cấp mật khẩu.
- Chỉ ADMIN tạo/xóa học sinh và giáo viên. Xóa đưa hồ sơ khỏi danh sách, giữ lịch sử; giáo viên bị khóa tài khoản và kết thúc phân công hiện tại.
- Menu/đường dẫn phân công chỉ dành cho ADMIN.
- Giáo viên nhập mức/nhận xét trên từng dòng. Lưu nhiều dòng chỉ ghi phần đã sửa và báo lỗi từng dòng nếu một phần không hợp lệ.
- Điểm có nút lưu riêng; điểm đã có ghi thêm lần kiểm tra lại và giữ lịch sử; điểm tự tính chỉ hiển thị.
- Năng lực/phẩm chất nhập theo tiêu chí, chỉ GVCN được ghi.
- Thống kê môn theo lớp/phạm vi: số lượng, tỷ lệ, nữ, dân tộc thiểu số, chưa đánh giá; sĩ số áp dụng chỉ gồm khối được cấu hình môn.
- ID/mã hệ thống, thời điểm tạo/cập nhật và lịch sử lớp hiển thị để xem; xếp/chuyển lớp do ADMIN thực hiện.

## Tổng nghỉ

Tính từ điểm danh `VANG_CO_PHEP` / `VANG_KHONG_PHEP` trong toàn bộ lịch sử lớp. Hai buổi cùng ngày đếm một ngày có vắng; có tổng buổi có phép/không phép và khử trùng ngày/buổi. Có mặt và Đi trễ không tính vào số nghỉ; đơn nghỉ đã duyệt không tự được coi là bản ghi điểm danh.

Hướng dẫn điểm danh nhanh, hộp thoại và phạm vi: [UI_ATTENDANCE_TEACHER_SCOPE.md](UI_ATTENDANCE_TEACHER_SCOPE.md).

## Kiểm thử

**Mã:** `9e925695677472a07cef76cd6baf82c8ed2fc9d8`  
**CI:** [Functional checks](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37211940169) — thành công.

| Bộ | Đạt |
|---|---:|
| Unit backend | 96/96 |
| E2E hiện có GET / | 1/1 |
| Bốn bộ API | 549/549 |
| Route có luồng thành công | 75/75 |
| MySQL CHECK | 15/15 |
| Ngày frontend | 16/16 |
| Chromium | 65/65 |

Chromium có 218 phản hồi HTTP, không lỗi JavaScript hay API 5xx trong các ca đã chạy. Dữ liệu giả nằm trong MySQL CI riêng; chưa xác nhận DB Windows hoặc mọi nhánh nghiệp vụ.

Báo cáo/bằng chứng: [FUNCTIONAL_TEST_REPORT.md](FUNCTIONAL_TEST_REPORT.md).

Sau khi pull nhánh, khởi động lại backend và frontend; schema/package lock không đổi, không cần reset DB.
