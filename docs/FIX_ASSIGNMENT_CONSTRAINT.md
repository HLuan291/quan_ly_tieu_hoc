# Sửa lỗi phân công `chk_pc_loai`

Cập nhật ngày 04/10/2026 (giờ Việt Nam), nhánh `backend_audit_fix`.

## Nguyên nhân đã xác nhận

Log backend trên máy người dùng trả MySQL **3819**, `Check constraint 'chk_pc_loai' is violated.` khi tạo phân công. Ràng buộc trong SQL cũ dùng `CHU_NHIEM` / `GIANG_DAY`; backend hiện tại dùng `GVCN` / `GVBM`. Vì vậy request đúng đầu vào vẫn bị MySQL từ chối và trả HTTP 500.

Đã tái hiện trên MySQL 8.0.46 riêng bằng Prisma schema hiện tại và đúng ràng buộc cũ. Cùng request `POST /phan_cong_giang_day/phan_cong/gvcn` trả 500 trước sửa, 201 sau sửa và lưu đủ dòng chủ nhiệm cùng môn tự động.

Script chỉ sửa ràng buộc này và mã loại phân công trong bảng `phan_cong_giao_vien`. Không dùng file SQL 31 bảng cũ để dựng lại database 23 model hiện tại, không đổi Prisma schema hoặc hợp đồng API.

## Chạy trên Windows

Trong terminal đang chạy backend, nhấn **Ctrl+C** để dừng. MySQL vẫn cần chạy. Sau đó chạy trong PowerShell:

```powershell
& {
    git -C C:\LuanVan pull --ff-only origin backend_audit_fix
    if ($LASTEXITCODE -ne 0) { return }

    npm --prefix "C:\LuanVan\backend" run db:check-assignments
    if ($LASTEXITCODE -ne 0) { return }

    npm --prefix "C:\LuanVan\backend" run db:fix-assignments
    if ($LASTEXITCODE -ne 0) { return }

    npm --prefix "C:\LuanVan\backend" run start:dev
}
```

Lệnh dùng `DATABASE_URL` trong `backend/.env`, giống database backend đang kết nối. Không cần cài lại package. Nếu đã đặt `DATABASE_URL` trong môi trường PowerShell, giá trị đó được ưu tiên; đối chiếu tên database mà lệnh in ra.

`db:check-assignments` chỉ đọc, in loại ràng buộc và số dòng cần chuyển. `db:fix-assignments` tự sao lưu trước khi sửa, rồi kiểm tra lại kết quả. Khi thành công sẽ in **Đã sửa chk_pc_loai…**; nếu đã đồng bộ sẽ in **Không có thay đổi**. Sau khi backend khởi động lại, tải lại trang Phân công giảng dạy và thử thao tác vừa lỗi.

Bản sao JSON nằm tại `C:\LuanVan\backend\backups\phan-cong-*.json`. Nó chứa `SHOW CREATE TABLE` thật của database, biểu thức CHECK, toàn bộ dòng phân công trước sửa và kế hoạch chuyển đổi. Đây là bản sao riêng bảng phân công, không phải bản sao toàn bộ database. Thư mục này được loại khỏi Git. Lệnh giữ nguyên Git stash `backup-local-before-audit`.

## Chuyển dữ liệu cũ

| Loại cũ | Môn | Nguồn cũ | Loại mới |
|---|---|---|---|
| `CHU_NHIEM` | `NULL` | `NULL` | `GVCN` |
| `GIANG_DAY` | Có môn | `TU_DONG_GVCN` | `GVCN` |
| `GIANG_DAY` | Có môn | `BO_SUNG` | `GVBM` |

Chỉ cột `loai_phan_cong` thay đổi. ID, giáo viên, lớp, môn, ngày bắt đầu/kết thúc, ngày tạo và nguồn phân công được giữ nguyên. Các dòng đã dùng mã mới hợp lệ không bị chuyển lại.

Mã cũ `GIANG_DAY` với nguồn `BO_SUNG` không ghi rõ môn bổ sung thuộc giáo viên chủ nhiệm hay giáo viên bộ môn, nên được chuyển thành `GVBM` để giữ phân công dạy môn. Dòng chủ nhiệm `CHU_NHIEM` của giáo viên vẫn được chuyển riêng thành `GVCN`; quyền chủ nhiệm dựa trên dòng đó.

CHECK mới cho phép dòng chủ nhiệm `GVCN` không có môn với nguồn `NULL` hoặc `BO_SUNG`; dòng dạy môn `GVCN` với nguồn `TU_DONG_GVCN` / `BO_SUNG`; dòng dạy môn `GVBM` với nguồn `BO_SUNG`. Các tổ hợp khác tiếp tục bị MySQL chặn.

## Dừng hoặc chạy lại

Script đã kiểm chứng trên MySQL **8.0.46** và giới hạn server MySQL **8.x**. Phiên bản khác, ràng buộc khác mẫu, thiếu ràng buộc hoặc dòng dữ liệu không khớp quy ước sẽ làm lệnh dừng trước khi sửa. Không tự đoán cách chuyển dữ liệu lạ. Tài khoản database cần quyền đọc, cập nhật và `ALTER TABLE` trên bảng phân công.

MySQL `ALTER TABLE` tự commit, nên toàn bộ quá trình không thể rollback như một transaction dữ liệu. Script thay CHECK cũ bằng CHECK chuyển tiếp chấp nhận hai bộ mã, chuyển các dòng trong transaction, rồi thay bằng CHECK mới nghiêm ngặt. Mỗi lần thay CHECK dùng một câu `ALTER TABLE` gồm cả DROP và ADD; không có bước tắt CHECK hoặc bỏ ràng buộc riêng lẻ.

Nếu bị gián đoạn, giữ bản sao đã in ra, dừng backend và chạy lại `db:fix-assignments`. Script nhận diện CHECK chuyển tiếp và tiếp tục chuyển các mã còn cũ. Nếu báo **khác mẫu** hoặc **không khớp quy ước**, giữ nguyên dữ liệu và đối chiếu log trước khi sửa thêm. Bản sao được giữ lại để kiểm tra; script không tự khôi phục đè lên dữ liệu mới.

Tham khảo tài liệu chính thức MySQL: [ALTER TABLE](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html), [Statements That Cause an Implicit Commit](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html).

## Kết quả kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| Unit/regression backend | 69/69 đạt, 6 suites |
| E2E HTTP trang gốc | 1/1 đạt |
| Chuyển CHECK và dữ liệu trên MySQL riêng | 15/15 đạt |
| API hồi quy với CHECK mới được thực thi | 231/231 đạt |
| Backend build và lint | Đạt; lint còn 3 cảnh báo có sẵn |

15 kiểm tra gồm chế độ chỉ đọc, tái hiện 500, chuyển ba bộ mã và giữ nguyên metadata, bản sao thực tế, chạy lại không tạo thay đổi, chặn bốn tổ hợp sai, tiếp tục từ CHECK chuyển tiếp, từ chối CHECK khác mẫu, cùng request thành công 201 và lưu đủ hai dòng phân công. Báo cáo: `assignment-constraint-audit-results.json`.

Các phép thử dùng dữ liệu giả và database mới riêng, không kết nối database người dùng. Chưa chạy lệnh sửa trên Windows hoặc kiểm tra trực tiếp giao diện của người dùng.

Để chạy lại phép thử tích hợp: tạo database MySQL riêng có tên chứa `audit`, đồng bộ Prisma schema hiện tại, build backend, đặt `DATABASE_URL`, `JWT_SECRET` và `AUDIT_ALLOW_TEST_DATA=1`, rồi chạy `node scripts/assignment-constraint-audit.cjs` trong thư mục `backend`. Script tạo dữ liệu giả, đổi CHECK của database thử và chạy tiếp bộ kiểm tra API; không dùng database đang sử dụng. Database cần mới và chưa có dữ liệu hoặc CHECK phân công.
