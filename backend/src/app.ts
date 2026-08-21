/**
 * Assembles the Express app. Deliberately does not listen — server.ts owns the
 * socket, so the integration tests can mount this same app in-process.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { requestId } from './middleware/requestId';
import { globalLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { validate } from './middleware/validate';
import { authRouter } from './modules/auth/routes';
import { postsRouter } from './modules/posts/routes';
import { devicesRouter } from './modules/devices/routes';
import { usersRouter } from './modules/users/routes';
import { notificationsRouter } from './modules/notifications/routes';
import { requireAuth, currentUser } from './middleware/auth';
import { uuidParam } from './middleware/validate';
import { noContent } from './lib/respond';
import * as comments from './modules/comments/service';

export function createApp() {
  const app = express();

  // Behind Railway/Render, req.ip must come from X-Forwarded-For or every
  // rate-limit bucket keys on the proxy and throttles the whole world at once.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true,
      credentials: false,
    }),
  );
  // 16 KB: a 500-character post needs a fraction of this, and anything larger
  // is rejected before the JSON parser has to look at it.
  app.use(express.json({ limit: '16kb' }));

  if (!env.isTest) {
    app.use(
      pinoHttp({
        logger,
        customProps: (req) => ({ requestId: (req as express.Request).requestId }),
        autoLogging: { ignore: (req) => req.url === '/health' },
      }),
    );
  }

  app.use(globalLimiter);

  app.get('/health', async (_req, res) => {
    let db = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }
    res
      .status(db === 'ok' ? 200 : 503)
      .json({ status: db === 'ok' ? 'ok' : 'degraded', db, uptime: Math.round(process.uptime()) });
  });

  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/posts', postsRouter);
  v1.use('/devices', devicesRouter);
  v1.use('/users', usersRouter);
  v1.use('/notifications', notificationsRouter);

  // Comments are addressed by their own id for deletion, so this one sits
  // outside /posts rather than pretending to be nested under it.
  v1.delete(
    '/comments/:id',
    requireAuth,
    validate({ params: uuidParam('id') }),
    async (req, res, next) => {
      try {
        await comments.deleteComment(currentUser(req).id, req.params.id as string);
        noContent(res);
      } catch (err) {
        next(err);
      }
    },
  );

  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
