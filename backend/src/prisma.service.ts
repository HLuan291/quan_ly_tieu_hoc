import { Injectable } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const databaseUrl = new URL(process.env.DATABASE_URL as string);

    const adapter = new PrismaMariaDb({
      host: databaseUrl.hostname,
      port: Number(databaseUrl.port || 3306),
      user: decodeURIComponent(databaseUrl.username),
      password: decodeURIComponent(databaseUrl.password),
      database: databaseUrl.pathname.replace('/', ''),
      connectionLimit: 5,
    });

    super({ adapter });
  }
}