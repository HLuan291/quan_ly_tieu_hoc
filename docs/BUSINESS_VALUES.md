# Giá trị nghiệp vụ sau sửa enum

Một danh mục chung tại `backend/src/danh_muc_quy_uoc.json` được dùng cho kiểm tra backend và lựa chọn frontend. Chỉ nhập mã trong bảng; nhãn tiếng Việt dùng để hiển thị. API trim khoảng trắng và chuyển mã thành chữ hoa, rồi kiểm tra thuộc đúng nhóm.

| Nhóm | Mã được lưu | Nhãn |
|---|---|---|
| Điểm danh | `CO_MAT` | Có mặt |
| Điểm danh | `VANG_CO_PHEP` | Vắng có phép |
| Điểm danh | `VANG_KHONG_PHEP` | Vắng không phép |
| Môn học | `HOAN_THANH_TOT` | Hoàn thành tốt |
| Môn học | `HOAN_THANH` | Hoàn thành |
| Môn học | `CHUA_HOAN_THANH` | Chưa hoàn thành |
| Năng lực/phẩm chất | `TOT` | Tốt |
| Năng lực/phẩm chất | `DAT` | Đạt |
| Năng lực/phẩm chất | `CAN_CO_GANG` | Cần cố gắng |
| Tổng kết giáo dục | `HOAN_THANH_XUAT_SAC` | Hoàn thành xuất sắc |
| Tổng kết giáo dục | `HOAN_THANH_TOT` | Hoàn thành tốt |
| Tổng kết giáo dục | `HOAN_THANH` | Hoàn thành |
| Tổng kết giáo dục | `CHUA_HOAN_THANH` | Chưa hoàn thành |
| Hoàn thành lớp | `HOAN_THANH` | Hoàn thành |
| Hoàn thành lớp | `CHUA_HOAN_THANH` | Chưa hoàn thành |

Các mức môn học và năng lực/phẩm chất đối chiếu Điều 7, tổng kết Điều 9 trong [bản ký Thông tư 27/2020/TT-BGDĐT](https://datafiles.chinhphu.vn/cpp/files/vbpq/2020/09/27-bgddt.signed.pdf), được công bố trên [Cổng thông tin Chính phủ](https://chinhphu.vn/default.aspx?docid=201006&pageid=27160). Cách mã hóa chữ hoa là quy ước của dự án. Ba trạng thái điểm danh là lựa chọn triển khai của dự án, không phải danh sách enum do thông tư này quy định.

Không dùng `HOAN_THANH_XUAT_SAC` cho từng môn, hoặc `HOAN_THANH` cho năng lực/phẩm chất. Tổng kết vẫn hỗ trợ trường tùy chọn/null như API cũ. Việc xét mức vẫn do giáo viên nhập; bản sửa này chưa tự suy ra kết quả hay chứng nhận toàn bộ công thức tính điểm phù hợp quy định.

Dữ liệu cũ ngoài danh mục chưa tự chuyển đổi. Trước khi dùng trên DB thật, thống kê các mã cũ và thống nhất cách chuyển; không mặc định đổi mọi `VANG` thành vắng không phép. Màn hình điểm danh hiện nhắc chọn lại khi gặp mã cũ.
