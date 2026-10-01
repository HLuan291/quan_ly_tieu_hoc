import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  DiemDanhNghiHocController,
} from './diem_danh_nghi_hoc.controller';

import {
  DiemDanhNghiHocService,
} from './diem_danh_nghi_hoc.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    DiemDanhNghiHocController,
  ],

  providers: [
    DiemDanhNghiHocService,
  ],

  exports: [
    DiemDanhNghiHocService,
  ],
})
export class DiemDanhNghiHocModule {}