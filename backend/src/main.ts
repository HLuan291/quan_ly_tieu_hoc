import {
  NestFactory,
} from '@nestjs/core';

import {
  AppModule,
} from './app.module';

async function Bootstrap() {
  const App =
    await NestFactory.create(
      AppModule,
    );

  App.enableCors({
    origin:
      'http://localhost:5173',

    credentials:
      true,
  });

  await App.listen(
    process.env.PORT ?? 3000,
  );
}

Bootstrap();
