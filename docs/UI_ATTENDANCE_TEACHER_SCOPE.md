# Hộp thoại, điểm danh nhanh và lớp gắn với giáo viên

Phạm vi: nhánh `backend_audit_fix`. Giao diện tham khảo thanh đầu trang xanh, menu ngang và bảng dữ liệu trong ảnh người dùng cung cấp. Trang https://truong.hcm.edu.vn/C1 không cho đọc tự động; trang gốc yêu cầu JavaScript/xác minh trình duyệt. Không truy cập màn hình nội bộ bằng tài khoản.

## Giao diện và thao tác

- Thanh menu ngang cho đúng vai trò; bảng có tiêu đề xanh, cuộn trong vùng bảng và phân trang.
- Thêm học sinh kèm phụ huynh, hồ sơ học sinh, thêm/sửa giáo viên và cấp lại mật khẩu mở hộp thoại nổi.
- Hộp thoại giữ focus bên trong, khóa cuộn nền, có một nút Đóng trên đầu và phím Escape. Hồ sơ đang sửa chưa lưu yêu cầu xác nhận trước khi đóng.
- Thông tin đăng nhập vừa tạo/cấp được hiển thị để bàn giao một lần; mật khẩu đã lưu không được đọc lại.

## Phân công giảng dạy (ADMIN)

Trang mặc định chỉ hiện danh sách và bốn nút mở form/cấu hình khi cần. GVCN hiển thị dòng chủ nhiệm chính; các môn GVCN không lặp trong bảng. Cấu hình mỗi khối có một nhãn GVCN; giáo viên bộ môn vẫn hiển thị theo môn. Xem [ASSIGNMENT_ON_DEMAND.md](ASSIGNMENT_ON_DEMAND.md).

## Phạm vi giáo viên

| Tài khoản | Học sinh và đánh giá | Năm học | Điểm danh |
|---|---|---|---|
| GVCN | Tự mở lớp chủ nhiệm, không có ô chọn năm/khối/lớp | Theo lớp chủ nhiệm | Tự mở lớp chủ nhiệm; chọn ngày/buổi |
| GVBM | Tự mở lớp đầu tiên; chọn khối/lớp trong phân công đang hiệu lực | Tự theo lớp đang chọn | Không ghi điểm danh |
| ADMIN | Danh sách học sinh toàn trường, lọc năm/khối/lớp; cấu hình đánh giá | Chọn trong danh mục | API đọc theo quyền quản trị |

GVCN có ưu tiên lớp chủ nhiệm khi hồ sơ cũ còn dòng phân công bộ môn ở lớp khác. Backend áp dụng cùng phạm vi cho danh mục, danh sách/hồ sơ, phụ huynh, bảng đánh giá, thống kê và các endpoint đọc/ghi đánh giá cũ. Các quyền môn học, năng lực/phẩm chất và tổng kết tiếp tục được kiểm tra riêng.

Một giáo viên không được chủ nhiệm hai lớp trong các khoảng ngày chồng nhau. API kiểm tra trong transaction và khóa dòng giáo viên, kể cả khi hai yêu cầu phân công đồng thời. Hồ sơ cũ có nhiều lớp chủ nhiệm đang hiệu lực sẽ báo Admin cần kết thúc phân công cũ, không tự đoán lớp.

## Điểm danh

1. Vào trang: danh sách tự tải theo lớp gắn với tài khoản, ngày và buổi. Chủ nhật mặc định hiển thị thứ Bảy gần nhất; có thông báo.
2. Chọn ngày hoặc buổi Sáng/Chiều: tự tải đúng dữ liệu đã lưu, không có nút “Tải sổ điểm danh”.
3. “Điểm danh tất cả” tích Có mặt cho toàn bộ học sinh; chưa ghi database.
4. Sửa từng em bằng checkbox Có mặt hoặc chọn Vắng có phép / Vắng không phép / Đi trễ, nhập ghi chú nếu cần.
5. Bấm “Lưu điểm danh”; ngày và buổi được lưu độc lập. Đổi ngày/buổi khi còn thay đổi chưa lưu yêu cầu xác nhận.
6. Chọn Chủ nhật: hiện thông báo, không tải danh sách, khóa nút điểm danh/lưu. API cũng từ chối đọc/ghi Chủ nhật và ngày tương lai.
7. Phản hồi tải cũ bị bỏ khi đổi ngày/buổi; không đưa danh sách ngày cũ vào ngày đang xem.

Các mã lưu: `CO_MAT`, `VANG_CO_PHEP`, `VANG_KHONG_PHEP`, `DI_TRE`. Đi trễ không cộng vào ngày/buổi vắng; phụ huynh thấy nhãn Đi trễ khi xem điểm danh của con.

Chỉ ADMIN tạo/xóa học sinh và giáo viên. Giáo viên xem/sửa hồ sơ trong phạm vi của mình và ghi thêm người giám hộ vào học sinh hiện có. Hồ sơ dùng một nút Lưu thay đổi; trạng thái chỉ ADMIN sửa. Giáo viên có menu Hồ sơ của tôi để sửa thông tin cá nhân. Xem [UNIFIED_PROFILE_SAVING.md](UNIFIED_PROFILE_SAVING.md).

## Cập nhật Windows

```powershell
cd C:\LuanVan
git pull --ff-only origin backend_audit_fix
```

Khởi động lại backend (`npm run start:dev`) và frontend (`npm run dev`) trong hai terminal tương ứng. Bản này giữ Prisma schema và package lock; không cần reset database. Bản stash `backup-local-before-audit` không bị áp dụng hoặc xóa.

Kết quả kiểm thử và bằng chứng được ghi trong [FUNCTIONAL_TEST_REPORT.md](FUNCTIONAL_TEST_REPORT.md).
