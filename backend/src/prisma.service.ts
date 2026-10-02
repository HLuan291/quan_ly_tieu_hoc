import {
  Injectable,
} from '@nestjs/common';

import {
  PrismaMariaDb,
} from '@prisma/adapter-mariadb';

import {
  PrismaClient,
} from './generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient {
  constructor() {
    const DatabaseUrl =
      new URL(
        process.env.DATABASE_URL as string,
      );

    const Adapter =
      new PrismaMariaDb({
        host:
          DatabaseUrl.hostname,

        port:
          Number(
            DatabaseUrl.port ||
            3306,
          ),

        user:
          decodeURIComponent(
            DatabaseUrl.username,
          ),

        password:
          decodeURIComponent(
            DatabaseUrl.password,
          ),

        database:
          DatabaseUrl.pathname
            .replace(
              '/',
              '',
            ),

        connectionLimit:
          5,
      });

    super({
      adapter:
        Adapter,
    });
  }
}
