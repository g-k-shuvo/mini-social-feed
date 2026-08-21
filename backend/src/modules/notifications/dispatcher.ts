/**
 * Turns an interaction into a notification row and a push, off the request
 * path.
 *
 * `enqueue` returns immediately. The HTTP response for a like or a comment has
 * already been sent by the time any of this runs, so an FCM outage degrades
 * notifications and never the API. Everything here is wrapped: a throw in the
 * dispatcher must not become an unhandled rejection that kills the process.
 */
import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { fcm } from '../../config/firebase';

export interface DispatchJob {
  type: NotificationType;
  actorId: string;
  postId: string;
  commentId?: string;
}

/** Re-liking after an unlike inside this window does not notify twice. */
const DUPLICATE_WINDOW_MS = 60_000;

const BODY_LIMIT = 80;

function truncate(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= BODY_LIMIT) return clean;
  const cut = clean.slice(0, BODY_LIMIT);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function enqueue(job: DispatchJob): void {
  setImmediate(() => {
    void dispatch(job).catch((err) => logger.error({ err, job }, 'notification dispatch failed'));
  });
}

export async function dispatch(job: DispatchJob): Promise<void> {
  const post = await prisma.post.findFirst({
    where: { id: job.postId, deletedAt: null },
    select: { id: true, authorId: true, content: true },
  });
  if (!post) return;

  // Rule N-1: you are never told about your own actions.
  if (post.authorId === job.actorId) return;

  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const duplicate = await prisma.notification.findFirst({
    where: {
      recipientId: post.authorId,
      actorId: job.actorId,
      type: job.type,
      postId: post.id,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (duplicate) return;

  const [actor, comment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: job.actorId },
      select: { username: true, displayName: true },
    }),
    job.commentId
      ? prisma.comment.findUnique({ where: { id: job.commentId }, select: { content: true } })
      : Promise.resolve(null),
  ]);
  if (!actor) return;

  // The dispatcher runs after the response, so the post, the actor, or the
  // recipient can all disappear between the reads above and this write. That
  // is a race to absorb, not an error to report: there is nobody left to
  // notify, which is the correct outcome.
  let notification;
  try {
    notification = await prisma.notification.create({
      data: {
        recipientId: post.authorId,
        actorId: job.actorId,
        type: job.type,
        postId: post.id,
        commentId: job.commentId ?? null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2003' || err.code === 'P2025')) {
      logger.debug({ job }, 'notification target vanished before it could be recorded');
      return;
    }
    throw err;
  }

  const title =
    job.type === NotificationType.LIKE
      ? `${actor.username} liked your post`
      : `${actor.username} commented on your post`;
  const body = truncate(comment?.content ?? post.content);

  await send({
    recipientId: post.authorId,
    notificationId: notification.id,
    title,
    body,
    type: job.type,
    postId: post.id,
    commentId: job.commentId ?? '',
    actorUsername: actor.username,
  });
}

interface SendArgs {
  recipientId: string;
  notificationId: string;
  title: string;
  body: string;
  type: NotificationType;
  postId: string;
  commentId: string;
  actorUsername: string;
}

async function send(args: SendArgs): Promise<void> {
  const devices = await prisma.device.findMany({
    where: { userId: args.recipientId },
    select: { fcmToken: true },
  });
  if (devices.length === 0) return;

  const tokens = devices.map((d) => d.fcmToken);

  // FCM rejects non-string data values, so every one of these is a string on
  // purpose — including the empty commentId on a like.
  const data: Record<string, string> = {
    type: args.type,
    postId: args.postId,
    commentId: args.commentId,
    actorUsername: args.actorUsername,
    notificationId: args.notificationId,
  };

  if (!fcm.enabled || !fcm.client) {
    logger.info(
      { notificationId: args.notificationId, tokenCount: tokens.length, title: args.title },
      'push suppressed (no Firebase credentials)',
    );
    return;
  }

  const result = await fcm.client.sendEachForMulticast({
    tokens,
    notification: { title: args.title, body: args.body },
    data,
    android: {
      priority: 'high',
      // Ten likes on one post while the phone is offline arrive as one
      // notification, not ten.
      collapseKey: `post_${args.postId}`,
      notification: { channelId: 'social-interactions', tag: `post_${args.postId}` },
    },
  });

  // A token the device no longer owns is dead forever; retrying it wastes a
  // send on every future notification.
  const dead: string[] = [];
  result.responses.forEach((r, i) => {
    const code = r.error?.code;
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/invalid-argument'
    ) {
      const token = tokens[i];
      if (token) dead.push(token);
    }
  });
  if (dead.length) {
    await prisma.device.deleteMany({ where: { fcmToken: { in: dead } } });
  }

  logger.info(
    {
      notificationId: args.notificationId,
      recipientId: args.recipientId,
      tokenCount: tokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      prunedTokens: dead.length,
    },
    'push sent',
  );
}
