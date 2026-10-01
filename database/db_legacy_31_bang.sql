-- ============================================================
-- LEGACY ONLY - KHONG DUNG FILE NAY DE TAO DATABASE HIEN TAI
-- File nay la cau truc CU 31 bang.
-- He thong hien tai dung schema Prisma 23 bang.
-- Can tao backup moi tu database dang chay tren may.
-- Xem database/README.md.
-- ============================================================

-- BAN LUU TRU CAU TRUC 31 BANG - LUAN VAN QUAN LY HOC SINH TIEU HOC
-- BAO GOM: 01 bang tai_khoan da tao thu cong + 30 bang con lai.
-- DAY LA FILE LUU TRU/TAO MOI O DATABASE TRONG, KHONG PHAI FILE CAP NHAT DATABASE HIEN CO.
-- KHONG CHAY LAI TREN DATABASE DA CO 31 BANG: cac lenh CREATE TABLE cua 30 bang se bao loi trung ten.
-- Neu can sao luu CHINH XAC database tren may, dung Workbench Data Export > Dump Structure Only.

CREATE DATABASE IF NOT EXISTS quan_ly_hoc_sinh_tieu_hoc
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE quan_ly_hoc_sinh_tieu_hoc;

-- 01. TAI KHOAN (ghep tu lenh nguoi dung da chay trong Query 1).
CREATE TABLE tai_khoan (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    so_dien_thoai VARCHAR(15) NOT NULL UNIQUE,
    mat_khau_bam VARCHAR(255) NOT NULL,
    vai_tro VARCHAR(20) NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    phai_doi_mat_khau BOOLEAN NOT NULL DEFAULT TRUE,
    lan_dang_nhap_cuoi DATETIME NULL,
    ngay_doi_mat_khau DATETIME NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_tai_khoan_vai_tro CHECK (vai_tro IN ('ADMIN', 'GIAO_VIEN', 'PHU_HUYNH')),
    CONSTRAINT chk_tai_khoan_trang_thai CHECK (trang_thai IN ('HOAT_DONG', 'KHOA'))
) ENGINE=InnoDB;

-- 02. GIAO VIEN: 1 ho so giao vien gan voi 1 tai khoan GIAO_VIEN.
CREATE TABLE giao_vien (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_giao_vien VARCHAR(20) NOT NULL UNIQUE,
    ho_ten VARCHAR(100) NOT NULL,
    ngay_sinh DATE NOT NULL,
    gioi_tinh VARCHAR(10) NOT NULL,
    so_dien_thoai VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    dia_chi_lien_he VARCHAR(255) NOT NULL,
    ngay_vao_truong DATE NOT NULL,
    trinh_do_chuyen_mon VARCHAR(100) NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    tai_khoan_id INT UNSIGNED NOT NULL UNIQUE,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_gv_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB;

-- 03. HOC SINH: 16 truong ho so + 3 truong so do SUC KHOE HIEN HANH.
-- Khong co bang suc khoe rieng; cap nhat so do moi se thay the so do cu.
CREATE TABLE hoc_sinh (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_hoc_sinh VARCHAR(20) NOT NULL UNIQUE,
    ho_ten VARCHAR(100) NOT NULL,
    ngay_sinh DATE NOT NULL,
    gioi_tinh VARCHAR(10) NOT NULL,
    dan_toc VARCHAR(50) NOT NULL,
    quoc_tich VARCHAR(50) NOT NULL,
    noi_sinh VARCHAR(255) NOT NULL,
    so_dien_thoai_lien_he VARCHAR(15) NOT NULL,
    dia_chi_thuong_tru VARCHAR(255) NOT NULL,
    dia_chi_hien_tai VARCHAR(255) NOT NULL,
    ngay_nhap_hoc DATE NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DANG_HOC',
    ghi_chu TEXT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    chieu_cao_cm DECIMAL(5,1) NULL,
    can_nang_kg DECIMAL(5,2) NULL,
    ngay_do DATE NULL,
    CONSTRAINT chk_hs_chieu_cao CHECK (chieu_cao_cm IS NULL OR chieu_cao_cm > 0),
    CONSTRAINT chk_hs_can_nang CHECK (can_nang_kg IS NULL OR can_nang_kg > 0)
) ENGINE=InnoDB;

-- 04. PHU HUYNH: so_dien_thoai LIEN HE khong UNIQUE.
CREATE TABLE phu_huynh (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    nam_sinh SMALLINT UNSIGNED NULL,
    so_dien_thoai VARCHAR(15) NOT NULL,
    nghe_nghiep VARCHAR(100) NULL,
    tai_khoan_id INT UNSIGNED NULL UNIQUE,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ph_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id),
    CONSTRAINT chk_ph_nam_sinh CHECK (nam_sinh IS NULL OR nam_sinh BETWEEN 1900 AND 2100)
) ENGINE=InnoDB;

-- 05. BANG NOI PHU HUYNH - HOC SINH (KHONG tu lien ket theo so dien thoai).
CREATE TABLE phu_huynh_hoc_sinh (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phu_huynh_id INT UNSIGNED NOT NULL,
    hoc_sinh_id INT UNSIGNED NOT NULL,
    moi_quan_he VARCHAR(20) NOT NULL,
    ngay_lien_ket DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_phhs UNIQUE (phu_huynh_id, hoc_sinh_id),
    CONSTRAINT fk_phhs_ph FOREIGN KEY (phu_huynh_id) REFERENCES phu_huynh(id),
    CONSTRAINT fk_phhs_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT chk_phhs_mqh CHECK (moi_quan_he IN ('CHA', 'ME', 'NGUOI_GIAM_HO'))
) ENGINE=InnoDB;

-- 06. NAM HOC.
CREATE TABLE nam_hoc (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ten_nam_hoc VARCHAR(20) NOT NULL UNIQUE,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHUA_BAT_DAU',
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 07. KHOI (lop 1 den lop 5).
CREATE TABLE khoi (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ten_khoi VARCHAR(20) NOT NULL,
    so_khoi TINYINT UNSIGNED NOT NULL UNIQUE,
    CONSTRAINT chk_khoi_so CHECK (so_khoi BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- 08. LOP HOC (ten lop vi du 'Hai 1').
CREATE TABLE lop_hoc (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nam_hoc_id INT UNSIGNED NOT NULL,
    khoi_id INT UNSIGNED NOT NULL,
    ten_lop VARCHAR(30) NOT NULL,
    ghi_chu TEXT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_lop_nam_ten UNIQUE (nam_hoc_id, ten_lop),
    CONSTRAINT fk_lop_nam FOREIGN KEY (nam_hoc_id) REFERENCES nam_hoc(id),
    CONSTRAINT fk_lop_khoi FOREIGN KEY (khoi_id) REFERENCES khoi(id)
) ENGINE=InnoDB;

-- 09. XEP LOP: lich su lop TRONG CUNG TRUONG; khong quan ly chuyen truong.
CREATE TABLE xep_lop (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoc_sinh_id INT UNSIGNED NOT NULL,
    lop_hoc_id INT UNSIGNED NOT NULL,
    ngay_xep_lop DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DANG_HOC',
    ghi_chu TEXT NULL,
    CONSTRAINT fk_xl_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT fk_xl_lop FOREIGN KEY (lop_hoc_id) REFERENCES lop_hoc(id),
    CONSTRAINT chk_xl_ngay CHECK (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= ngay_bat_dau)
) ENGINE=InnoDB;

-- 10. MON HOC.
CREATE TABLE mon_hoc (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_mon_hoc VARCHAR(20) NOT NULL UNIQUE,
    ten_mon_hoc VARCHAR(100) NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 11. DANH MUC MON THEO KHOI VA CO MAC DINH DO GVCN GIANG DAY HAY KHONG.
CREATE TABLE mon_hoc_khoi (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mon_hoc_id INT UNSIGNED NOT NULL,
    khoi_id INT UNSIGNED NOT NULL,
    mac_dinh_gvcn BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_mhk UNIQUE (mon_hoc_id, khoi_id),
    CONSTRAINT fk_mhk_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc(id),
    CONSTRAINT fk_mhk_khoi FOREIGN KEY (khoi_id) REFERENCES khoi(id)
) ENGINE=InnoDB;

-- 12. PHAN CONG: CHU_NHIEM thi mon_hoc_id/nguon_phan_cong NULL;
-- GIANG_DAY thi can mon va nguon phan cong.
CREATE TABLE phan_cong_giao_vien (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    giao_vien_id INT UNSIGNED NOT NULL,
    lop_hoc_id INT UNSIGNED NOT NULL,
    mon_hoc_id INT UNSIGNED NULL,
    loai_phan_cong VARCHAR(20) NOT NULL,
    nguon_phan_cong VARCHAR(20) NULL,
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pc_gv FOREIGN KEY (giao_vien_id) REFERENCES giao_vien(id),
    CONSTRAINT fk_pc_lop FOREIGN KEY (lop_hoc_id) REFERENCES lop_hoc(id),
    CONSTRAINT fk_pc_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc(id),
    CONSTRAINT chk_pc_ngay CHECK (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= ngay_bat_dau),
    CONSTRAINT chk_pc_loai CHECK (
        (loai_phan_cong = 'CHU_NHIEM' AND mon_hoc_id IS NULL AND nguon_phan_cong IS NULL)
        OR (loai_phan_cong = 'GIANG_DAY' AND mon_hoc_id IS NOT NULL
            AND nguon_phan_cong IS NOT NULL
            AND nguon_phan_cong IN ('TU_DONG_GVCN', 'BO_SUNG'))
    )
) ENGINE=InnoDB;

-- 13. DIEM DANH SANG / CHIEU.
CREATE TABLE diem_danh (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    xep_lop_id INT UNSIGNED NOT NULL,
    ngay_hoc DATE NOT NULL,
    buoi_hoc VARCHAR(10) NOT NULL,
    trang_thai VARCHAR(30) NOT NULL,
    ghi_chu TEXT NULL,
    giao_vien_cap_nhat_id INT UNSIGNED NOT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_dd_xl_ngay_buoi UNIQUE (xep_lop_id, ngay_hoc, buoi_hoc),
    CONSTRAINT fk_dd_xl FOREIGN KEY (xep_lop_id) REFERENCES xep_lop(id),
    CONSTRAINT fk_dd_gv FOREIGN KEY (giao_vien_cap_nhat_id) REFERENCES giao_vien(id),
    CONSTRAINT chk_dd_buoi CHECK (buoi_hoc IN ('SANG', 'CHIEU'))
) ENGINE=InnoDB;

-- 14. DON XIN NGHI: phu huynh gui, GVCN duyet.
CREATE TABLE don_xin_nghi (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoc_sinh_id INT UNSIGNED NOT NULL,
    phu_huynh_id INT UNSIGNED NOT NULL,
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NOT NULL,
    buoi_nghi VARCHAR(10) NOT NULL,
    ly_do TEXT NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHO_DUYET',
    giao_vien_duyet_id INT UNSIGNED NULL,
    ly_do_tu_choi TEXT NULL,
    ngay_gui DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_xu_ly DATETIME NULL,
    CONSTRAINT fk_dxn_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT fk_dxn_ph FOREIGN KEY (phu_huynh_id) REFERENCES phu_huynh(id),
    CONSTRAINT fk_dxn_gv FOREIGN KEY (giao_vien_duyet_id) REFERENCES giao_vien(id),
    CONSTRAINT chk_dxn_ngay CHECK (ngay_ket_thuc >= ngay_bat_dau),
    CONSTRAINT chk_dxn_buoi CHECK (buoi_nghi IN ('SANG', 'CHIEU', 'CA_NGAY')),
    CONSTRAINT chk_dxn_tt CHECK (trang_thai IN ('CHO_DUYET', 'DA_DUYET', 'TU_CHOI'))
) ENGINE=InnoDB;

-- 15. DOT DANH GIA: moi nam hoc co ID dot RIENG, ma_dot chi la ma loai dot.
CREATE TABLE dot_danh_gia (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nam_hoc_id INT UNSIGNED NOT NULL,
    ma_dot VARCHAR(20) NOT NULL,
    ten_dot VARCHAR(100) NOT NULL,
    hoc_ky VARCHAR(10) NOT NULL,
    thu_tu TINYINT UNSIGNED NOT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_dot_nam_ma UNIQUE (nam_hoc_id, ma_dot),
    CONSTRAINT uq_dot_nam_thutu UNIQUE (nam_hoc_id, thu_tu),
    CONSTRAINT fk_dot_nam FOREIGN KEY (nam_hoc_id) REFERENCES nam_hoc(id),
    CONSTRAINT chk_dot_ma CHECK (ma_dot IN ('GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM')),
    CONSTRAINT chk_dot_hk CHECK (hoc_ky IN ('HK1', 'HK2')),
    CONSTRAINT chk_dot_thutu CHECK (thu_tu BETWEEN 1 AND 4)
) ENGINE=InnoDB;

-- 16. KHUNG NHAP LIEU: 1 dot co toi da 1 cua so nhap lieu hien tai.
CREATE TABLE khung_nhap_lieu (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dot_danh_gia_id INT UNSIGNED NOT NULL UNIQUE,
    thoi_gian_bat_dau DATETIME NOT NULL,
    thoi_gian_ket_thuc DATETIME NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DONG',
    ly_do_mo_lai TEXT NULL,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_knl_dot FOREIGN KEY (dot_danh_gia_id) REFERENCES dot_danh_gia(id),
    CONSTRAINT chk_knl_ngay CHECK (thoi_gian_ket_thuc > thoi_gian_bat_dau),
    CONSTRAINT chk_knl_tt CHECK (trang_thai IN ('MO', 'DONG'))
) ENGINE=InnoDB;

-- 17. CAU HINH DANH GIA MON: gan TRUC TIEP vao ID dot cua nam hoc.
CREATE TABLE cau_hinh_danh_gia_mon (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dot_danh_gia_id INT UNSIGNED NOT NULL,
    khoi_id INT UNSIGNED NOT NULL,
    mon_hoc_id INT UNSIGNED NOT NULL,
    CONSTRAINT uq_chdgm_dot_khoi_mon UNIQUE (dot_danh_gia_id, khoi_id, mon_hoc_id),
    CONSTRAINT fk_chdgm_dot FOREIGN KEY (dot_danh_gia_id) REFERENCES dot_danh_gia(id),
    CONSTRAINT fk_chdgm_khoi FOREIGN KEY (khoi_id) REFERENCES khoi(id),
    CONSTRAINT fk_chdgm_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc(id)
) ENGINE=InnoDB;

-- 18. CAU HINH DIEM: diem TV DOC/VIET do GV nhap, KT_DINH_KY chung tu tinh.
CREATE TABLE cau_hinh_diem (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dot_danh_gia_id INT UNSIGNED NOT NULL,
    khoi_id INT UNSIGNED NOT NULL,
    mon_hoc_id INT UNSIGNED NOT NULL,
    ma_loai_diem VARCHAR(30) NOT NULL,
    ten_hien_thi VARCHAR(100) NOT NULL,
    bat_buoc BOOLEAN NOT NULL DEFAULT TRUE,
    thu_tu_hien_thi TINYINT UNSIGNED NOT NULL,
    cach_nhap VARCHAR(20) NOT NULL,
    CONSTRAINT uq_chd_dot_khoi_mon_loai UNIQUE
        (dot_danh_gia_id, khoi_id, mon_hoc_id, ma_loai_diem),
    CONSTRAINT fk_chd_dot FOREIGN KEY (dot_danh_gia_id) REFERENCES dot_danh_gia(id),
    CONSTRAINT fk_chd_khoi FOREIGN KEY (khoi_id) REFERENCES khoi(id),
    CONSTRAINT fk_chd_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc(id),
    CONSTRAINT chk_chd_cach CHECK (cach_nhap IN ('NHAP_TAY', 'TU_TINH'))
) ENGINE=InnoDB;

-- 19. KET QUA MON HOC: 1 hoc sinh - mon - dot chi co 1 ban ghi hien hanh.
CREATE TABLE ket_qua_mon_hoc (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoc_sinh_id INT UNSIGNED NOT NULL,
    mon_hoc_id INT UNSIGNED NOT NULL,
    dot_danh_gia_id INT UNSIGNED NOT NULL,
    muc_danh_gia VARCHAR(30) NOT NULL,
    nhan_xet TEXT NULL,
    giao_vien_cap_nhat_id INT UNSIGNED NOT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_kqmh_hs_mon_dot UNIQUE (hoc_sinh_id, mon_hoc_id, dot_danh_gia_id),
    CONSTRAINT fk_kqmh_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT fk_kqmh_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc(id),
    CONSTRAINT fk_kqmh_dot FOREIGN KEY (dot_danh_gia_id) REFERENCES dot_danh_gia(id),
    CONSTRAINT fk_kqmh_gv FOREIGN KEY (giao_vien_cap_nhat_id) REFERENCES giao_vien(id),
    CONSTRAINT chk_kqmh_muc CHECK
        (muc_danh_gia IN ('HOAN_THANH_TOT', 'HOAN_THANH', 'CHUA_HOAN_THANH'))
) ENGINE=InnoDB;

-- 20. DIEM KIEM TRA DINH KY: chi lien ket cau_hinh_diem_id, khong luu lap dot_id.
-- 'diem' o day la diem HIEN HANH; cac lan kiem tra luu o bang 29.
CREATE TABLE diem_kiem_tra_dinh_ky (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoc_sinh_id INT UNSIGNED NOT NULL,
    cau_hinh_diem_id INT UNSIGNED NOT NULL,
    diem DECIMAL(4,1) NOT NULL,
    giao_vien_cap_nhat_id INT UNSIGNED NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_dkt_hs_chd UNIQUE (hoc_sinh_id, cau_hinh_diem_id),
    CONSTRAINT fk_dkt_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT fk_dkt_chd FOREIGN KEY (cau_hinh_diem_id) REFERENCES cau_hinh_diem(id),
    CONSTRAINT fk_dkt_gv FOREIGN KEY (giao_vien_cap_nhat_id) REFERENCES giao_vien(id),
    CONSTRAINT chk_dkt_diem CHECK (diem BETWEEN 0 AND 10)
) ENGINE=InnoDB;

-- 21. TIEU CHI DANH GIA (nap danh muc chi tiet 15 noi dung o buoc du lieu mau).
CREATE TABLE tieu_chi_danh_gia (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_tieu_chi VARCHAR(30) NOT NULL UNIQUE,
    ten_tieu_chi VARCHAR(100) NOT NULL,
    nhom_danh_gia VARCHAR(30) NOT NULL,
    thu_tu_hien_thi TINYINT UNSIGNED NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT chk_tcdg_nhom CHECK
        (nhom_danh_gia IN ('PHAM_CHAT', 'NANG_LUC_CHUNG', 'NANG_LUC_DAC_THU'))
) ENGINE=InnoDB;

-- 22. KET QUA NANG LUC / PHAM CHAT.
CREATE TABLE ket_qua_nang_luc_pham_chat (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoc_sinh_id INT UNSIGNED NOT NULL,
    dot_danh_gia_id INT UNSIGNED NOT NULL,
    tieu_chi_danh_gia_id INT UNSIGNED NOT NULL,
    muc_danh_gia VARCHAR(20) NOT NULL,
    nhan_xet TEXT NULL,
    giao_vien_cap_nhat_id INT UNSIGNED NOT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_kqnlpc_hs_dot_tc UNIQUE
        (hoc_sinh_id, dot_danh_gia_id, tieu_chi_danh_gia_id),
    CONSTRAINT fk_kqnlpc_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT fk_kqnlpc_dot FOREIGN KEY (dot_danh_gia_id) REFERENCES dot_danh_gia(id),
    CONSTRAINT fk_kqnlpc_tc FOREIGN KEY (tieu_chi_danh_gia_id) REFERENCES tieu_chi_danh_gia(id),
    CONSTRAINT fk_kqnlpc_gv FOREIGN KEY (giao_vien_cap_nhat_id) REFERENCES giao_vien(id),
    CONSTRAINT chk_kqnlpc_muc CHECK (muc_danh_gia IN ('TOT', 'DAT', 'CAN_CO_GANG'))
) ENGINE=InnoDB;

-- 23. CANH BAO NOI BO GVBM -> GVCN; khong tu dong gui phu huynh.
CREATE TABLE canh_bao_hoc_sinh (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    xep_lop_id INT UNSIGNED NOT NULL,
    mon_hoc_id INT UNSIGNED NULL,
    giao_vien_tao_id INT UNSIGNED NOT NULL,
    tieu_de VARCHAR(150) NOT NULL,
    noi_dung TEXT NOT NULL,
    de_xuat_ho_tro TEXT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'MOI',
    giao_vien_xu_ly_id INT UNSIGNED NULL,
    ngay_xu_ly DATETIME NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cb_xl FOREIGN KEY (xep_lop_id) REFERENCES xep_lop(id),
    CONSTRAINT fk_cb_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc(id),
    CONSTRAINT fk_cb_gv_tao FOREIGN KEY (giao_vien_tao_id) REFERENCES giao_vien(id),
    CONSTRAINT fk_cb_gv_xl FOREIGN KEY (giao_vien_xu_ly_id) REFERENCES giao_vien(id)
) ENGINE=InnoDB;

-- 24. THONG BAO: gui boi GV trong pham vi lop duoc phan cong.
CREATE TABLE thong_bao (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loai_thong_bao VARCHAR(30) NOT NULL,
    lop_hoc_id INT UNSIGNED NOT NULL,
    hoc_sinh_id INT UNSIGNED NULL,
    canh_bao_hoc_sinh_id INT UNSIGNED NULL,
    giao_vien_gui_id INT UNSIGNED NOT NULL,
    tieu_de VARCHAR(150) NOT NULL,
    noi_dung TEXT NOT NULL,
    ngay_gui DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tb_lop FOREIGN KEY (lop_hoc_id) REFERENCES lop_hoc(id),
    CONSTRAINT fk_tb_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT fk_tb_cb FOREIGN KEY (canh_bao_hoc_sinh_id) REFERENCES canh_bao_hoc_sinh(id),
    CONSTRAINT fk_tb_gv FOREIGN KEY (giao_vien_gui_id) REFERENCES giao_vien(id)
) ENGINE=InnoDB;

-- 25. NGUOI NHAN THONG BAO: chot danh sach tai khoan nhan khi gui.
CREATE TABLE thong_bao_nguoi_nhan (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thong_bao_id INT UNSIGNED NOT NULL,
    tai_khoan_id INT UNSIGNED NOT NULL,
    da_xem BOOLEAN NOT NULL DEFAULT FALSE,
    ngay_xem DATETIME NULL,
    CONSTRAINT uq_tbnn_tb_tk UNIQUE (thong_bao_id, tai_khoan_id),
    CONSTRAINT fk_tbnn_tb FOREIGN KEY (thong_bao_id) REFERENCES thong_bao(id),
    CONSTRAINT fk_tbnn_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(id)
) ENGINE=InnoDB;

-- 26. KHEN THUONG: phan biet CUOI_NAM va DOT_XUAT.
CREATE TABLE khen_thuong_hoc_sinh (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    xep_lop_id INT UNSIGNED NOT NULL,
    tieu_de VARCHAR(150) NOT NULL,
    noi_dung TEXT NOT NULL,
    ngay_khen_thuong DATE NOT NULL,
    giao_vien_tao_id INT UNSIGNED NOT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    loai_khen_thuong VARCHAR(20) NOT NULL,
    CONSTRAINT fk_kt_xl FOREIGN KEY (xep_lop_id) REFERENCES xep_lop(id),
    CONSTRAINT fk_kt_gv FOREIGN KEY (giao_vien_tao_id) REFERENCES giao_vien(id),
    CONSTRAINT chk_kt_loai CHECK (loai_khen_thuong IN ('CUOI_NAM', 'DOT_XUAT'))
) ENGINE=InnoDB;

-- 27. YEU CAU PHU HUYNH DE NGHI SUA 1 TRUONG THONG TIN HOC SINH.
CREATE TABLE yeu_cau_chinh_sua_ho_so (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoc_sinh_id INT UNSIGNED NOT NULL,
    phu_huynh_id INT UNSIGNED NOT NULL,
    ten_truong VARCHAR(50) NOT NULL,
    gia_tri_cu TEXT NOT NULL,
    gia_tri_de_xuat TEXT NOT NULL,
    ly_do TEXT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHO_DUYET',
    giao_vien_xu_ly_id INT UNSIGNED NULL,
    ly_do_tu_choi TEXT NULL,
    ngay_gui DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_xu_ly DATETIME NULL,
    CONSTRAINT fk_ycs_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT fk_ycs_ph FOREIGN KEY (phu_huynh_id) REFERENCES phu_huynh(id),
    CONSTRAINT fk_ycs_gv FOREIGN KEY (giao_vien_xu_ly_id) REFERENCES giao_vien(id)
) ENGINE=InnoDB;

-- 28. TONG KET CUOI NAM: khong co nhan xet chung, khong co GV xac nhan.
CREATE TABLE tong_ket_giao_duc (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoc_sinh_id INT UNSIGNED NOT NULL,
    dot_danh_gia_id INT UNSIGNED NOT NULL,
    muc_ket_qua_giao_duc VARCHAR(30) NULL,
    ket_qua_hoan_thanh_lop VARCHAR(30) NULL,
    ngay_xet DATETIME NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_tkgd_hs_dot UNIQUE (hoc_sinh_id, dot_danh_gia_id),
    CONSTRAINT fk_tkgd_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT fk_tkgd_dot FOREIGN KEY (dot_danh_gia_id) REFERENCES dot_danh_gia(id),
    CONSTRAINT chk_tkgd_muc CHECK (muc_ket_qua_giao_duc IS NULL OR
        muc_ket_qua_giao_duc IN ('HOAN_THANH_XUAT_SAC','HOAN_THANH_TOT',
                                'HOAN_THANH','CHUA_HOAN_THANH')),
    CONSTRAINT chk_tkgd_ht CHECK (ket_qua_hoan_thanh_lop IS NULL OR
        ket_qua_hoan_thanh_lop IN ('HOAN_THANH', 'CHUA_HOAN_THANH'))
) ENGINE=InnoDB;

-- 29. LICH SU CAC LAN KIEM TRA: diem moi nhat HOP LE la diem hien hanh.
-- Khong dung cot duoc_su_dung: lay lan_thu lon nhat; GV khong nhap truc tiep
-- lan kiem tra cho diem KT_DINH_KY chung TU_TINH cua Tieng Viet.
CREATE TABLE lan_kiem_tra_dinh_ky (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    diem_kiem_tra_dinh_ky_id INT UNSIGNED NOT NULL,
    lan_thu SMALLINT UNSIGNED NOT NULL,
    diem DECIMAL(4,1) NOT NULL,
    ngay_kiem_tra DATE NOT NULL,
    ly_do_kiem_tra_lai TEXT NULL,
    giao_vien_nhap_id INT UNSIGNED NOT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lkt_diem_lan UNIQUE (diem_kiem_tra_dinh_ky_id, lan_thu),
    CONSTRAINT fk_lkt_diem FOREIGN KEY (diem_kiem_tra_dinh_ky_id)
        REFERENCES diem_kiem_tra_dinh_ky(id),
    CONSTRAINT fk_lkt_gv FOREIGN KEY (giao_vien_nhap_id) REFERENCES giao_vien(id),
    CONSTRAINT chk_lkt_lan CHECK (lan_thu >= 1),
    CONSTRAINT chk_lkt_diem CHECK (diem BETWEEN 0 AND 10)
) ENGINE=InnoDB;

-- 30. LICH SU DANH GIA BO SUNG: 1 dong = 1 mon HOAC 1 tieu chi.
CREATE TABLE danh_gia_bo_sung (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoc_sinh_id INT UNSIGNED NOT NULL,
    dot_danh_gia_id INT UNSIGNED NOT NULL,
    loai_danh_gia VARCHAR(30) NOT NULL,
    mon_hoc_id INT UNSIGNED NULL,
    tieu_chi_danh_gia_id INT UNSIGNED NULL,
    muc_truoc VARCHAR(30) NOT NULL,
    muc_sau VARCHAR(30) NOT NULL,
    ngay_danh_gia DATE NOT NULL,
    giao_vien_cap_nhat_id INT UNSIGNED NOT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dgbs_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id),
    CONSTRAINT fk_dgbs_dot FOREIGN KEY (dot_danh_gia_id) REFERENCES dot_danh_gia(id),
    CONSTRAINT fk_dgbs_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc(id),
    CONSTRAINT fk_dgbs_tc FOREIGN KEY (tieu_chi_danh_gia_id) REFERENCES tieu_chi_danh_gia(id),
    CONSTRAINT fk_dgbs_gv FOREIGN KEY (giao_vien_cap_nhat_id) REFERENCES giao_vien(id),
    CONSTRAINT chk_dgbs_loai CHECK (
        (loai_danh_gia = 'MON_HOC' AND mon_hoc_id IS NOT NULL
            AND tieu_chi_danh_gia_id IS NULL)
        OR (loai_danh_gia = 'NANG_LUC_PHAM_CHAT' AND mon_hoc_id IS NULL
            AND tieu_chi_danh_gia_id IS NOT NULL)
    ),
    CONSTRAINT chk_dgbs_muc CHECK (
        (loai_danh_gia = 'MON_HOC'
            AND muc_truoc IN ('HOAN_THANH_TOT', 'HOAN_THANH', 'CHUA_HOAN_THANH')
            AND muc_sau IN ('HOAN_THANH_TOT', 'HOAN_THANH', 'CHUA_HOAN_THANH'))
        OR (loai_danh_gia = 'NANG_LUC_PHAM_CHAT'
            AND muc_truoc IN ('TOT', 'DAT', 'CAN_CO_GANG')
            AND muc_sau IN ('TOT', 'DAT', 'CAN_CO_GANG'))
    )
) ENGINE=InnoDB;

-- 31. CAC LAN XET HOAN THANH CHUONG TRINH LOP HOC CUOI NAM.
CREATE TABLE lan_xet_hoan_thanh_lop (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tong_ket_giao_duc_id INT UNSIGNED NOT NULL,
    lan_thu SMALLINT UNSIGNED NOT NULL,
    muc_ket_qua_giao_duc VARCHAR(30) NOT NULL,
    ket_qua_hoan_thanh_lop VARCHAR(30) NOT NULL,
    ngay_xet DATETIME NOT NULL,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lx_tongket_lan UNIQUE (tong_ket_giao_duc_id, lan_thu),
    CONSTRAINT fk_lx_tongket FOREIGN KEY (tong_ket_giao_duc_id)
        REFERENCES tong_ket_giao_duc(id),
    CONSTRAINT chk_lx_lan CHECK (lan_thu >= 1),
    CONSTRAINT chk_lx_muc CHECK (muc_ket_qua_giao_duc IN
        ('HOAN_THANH_XUAT_SAC','HOAN_THANH_TOT','HOAN_THANH','CHUA_HOAN_THANH')),
    CONSTRAINT chk_lx_ht CHECK
        (ket_qua_hoan_thanh_lop IN ('HOAN_THANH','CHUA_HOAN_THANH'))
) ENGINE=InnoDB;

-- KIEM TRA: phai co 31 bang TONG CONG, gom ca tai_khoan da tao.
SELECT COUNT(*) AS tong_so_bang
FROM information_schema.tables
WHERE table_schema = 'quan_ly_hoc_sinh_tieu_hoc' AND table_type = 'BASE TABLE';

SHOW TABLES FROM quan_ly_hoc_sinh_tieu_hoc;

-- QUY TAC LIEN BANG CAN LAM O BACKEND (chua the duoc dam bao chi boi FK/CHECK):
-- 1) Phan quyen GVCN/GVBM/PH; so dien thoai giao vien cap nhat dong bo 2 bang.
-- 2) Khong chong lan thoi gian xep lop, chu nhiem va day tung mon.
-- 3) Hoc sinh dung khoi/nam/dot; tong ket + danh gia bo sung chi o CUOI_NAM.
-- 4) Diem chung Tieng Viet TU_TINH tu DOC/VIET, khong cho GV nhap truc tiep.
-- 5) Lan kiem tra/xet moi nhat HOP LE la ket qua hien hanh; cap nhat lich su va
--    bang diem/tong ket trong CUNG GIAO DICH de khong mat dong bo.
-- 6) Xuat hoc ba nam cu KHONG phuc hoi duoc so do suc khoe cu neu so do da bi ghi de.
