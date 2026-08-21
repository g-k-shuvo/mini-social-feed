import 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      /** Set by the auth middleware. Absent on public routes. */
      user?: { id: string; username: string };
    }
  }
}

export {};
