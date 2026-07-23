import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Fix for Vercel Serverless SQLite path resolution & read/write permissions
if (process.env.VERCEL) {
  try {
    const tmpDb = '/tmp/dev.db';
    const rootDb = path.join(process.cwd(), 'prisma', 'dev.db');
    
    if (!fs.existsSync(tmpDb)) {
      if (fs.existsSync(rootDb)) {
        fs.copyFileSync(rootDb, tmpDb);
      }
    }
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  } catch (e) {
    console.error('Vercel DB copy notice:', e);
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
