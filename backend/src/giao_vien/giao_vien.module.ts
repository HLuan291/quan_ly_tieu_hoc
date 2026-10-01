import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { GiaoVienController } from './giao_vien.controller';
import { GiaoVienService } from './giao_vien.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    GiaoVienController,
  ],

  providers: [
    GiaoVienService,
  ],
})
export class GiaoVienModule {}