import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  HoSoHocSinhController,
} from './ho_so_hoc_sinh.controller';

import {
  HoSoHocSinhService,
} from './ho_so_hoc_sinh.service';


@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    HoSoHocSinhController,
  ],

  providers: [
    HoSoHocSinhService,
  ],
})
export class HoSoHocSinhModule {}