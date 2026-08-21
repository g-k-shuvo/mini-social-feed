import type { NextFunction, Request, Response } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { ApiError } from '../lib/apiError';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Parses and *replaces* the request's own body/query/params with the validated
 * result, so a handler downstream cannot accidentally read the raw value. The
 * first failing field decides the message the user sees.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // req.query is a getter-only property on Express 5-style requests;
        // defineProperty keeps this working on both.
        Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
      }
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const details = err.issues.map((i) => ({
          field: i.path.join('.') || '(body)',
          issue: i.code,
        }));
        const first = err.issues[0];
        next(ApiError.validation(first?.message ?? 'That input is not valid.', details));
        return;
      }
      next(err);
    }
  };
}

export const uuidParam = (name: string) =>
  z.object({ [name]: z.string().uuid('That link is not valid.') });
