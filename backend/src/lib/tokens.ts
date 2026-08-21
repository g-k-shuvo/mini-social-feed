/**
 * Access tokens are stateless JWTs with a short life. Refresh tokens are
 * opaque random values, stored only as a SHA-256 hash, single-use, and grouped
 * into a family so that replaying a rotated token can revoke the whole line
 * rather than just the one presented.
 */
import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from './apiError';

export interface AccessClaims {
  sub: string;
  username: string;
}

export function signAccessToken(claims: AccessClaims): string {
  const opts: SignOptions = {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessClaims {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub) throw new Error('bad payload');
    return { sub: String(payload.sub), username: String((payload as jwt.JwtPayload).username) };
  } catch {
    // Expired and forged are the same answer to the caller: the client's move
    // is identical either way — refresh, then retry.
    throw ApiError.unauthenticated('Your session expired. Sign in again.');
  }
}

export function newRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}
