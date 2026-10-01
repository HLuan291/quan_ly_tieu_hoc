import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  DanhGiaHocTapController,
} from './danh_gia_hoc_tap.controller';

import {
  DanhGiaHocTapService,
} from './danh_gia_hoc_tap.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    DanhGiaHocTapController,
  ],

  providers: [
    DanhGiaHocTapService,
  ],

  exports: [
    DanhGiaHocTapService,
  ],
})
export class DanhGiaHocTapModule {}