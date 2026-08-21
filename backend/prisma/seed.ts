/**
 * Seeds a populated feed so a reviewer's first launch shows a working app
 * rather than an empty state they have to fill themselves.
 *
 * Everything in here is synthetic demonstration content. The two named
 * accounts are the ones documented in the README.
 */
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'demo1234';
const MIN = 60_000;

const PEOPLE = [
  { username: 'priya', email: 'priya@example.com', displayName: 'Priya S.' },
  { username: 'rahul', email: 'rahul@example.com', displayName: 'Rahul M.' },
  { username: 'nadia', email: 'nadia@example.com', displayName: 'Nadia K.' },
  { username: 'tomas', email: 'tomas@example.com', displayName: 'Tomás R.' },
  { username: 'ify', email: 'ify@example.com', displayName: 'Ifeoma A.' },
  { username: 'kenji', email: 'kenji@example.com', displayName: 'Kenji W.' },
] as const;

const POSTS: { author: string; body: string; minutesAgo: number; likedBy: string[] }[] = [
  {
    author: 'priya',
    body: 'Shipping the feed today. Cursor pagination is in, counters are transactional, and the like toggle finally survives a double tap.',
    minutesAgo: 6,
    likedBy: ['rahul', 'nadia', 'tomas', 'ify', 'kenji'],
  },
  {
    author: 'kenji',
    body: 'Two devices, one push, four seconds. I have never been so happy about a notification.',
    minutesAgo: 31,
    likedBy: ['priya', 'nadia', 'ify'],
  },
  {
    author: 'nadia',
    body: 'Text only was the right call. Nothing to hide behind — the writing has to carry it.',
    minutesAgo: 74,
    likedBy: ['priya', 'rahul', 'tomas', 'ify', 'kenji'],
  },
  {
    author: 'rahul',
    body: 'Reading this on the tablet in landscape and it actually feels built for the tablet. Rare.',
    minutesAgo: 128,
    likedBy: ['priya', 'kenji'],
  },
  {
    author: 'tomas',
    body: 'Spent the morning arguing for keyset pagination and the afternoon proving it. Offset duplicates rows the moment anyone posts mid-scroll.',
    minutesAgo: 205,
    likedBy: ['priya', 'nadia', 'ify', 'kenji'],
  },
  {
    author: 'ify',
    body: 'Skeletons that match the real geometry. No layout shift on arrival. Small thing, feels enormous.',
    minutesAgo: 292,
    likedBy: ['nadia'],
  },
  {
    author: 'priya',
    body: 'The empty state says "Say something first." That is the whole product in three words.',
    minutesAgo: 431,
    likedBy: ['rahul', 'nadia', 'tomas', 'kenji'],
  },
  {
    author: 'kenji',
    body: 'Turned the font scale to 1.3x to see what breaks. Almost nothing. Almost.',
    minutesAgo: 588,
    likedBy: ['ify'],
  },
  {
    author: 'nadia',
    body: 'Every count sits in a fixed cell, so your eye stops hunting for the number down the column.',
    minutesAgo: 726,
    likedBy: ['priya', 'tomas'],
  },
  {
    author: 'rahul',
    body: 'Offline banner stays up, cached posts stay readable, and the compose button tells you why it is asleep.',
    minutesAgo: 940,
    likedBy: ['ify', 'kenji'],
  },
  {
    author: 'tomas',
    body: 'Optimistic likes with a real rollback. If the server says no, the number walks back and says so.',
    minutesAgo: 1180,
    likedBy: ['priya', 'nadia', 'rahul'],
  },
  {
    author: 'ify',
    body: 'Filed my first post at 2am. Naturally it was about pagination.',
    minutesAgo: 1425,
    likedBy: [],
  },
];

const COMMENTS: { postIndex: number; author: string; body: string; minutesAgo: number }[] = [
  { postIndex: 0, author: 'rahul', body: 'The double-tap fix is the one I would have shipped broken. Nice catch.', minutesAgo: 4 },
  { postIndex: 0, author: 'nadia', body: 'Unique constraint doing the heavy lifting?', minutesAgo: 3 },
  { postIndex: 0, author: 'priya', body: 'Exactly that. Insert guarded by the constraint, delete on conflict, both inside the transaction.', minutesAgo: 1 },
  { postIndex: 1, author: 'ify', body: 'Four seconds is fast. What is the p95?', minutesAgo: 24 },
  { postIndex: 2, author: 'tomas', body: 'It also means the feed never waits on an image decode. Scroll stays at 60.', minutesAgo: 60 },
  { postIndex: 2, author: 'priya', body: 'And nobody has to design an aspect-ratio policy at 1am.', minutesAgo: 51 },
  { postIndex: 2, author: 'kenji', body: 'The constraint is the feature.', minutesAgo: 40 },
  { postIndex: 3, author: 'nadia', body: 'Two pane or a wide single column?', minutesAgo: 110 },
  { postIndex: 3, author: 'rahul', body: 'Two pane. List on the left, the post open on the right. It never pushes a new screen.', minutesAgo: 96 },
  { postIndex: 4, author: 'ify', body: 'Show me the test.', minutesAgo: 190 },
  { postIndex: 4, author: 'tomas', body: 'Insert a post mid-scroll, page across the boundary, assert no duplicate and no skip.', minutesAgo: 180 },
  { postIndex: 6, author: 'kenji', body: 'Better than "No content available."', minutesAgo: 400 },
  { postIndex: 8, author: 'tomas', body: 'This is the detail nobody asks for and everybody feels.', minutesAgo: 700 },
  { postIndex: 10, author: 'priya', body: 'Snackbar with a retry. No silent rollbacks.', minutesAgo: 1050 },
];

function avatarColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const step = (h % 9) - 4;
  const hue = (12 + step * 15 + 360) % 360;
  return `hsl(${hue} 78% 58%)`;
}

async function main() {
  console.log('Seeding…');

  // Idempotent: re-running replaces the demo data rather than stacking it up.
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.device.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const byName = new Map<string, string>();

  for (const p of PEOPLE) {
    const id = crypto.randomUUID();
    await prisma.user.create({
      data: {
        id,
        username: p.username,
        email: p.email,
        displayName: p.displayName,
        passwordHash,
        avatarColor: avatarColorFor(id),
      },
    });
    byName.set(p.username, id);
  }

  const now = Date.now();
  const postIds: string[] = [];

  for (const post of POSTS) {
    const authorId = byName.get(post.author);
    if (!authorId) continue;
    const created = await prisma.post.create({
      data: {
        authorId,
        content: post.body,
        createdAt: new Date(now - post.minutesAgo * MIN),
        likeCount: post.likedBy.length,
      },
    });
    postIds.push(created.id);

    for (const liker of post.likedBy) {
      const userId = byName.get(liker);
      if (!userId) continue;
      await prisma.like.create({
        data: { postId: created.id, userId, createdAt: new Date(now - post.minutesAgo * MIN + MIN) },
      });
    }
  }

  for (const c of COMMENTS) {
    const postId = postIds[c.postIndex];
    const authorId = byName.get(c.author);
    if (!postId || !authorId) continue;
    await prisma.comment.create({
      data: { postId, authorId, content: c.body, createdAt: new Date(now - c.minutesAgo * MIN) },
    });
  }

  // Counters are derived, never guessed — same computation the reconcile
  // command and the integration test use.
  for (const postId of postIds) {
    const [likeCount, commentCount] = await Promise.all([
      prisma.like.count({ where: { postId } }),
      prisma.comment.count({ where: { postId, deletedAt: null } }),
    ]);
    await prisma.post.update({ where: { id: postId }, data: { likeCount, commentCount } });
  }

  // A few notifications addressed to priya, so the Notifications screen has
  // something in it on first launch.
  const priya = byName.get('priya');
  if (priya) {
    const priyaPosts = await prisma.post.findMany({
      where: { authorId: priya },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    const targets = priyaPosts.slice(0, 2);
    const actors = ['rahul', 'nadia', 'kenji', 'tomas'];
    let i = 0;
    for (const t of targets) {
      for (const a of actors) {
        const actorId = byName.get(a);
        if (!actorId) continue;
        i += 1;
        await prisma.notification.create({
          data: {
            recipientId: priya,
            actorId,
            type: i % 3 === 0 ? 'COMMENT' : 'LIKE',
            postId: t.id,
            readAt: i > 4 ? new Date(now - i * 20 * MIN) : null,
            createdAt: new Date(now - i * 17 * MIN),
          },
        });
      }
    }
  }

  console.log(`Seeded ${PEOPLE.length} users, ${postIds.length} posts, ${COMMENTS.length} comments.`);
  console.log(`Demo sign-in:  priya / ${PASSWORD}   (any username above works)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
