/**
 * The feed, and the two interactions that hang off it.
 *
 * Two things here are load-bearing and easy to get wrong:
 *   - `likedByMe` is hydrated for a whole page in one query, never per row.
 *     A per-row check is the N+1 that turns a 20-post feed into 21 round trips.
 *   - Every counter change shares a transaction with the row it counts, so a
 *     failure rolls back both and the number on screen stays true.
 */
import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/apiError';
import { decodeCursor, encodeCursor, takePage } from '../../lib/pagination';
import { enqueue } from '../notifications/dispatcher';

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarColor: true,
} as const;

const postSelect = {
  id: true,
  content: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  author: { select: authorSelect },
} as const;

type RawPost = Prisma.PostGetPayload<{ select: typeof postSelect }>;

export interface PostDto {
  id: string;
  content: string;
  author: { id: string; username: string; displayName: string | null; avatarColor: string };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: Date;
}

const toDto = (p: RawPost, likedByMe: boolean): PostDto => ({
  id: p.id,
  content: p.content,
  author: p.author,
  likeCount: p.likeCount,
  commentCount: p.commentCount,
  likedByMe,
  createdAt: p.createdAt,
});

/** One query for the whole page, not one per post. */
async function likedSet(viewerId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const rows = await prisma.like.findMany({
    where: { userId: viewerId, postId: { in: postIds } },
    select: { postId: true },
  });
  return new Set(rows.map((r) => r.postId));
}

export async function createPost(authorId: string, content: string): Promise<PostDto> {
  const post = await prisma.post.create({
    data: { authorId, content },
    select: postSelect,
  });
  return toDto(post, false);
}

export interface FeedArgs {
  viewerId: string;
  limit: number;
  cursor?: string;
  username?: string;
}

export async function feed(args: FeedArgs) {
  const where: Prisma.PostWhereInput = { deletedAt: null };

  if (args.username) {
    // An unknown username is an empty page, not a 404: "nobody by that name
    // has posted" and "no posts yet" are the same fact to the reader.
    where.author = { username: args.username };
  }

  if (args.cursor) {
    const c = decodeCursor(args.cursor);
    where.OR = [
      { createdAt: { lt: c.createdAt } },
      { createdAt: c.createdAt, id: { lt: c.id } },
    ];
  }

  const rows = await prisma.post.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: args.limit + 1,
    select: postSelect,
  });

  const { page, hasMore } = takePage(rows, args.limit);
  const liked = await likedSet(args.viewerId, page.map((p) => p.id));
  const last = page[page.length - 1];

  return {
    data: page.map((p) => toDto(p, liked.has(p.id))),
    meta: {
      nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
      hasMore,
    },
  };
}

export async function getPost(viewerId: string, postId: string): Promise<PostDto> {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: postSelect,
  });
  if (!post) throw ApiError.notFound('That post is gone.');

  const liked = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: viewerId } },
    select: { id: true },
  });
  return toDto(post, liked !== null);
}

export async function deletePost(userId: string, postId: string): Promise<void> {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { authorId: true },
  });
  if (!post) throw ApiError.notFound('That post is gone.');
  // Ownership is decided from the token, never from anything the client sent.
  if (post.authorId !== userId) throw ApiError.forbidden("That post isn't yours to delete.");

  await prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
}

export interface LikeResult {
  postId: string;
  liked: boolean;
  likeCount: number;
}

/**
 * Toggle, idempotent by construction.
 *
 * The insert is guarded by UNIQUE (post_id, user_id). Two taps racing each
 * other cannot both win: the loser hits the constraint, we treat that as
 * "already liked", and the counter moves exactly once.
 */
export async function toggleLike(userId: string, postId: string): Promise<LikeResult> {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });
  if (!post) throw ApiError.notFound('That post is gone.');

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
    select: { id: true },
  });

  if (existing) {
    const [, updated] = await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      }),
    ]);
    // Unliking never notifies, and never removes the original notification.
    return { postId, liked: false, likeCount: Math.max(0, updated.likeCount) };
  }

  try {
    const [, updated] = await prisma.$transaction([
      prisma.like.create({ data: { postId, userId } }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      }),
    ]);

    enqueue({ type: NotificationType.LIKE, actorId: userId, postId });
    return { postId, liked: true, likeCount: updated.likeCount };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Lost the race. Report the settled truth rather than a 500.
      const fresh = await prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });
      return { postId, liked: true, likeCount: fresh?.likeCount ?? 0 };
    }
    throw err;
  }
}
