import { Injectable } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client';
import { TaoCauHinhMySql } from './cau_hinh_database';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const Adapter = new PrismaMariaDb(
      TaoCauHinhMySql(process.env.DATABASE_URL),
    );

    super({ adapter: Adapter });
  }
}
