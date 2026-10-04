# Kiểm thử chức năng — 04/10/2026

Báo cáo này cập nhật lượt kiểm thử sau khi bổ sung hồ sơ học sinh/phụ huynh, bảng đánh giá và thống kê theo phạm vi giáo viên. Bản sửa, bộ test và workflow đã có trên nhánh `backend_audit_fix`.

**Mã đã kiểm thử:** 0eda31779399e69fd8b153637784e21c60d33d0a  
**Lượt CI:** [Functional checks](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37204738578)

Kiểm thử chạy trên GitHub Actions với Node.js 24, MySQL 8 và Chromium thật. Database CI riêng chỉ có dữ liệu giả, không kết nối database trên máy Windows `C:\LuanVan`.

## Kết quả đã chạy

| Kiểm tra | Kết quả | Phạm vi |
|---|---:|---|
| Backend unit | 95/95, 8 suite | Gồm regression ngày/tuổi và 3 test thống kê nghỉ |
| E2E hiện có | 1/1 | Chỉ `GET /` |
| API core | 236/236 | 224 HTTP và 12 assertion |
| API bổ sung | 116/116 | 77 HTTP và 39 assertion |
| API hồ sơ/phân quyền mới | 125/125 | 85 HTTP và 40 assertion |
| Tổng ba bộ API | **477/477** | **386 HTTP và 91 assertion** |
| Route có luồng thành công | **75/75** | Khớp route tĩnh trước route tham số |
| Chuyển CHECK phân công | 15/15 | MySQL thử nghiệm với ràng buộc cũ và mới |
| Ngày frontend | 9/9 | Biên ngày, tháng, năm, năm nhuận, Việt Nam và Los Angeles |
| Chromium | **58/58** | Ba vai trò; 185 phản hồi HTTP; đối chiếu MySQL |
| Prisma validate/generate | Đạt | Schema 23 model |
| Backend/frontend lint và build | Đạt | Còn cảnh báo nêu bên dưới |

Không cộng các số trên thành một tổng HTTP: unit/assertion khác request, và bộ chuyển CHECK sử dụng lại API core. 75/75 chỉ là độ phủ đường chạy thành công của route, không chứng minh mọi nhánh nghiệp vụ đã được thử.

### API và phân quyền

Đã chạy đăng nhập đúng/sai; đổi và cấp lại mật khẩu; token không hợp lệ/hết hiệu lực; bắt buộc đổi mật khẩu; quyền ADMIN/GIAO_VIEN/PHU_HUYNH; giới hạn dữ liệu theo phân công và quan hệ phụ huynh–học sinh. Bộ core kiểm tra không token ở 73 route được bảo vệ.

Ba luồng đọc chi tiết học sinh cho ADMIN/GV/PH đã chạy thành công, có assertion về học sinh, sức khỏe, xếp lớp, phạm vi liên kết và không trả hash. Bộ bổ sung kiểm tra tài khoản phụ huynh, liên kết/đổi quan hệ, thay số điện thoại, cấp lại mật khẩu và thu hồi hiệu lực phiên trong các tình huống của script.

| Nhóm | Route đã có luồng thành công |
|---|---:|
| Trang gốc/kiểm tra DB | 2/2 |
| Xác thực | 2/2 |
| Giáo viên | 5/5 |
| Hồ sơ học sinh/phụ huynh | 17/17 |
| Tổ chức lớp học | 12/12 |
| Phân công giảng dạy | 11/11 |
| Điểm danh/đơn nghỉ | 8/8 |
| Đánh giá học tập | 18/18 |

Bộ hồ sơ mới kiểm tra sửa thông tin cá nhân/liên hệ/địa chỉ/ghi chú/sức khỏe/trạng thái; cập nhật phụ huynh và quan hệ; hai buổi vắng cùng ngày chỉ tính một ngày. Kiểm tra âm gồm giáo viên không phân công, phân công hết hạn/chưa bắt đầu, lớp khác, phụ huynh khác, quyền tạo/xóa và cấp tài khoản, hồ sơ đã xóa, GVBM không ghi năng lực/phẩm chất, đợt sai năm, môn chưa cấu hình và bộ lọc sai. Thống kê môn chỉ tính sĩ số ở khối được cấu hình môn.

### Trình duyệt thật

58 ca Chromium bao gồm:

- Khách, đăng nhập sai/đúng, menu và route theo quyền, đăng xuất, token hết hạn/sai định dạng.
- Tạo/sửa giáo viên; mật khẩu ban đầu, cấp lại, clipboard native, ẩn thông tin; đổi mật khẩu bắt buộc và đối chiếu Argon2 trong MySQL.
- Tạo học sinh và phụ huynh; mở hồ sơ và cập nhật sức khỏe bằng form; tạo năm/lớp và xếp lớp.
- Tạo môn, gắn môn vào khối, phân công GVCN/GVBM, môn GVCN tự động và kết thúc phân công.
- ADMIN tạo đợt, cấu hình môn/điểm và tiêu chí đánh giá.
- Giáo viên chỉ thấy lớp được phân công, sửa đủ thông tin học sinh/phụ huynh và bổ sung người giám hộ. Không có nút tạo/xóa học sinh hoặc menu phân công; đường dẫn phân công cũng chặn giáo viên.
- Bảng đánh giá nhập mức/nhận xét từng dòng, lưu điểm và kiểm tra lại, năng lực/phẩm chất theo tiêu chí, nạp lại dữ liệu đã lưu. Lưu nhiều dòng có phần thiếu mức đánh giá báo lỗi đúng dòng và không ghi nhầm học sinh.
- ADMIN lọc danh sách theo năm/khối/lớp, mở hồ sơ và xóa học sinh/giáo viên; đối chiếu trạng thái lưu giữ hồ sơ và khóa tài khoản trong MySQL.
- Giáo viên xem thống kê đúng lớp, sĩ số và tỷ lệ. Danh sách/bảng đánh giá không làm tràn trang ở viewport điện thoại.
- Tải/lưu điểm danh và native validation chặn thiếu trạng thái; assertion đối chiếu đúng ngày/buổi.
- Phụ huynh chỉ chọn con được liên kết; xem điểm danh/kết quả; gửi đơn và GVCN duyệt; kiểm tra `CHO_DUYET`, `DA_DUYET` và `giao_vien_duyet_id` trong MySQL.
- Hai ca cố ý giữ phản hồi khởi tạo cũ đến sau khi phụ huynh chọn con/đợt hoặc học sinh trong đơn nghỉ; phản hồi được lấy từ backend thật và giữ nguyên body.
- Mất mạng hiển thị lỗi và phục hồi sau nối lại; viewport 390×844; không có lỗi JavaScript hay phản hồi API 5xx trong các ca đã chạy.

Trace browser của lượt cuối ghi vai trò trong token tại thời điểm gửi request; kiểm tra phân quyền dựa trên response và bộ API riêng.

Đồng hồ frontend đặt ở ngày nghiệp vụ của CI lúc 00:30 tại Việt Nam để thử lỗi trước 07:00. Fixture dùng khối 5, năm 2026–2027, học sinh/tài khoản/lớp/môn riêng. Dữ liệu và response body đến từ backend thật; hai ca phản hồi chậm chỉ trì hoãn response. Chromium headless và desktop 1440×1000; kiểm tra điện thoại bằng viewport, không phải thiết bị thật.

## Lỗi đã sửa và publish

1. **Ngày bị lệch trước 07:00 Việt Nam.** Frontend lấy ngày local qua helper chung tại 7 trang. Backend lấy ngày nghiệp vụ `Asia/Ho_Chi_Minh`, độc lập múi giờ máy chủ; cột DATE vẫn biểu diễn ở UTC 00:00. Có regression cho phạm vi phân công, điểm danh, đánh giá, nhập học, tuổi giáo viên và biên năm.
2. **Giới hạn tuổi ngày 29/02 bị chuyển sang 01/03 khi trừ 18 năm.** Backend/frontend chốt ngày cuối tháng 02 trong năm không nhuận; có test riêng cho giới hạn ngày sinh thực tế.
3. **Layout điện thoại bị menu bên trái ép hẹp.** Đã tái hiện và xem ảnh Chromium trước sửa: viewport 390 px, trang rộng 397 px, nội dung chỉ còn cột hẹp. Layout chuyển menu lên trên ở màn hình nhỏ, cho menu cuộn trong vùng riêng, header tự xuống dòng. Sau sửa: viewport/trang/nội dung đều rộng 390 px, không tràn ngang. Test bắt buộc nội dung đủ chiều rộng và không tràn ngang.

4. **Khởi tạo bất đồng bộ ghi đè lựa chọn phụ huynh.** Phản hồi cũ có thể trả học sinh về con đầu tiên, làm xem/gửi đơn cho nhầm con. Khởi tạo bỏ phản hồi sau cleanup, giá trị mặc định chỉ đặt khi chưa chọn; danh sách đơn theo lớp bỏ phản hồi của lượt tải cũ. Hai regression Chromium trì hoãn phản hồi thật để xác nhận giữ đúng lựa chọn.

5. **Giáo viên bị chặn sửa hồ sơ học sinh/phụ huynh.** API bổ sung quyền cập nhật theo lớp đang được phân công, chặn sửa ngoài phạm vi ngay tại backend. Giáo viên được bổ sung phụ huynh mới; việc gắn hồ sơ có sẵn theo ID và cấp/reset tài khoản vẫn thuộc ADMIN.
6. **Thiếu danh sách/hồ sơ chi tiết và đánh giá theo bảng.** Có bộ lọc năm/khối/lớp, phân trang, hồ sơ đầy đủ, sức khỏe, phụ huynh, lịch sử lớp và thống kê nghỉ. Bảng đánh giá có nhận xét từng học sinh, điểm/kiểm tra lại, năng lực/phẩm chất và thống kê môn.
7. **Xóa giáo viên có thể giữ chỗ phân công cũ.** Xóa lưu giữ lịch sử, khóa tài khoản và kết thúc phân công hiện tại; kiểm tra trùng không để giáo viên đã xóa giữ chỗ. Có ca thay GVCN cùng ngày sau khi xóa giáo viên cũ.
8. **Tải lại bảng khi đổi môn/tiêu chí dễ làm mất phần đang nhập.** Dữ liệu lớp/đợt nạp một lần, môn/tiêu chí lọc trên dữ liệu đã nạp; phản hồi cũ bị bỏ và đổi bộ lọc có xác nhận khi còn nhận xét chưa lưu.

Giữ Prisma schema và tên trường API/DB hiện có; bổ sung 5 route. Package lock không thay đổi trong các bản sửa này. Chi tiết sử dụng: [Hồ sơ và bảng đánh giá](STUDENT_PROFILE_ASSESSMENT.md).

## Dependency và cảnh báo còn tồn tại

| Phạm vi npm audit | Low | Moderate | High | Critical | Tổng |
|---|---:|---:|---:|---:|---:|
| Backend, tất cả dependency | 2 | 2 | 7 | 0 | **11** |
| Backend, `--omit=dev` | 0 | 1 | 5 | 0 | **6** |
| Frontend, tất cả | 0 | 0 | 0 | 0 | **0** |
| Frontend, `--omit=dev` | 0 | 0 | 0 | 0 | **0** |

Đây là số package bị npm audit đánh dấu trong lockfile, không phải số lỗi chức năng hay bằng chứng API đã bị khai thác. Nhóm cần rà soát có `mariadb`, `deepmerge-ts`, `mysql2` và các package cha Prisma; công cụ dev còn `@nestjs/mau`, `tmp`, `undici` và chuỗi phụ thuộc.

Adapter Prisma 7.10.0 ghim `mariadb@3.4.5`. Các advisory MariaDB ghi bản vá ở nhánh 3.4 là 3.4.6: [TLS](https://github.com/advisories/GHSA-cqhc-2h57-wpxf), [Buffer escaping](https://github.com/advisories/GHSA-g5xc-5w98-jfvm). Cần xử lý version pin/compatibility có kiểm thử; chưa nâng gói trong đợt kiểm thử chức năng này. npm audit còn gợi ý downgrade Prisma xuống 6.19.3 khi dùng force; không áp dụng tự động vào dự án Prisma 7.

Bước dependency CI thu và lưu báo cáo, không đặt điều kiện audit phải bằng 0. CI chức năng đạt không có nghĩa đã sạch dependency.

Còn 3 cảnh báo spread dư của backend lint và cảnh báo bundle frontend trên 500 kB sau minify; chúng không làm build thất bại.

## Bằng chứng và chạy lại

JSON chính xác từ lượt CI đã lưu trong:

- `docs/ci-core-results.json`
- `docs/ci-extra-results.json`
- `docs/ci-profile-results.json`
- `docs/ci-route-coverage.json`
- `docs/ci-browser-results.json`
- `docs/ci-browser-before-mobile-fix.json`
- `docs/ci-browser-before-initialization-fix.json`
- `docs/ci-dependency-results.json`
- `docs/ci-functional-summary.json`

Ảnh desktop/điện thoại và log nằm trong artifact `functional-evidence` của lượt CI, giữ 14 ngày. Có thể chạy lại workflow Functional checks; workflow tự chạy khi push thay đổi backend/frontend trên nhánh này.

Sau khi pull và khởi động lại backend/frontend, kiểm tra không tạo fixture trên Windows bằng:

```powershell
npm --prefix C:\LuanVan\backend run prisma:validate
npm --prefix C:\LuanVan\backend run build
npm --prefix C:\LuanVan\backend run test -- --runInBand
npm --prefix C:\LuanVan\frontend run test:dates
npm --prefix C:\LuanVan\frontend run lint
npm --prefix C:\LuanVan\frontend run build
```

Runtime audit tạo dữ liệu giả; chỉ chạy với database thử nghiệm riêng và cờ `AUDIT_ALLOW_TEST_DATA=1`. Workflow dùng `db push` trên database CI mới; không dùng bước này cho database thật của người dùng.

## Chưa xác nhận / phần sản phẩm còn thiếu

- Database Windows hiện có, toàn bộ trigger/ràng buộc cũ, backup/phục hồi và chuyển CHECK trên bản sao dữ liệu thật.
- Tải lớn, mọi tình huống cập nhật đồng thời, Safari/Firefox, thiết bị thật và mọi trạng thái giao diện.
- Tính đúng đầy đủ công thức/biểu mẫu theo yêu cầu luận văn; chưa xác nhận quy trình vận hành cho trường.
- Các thao tác backend chưa có UI, như sửa lớp/năm, sửa/kết thúc lượt xếp lớp, gắn hồ sơ phụ huynh có sẵn, cấp lại mật khẩu phụ huynh và tổng kết giáo dục. Hồ sơ hiển thị lịch sử lớp, hỗ trợ bổ sung/sửa phụ huynh mới và bảng đã có kiểm tra lại.
- Gửi mail/link đặt lại mật khẩu chưa được triển khai; cơ chế hiện có là ADMIN cấp mật khẩu và bắt buộc đổi.
- Chưa có seed và chuỗi migration chính thức đầy đủ để dựng/triển khai mới.

Các giới hạn trên cùng cảnh báo dependency vẫn cần được xử lý trước khi kết luận sẵn sàng triển khai. Kết quả đạt trong báo cáo chỉ áp dụng cho cây mã và phạm vi đã ghi.
