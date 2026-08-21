import rateLimit, { type Options } from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../config/env';

/**
 * Buckets sized so a scripted attack runs out of room long before a real
 * person does. Every 429 carries Retry-After and the same friendly message the
 * app shows, rather than the library's default HTML.
 */
const base = (opts: Partial<Options> & Pick<Options, 'windowMs' | 'limit'>) =>
  rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Test runs would otherwise trip the auth bucket after five cases.
    skip: () => env.isTest,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: "You're going a bit fast — try again in a moment.",
          requestId: (res.req as Request).requestId,
        },
      });
    },
    ...opts,
  });

const byUser = (req: Request) => req.user?.id ?? req.ip ?? 'anonymous';

/** IP + identifier, so one attacker cannot lock out a real account by name. */
const byIpAndIdentifier = (req: Request) => {
  const id = typeof req.body?.identifier === 'string' ? req.body.identifier.toLowerCase() : '';
  return `${req.ip ?? 'unknown'}|${id}`;
};

export const signupLimiter = base({ windowMs: 60 * 60 * 1000, limit: 5 });
export const loginLimiter = base({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: byIpAndIdentifier,
});
export const createPostLimiter = base({ windowMs: 60 * 1000, limit: 10, keyGenerator: byUser });
export const commentLimiter = base({ windowMs: 60 * 1000, limit: 30, keyGenerator: byUser });
export const likeLimiter = base({ windowMs: 60 * 1000, limit: 60, keyGenerator: byUser });
export const globalLimiter = base({ windowMs: 60 * 1000, limit: 300 });
