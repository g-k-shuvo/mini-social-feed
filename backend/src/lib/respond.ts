import type { Response } from 'express';

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

/** The success envelope. `meta` appears only on paginated responses. */
export function ok<T>(res: Response, data: T, meta?: PageMeta, status = 200) {
  return res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, undefined, 201);
}

export function noContent(res: Response) {
  return res.status(204).end();
}

/** Deterministic avatar colour from the user id, so an avatar never needs an
 *  upload, a CDN, or a fallback image. One rule, applied once at signup. */
export function avatarColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const step = (h % 9) - 4;
  const hue = (12 + step * 15 + 360) % 360;
  return `hsl(${hue} 78% 58%)`;
}
