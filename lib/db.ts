import { PrismaClient } from '@prisma/client';
import path from 'path';

// Force absolute path resolution to prisma/dev.db in Next.js runtime
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
