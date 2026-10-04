# Ma trận endpoint và giao diện

Vai trò theo kiểm tra trong controller/service; độ phủ luồng thành công của lượt CI cuối là 75/75, không đại diện cho mọi nhánh nghiệp vụ. Endpoint chưa có frontend vẫn có thể gọi qua API.

| Method | Endpoint | Vai trò | Frontend |
|---|---|---|---|
| GET | `/` | Công khai | Chưa thấy lời gọi |
| GET | `/kiem-tra-db` | ADMIN | Chưa thấy lời gọi |
| POST | `/auth/login` | Công khai | dang_nhap_page.tsx |
| POST | `/auth/doi-mat-khau` | ADMIN, GIAO_VIEN, PHU_HUYNH (có thể giới hạn dữ liệu theo vai trò) | doi_mat_khau_page.tsx |
| POST | `/danh_gia_hoc_tap/dot_danh_gia` | ADMIN | danh_gia_page.tsx |
| GET | `/danh_gia_hoc_tap/dot_danh_gia` | ADMIN, GIAO_VIEN, PHU_HUYNH (có thể giới hạn dữ liệu theo vai trò) | bang_danh_gia_giao_vien.tsx, con_cua_toi_page.tsx, danh_gia_page.tsx, thong_ke_danh_gia.tsx |
| POST | `/danh_gia_hoc_tap/cau_hinh_danh_gia_mon` | ADMIN | danh_gia_page.tsx |
| GET | `/danh_gia_hoc_tap/cau_hinh_danh_gia_mon` | ADMIN, GIAO_VIEN, PHU_HUYNH (có thể giới hạn dữ liệu theo vai trò) | Chưa thấy lời gọi |
| POST | `/danh_gia_hoc_tap/cau_hinh_diem` | ADMIN | danh_gia_page.tsx |
| GET | `/danh_gia_hoc_tap/cau_hinh_diem` | ADMIN, GIAO_VIEN, PHU_HUYNH (có thể giới hạn dữ liệu theo vai trò) | danh_gia_page.tsx |
| POST | `/danh_gia_hoc_tap/tieu_chi_danh_gia` | ADMIN | danh_gia_page.tsx |
| GET | `/danh_gia_hoc_tap/tieu_chi_danh_gia` | ADMIN, GIAO_VIEN, PHU_HUYNH (có thể giới hạn dữ liệu theo vai trò) | danh_gia_page.tsx |
| GET | `/danh_gia_hoc_tap/lop/:lop_hoc_id/hoc_sinh` | GIAO_VIEN | danh_gia_page.tsx |
| PUT | `/danh_gia_hoc_tap/ket_qua_mon_hoc` | GIAO_VIEN | bang_danh_gia_giao_vien.tsx, danh_gia_page.tsx |
| POST | `/danh_gia_hoc_tap/diem_dinh_ky` | GIAO_VIEN | bang_danh_gia_giao_vien.tsx, danh_gia_page.tsx |
| POST | `/danh_gia_hoc_tap/diem_dinh_ky/:Id/kiem_tra_lai` | GIAO_VIEN | bang_danh_gia_giao_vien.tsx |
| PUT | `/danh_gia_hoc_tap/nang_luc_pham_chat` | GIAO_VIEN | bang_danh_gia_giao_vien.tsx, danh_gia_page.tsx |
| PUT | `/danh_gia_hoc_tap/tong_ket_giao_duc` | GIAO_VIEN | Chưa thấy lời gọi |
| GET | `/danh_gia_hoc_tap/hoc_sinh/:hoc_sinh_id/dot/:dot_danh_gia_id` | ADMIN, GIAO_VIEN (phạm vi phân công) | Chưa thấy lời gọi |
| GET | `/danh_gia_hoc_tap/con/:hoc_sinh_id/dot/:dot_danh_gia_id` | PHU_HUYNH | con_cua_toi_page.tsx |
| GET | `/danh_gia_hoc_tap/bang_danh_gia` | ADMIN, GIAO_VIEN (phạm vi phân công) | bang_danh_gia_giao_vien.tsx |
| GET | `/danh_gia_hoc_tap/thong_ke_danh_gia` | ADMIN, GIAO_VIEN (phạm vi phân công) | thong_ke_danh_gia.tsx |
| GET | `/diem_danh_nghi_hoc/lop_chu_nhiem_cua_toi` | GIAO_VIEN | diem_danh_page.tsx, don_xin_nghi_page.tsx |
| GET | `/diem_danh_nghi_hoc/diem_danh` | ADMIN, GIAO_VIEN (phạm vi phân công) | diem_danh_page.tsx |
| POST | `/diem_danh_nghi_hoc/diem_danh` | GIAO_VIEN | diem_danh_page.tsx |
| GET | `/diem_danh_nghi_hoc/diem_danh/con/:hoc_sinh_id` | PHU_HUYNH | con_cua_toi_page.tsx |
| POST | `/diem_danh_nghi_hoc/don_xin_nghi` | PHU_HUYNH | don_xin_nghi_page.tsx |
| GET | `/diem_danh_nghi_hoc/don_xin_nghi/cua_toi` | PHU_HUYNH | don_xin_nghi_page.tsx |
| GET | `/diem_danh_nghi_hoc/don_xin_nghi/lop/:lop_hoc_id` | GIAO_VIEN | don_xin_nghi_page.tsx |
| PATCH | `/diem_danh_nghi_hoc/don_xin_nghi/:id/xu_ly` | GIAO_VIEN | don_xin_nghi_page.tsx |
| POST | `/giao_vien` | ADMIN | giao_vien_page.tsx |
| GET | `/giao_vien` | ADMIN | giao_vien_page.tsx, phan_cong_page.tsx |
| PATCH | `/giao_vien/:id` | ADMIN | giao_vien_page.tsx |
| POST | `/giao_vien/:id/cap_lai_mat_khau` | ADMIN | giao_vien_page.tsx |
| DELETE | `/giao_vien/:id` | ADMIN | giao_vien_page.tsx |
| GET | `/ho_so_hoc_sinh/danh_muc` | ADMIN, GIAO_VIEN (phạm vi phân công) | bang_danh_gia_giao_vien.tsx, danh_sach_hoc_sinh.tsx, thong_ke_danh_gia.tsx |
| DELETE | `/ho_so_hoc_sinh/hoc_sinh/:Id` | ADMIN | danh_sach_hoc_sinh.tsx |
| POST | `/ho_so_hoc_sinh/hoc_sinh` | ADMIN | hoc_sinh_page.tsx |
| GET | `/ho_so_hoc_sinh/hoc_sinh` | ADMIN, GIAO_VIEN, PHU_HUYNH (có thể giới hạn dữ liệu theo vai trò) | danh_sach_hoc_sinh.tsx |
| GET | `/ho_so_hoc_sinh/hoc_sinh/:Id` | ADMIN, GIAO_VIEN, PHU_HUYNH (có thể giới hạn dữ liệu theo vai trò) | ho_so_hoc_sinh_chi_tiet.tsx |
| PATCH | `/ho_so_hoc_sinh/hoc_sinh/:Id` | ADMIN, GIAO_VIEN (phạm vi phân công) | ho_so_hoc_sinh_chi_tiet.tsx |
| PATCH | `/ho_so_hoc_sinh/hoc_sinh/:Id/trang_thai` | ADMIN, GIAO_VIEN (phạm vi phân công) | ho_so_hoc_sinh_chi_tiet.tsx |
| PATCH | `/ho_so_hoc_sinh/hoc_sinh/:Id/suc_khoe` | ADMIN, GIAO_VIEN (phạm vi phân công) | ho_so_hoc_sinh_chi_tiet.tsx |
| GET | `/ho_so_hoc_sinh/phu_huynh` | ADMIN | Chưa thấy lời gọi |
| GET | `/ho_so_hoc_sinh/phu_huynh/me` | PHU_HUYNH | con_cua_toi_page.tsx, don_xin_nghi_page.tsx |
| GET | `/ho_so_hoc_sinh/phu_huynh/:Id` | ADMIN | con_cua_toi_page.tsx, don_xin_nghi_page.tsx |
| PATCH | `/ho_so_hoc_sinh/phu_huynh/:Id` | ADMIN, GIAO_VIEN (phạm vi phân công) | ho_so_hoc_sinh_chi_tiet.tsx |
| POST | `/ho_so_hoc_sinh/phu_huynh/:Id/tao_tai_khoan` | ADMIN | Chưa thấy lời gọi |
| POST | `/ho_so_hoc_sinh/phu_huynh/:Id/cap_lai_mat_khau` | ADMIN | Chưa thấy lời gọi |
| POST | `/ho_so_hoc_sinh/hoc_sinh/:Id/phu_huynh` | ADMIN, GIAO_VIEN (phạm vi phân công) | ho_so_hoc_sinh_chi_tiet.tsx |
| PATCH | `/ho_so_hoc_sinh/hoc_sinh/:hoc_sinh_id/phu_huynh/:phu_huynh_id/moi_quan_he` | ADMIN, GIAO_VIEN (phạm vi phân công) | ho_so_hoc_sinh_chi_tiet.tsx |
| DELETE | `/ho_so_hoc_sinh/hoc_sinh/:hoc_sinh_id/phu_huynh/:phu_huynh_id` | ADMIN | Chưa thấy lời gọi |
| POST | `/phan_cong_giang_day/mon_hoc` | ADMIN | phan_cong_page.tsx |
| GET | `/phan_cong_giang_day/mon_hoc` | ADMIN, GIAO_VIEN, PHU_HUYNH (có thể giới hạn dữ liệu theo vai trò) | danh_gia_page.tsx, phan_cong_page.tsx |
| PATCH | `/phan_cong_giang_day/mon_hoc/:Id` | ADMIN | Chưa thấy lời gọi |
| POST | `/phan_cong_giang_day/mon_hoc_khoi` | ADMIN | phan_cong_page.tsx |
| GET | `/phan_cong_giang_day/mon_hoc_khoi` | ADMIN | phan_cong_page.tsx |
| PATCH | `/phan_cong_giang_day/mon_hoc_khoi/:Id` | ADMIN | Chưa thấy lời gọi |
| POST | `/phan_cong_giang_day/phan_cong/gvcn` | ADMIN | phan_cong_page.tsx |
| POST | `/phan_cong_giang_day/phan_cong/mon_hoc` | ADMIN | phan_cong_page.tsx |
| GET | `/phan_cong_giang_day/phan_cong` | ADMIN | phan_cong_page.tsx |
| GET | `/phan_cong_giang_day/phan_cong/cua_toi` | GIAO_VIEN | danh_gia_page.tsx, phan_cong_page.tsx |
| PATCH | `/phan_cong_giang_day/phan_cong/:Id/ket_thuc` | ADMIN | phan_cong_page.tsx |
| POST | `/to_chuc_lop_hoc/nam_hoc` | ADMIN | lop_hoc_page.tsx |
| GET | `/to_chuc_lop_hoc/nam_hoc` | ADMIN | danh_gia_page.tsx, lop_hoc_page.tsx |
| PATCH | `/to_chuc_lop_hoc/nam_hoc/:Id` | ADMIN | Chưa thấy lời gọi |
| GET | `/to_chuc_lop_hoc/khoi` | ADMIN | danh_gia_page.tsx, lop_hoc_page.tsx, phan_cong_page.tsx |
| POST | `/to_chuc_lop_hoc/lop_hoc` | ADMIN | lop_hoc_page.tsx |
| GET | `/to_chuc_lop_hoc/lop_hoc` | ADMIN | lop_hoc_page.tsx, phan_cong_page.tsx |
| GET | `/to_chuc_lop_hoc/lop_hoc/:Id` | ADMIN | Chưa thấy lời gọi |
| PATCH | `/to_chuc_lop_hoc/lop_hoc/:Id` | ADMIN | Chưa thấy lời gọi |
| GET | `/to_chuc_lop_hoc/hoc_sinh_chua_xep_lop` | ADMIN | lop_hoc_page.tsx |
| POST | `/to_chuc_lop_hoc/xep_lop` | ADMIN | lop_hoc_page.tsx |
| GET | `/to_chuc_lop_hoc/xep_lop/hoc_sinh/:hoc_sinh_id` | ADMIN | Chưa thấy lời gọi |
| PATCH | `/to_chuc_lop_hoc/xep_lop/:Id` | ADMIN | Chưa thấy lời gọi |
