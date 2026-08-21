import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAuth, currentUser } from '../../middleware/auth';
import { loginLimiter, signupLimiter } from '../../middleware/rateLimit';
import { created, noContent, ok } from '../../lib/respond';
import { loginBody, logoutBody, refreshBody, signupBody } from './schema';
import * as authService from './service';

export const authRouter = Router();

authRouter.post(
  '/signup',
  signupLimiter,
  validate({ body: signupBody }),
  async (req, res, next) => {
    try {
      created(res, await authService.signup(req.body));
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post('/login', loginLimiter, validate({ body: loginBody }), async (req, res, next) => {
  try {
    ok(res, await authService.login(req.body.identifier, req.body.password));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', loginLimiter, validate({ body: refreshBody }), async (req, res, next) => {
  try {
    ok(res, await authService.refresh(req.body.refreshToken));
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  '/logout',
  requireAuth,
  validate({ body: logoutBody }),
  async (req, res, next) => {
    try {
      await authService.logout(currentUser(req).id, req.body.refreshToken, req.body.fcmToken);
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    ok(res, await authService.me(currentUser(req).id));
  } catch (err) {
    next(err);
  }
});
