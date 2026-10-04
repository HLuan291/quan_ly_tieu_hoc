# Lưu chung hồ sơ và thông tin cá nhân giáo viên

Nhánh `backend_audit_fix`; mã kiểm thử `c967dafc3377fc705f2d0c185a70d426dc924b62`.
[Functional checks](https://github.com/HLuan291/quan_ly_tieu_hoc/actions/runs/37216358087) thành công với dữ liệu giả trên MySQL CI riêng.

## Hồ sơ học sinh

Mở tên học sinh hoặc Xem / sửa. Hồ sơ nổi có một nút **Đóng** trên đầu và một nút **Lưu thay đổi**.

- Sửa thông tin học sinh, ghi chú, sức khỏe, các phụ huynh và mối quan hệ ngay trên cùng form.
- ADMIN được chọn trạng thái học sinh; GIAO_VIEN chỉ thấy trạng thái để xem.
- Không có nút Bổ sung phụ huynh hoặc hộp thoại con. Phần Người giám hộ khác (nếu có) cho nhập họ tên, điện thoại, năm sinh, nghề nghiệp. Để trống nếu không cần ghi thêm.
- Người giám hộ mới cần họ tên và điện thoại đúng 10 số; năm sinh tùy chọn và phải đủ 18 tuổi. Không tự cấp tài khoản đăng nhập.
- Sức khỏe cần đủ chiều cao, cân nặng, ngày đo; có thể xóa cả ba cùng lúc.
- Lưu một lần ghi toàn bộ các phần trong cùng transaction. Nếu lỗi, database không ghi một phần; form giữ bản nhập để sửa.
- Nút Lưu chỉ bật khi có thay đổi. Sau lưu thành công, ô người giám hộ mới trống lại và người vừa ghi xuất hiện trong danh sách liên kết.
- Đóng khi đang có bản nhập chưa lưu yêu cầu xác nhận; trong lúc lưu khóa việc sửa/đóng.

Thông tin phụ huynh có thể dùng chung cho nhiều con; sửa thông tin cá nhân áp dụng cho hồ sơ phụ huynh đó. Mối quan hệ áp dụng cho học sinh đang mở. Mã/ID, lịch sử lớp và số nghỉ tiếp tục để xem.

## Hồ sơ của tôi

GIAO_VIEN vào menu **Hồ sơ của tôi** để xem/sửa họ tên, ngày sinh, giới tính, điện thoại, email, địa chỉ, ngày vào trường và trình độ chuyên môn; một nút Lưu thay đổi.

Mã giáo viên, tên đăng nhập và trạng thái hiển thị để xem. Số điện thoại được đồng bộ với tài khoản. Đổi mật khẩu sử dụng trang Đổi mật khẩu hiện có.

API xác định hồ sơ từ tài khoản JWT; không nhận ID giáo viên do frontend chọn. Giáo viên không được tự đổi vai trò, trạng thái, liên kết tài khoản hoặc mật khẩu qua API hồ sơ. Không cần có phân công lớp để chỉnh sửa hồ sơ cá nhân.

## API

| Endpoint | Quyền |
|---|---|
| GET /giao_vien/me | GIAO_VIEN, hồ sơ của chính mình |
| PATCH /giao_vien/me | GIAO_VIEN, thông tin cá nhân của chính mình |
| PATCH /ho_so_hoc_sinh/hoc_sinh/:Id/ho_so | ADMIN hoặc GIAO_VIEN trong phạm vi phân công; trạng thái chỉ ADMIN |
| PATCH /ho_so_hoc_sinh/hoc_sinh/:Id/trang_thai | Chỉ ADMIN |

Lần lưu chung chấp nhận `hoc_sinh`, `suc_khoe`, `phu_huynh`, `nguoi_giam_ho` và `trang_thai` (ADMIN). PH cập nhật phải đã liên kết với học sinh; không gắn hồ sơ khác hoặc cấp tài khoản trong lần lưu này. `suc_khoe: null` xóa cả ba trường đo; bỏ trường này giữ nguyên sức khỏe.

## Kiểm thử và cập nhật

599/599 ca API, 78/78 route có luồng thành công, 96/96 unit backend, E2E GET / 1/1, ngày frontend 16/16, CHECK MySQL 15/15, Chromium 68/68. Chromium ghi 234 phản hồi HTTP, không lỗi JavaScript hoặc API 5xx trong các ca đã chạy. Có ca lỗi điện thoại/quan hệ/giám hộ xác nhận rollback, bản nhập sau lỗi, trạng thái ADMIN/GV và reload hồ sơ cá nhân.

Bằng chứng: [FUNCTIONAL_TEST_REPORT.md](FUNCTIONAL_TEST_REPORT.md).
Chưa kiểm thử database Windows hiện có hoặc mọi nhánh nghiệp vụ.

```powershell
cd C:\LuanVan
git pull --ff-only origin backend_audit_fix
```

Khởi động lại backend và frontend. Không đổi Prisma schema hoặc package lock, không reset database; không áp dụng/xóa stash local.
