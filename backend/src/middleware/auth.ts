import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/apiError';
import { verifyAccessToken } from '../lib/tokens';

/**
 * Establishes who is calling, from the token and nothing else.
 *
 * The client never tells the server which user it is — not in a body field,
 * not in a query param. Every ownership check downstream compares against
 * `req.user.id`, which came out of a signature the client cannot forge.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return next(ApiError.unauthenticated('Sign in to continue.'));
  }

  try {
    const claims = verifyAccessToken(token);
    req.user = { id: claims.sub, username: claims.username };
    next();
  } catch (err) {
    next(err);
  }
}

/** Narrows the optional `req.user` for handlers that sit behind requireAuth. */
export function currentUser(req: Request): { id: string; username: string } {
  if (!req.user) throw ApiError.unauthenticated();
  return req.user;
}
