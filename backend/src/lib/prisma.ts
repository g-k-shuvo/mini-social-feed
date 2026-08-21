import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * One client for the process. In dev the module is re-evaluated on every
 * watch reload, which would otherwise open a new pool each time until Postgres
 * refuses connections.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!env.isProd) globalForPrisma.prisma = prisma;
