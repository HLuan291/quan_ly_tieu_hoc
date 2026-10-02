import {
  NestFactory,
} from '@nestjs/core';

import {
  AppModule,
} from './app.module';
import { KiemTraBodyPipe } from './kiem_tra_body.pipe';

async function Bootstrap() {
  const App =
    await NestFactory.create(
      AppModule,
    );

  App.useGlobalPipes(new KiemTraBodyPipe());

  App.enableCors({
    origin:
      process.env.FRONTEND_ORIGIN || 'http://localhost:5173',

    credentials:
      true,
  });

  await App.listen(
    process.env.PORT ?? 3000,
  );
}

Bootstrap();
