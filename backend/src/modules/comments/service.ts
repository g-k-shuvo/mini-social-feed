/**
 * Comments read oldest-first inside a post, so a thread reads top to bottom
 * the way a conversation happened. The cursor comparison inverts accordingly.
 */
import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/apiError';
import { decodeCursor, encodeCursor, takePage } from '../../lib/pagination';
import { enqueue } from '../notifications/dispatcher';

const commentSelect = {
  id: true,
  postId: true,
  content: true,
  createdAt: true,
  author: { select: { id: true, username: true, displayName: true, avatarColor: true } },
} as const;

export interface CommentDto {
  id: string;
  postId: string;
  content: string;
  author: { id: string; username: string; displayName: string | null; avatarColor: string };
  createdAt: Date;
}

export async function addComment(authorId: string, postId: string, content: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });
  if (!post) throw ApiError.unprocessable('That post is gone, so there is nothing to reply to.');

  const [comment, updated] = await prisma.$transaction([
    prisma.comment.create({ data: { postId, authorId, content }, select: commentSelect }),
    prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
      select: { commentCount: true },
    }),
  ]);

  enqueue({ type: NotificationType.COMMENT, actorId: authorId, postId, commentId: comment.id });

  return { ...comment, postCommentCount: updated.commentCount };
}

export async function listComments(postId: string, limit: number, cursor?: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });
  if (!post) throw ApiError.notFound('That post is gone.');

  const where: Prisma.CommentWhereInput = { postId, deletedAt: null };

  if (cursor) {
    const c = decodeCursor(cursor);
    // Ascending order, so the next page is everything *after* the cursor.
    where.OR = [{ createdAt: { gt: c.createdAt } }, { createdAt: c.createdAt, id: { gt: c.id } }];
  }

  const rows = await prisma.comment.findMany({
    where,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: limit + 1,
    select: commentSelect,
  });

  const { page, hasMore } = takePage(rows, limit);
  const last = page[page.length - 1];

  return {
    data: page as CommentDto[],
    meta: {
      nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
      hasMore,
    },
  };
}

/** The comment's author may delete it, and so may the post's author. */
export async function deleteComment(userId: string, commentId: string): Promise<void> {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
    select: { id: true, authorId: true, postId: true, post: { select: { authorId: true } } },
  });
  if (!comment) throw ApiError.notFound('That comment is gone.');

  if (comment.authorId !== userId && comment.post.authorId !== userId) {
    throw ApiError.forbidden("That comment isn't yours to delete.");
  }

  await prisma.$transaction([
    prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } }),
    prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    }),
  ]);
}
