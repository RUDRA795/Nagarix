import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const dbUrl = `file:${dbPath}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaLibSql({ url: dbUrl });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
