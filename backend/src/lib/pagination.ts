/**
 * Keyset (cursor) pagination.
 *
 * Not offset. The feed is a live, insert-heavy list: with OFFSET, a post
 * published while the user is reading shifts every later page by one, which
 * duplicates rows across page boundaries and silently skips others. The cursor
 * encodes the last row's sort key instead, so a page boundary means the same
 * thing no matter what was written since.
 */
import { ApiError } from './apiError';

export interface Cursor {
  createdAt: Date;
  id: string;
}

export function encodeCursor(c: Cursor): string {
  return Buffer.from(`${c.createdAt.toISOString()}|${c.id}`, 'utf8').toString('base64url');
}

export function decodeCursor(raw: string): Cursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw ApiError.validation('That page link is not valid. Pull to refresh and try again.', [
      { field: 'cursor', issue: 'malformed' },
    ]);
  }

  const sep = decoded.lastIndexOf('|');
  const iso = sep === -1 ? '' : decoded.slice(0, sep);
  const id = sep === -1 ? '' : decoded.slice(sep + 1);
  const createdAt = new Date(iso);

  // A bad cursor is a 400, never a silent reset to page one: resetting looks
  // to the user like the feed randomly jumped back to the top.
  if (!iso || !id || Number.isNaN(createdAt.getTime())) {
    throw ApiError.validation('That page link is not valid. Pull to refresh and try again.', [
      { field: 'cursor', issue: 'malformed' },
    ]);
  }

  return { createdAt, id };
}

/**
 * Takes one row more than asked for, then hands back the page without it.
 * That extra row is the only thing `hasMore` is ever derived from — no counts,
 * no second query.
 */
export function takePage<T>(rows: T[], limit: number): { page: T[]; hasMore: boolean } {
  const hasMore = rows.length > limit;
  return { page: hasMore ? rows.slice(0, limit) : rows, hasMore };
}
