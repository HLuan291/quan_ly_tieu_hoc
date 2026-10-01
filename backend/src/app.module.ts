import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
} from '@nestjs/config';

import {
  AppController,
} from './app.controller';

import {
  AppService,
} from './app.service';

import {
  PrismaModule,
} from './prisma.module';

import {
  AuthModule,
} from './auth/auth.module';

import {
  GiaoVienModule,
} from './giao_vien/giao_vien.module';

import {
  HoSoHocSinhModule,
} from './ho_so_hoc_sinh/ho_so_hoc_sinh.module';

import {
  ToChucLopHocModule,
} from './to_chuc_lop_hoc/to_chuc_lop_hoc.module';

import {
  PhanCongGiangDayModule,
} from './phan_cong_giang_day/phan_cong_giang_day.module';

import {
  DiemDanhNghiHocModule,
} from './diem_danh_nghi_hoc/diem_danh_nghi_hoc.module';

import {
  DanhGiaHocTapModule,
} from './danh_gia_hoc_tap/danh_gia_hoc_tap.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    GiaoVienModule,
    HoSoHocSinhModule,
    ToChucLopHocModule,
    PhanCongGiangDayModule,
    DiemDanhNghiHocModule,
    DanhGiaHocTapModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}
