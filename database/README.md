# Database backup

Hệ thống hiện tại dùng **23 bảng**, theo:

`backend/prisma/schema.prisma`

File:

`database/db_legacy_31_bang.sql`

chỉ là cấu trúc cũ 31 bảng và **không được dùng để tạo lại database hiện tại**.

## Tạo bản sao lưu đúng từ database đang chạy

Database mặc định:

`quan_ly_hoc_sinh_tieu_hoc`

### MySQL Workbench

1. Mở **Server > Data Export**.
2. Chọn database `quan_ly_hoc_sinh_tieu_hoc`.
3. Chọn **Dump Structure Only** nếu chỉ cần cấu trúc.
4. Chọn **Dump Structure and Data** nếu cần cả dữ liệu.
5. Export ra file SQL.
6. Đặt file cấu trúc hiện tại tại:
   `database/db_schema_23_bang.sql`

Không commit file chứa dữ liệu thật, mật khẩu, token hoặc thông tin cá nhân lên GitHub public.

## Kiểm tra trước khi dùng backup

Bản schema hiện tại phải có đúng các model/bảng sau:

1. tai_khoan
2. giao_vien
3. hoc_sinh
4. phu_huynh
5. phu_huynh_hoc_sinh
6. nam_hoc
7. khoi
8. lop_hoc
9. xep_lop
10. mon_hoc
11. mon_hoc_khoi
12. phan_cong_giao_vien
13. diem_danh
14. don_xin_nghi
15. dot_danh_gia
16. cau_hinh_danh_gia_mon
17. cau_hinh_diem
18. ket_qua_mon_hoc
19. diem_kiem_tra_dinh_ky
20. tieu_chi_danh_gia
21. ket_qua_nang_luc_pham_chat
22. tong_ket_giao_duc
23. lan_kiem_tra_dinh_ky
