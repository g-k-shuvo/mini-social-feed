import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { requireAuth, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { noContent, ok } from '../../lib/respond';

export const devicesRouter = Router();
devicesRouter.use(requireAuth);

const registerBody = z.object({
  fcmToken: z.string().trim().min(10, 'That does not look like an FCM token.').max(4096),
  platform: z.enum(['ANDROID', 'IOS']).default('ANDROID'),
});

/**
 * Upsert on the token, not on (user, token).
 *
 * One handset has one FCM token. If a second account signs in on it, the token
 * must move to the new owner — otherwise the previous account keeps receiving
 * notifications on a phone it no longer has a session on.
 */
devicesRouter.post('/', validate({ body: registerBody }), async (req, res, next) => {
  try {
    const me = currentUser(req);
    await prisma.device.upsert({
      where: { fcmToken: req.body.fcmToken },
      create: { userId: me.id, fcmToken: req.body.fcmToken, platform: req.body.platform },
      update: { userId: me.id, platform: req.body.platform, lastSeenAt: new Date() },
    });
    ok(res, { registered: true });
  } catch (err) {
    next(err);
  }
});

devicesRouter.delete(
  '/:fcmToken',
  validate({ params: z.object({ fcmToken: z.string().min(1) }) }),
  async (req, res, next) => {
    try {
      await prisma.device.deleteMany({
        where: { fcmToken: req.params.fcmToken as string, userId: currentUser(req).id },
      });
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
);
