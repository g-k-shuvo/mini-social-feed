/**
 * Recomputes every post's denormalised counters from the rows they count.
 *
 * The counters are maintained transactionally, so in a healthy system this
 * changes nothing. It exists because "in a healthy system" is a claim worth
 * being able to check — and because the integration test for the like toggle
 * asserts against exactly this computation.
 */
import { prisma } from '../lib/prisma';

export interface Drift {
  postId: string;
  field: 'likeCount' | 'commentCount';
  stored: number;
  actual: number;
}

export async function reconcileCounters(apply: boolean): Promise<Drift[]> {
  const posts = await prisma.post.findMany({
    select: { id: true, likeCount: true, commentCount: true },
  });

  const drift: Drift[] = [];

  for (const post of posts) {
    const [likes, comments] = await Promise.all([
      prisma.like.count({ where: { postId: post.id } }),
      prisma.comment.count({ where: { postId: post.id, deletedAt: null } }),
    ]);

    if (post.likeCount !== likes) {
      drift.push({ postId: post.id, field: 'likeCount', stored: post.likeCount, actual: likes });
    }
    if (post.commentCount !== comments) {
      drift.push({
        postId: post.id,
        field: 'commentCount',
        stored: post.commentCount,
        actual: comments,
      });
    }

    if (apply && (post.likeCount !== likes || post.commentCount !== comments)) {
      await prisma.post.update({
        where: { id: post.id },
        data: { likeCount: likes, commentCount: comments },
      });
    }
  }

  return drift;
}

if (require.main === module) {
  reconcileCounters(true)
    .then((drift) => {
      if (drift.length === 0) {
        console.log('Counters are consistent. Nothing to fix.');
      } else {
        console.log(`Repaired ${drift.length} drifted counter(s):`);
        for (const d of drift) {
          console.log(`  ${d.postId}  ${d.field}: ${d.stored} -> ${d.actual}`);
        }
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
