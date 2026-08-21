import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, firebase: env.firebaseEnabled },
    `Mini Social Feed API listening on http://localhost:${env.PORT}`,
  );
});

/**
 * A request in flight when the platform sends SIGTERM should finish, not be
 * cut mid-transaction. Ten seconds, then we stop being polite.
 */
async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down');
  const force = setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000);
  force.unref();

  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined);
    logger.info('shutdown complete');
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// A rejected promise nobody awaited is a bug, but it is not a reason to drop
// every in-flight request on the floor.
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandled rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  void shutdown('uncaughtException');
});
