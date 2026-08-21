import pino from 'pino';
import { env } from '../config/env';

/**
 * One structured logger for the process. The redact list is not optional:
 * a credential that reaches a log file has leaked, whether or not anyone
 * reads that file.
 */
export const logger = pino({
  level: env.isTest ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'accessToken',
      '*.accessToken',
      'refreshToken',
      '*.refreshToken',
      'fcmToken',
      '*.fcmToken',
      'passwordHash',
      '*.passwordHash',
      'tokenHash',
      '*.tokenHash',
    ],
    censor: '[redacted]',
  },
  ...(env.isProd
    ? {}
    : { transport: { target: 'pino/file', options: { destination: 1 } } }),
});
