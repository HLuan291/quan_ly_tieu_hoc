import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

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
  KiemTraDatabase() {
    return this.AppService.KiemTraDatabase();
  }
}
