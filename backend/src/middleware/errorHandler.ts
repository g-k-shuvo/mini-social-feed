import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../lib/apiError';
import { logger } from '../lib/logger';
import { env } from '../config/env';

/** Anything that reaches here leaves as the one error envelope. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `No route for ${req.method} ${req.path}.`,
      requestId: req.requestId,
    },
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    apiError = translatePrisma(err);
  } else if (err instanceof SyntaxError && 'body' in err) {
    apiError = ApiError.validation('That request body is not valid JSON.');
  } else {
    apiError = new ApiError('INTERNAL_ERROR', 'Something went wrong on our end.');
  }

  if (apiError.status >= 500) {
    logger.error({ err, requestId: req.requestId, path: req.path }, 'unhandled error');
  } else {
    logger.debug({ code: apiError.code, requestId: req.requestId, path: req.path }, 'handled error');
  }

  res.status(apiError.status).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
      requestId: req.requestId,
      // Stack traces are a development affordance and never leave production.
      ...(!env.isProd && apiError.status >= 500 && err instanceof Error
        ? { stack: err.stack }
        : {}),
    },
  });
}

function translatePrisma(err: Prisma.PrismaClientKnownRequestError): ApiError {
  const target = Array.isArray(err.meta?.target) ? (err.meta.target as string[]) : [];

  if (err.code === 'P2002') {
    if (target.includes('username')) return new ApiError('USERNAME_TAKEN', 'That username is taken.');
    if (target.includes('email')) return new ApiError('EMAIL_TAKEN', 'That email is already registered.');
    return ApiError.unprocessable('That already exists.');
  }
  if (err.code === 'P2025') return ApiError.notFound();
  if (err.code === 'P2003') return ApiError.unprocessable('That refers to something that no longer exists.');

  return new ApiError('INTERNAL_ERROR', 'Something went wrong on our end.');
}
