import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { requireAuth, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { decodeCursor, encodeCursor, takePage } from '../../lib/pagination';
import { ok } from '../../lib/respond';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
});

/**
 * The in-app history. Push is fire-and-forget and a phone can be off, so this
 * is the only surface that can honestly answer "what did I miss".
 */
notificationsRouter.get('/', validate({ query: listQuery }), async (req, res, next) => {
  try {
    const me = currentUser(req);
    const q = req.query as unknown as z.infer<typeof listQuery>;

    const where: Prisma.NotificationWhereInput = { recipientId: me.id };
    if (q.cursor) {
      const c = decodeCursor(q.cursor);
      where.OR = [{ createdAt: { lt: c.createdAt } }, { createdAt: c.createdAt, id: { lt: c.id } }];
    }

    const rows = await prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: q.limit + 1,
      select: {
        id: true,
        type: true,
        postId: true,
        commentId: true,
        readAt: true,
        createdAt: true,
        actor: { select: { id: true, username: true, displayName: true, avatarColor: true } },
        post: { select: { content: true } },
        comment: { select: { content: true } },
      },
    });

    const { page, hasMore } = takePage(rows, q.limit);
    const last = page[page.length - 1];

    ok(
      res,
      page.map((n) => ({
        id: n.id,
        type: n.type,
        actor: n.actor,
        postId: n.postId,
        commentId: n.commentId,
        preview: n.comment?.content ?? n.post.content,
        read: n.readAt !== null,
        createdAt: n.createdAt,
      })),
      {
        nextCursor:
          hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
        hasMore,
      },
    );
  } catch (err) {
    next(err);
  }
});

const readBody = z
  .object({
    ids: z.array(z.string().uuid()).max(200).optional(),
    all: z.boolean().optional(),
  })
  .refine((v) => v.all === true || (v.ids?.length ?? 0) > 0, {
    message: 'Tell us which notifications to mark read.',
  });

notificationsRouter.post('/read', validate({ body: readBody }), async (req, res, next) => {
  try {
    const me = currentUser(req);
    const body = req.body as z.infer<typeof readBody>;

    const result = await prisma.notification.updateMany({
      // recipientId is always in the filter: a user cannot mark someone
      // else's notifications read by guessing ids.
      where: {
        recipientId: me.id,
        readAt: null,
        ...(body.all ? {} : { id: { in: body.ids ?? [] } }),
      },
      data: { readAt: new Date() },
    });

    const unread = await prisma.notification.count({
      where: { recipientId: me.id, readAt: null },
    });

    ok(res, { marked: result.count, unread });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.get('/unread-count', async (req, res, next) => {
  try {
    const unread = await prisma.notification.count({
      where: { recipientId: currentUser(req).id, readAt: null },
    });
    ok(res, { unread });
  } catch (err) {
    next(err);
  }
});
