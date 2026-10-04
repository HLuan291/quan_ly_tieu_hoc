# Hồ sơ học sinh và bảng đánh giá giáo viên

Phạm vi: nhánh `backend_audit_fix`. Giáo viên chỉ xem và sửa học sinh của lớp đang được phân công; ADMIN quản lý toàn trường.

## Chức năng

- Danh sách học sinh: lọc năm học, khối, lớp, trạng thái, tìm kiếm và phân trang.
- Chọn họ tên hoặc “Xem / sửa” để mở hồ sơ: thông tin cá nhân, liên hệ/địa chỉ, ghi chú, sức khỏe, trạng thái, phụ huynh/người giám hộ và lịch sử lớp.
- Giáo viên sửa thông tin học sinh, phụ huynh liên kết và bổ sung phụ huynh mới. ADMIN quản lý tài khoản; giáo viên không gắn hồ sơ phụ huynh bất kỳ theo ID hoặc cấp mật khẩu.
- Chỉ ADMIN tạo/xóa học sinh và giáo viên. Xóa đưa hồ sơ khỏi danh sách đang sử dụng; giữ lịch sử, khóa tài khoản giáo viên và kết thúc phân công hiện tại. Không xóa dữ liệu học tập/điểm danh bằng cascade.
- Bỏ menu và đường dẫn phân công khỏi giao diện giáo viên. API phân công vẫn phục vụ việc xác định quyền và các chức năng liên quan.
- Giáo viên nhập mức/nhận xét trực tiếp trên từng dòng học sinh. Nút lưu nhiều dòng chỉ lưu mức/nhận xét đã sửa và hiển thị lỗi từng dòng nếu một phần chưa lưu được.
- Điểm có nút lưu riêng. Điểm đã có được ghi lần kiểm tra lại, giữ lịch sử; điểm tự tính chỉ hiển thị.
- Năng lực/phẩm chất nhập theo danh sách và tiêu chí; chỉ GVCN của lớp được ghi.
- Thống kê môn theo lớp/phạm vi được phép xem: số lượng, tỷ lệ, nữ, dân tộc thiểu số, chưa đánh giá. Sĩ số áp dụng chỉ gồm khối đã cấu hình môn trong đợt.

## Cách tính nghỉ

Tính từ điểm danh `VANG_CO_PHEP` / `VANG_KHONG_PHEP` của toàn bộ lịch sử lớp. Một ngày có ít nhất một buổi vắng được tính một lần. Có tổng buổi có phép/không phép riêng. Không coi đơn nghỉ đã duyệt là bản ghi điểm danh; không cộng trùng khi hai buổi cùng ngày hoặc lịch sử lớp có bản ghi trùng buổi.

## Lưu và cập nhật

Các phần hồ sơ, sức khỏe, trạng thái và từng phụ huynh có nút lưu riêng. ID/mã hệ thống, thời điểm tạo/cập nhật và lịch sử lớp được xem trong hồ sơ; việc xếp/chuyển lớp do ADMIN thực hiện ở trang tổ chức lớp.

Sau khi kéo mã mới, khởi động lại backend và frontend. Bản này không thay đổi Prisma schema, không yêu cầu thao tác xóa/reset database.

## Kiểm thử

**Mã đã kiểm thử:** `0eda31779399e69fd8b153637784e21c60d33d0a`.
**CI:** [Functional checks](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37204738578) — hoàn tất thành công.

| Bộ kiểm thử | Đạt |
|---|---:|
| Backend unit | 95/95 |
| E2E hiện có (GET /) | 1/1 |
| API core + bổ sung + hồ sơ/phân quyền | 477/477 |
| Route có luồng thành công | 75/75 |
| MySQL CHECK phân công | 15/15 |
| Ngày frontend | 9/9 |
| Chromium thao tác thật | 58/58 |

Chromium ghi 185 phản hồi HTTP, không có lỗi JavaScript hoặc API 5xx trong các ca đã chạy. Frontend lint không cảnh báo; backend còn 3 cảnh báo cũ và bundle frontend vượt 500 kB.

Các ca mới kiểm tra giáo viên sửa/bổ sung hồ sơ của lớp được phân công, chặn lớp/phụ huynh khác, phân công đã hết hạn/chưa bắt đầu, quyền ADMIN tạo/xóa, khóa tài khoản khi xóa GV, thay GVCN cùng ngày, đếm nghỉ đúng ngày/buổi, nạp lại bảng, kiểm tra lại, lưu nhiều dòng có lỗi một phần, đúng học sinh và thống kê theo phạm vi.

Dữ liệu kiểm thử giả nằm trong MySQL CI riêng; không kết nối database Windows của người dùng. Viewport điện thoại 390×844; đây là Chromium headless, chưa xác nhận Safari/Firefox hoặc thiết bị thật. Độ phủ route không có nghĩa mọi nhánh nghiệp vụ đều đã được thử.

## Bằng chứng

Báo cáo đầy đủ: [FUNCTIONAL_TEST_REPORT.md](FUNCTIONAL_TEST_REPORT.md). Các JSON `ci-profile-results.json`, `ci-browser-results.json`, `ci-core-results.json`, `ci-extra-results.json` và `ci-route-coverage.json` nằm trong thư mục `docs`.

Artifact [functional-evidence](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37204738578/artifacts/11304481829) có log và ảnh:
- `admin-student-directory.png`
- `teacher-student-profile.png`
- `teacher-assessment-table.png`
- `teacher-assessment-statistics.png`
- `teacher-student-mobile.png`
- `teacher-assessment-mobile.png`

Artifact giữ tới 18/10/2026; JSON và báo cáo được lưu trong Git.

## Cập nhật trên Windows

```powershell
cd C:\LuanVan
git pull --ff-only origin backend_audit_fix
```

Khởi động lại hai tiến trình `npm run start:dev` (backend) và `npm run dev` (frontend). Không cần reset database hoặc chạy `db push` cho bản này. Bản sao local đã stash trước đây không bị áp dụng/xóa bởi các thay đổi qua Git.
