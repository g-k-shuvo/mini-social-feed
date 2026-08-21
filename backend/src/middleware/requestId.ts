import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Stamps every request with an id, echoes it in a header, and hands it to the
 * error handler. One id ties a user's screenshot of an error message to the
 * exact line in the server log.
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.length <= 128 ? incoming : crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
