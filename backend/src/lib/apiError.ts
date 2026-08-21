/**
 * The one error type the API throws. Every failure — including unhandled ones,
 * which the error handler converts — leaves the process as this shape, so the
 * client only ever parses one envelope.
 *
 * `message` is written for a person, not for a log. The mobile app renders it
 * verbatim, so "Posts are limited to 500 characters." is correct and
 * "ValidationError: content.maxLength" is not.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'REFRESH_TOKEN_INVALID'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'USERNAME_TAKEN'
  | 'EMAIL_TAKEN'
  | 'UNPROCESSABLE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface FieldIssue {
  field: string;
  issue: string;
}

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  REFRESH_TOKEN_INVALID: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  USERNAME_TAKEN: 409,
  EMAIL_TAKEN: 409,
  UNPROCESSABLE: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: FieldIssue[] | undefined;

  constructor(code: ErrorCode, message: string, details?: FieldIssue[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static validation(message: string, details?: FieldIssue[]) {
    return new ApiError('VALIDATION_ERROR', message, details);
  }
  static unauthenticated(message = 'Sign in to continue.') {
    return new ApiError('UNAUTHENTICATED', message);
  }
  static forbidden(message = "That isn't yours to change.") {
    return new ApiError('FORBIDDEN', message);
  }
  static notFound(message = "We couldn't find that.") {
    return new ApiError('NOT_FOUND', message);
  }
  static unprocessable(message: string) {
    return new ApiError('UNPROCESSABLE', message);
  }
}
