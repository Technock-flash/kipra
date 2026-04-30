import { PrismaClient } from '@prisma/client';
import logger from '@utils/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  try {
    const u = new URL(process.env.DATABASE_URL.replace(/^postgresql:/, 'http:'));
    const name = decodeURIComponent(u.pathname.replace(/^\//, '').split(/[/?]/)[0] || '?');
    logger.info(`Prisma DATABASE_URL → host ${u.hostname}${u.port ? `:${u.port}` : ''} database "${name}"`);
  } catch {
    /* DATABASE_URL parse failed */
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

