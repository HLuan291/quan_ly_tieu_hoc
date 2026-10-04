# Kiểm thử chức năng quan_ly_tieu_hoc — 04/10/2026

## Trạng thái bản kiểm thử

Mã nền: nhánh `backend_audit_fix`, commit `9ebaccd8bfb8ed69c887330d1d87c9a5f01b0e24`. Không thay đổi nhánh `main`.

Các kết quả dưới đây được ghi nhận từ những lượt đã chạy trong bản làm việc của phiên kiểm thử. Bản làm việc có thêm bản sửa ngày và các script test. **Commit lưu báo cáo này chỉ cập nhật tài liệu; chưa chứa các bản sửa ngày, script mới hoặc JSON kết quả của phiên này.** Sau khi test hoàn tất, kết nối tới môi trường chạy lệnh bị ngắt; không thể đọc lại và xuất chính xác cây mã đã test để publish. Vì vậy, không xem việc pull báo cáo là đã nhận được bản sửa.

Đây là kiểm thử trên database MySQL riêng với dữ liệu giả, không phải database trong máy Windows `C:\LuanVan` của người dùng.

## 1. Chức năng đã kiểm chứng

| Bộ kiểm tra đã chạy | Kết quả | Phạm vi |
|---|---:|---|
| Unit backend trước khi sửa ngày | 69/69, 6 suite | Mã nền 9ebaccd |
| Unit backend sau khi sửa ngày | 90/90, 7 suite | Thêm 21 regression test ngày |
| Regression ngày frontend | 9/9 | Ngày local, trước 07:00 ở Việt Nam, biên tháng/năm, năm nhuận, Los Angeles |
| E2E hiện có | 1/1 | Chỉ happy path `GET /` |
| API core | 231/231 | 219 yêu cầu HTTP và 12 assertion |
| API bổ sung đã chạy | 142/142 | 83 yêu cầu HTTP và 59 assertion |
| Tổng hai bộ API đã chạy | **373/373** | **302 HTTP thật và 71 assertion** |
| Chuyển ràng buộc phân công | 15/15 | Database thử nghiệm có CHECK cũ và CHECK sau chuyển đổi |
| Form React/DOM với API thật | **25/25** | **45 HTTP thật, không có HTTP 5xx** |
| Backend TypeScript, build | Đạt | Sau sửa ngày |
| Backend lint | Đạt | Còn 3 cảnh báo spread dư đã có |
| Frontend lint, build | Đạt | Sau sửa ngày; còn cảnh báo bundle lớn |

Không cộng các bộ trên thành một số HTTP chung: unit/assertion không phải request, và bộ chuyển CHECK có sử dụng lại runtime audit.

Đối chiếu route có happy path thành công cho thấy **69/70 endpoint** trong danh mục hiện tại đã có ít nhất một luồng thành công. Đây chỉ là độ phủ route; không chứng minh mọi nhánh nghiệp vụ của từng endpoint đã được thử. API core còn kiểm tra từ chối truy cập không có token ở 68 endpoint được bảo vệ.

### Xác thực, tài khoản và phân quyền

Đã thử đăng nhập đúng/sai; truy cập có/không có token; quyền ADMIN, GIAO_VIEN và PHU_HUYNH; phạm vi dữ liệu theo phân công hoặc quan hệ phụ huynh–học sinh; các trường hợp bị từ chối.

Đã thử tạo giáo viên, mật khẩu ban đầu/mật khẩu tạm, cấp lại và đổi mật khẩu bắt buộc; đối chiếu hash trong MySQL; xác nhận API không trả hash. Luồng copy/ẩn mật khẩu được thử qua form. API bổ sung thử quản lý tài khoản/liên kết phụ huynh, thay đổi số điện thoại và thu hồi hiệu lực phiên theo các tình huống của script.

### Dữ liệu trường học và nghiệp vụ

Đã thử các luồng trong bộ API cho giáo viên, học sinh, phụ huynh, năm học, lớp, xếp lớp, phân công, điểm danh, đơn xin nghỉ, đánh giá và kết quả học tập. Các kiểm tra có đối chiếu dữ liệu lưu trong MySQL và các điều kiện quyền/đầu vào tương ứng.

API bổ sung đã thực thi thành công happy path ở 26 route còn thiếu của bộ core. Ba happy path mới cho đọc chi tiết học sinh bằng ADMIN/GV/PH được thêm sau lượt chạy này, nên chưa được tính vào kết quả đã đạt.

### Các form đã thực thi

React App và React Router chạy trong jsdom; Axios gọi backend thật; backend dùng MySQL thật. Không mock API.

25 ca đã đạt bao gồm:

- Chặn khách chưa đăng nhập, hiển thị lỗi đăng nhập sai, menu/route theo quyền và đăng xuất.
- ADMIN tạo giáo viên; đối chiếu hash; copy/ẩn và cấp lại mật khẩu.
- Ngày tối đa của ngày sinh, ngày mặc định ở form phân công; tạo phân công GVCN và môn tương ứng.
- Giáo viên bị chuyển tới đổi mật khẩu; xác nhận mật khẩu không khớp; đổi mật khẩu và đối chiếu hash; chặn route dành cho ADMIN.
- Tải và lưu điểm danh; kiểm tra trường bắt buộc ở form; xác nhận dữ liệu điểm danh và đánh giá môn được lưu.
- PHU_HUYNH đăng nhập, xem con của mình, điểm danh và kết quả.
- PHU_HUYNH gửi đơn nghỉ: MySQL ghi `CHO_DUYET`; giáo viên duyệt: MySQL ghi `DA_DUYET` cùng giáo viên duyệt.

Fixture UI: năm học 2026–2027, khối 3, lớp/môn và tài khoản riêng; xếp lớp từ 01/09/2026. Đồng hồ frontend được đặt ở **04/10/2026 lúc 00:30, Asia/Ho_Chi_Minh** để thử giá trị ngày trước 07:00.

Báo cáo UI ghi 6 cảnh báo đồng bộ React `act` của môi trường kiểm thử. Clipboard và hộp thoại được mô phỏng; không dùng browser engine để xác nhận các thao tác này.

## 2. Chưa kiểm chứng khi chạy thực tế

- Database Windows hiện có: dữ liệu, trigger, toàn bộ ràng buộc cũ và kết quả chạy script chuyển CHECK trên chính máy người dùng.
- Giao diện bằng Chromium/browser thật: bố cục, responsive, ảnh chụp, clipboard native và hành vi trình duyệt.
- Tải lớn, nhiều người cập nhật đồng thời, hiệu năng, mất mạng và các tình huống ngoài danh sách test.
- Tính đúng đầy đủ của mọi công thức/biểu mẫu đánh giá theo yêu cầu nghiệp vụ luận văn.
- Happy path `GET /ho_so_hoc_sinh/hoc_sinh/:Id` cho ba vai trò và các assertion phạm vi mới thêm: **chưa chạy**. Script mới dự kiến 149 extra checks, tổng 380 checks và 70/70 route; các số này **không phải kết quả đạt**.

## 3. Lỗi đã tái hiện và bản sửa đang chờ publish

Phát hiện cách lấy ngày hôm nay bằng `toISOString().slice(0, 10)` dùng ngày UTC. Ví dụ, 04/10/2026 lúc 00:30 ở Việt Nam vẫn là ngày 03/10 theo UTC. Lỗi xuất hiện từ 00:00 đến trước 07:00 ở Việt Nam.

Ảnh hưởng đã tái hiện ở frontend: ngày mặc định/giới hạn ngày trên các form và việc lọc phân công theo ngày hôm nay.

Ảnh hưởng đã tái hiện ở backend: phạm vi phân công hiện tại, danh sách học sinh/điểm danh/đánh giá, kiểm tra ngày bắt đầu/nhập học, giới hạn tuổi giáo viên tròn 18 và giới hạn năm ở biên năm mới. **9 ca nghiệp vụ thất bại trên mã cũ, đạt sau sửa.**

Bản sửa trong bản làm việc:

- Frontend dùng helper chung lấy ngày theo múi giờ local thay cho ngày UTC; áp dụng tại 7 trang liên quan.
- Backend dùng ngày nghiệp vụ `Asia/Ho_Chi_Minh`, độc lập múi giờ máy chủ; giữ biểu diễn cột DATE ở UTC 00:00.
- Thêm 21 test backend và 9 test frontend cho các biên ngày liên quan.
- Không thay schema, tên trường API/DB hay route.

**Các bản sửa này chưa có trên Git trong commit báo cáo.** Cần khôi phục kết nối môi trường, đọc lại cây mã, hoàn tất lượt test bổ sung và publish đúng bản đã kiểm tra. Các lượt API/form đã hoàn tất không phát hiện lỗi ứng dụng khác trong phạm vi đã chạy.

## 4. Phần còn thiếu và việc tiếp theo

- Đẩy bản sửa ngày cùng script và JSON bằng chứng; cập nhật báo cáo với SHA của cây mã đã kiểm tra.
- Chạy nốt ba happy path đọc chi tiết học sinh và assertion phạm vi mới.
- Chạy UI bằng browser thật khi có môi trường trình duyệt hoạt động.
- Đối chiếu các API quản lý đã có với thao tác frontend còn thiếu, theo báo cáo audit cũ; độ phủ API không có nghĩa giao diện đã cung cấp mọi thao tác.
- Cơ chế gửi mail/link đặt lại mật khẩu chưa được triển khai trong phiên này.
- Bổ sung seed/migration, tài liệu vận hành và CI phù hợp để tái lập kiểm thử.

## Chạy các kiểm tra hiện có trên Windows

Sau khi pull nhánh `backend_audit_fix`, có thể chạy các lệnh hiện có:

```powershell
npm --prefix C:\LuanVan\backend run build
npm --prefix C:\LuanVan\backend run test -- --runInBand
npm --prefix C:\LuanVan\frontend run lint
npm --prefix C:\LuanVan\frontend run build
```

Mã đã publish ở 9ebaccd có 69 unit test backend; 90 test và lệnh frontend `test:dates` thuộc bản làm việc chưa publish. Không kỳ vọng nhận các test mới chỉ bằng pull commit tài liệu này.

Các bộ runtime có tạo dữ liệu giả nên chỉ chạy trên database kiểm thử riêng với cờ cho phép dữ liệu audit. Không dùng `db push` hoặc fixture của phiên này trên database thật của người dùng.
