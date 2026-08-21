import bcrypt from 'bcryptjs';

/** bcrypt's own ceiling: bytes past 72 are ignored, so accepting them silently
 *  would let two different passwords authenticate the same account. */
export const MAX_PASSWORD_BYTES = 72;

const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
