# Kiểm thử chức năng — 04/10/2026

Lượt này kiểm thử hộp thoại nổi, điểm danh nhanh theo ngày/buổi, trạng thái Đi trễ, chặn Chủ nhật và phạm vi lớp riêng cho GVCN/GVBM. Mã, test và workflow nằm trên nhánh `backend_audit_fix`.

**Mã đã kiểm thử:** `9e925695677472a07cef76cd6baf82c8ed2fc9d8`  
**CI:** [Functional checks](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37211940169) — **success**

GitHub Actions chạy Node.js 24, MySQL 8 và Chromium thật. Database CI riêng chỉ có dữ liệu giả; không kết nối database Windows `C:\LuanVan`.

## Kết quả

| Bộ kiểm thử | Đạt | Phạm vi |
|---|---:|---|
| Backend unit | 96/96, 8 suite | Ngày/tuổi, xác thực, validation và thống kê nghỉ, kể cả Đi trễ |
| E2E hiện có | 1/1 | Chỉ GET / |
| API core | 236/236 | 224 HTTP, 12 assertion |
| API bổ sung | 116/116 | 77 HTTP, 39 assertion |
| API hồ sơ/phân quyền | 126/126 | 86 HTTP, 40 assertion |
| API điểm danh và phạm vi giáo viên | 71/71 | 48 HTTP, 23 assertion |
| Tổng bốn bộ API | **549/549** | **435 HTTP, 114 assertion** |
| Route có luồng thành công | **75/75** | Core kiểm tra không token ở 73 route bảo vệ |
| MySQL CHECK phân công | 15/15 | Ràng buộc cũ/mới trên MySQL thử nghiệm |
| Ngày frontend | 16/16 | Múi giờ, biên tháng/năm, năm nhuận, Chủ nhật |
| Chromium | **65/65** | **218 phản hồi HTTP**, 0 lỗi JavaScript, 0 API 5xx |
| Prisma validate/generate | Đạt | Giữ schema hiện có |
| Backend/frontend lint, build | Đạt | Backend còn 3 cảnh báo spread; frontend lint 0 cảnh báo |

Không cộng các hàng thành một tổng HTTP: unit/assertion khác request và bộ CHECK chạy lại API core. Độ phủ 75/75 route không chứng minh mọi nhánh nghiệp vụ đã được thử.

## Thay đổi và kiểm thử tương ứng

- **Hộp thoại nổi:** thêm học sinh/phụ huynh, mở hồ sơ, bổ sung phụ huynh, thêm/sửa giáo viên và cấp lại mật khẩu. Chromium kiểm tra dialog thật, focus/khóa cuộn nền, Escape và hộp thoại con; mở/sửa/lưu dữ liệu được đối chiếu MySQL.
- **Menu/bảng:** thanh đầu trang xanh, menu ngang theo vai trò, bảng có tiêu đề xanh và vùng cuộn. Danh sách học sinh/đánh giá/hộp thoại không làm tràn ngang viewport 390×844.
- **GVCN:** tự gắn một lớp chủ nhiệm. Trang học sinh, đánh giá và thống kê không yêu cầu chọn năm/khối/lớp; điểm danh dùng cùng lớp. API áp dụng phạm vi, kể cả khi hồ sơ cũ còn dòng bộ môn ở lớp khác. Kiểm tra gọi trực tiếp endpoint bảng/danh sách đánh giá/hồ sơ ngoài lớp đều bị chặn.
- **GVBM:** chọn khối/lớp trong phân công đang hiệu lực, năm học theo lớp. API và Chromium dùng một GVBM được giao hai lớp thuộc hai khối; đổi lớp đúng học sinh, môn được giao cho nhập, môn khác/năng lực chỉ xem theo quyền.
- **Phân công chủ nhiệm:** chặn một giáo viên chủ nhiệm hai lớp có khoảng ngày chồng nhau. Hai yêu cầu đồng thời chỉ có một yêu cầu HTTP 201, yêu cầu còn lại 409; MySQL chỉ lưu một lớp chủ nhiệm.
- **Điểm danh tự tải:** không có nút Tải sổ. Mở trang hoặc đổi ngày/buổi tự nạp dữ liệu; khi hôm nay là Chủ nhật mặc định mở thứ Bảy gần nhất và thông báo.
- **Điểm danh tất cả:** tích Có mặt cho toàn bộ danh sách trong bản nháp, chưa POST database. Sửa từng em thành Vắng có phép/Vắng không phép/Đi trễ rồi Lưu. Chromium thử đủ bốn trạng thái, reload đọc lại và đối chiếu một bản ghi đúng ngày/buổi trong MySQL.
- **Ngày/buổi và phản hồi muộn:** Sáng/Chiều lưu độc lập. Một ca giữ response điểm danh thật, đổi sang Chủ nhật rồi trả response cũ; danh sách ngày cũ không xuất hiện ở ngày đang chọn. Đổi ngày/buổi khi còn bản nháp có xác nhận.
- **Chủ nhật và tương lai:** frontend thông báo/khóa nút; API từ chối đọc/ghi, không phát sinh bản ghi Chủ nhật. Test không dựa vào nút frontend để chứng minh API.
- **Thống kê nghỉ:** Đi trễ/Có mặt không cộng vào ngày/buổi vắng. Hai buổi vắng cùng ngày đếm một ngày, có tổng có phép/không phép và khử trùng lịch sử lớp.
- **Quyền quản trị:** chỉ ADMIN tạo/xóa học sinh và giáo viên; giáo viên sửa hồ sơ/phụ huynh trong phạm vi và bổ sung phụ huynh mới. Xóa giữ lịch sử; giáo viên bị khóa tài khoản và kết thúc phân công hiện tại. Có ca thay GVCN cùng ngày bằng một giáo viên chưa chủ nhiệm lớp khác.

Các ca có từ trước tiếp tục chạy: login/đổi/cấp mật khẩu, thu hồi phiên, giáo viên/phụ huynh ngoài quyền, xếp lớp, môn và cấu hình đánh giá, điểm/kiểm tra lại, năng lực/phẩm chất, tổng kết và đơn nghỉ. Chromium còn kiểm tra lưu nhiều dòng có lỗi một phần, lựa chọn phụ huynh khi response khởi tạo muộn, mất mạng/phục hồi, logout và token hết hạn/sai định dạng.

## Giao diện tham khảo

[Trang C1](https://truong.hcm.edu.vn/C1) không cho đọc màn hình nội bộ tự động; trang gốc yêu cầu JavaScript/xác minh trình duyệt. Bố cục dùng các ảnh người dùng gửi làm mẫu cho thanh đầu trang, menu và bảng; không xác nhận bản sao từng màn hình riêng của hệ thống tham khảo.

Đồng hồ frontend ở 00:30 tại Việt Nam để tiếp tục kiểm tra biên ngày trước 07:00. Chromium dùng locale vi-VN, desktop 1440×1000 và viewport điện thoại 390×844; các API/dữ liệu đến từ backend và MySQL thật trong CI.

## Bằng chứng

Báo cáo JSON của chính lượt CI này đã lưu trong Git:

- `ci-functional-summary.json`
- `ci-core-results.json`, `ci-extra-results.json`, `ci-profile-results.json`
- `ci-scope-attendance-results.json`
- `ci-browser-results.json`, `ci-route-coverage.json`, `endpoint-map.json`
- `ci-dependency-results.json`

[Artifact functional-evidence](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37211940169/artifacts/11307405006) chứa log, bằng chứng CHECK và 11 ảnh:
- `admin-student-directory.png`
- `teacher-student-profile.png`
- `attendance-quick.png`
- `teacher-assessment-table.png`
- `teacher-assessment-statistics.png`
- `teacher-student-mobile.png`
- `student-modal-mobile.png`
- `teacher-assessment-mobile.png`
- `subject-teacher-assessment.png`
- `parent-desktop.png`
- `parent-mobile.png`

Artifact giữ đến 2026-10-18T15:11:33Z; các JSON và báo cáo trong Git không phụ thuộc thời hạn artifact.

## Cảnh báo và giới hạn còn lại

| npm audit | Low | Moderate | High | Critical | Tổng |
|---|---:|---:|---:|---:|---:|
| backend / all | 2 | 2 | 7 | 0 | 11 |
| backend / production | 0 | 1 | 5 | 0 | 6 |
| frontend / all | 0 | 0 | 0 | 0 | 0 |
| frontend / production | 0 | 0 | 0 | 0 | 0 |

Dependency audit là bước thu báo cáo, không yêu cầu số vulnerability bằng 0. Chưa nâng package/lockfile; cảnh báo bundle frontend trên 500 kB còn tồn tại.

Chưa kiểm thử database Windows hiện có, mọi trigger/ràng buộc cũ, backup/phục hồi, tải lớn, mọi nhánh nghiệp vụ, Safari/Firefox hoặc thiết bị thật. Viewport điện thoại là giả lập trên Chromium. Chưa xác nhận đầy đủ công thức/biểu mẫu theo yêu cầu luận văn. Gửi mail/link đặt lại mật khẩu, seed và chuỗi migration triển khai đầy đủ chưa có trong đợt này.

## Cập nhật và chạy lại

Xem [hướng dẫn giao diện/điểm danh/phạm vi giáo viên](UI_ATTENDANCE_TEACHER_SCOPE.md). Pull nhánh rồi khởi động lại backend/frontend. Không reset database; schema và package lock giữ nguyên. Stash local `backup-local-before-audit` không bị áp dụng/xóa.

Có thể chạy lại workflow Functional checks. Runtime audit tạo dữ liệu giả, chỉ dùng database thử nghiệm riêng với `AUDIT_ALLOW_TEST_DATA=1`; workflow dùng db push trên database CI mới, không dùng bước này với database thật.
