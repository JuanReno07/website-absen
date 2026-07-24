import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  let client: PrismaClient;

  if (tursoUrl && tursoAuthToken) {
    const url = tursoUrl.startsWith('libsql://')
      ? tursoUrl.replace('libsql://', 'https://')
      : tursoUrl;

    const libsql = createClient({
      url,
      authToken: tursoAuthToken,
    });

    const adapter = new PrismaLibSQL(libsql);
    client = new PrismaClient({
      adapter,
      log: ['error'],
    } as any);
  } else {
    client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();
