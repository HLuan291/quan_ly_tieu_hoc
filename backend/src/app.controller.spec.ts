import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  AppController,
} from './app.controller';

import {
  AppService,
} from './app.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';

describe(
  'AppController',
  () => {
    let AppControllerInstance:
      AppController;

    beforeEach(
      async () => {
        const App:
          TestingModule =
          await Test
            .createTestingModule({
              controllers: [
                AppController,
              ],

              providers: [
                AppService,
                { provide: JwtService, useValue: {} },
                { provide: PrismaService, useValue: { tai_khoan: { count: jest.fn() } } },
              ],
            })
            .compile();

        AppControllerInstance =
          App.get<AppController>(
            AppController,
          );
      },
    );

    describe(
      'root',
      () => {
        it(
          'should return "Hello World!"',
          () => {
            expect(
              AppControllerInstance
                .GetHello(),
            ).toBe(
              'Hello World!',
            );
          },
        );
      },
    );
  },
);
