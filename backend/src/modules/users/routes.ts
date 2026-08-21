import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { requireAuth, currentUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ok } from '../../lib/respond';

export const usersRouter = Router();
usersRouter.use(requireAuth);

const searchQuery = z.object({
  search: z.string().trim().max(20).optional(),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

/** Powers the feed filter's autocomplete. Prefix match, never a full scan. */
usersRouter.get('/', validate({ query: searchQuery }), async (req, res, next) => {
  try {
    const q = req.query as unknown as z.infer<typeof searchQuery>;
    const users = await prisma.user.findMany({
      where: q.search ? { username: { startsWith: q.search, mode: 'insensitive' } } : {},
      orderBy: { username: 'asc' },
      take: q.limit,
      select: { id: true, username: true, displayName: true, avatarColor: true },
    });
    ok(res, users);
  } catch (err) {
    next(err);
  }
});

/** Everything the Profile screen shows, in one round trip. */
usersRouter.get('/me/stats', async (req, res, next) => {
  try {
    const me = currentUser(req);
    const [user, postCount, agg] = await Promise.all([
      prisma.user.findUnique({
        where: { id: me.id },
        select: { id: true, username: true, displayName: true, avatarColor: true, createdAt: true },
      }),
      prisma.post.count({ where: { authorId: me.id, deletedAt: null } }),
      prisma.post.aggregate({
        where: { authorId: me.id, deletedAt: null },
        _sum: { likeCount: true },
      }),
    ]);
    ok(res, { user, postCount, likesReceived: agg._sum.likeCount ?? 0 });
  } catch (err) {
    next(err);
  }
});
