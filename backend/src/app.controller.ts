import { Controller, Get, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(
    private readonly AppService:
      AppService,
  ) {}

  @Get()
  GetHello(): string {
    return this.AppService.GetHello();
  }

  @Get('kiem-tra-db')
  @UseGuards(JwtAuthGuard)
  KiemTraDatabase(@Req() Request: { nguoi_dung?: { vai_tro: string } }) {
    if (Request.nguoi_dung?.vai_tro !== 'ADMIN') throw new ForbiddenException('Chỉ Admin được kiểm tra database');
    return this.AppService.KiemTraDatabase();
  }
}
