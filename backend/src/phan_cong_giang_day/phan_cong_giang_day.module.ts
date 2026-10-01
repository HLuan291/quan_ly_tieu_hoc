import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  PhanCongGiangDayController,
} from './phan_cong_giang_day.controller';

import {
  PhanCongGiangDayService,
} from './phan_cong_giang_day.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    PhanCongGiangDayController,
  ],

  providers: [
    PhanCongGiangDayService,
  ],

  exports: [
    PhanCongGiangDayService,
  ],
})
export class PhanCongGiangDayModule {}