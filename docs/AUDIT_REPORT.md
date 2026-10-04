> Lưu hồ sơ bằng một nút, trạng thái chỉ ADMIN sửa và giáo viên tự sửa thông tin: [UNIFIED_PROFILE_SAVING.md](UNIFIED_PROFILE_SAVING.md).
>
> Kết quả kiểm thử chức năng ngày 04/10/2026: [FUNCTIONAL_TEST_REPORT.md](FUNCTIONAL_TEST_REPORT.md). Hộp thoại, điểm danh nhanh và lớp gắn với giáo viên: [UI_ATTENDANCE_TEACHER_SCOPE.md](UI_ATTENDANCE_TEACHER_SCOPE.md). Báo cáo bên dưới là kết quả lịch sử ngày 02/10/2026.

# Báo cáo kiểm tra quan_ly_tieu_hoc

Ngày kiểm tra: 02/10/2026. Repository: https://github.com/HLuan291/quan_ly_tieu_hoc

Nhánh gốc: `backend_audit_fix`, commit `7ecc30a22878d114407e2985da4218f860ab3aa1`. Phạm vi bản sửa: nhánh `backend_audit_fix`; giữ nguyên `main`. Đã đọc tài liệu handoff và rà soát backend, frontend, Prisma, xác thực, phân quyền, API và cấu hình chạy. Không đổi schema, tên trường DB hoặc route.

## Kết quả chính

| Kiểm tra | Kết quả |
|---|---|
| Backend TypeScript/build | Đạt sau sửa; trước sửa có 12 lỗi TypeScript |
| Frontend lint/build | Đạt sau sửa; trước sửa có 5 lỗi lint |
| Unit/regression test | 44/44 đạt, 4 suites |
| E2E mặc định của Nest | 1/1 đạt; chỉ kiểm tra HTTP trang gốc |
| API thực tế với MySQL 8.0 | 198/198 đạt; hai lỗi enum đã sửa |
| Endpoint không có token | 68/68 endpoint bảo vệ trả 401 |
| Đối chiếu endpoint | 70 endpoint; 47 có lời gọi frontend; 23 chưa thấy lời gọi |
| Endpoint đã chạy thành công với dữ liệu hợp lệ | 43/70, tương đương 61,4% |
| Kiểm tra trình duyệt thực tế | Chưa hoàn thành: Chromium không tải được trong môi trường kiểm tra |
| Database hiện tại của người dùng | Chưa kiểm tra: chưa có kết nối hoặc bản sao DB |

198 là số ca kiểm tra, gồm cả ca lỗi và phân quyền; không phải số chức năng. 100% ca kiểm tra hiện tại đạt không có nghĩa đã kiểm tra hết dự án. Ở cấp endpoint, phần đã xác nhận có đường chạy thành công hiện là 61,4%; các luồng chính đã chạy nhưng giao diện và DB thật chưa xác minh nên chưa đủ cơ sở tuyên bố hệ thống hoàn thiện để triển khai.

MySQL thử nghiệm dùng DB mới tạo từ 23 model Prisma và dữ liệu giả. Không dùng SQL cũ 31 bảng và không tác động dữ liệu thật. Các kết quả chi tiết nằm trong `runtime-audit-results.json`; ma trận đầy đủ trong `ENDPOINT_MATRIX.md` và `endpoint-map.json`. Các bản `before-*` giữ bằng chứng lỗi trước sửa. Log server chỉ là tệp tạm, không nằm trong gói bản sửa.

## 1. ĐÃ XÁC NHẬN HOẠT ĐỘNG

Các mục sau đã chạy bằng HTTP qua Nest và MySQL thử nghiệm:

- Đăng nhập ADMIN, GIAO_VIEN, PHU_HUYNH; sai mật khẩu; bắt buộc đổi mật khẩu; đổi mật khẩu và đăng nhập lại.
- Tài khoản khóa, token hết hạn, thiếu token, token cũ sau cấp lại/đổi mật khẩu bị chặn.
- ADMIN tạo/sửa giáo viên, tạo/sửa học sinh và phụ huynh; đọc hồ sơ; cập nhật sức khỏe; kiểm tra trùng dữ liệu và một số đầu vào sai.
- Tạo năm học/lớp, xếp lớp, xem lịch sử xếp lớp; chặn xếp lớp trùng thời gian.
- Tạo môn, gắn môn với khối, phân công GVCN và bộ môn; kết thúc phân công; chặn giáo viên hết phân công ghi đánh giá/tổng kết.
- Giáo viên đọc và lưu điểm danh; phụ huynh chỉ đọc điểm danh con mình.
- Phụ huynh gửi đơn nghỉ; giáo viên duyệt/từ chối; chặn thao tác ngoài phạm vi.
- Tạo đợt/cấu hình/tiêu chí; nhập đánh giá môn, điểm định kỳ, kiểm tra lại, năng lực/phẩm chất, tổng kết; điểm tự tính xuất hiện trong kết quả.
- Phụ huynh xem kết quả gồm môn, điểm, năng lực/phẩm chất và tổng kết; yêu cầu xem con khác trả 403. ADMIN đọc kết quả; giáo viên ngoài lớp bị chặn.
- Tên giáo viên dài 101 ký tự trả 400; hai yêu cầu tạo giáo viên đồng thời với số điện thoại khác nhau đều trả 201 sau sửa.

Phạm vi này không chứng minh mọi tổ hợp dữ liệu/quyền đều đúng. Các quy tắc tính điểm mới chỉ được kiểm tra theo cách code hiện tại vận hành, chưa đối chiếu quy chế nghiệp vụ của trường.

## 2. CÓ CODE NHƯNG CHƯA XÁC NHẬN RUNTIME

- Giao diện cho ba vai trò, route guard, refresh, thông báo lỗi đăng nhập, xem kết quả phụ huynh: đã đọc code, frontend lint/build đạt; chưa chạy được Chromium để xác nhận thao tác thật.
- Các bản sửa giao diện chống ghi điểm danh vào ngày/lớp/buổi khác, chống gửi cấu hình điểm của lựa chọn cũ, và bỏ kết quả phụ huynh trả về muộn: mới có bằng chứng mã nguồn và build.
- 27 endpoint chưa có ca trả thành công trong bộ API hiện tại; xem ma trận để biết endpoint có giao diện hoặc chưa có giao diện. Đã kiểm tra thiếu token trên tất cả endpoint bảo vệ.
- DB thật: foreign key, unique, check constraint, trigger, charset, dữ liệu cũ, backup và tính tương thích với Prisma chưa đối chiếu. `db push` trong DB thử nghiệm không thay thế bước này.
- Đồng thời nhiều yêu cầu tạo học sinh, xếp lớp, phân công và kiểm tra lại chưa được stress test. Riêng lỗi tạo giáo viên đồng thời đã tái hiện và sửa.
- Tính đúng của ngày theo giờ Việt Nam ở ranh giới nửa đêm, hiệu năng danh sách lớn/N+1, phục hồi khi DB mất kết nối, và khả năng triển khai máy thật chưa kiểm tra.
- Quy ước điểm danh hiện dùng 3 trạng thái: có mặt, vắng có phép, vắng không phép. Công thức điểm tổng hợp, quy tắc làm tròn và tính phù hợp của quy ước điểm danh với từng trường vẫn cần đối chiếu khi triển khai.

## 3. ĐANG LỖI / SAI

### Hai lỗi enum đã xử lý trong lần cập nhật tiếp theo

| ID | Vị trí | Nguyên nhân và cách tái hiện trước sửa | Mức độ | Trạng thái |
|---|---|---|---|---|
| O01 | `backend/src/diem_danh_nghi_hoc/diem_danh_nghi_hoc.service.ts`, `DiemDanhHangLoat` | POST trạng thái `SAI_QUY_UOC` từng trả 201. Nay chỉ nhận `CO_MAT`, `VANG_CO_PHEP`, `VANG_KHONG_PHEP`; giá trị khác trả 400. | Cao | Đã sửa; API xác nhận cả 3 trạng thái và rollback lượt lỗi |
| O02 | `backend/src/danh_gia_hoc_tap/danh_gia_hoc_tap.service.ts`, cập nhật môn/năng lực/tổng kết | `muc_danh_gia` tùy ý từng được lưu. Nay kiểm tra đúng tập giá trị cho từng loại và không dùng lẫn mức môn học/năng lực. | Cao | Đã sửa; API xác nhận cả giá trị hợp lệ và sai nhóm |

Backend và frontend cùng đọc `backend/src/danh_muc_quy_uoc.json`; service dùng `KiemTraGiaTriQuyUoc`, giao diện thay input tự do bằng select. Danh mục mã/nội dung trong `BUSINESS_VALUES.md`. Cấu trúc hai thư mục backend/frontend cần được giữ khi build vì frontend nhập danh mục JSON từ backend. Prisma schema và route được giữ nguyên.

Đã bổ sung 22 ca API, 17 unit test. Kết quả: 198/198 API, 44/44 unit và 1/1 E2E đạt. Giữ bản kết quả 174/176 trước sửa trong `runtime-audit-before-enum-fixes.json`. Không backfill dữ liệu thật; điểm danh cũ có mã ngoài danh mục sẽ hiện nhắc chọn lại khi chỉnh sửa. Giao diện đã lint/build, chưa chạy thử được bằng trình duyệt.

### Các lỗi đã sửa

| ID | File/hàm | Bằng chứng, nguyên nhân và cách tái hiện trước sửa | Mức độ | Xác minh sau sửa |
|---|---|---|---|---|
| F01 | Controller hồ sơ, lớp, đánh giá; service phân công | Controller gọi 4 hàm sai chữ hoa; 7 Prisma where dùng `Id` thay vì `id`; JWT đọc header sai casing/type. Chạy backend build báo 12 lỗi. | Chặn chạy | Build đạt; endpoint liên quan đã chạy |
| F02 | `backend/jest.config.ts`, `tsconfig.json`, scripts test, test controller | TS6 rootDir và Jest ESM/Prisma imports làm suite không chạy; thiếu provider Prisma. Chạy npm test thất bại. | Cao | 44 unit/regression và 1 E2E đạt |
| F03 | Các service xử lý ngày; `kiem_tra_body.pipe.ts`, `main.ts` | DTO TypeScript không kiểm tra JSON runtime; số thay chuỗi gây trim lỗi, ngày 30/02 bị JS chuẩn hóa; thiếu trường gây lỗi Prisma. Gửi body sai kiểu/ngày không tồn tại. | Cao | Ca sai kiểu, thiếu trường, null và ngày trả 400 |
| F04 | Hồ sơ học sinh `KiemTraNgayHocSinh`, `KiemTraHoTen`, SĐT | Cho ngày tương lai, nhập học trước sinh, SĐT 11–15 số dù UI/handoff yêu cầu 10 số; chưa đồng nhất họ tên. | Vừa | Các ca tương ứng trả 400; giữ field DB/API |
| F05 | `app.controller.ts`, `KiemTraDatabase` | Khách GET `/kiem-tra-db` biết số tài khoản và tình trạng DB. | Vừa | Không token 401; chỉ ADMIN truy cập |
| F06 | Service đánh giá `KiemTraQuyenDanhGiaMon`, `KiemTraQuyenGvcn`, `LayHocSinhDeDanhGia` | Query phân công không lọc khoảng ngày hiện hành. Kết thúc phân công ngày 30/09 rồi giáo viên vẫn ghi kết quả/tổng kết ngày 02/10. | Cao | Hai ca ghi ngoài quyền trả 403 |
| F07 | Auth service, JWT guard, `phien_dang_nhap.ts` | Token cũ hợp lệ trở lại sau reset và đổi mật khẩu. Guard chưa gắn token với phiên bản hash mật khẩu. | Cao | Token cũ trả 401; token mới dùng được |
| F08 | `frontend/src/api/api.ts` | 401 của login gây full reload, mất thông báo sai mật khẩu. | Vừa | Đã sửa interceptor; lint/build đạt, chưa xác nhận bằng trình duyệt |
| F09 | `diem_danh_page.tsx` | Tải sổ rồi đổi ngày/lớp/buổi có thể gửi danh sách cũ sang lựa chọn mới. | Cao | Gắn sổ với khóa lựa chọn và chặn gửi sai; build đạt, chưa kiểm thử trình duyệt |
| F10 | `danh_gia_page.tsx` | Dùng `Khoi` thay `khoi`, nhận phân công đã hết hạn, giữ cấu hình điểm cũ khi đổi lựa chọn. | Vừa/Cao | Sửa key, lọc thời hạn và kiểm tra ngữ cảnh cấu hình trước gửi; build đạt |
| F11 | `con_cua_toi_page.tsx` | Đổi con/đợt trong khi request đang chạy có thể hiện kết quả của lựa chọn trước. | Vừa | Bộ đếm request loại bỏ kết quả/lỗi trả muộn; build đạt |
| F12 | Hồ sơ service và `hoc_sinh_page.tsx` | Thẻ tài khoản mới hiển thị username trong khi phụ huynh đăng nhập bằng SĐT. | Vừa | Thêm SĐT vào response và hiển thị SĐT; giữ key cũ; build/API đạt |
| F13 | 5 trang danh sách frontend | SetState trực tiếp trong effect vi phạm lint React. | Vừa | Khởi tạo async có hủy khi effect cleanup; lint đạt |
| F14 | `kiem_tra_body.pipe.ts` | PATCH giáo viên tên dài 101 ký tự vượt VarChar(100), trả 500 thay vì lỗi đầu vào. | Vừa | Kiểm tra độ dài họ tên; API trả 400; thêm regression test |
| F15 | Giáo viên `TaoGiaoVien`, `TaoGiaoVienMotLan` | Hai POST đồng thời cùng đọc mã cuối và sinh cùng mã/username; một transaction lỗi P2002 trả 500. | Cao | Thử lại tối đa 3 transaction mới khi unique conflict, trả 409 nếu vẫn xung đột; ca 2 yêu cầu đều 201 |
| F16 | API frontend, CORS backend | URL cố định localhost gây hạn chế khi chạy máy khác. | Vừa khi triển khai | Thêm `VITE_API_URL`, `FRONTEND_ORIGIN` và file env mẫu; giữ mặc định cũ |

Bản sửa F07 thay đổi hiệu lực JWT: token phát hành trước bản sửa không có dấu phiên sẽ bị từ chối. Người dùng cần đăng nhập lại sau áp dụng. Không thay schema hay hash mật khẩu đã lưu.

Frontend vẫn cảnh báo bundle khoảng 511 KB trước gzip. Đây là cảnh báo hiệu năng, không làm build thất bại; chưa tối ưu tách trang trước khi xác minh UI.

## 4. CHƯA CÓ / CÒN THIẾU

- Giao diện chưa gọi nhiều chức năng backend: sửa lớp/năm học, lịch sử hoặc kết thúc xếp lớp; sửa môn/cấu hình môn-khối; các thao tác sửa/liên kết phụ huynh; nhập kiểm tra lại, nhập tổng kết, xem kết quả học sinh cho nhân viên. Danh sách chính xác trong ma trận; không có lời gọi frontend không đồng nghĩa thiếu API.
- Chưa có migration lịch sử và seed chính thức trong repo, hoặc dữ liệu khối ban đầu đủ để người mới dựng môi trường theo một quy trình đã kiểm chứng. Script audit tạo khối 2 riêng, không phải seed sản phẩm.
- README hiện còn mẫu framework. Báo cáo này thêm hướng dẫn kiểm tra bên dưới và env mẫu, chưa thay cho tài liệu vận hành đầy đủ.
- Chưa có backup DB hiện tại hoặc bằng chứng phục hồi backup.
- Chưa có bộ browser E2E/CI hoàn chỉnh cho ba vai trò; E2E mặc định chỉ kiểm tra trang gốc. Unit và API regression được bổ sung lần này.
- Cần bổ sung kiểm tra giới hạn độ dài/range theo từng cột ngoài họ tên; chưa chứng minh mọi input bất thường đều được trả 400.
- Cần đối chiếu quy ước điểm danh với trường, chốt công thức tính điểm và thời hạn được nhập/sửa kết quả trước khi merge.

## Cách áp dụng và kiểm tra lại

Lấy bản sửa trực tiếp từ nhánh `backend_audit_fix` trên GitHub. Nếu đã có repository trên máy, dùng `git fetch origin`, checkout nhánh này và `git pull --ff-only` khi working tree sạch.

Gói patch là phương án cho bản checkout còn ở đúng commit gốc ghi đầu báo cáo. Chỉ áp dụng patch khi chưa có các sửa đổi này:

```bash
git apply --check audit-fixes.patch
git apply audit-fixes.patch
```

Backend: sao chép `.env.example` thành `.env`, đặt DATABASE_URL và JWT_SECRET thực; không commit secrets. Chạy lần lượt `npm ci`, `npm run prisma:generate`, `npm run prisma:validate`, `npm run build`, `npm test -- --runInBand`, `npm run start:dev`. Frontend: sao chép env mẫu, đặt VITE_API_URL, chạy `npm ci`, `npm run lint`, `npm run build`, `npm run dev`.

Chạy script API chỉ trên DB thử nghiệm **mới, trống, tên chứa audit**. Script tạo dữ liệu giả, không dọn DB; SĐT fixture cố định nên không chạy lại trên DB cũ. Cần tạo schema trước với Prisma bằng cấu hình `prisma7.config.ts` trong DB thử nghiệm, rồi chạy:

```bash
AUDIT_ALLOW_TEST_DATA=1 node scripts/runtime-audit.cjs
```

DATABASE_URL và JWT_SECRET phải có trong environment của lệnh Node (Node này không tự đọc `.env`). Script khởi động backend build sẵn trên cổng 3000; cổng phải trống. Chạy từ thư mục backend và đảm bảo thư mục docs tồn tại. Dữ liệu/ngày fixture thiết kế cho 02/10/2026; khi kiểm tra ở thời điểm khác cần chỉnh ngày phân công và ngày nghiệp vụ đồng bộ. Script đọc `docs/endpoint-map.json`; tạo lại bằng `node scripts/audit-route-map.cjs` nếu đổi controller.

## Trước khi merge

Chưa đề nghị merge ở trạng thái này. O01/O02 đã sửa và kiểm tra đạt. Vẫn cần kiểm tra DB thật từ bản sao; backup và thử phục hồi; chạy thao tác UI cả ba vai trò; test các endpoint chưa có happy path; xác nhận thay đổi JWT yêu cầu đăng nhập lại; sau đó review diff và tạo PR để xem xét merge. Không dùng `prisma db push` trực tiếp trên DB thật trong quá trình kiểm tra.
