import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  ToChucLopHocController,
} from './to_chuc_lop_hoc.controller';

import {
  ToChucLopHocService,
} from './to_chuc_lop_hoc.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    ToChucLopHocController,
  ],

  providers: [
    ToChucLopHocService,
  ],

  exports: [
    ToChucLopHocService,
  ],
})
export class ToChucLopHocModule {}