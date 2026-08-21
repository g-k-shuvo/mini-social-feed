import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, signUp, auth, createPost } from './helpers';
import { prisma } from '../src/lib/prisma';
import { reconcileCounters } from '../src/scripts/reconcileCounters';
import { dispatch } from '../src/modules/notifications/dispatcher';

describe('likes', () => {
  /** Case 1. */
  it('toggles: two taps leave one row and the original count', async () => {
    const a = await signUp();
    const id = await createPost(a);

    const on = await request(app).post(`/api/v1/posts/${id}/like`).set(auth(a)).expect(200);
    expect(on.body.data).toMatchObject({ liked: true, likeCount: 1 });

    const off = await request(app).post(`/api/v1/posts/${id}/like`).set(auth(a)).expect(200);
    expect(off.body.data).toMatchObject({ liked: false, likeCount: 0 });

    expect(await prisma.like.count({ where: { postId: id } })).toBe(0);
  });

  /** Case 2 — the unique constraint is what makes this survive a real race. */
  it('lands on exactly 2 when two users like the same post at once', async () => {
    const author = await signUp();
    const one = await signUp();
    const two = await signUp();
    const id = await createPost(author);

    await Promise.all([
      request(app).post(`/api/v1/posts/${id}/like`).set(auth(one)),
      request(app).post(`/api/v1/posts/${id}/like`).set(auth(two)),
    ]);

    const post = await prisma.post.findUniqueOrThrow({ where: { id } });
    expect(post.likeCount).toBe(2);
    expect(await prisma.like.count({ where: { postId: id } })).toBe(2);
  });

  it('never records two likes when one user fires the same tap concurrently', async () => {
    const a = await signUp();
    const id = await createPost(a);

    await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).post(`/api/v1/posts/${id}/like`).set(auth(a)),
      ),
    );

    // Whatever order they resolved in, the constraint permits at most one row.
    expect(await prisma.like.count({ where: { postId: id, userId: a.id } })).toBeLessThanOrEqual(1);
  });

  it('leaves counters consistent with their source rows', async () => {
    const a = await signUp();
    const b = await signUp();
    const id = await createPost(a);
    await request(app).post(`/api/v1/posts/${id}/like`).set(auth(b)).expect(200);
    await request(app)
      .post(`/api/v1/posts/${id}/comment`)
      .set(auth(b))
      .send({ content: 'nice' })
      .expect(201);

    // The same computation the maintenance command uses: no drift means the
    // transactional updates did their job.
    expect(await reconcileCounters(false)).toEqual([]);
  });

  it('404s a like against a post that is gone', async () => {
    const a = await signUp();
    const id = await createPost(a);
    await request(app).delete(`/api/v1/posts/${id}`).set(auth(a)).expect(204);
    await request(app).post(`/api/v1/posts/${id}/like`).set(auth(a)).expect(404);
  });
});

describe('comments', () => {
  it('adds a comment, bumps the count, and reads oldest-first', async () => {
    const a = await signUp();
    const b = await signUp();
    const id = await createPost(a);

    await request(app).post(`/api/v1/posts/${id}/comment`).set(auth(b)).send({ content: 'first' }).expect(201);
    await request(app).post(`/api/v1/posts/${id}/comment`).set(auth(b)).send({ content: 'second' }).expect(201);
    const third = await request(app)
      .post(`/api/v1/posts/${id}/comment`)
      .set(auth(a))
      .send({ content: 'third' })
      .expect(201);

    expect(third.body.data.postCommentCount).toBe(3);

    const list = await request(app).get(`/api/v1/posts/${id}/comments`).set(auth(a)).expect(200);
    expect(list.body.data.map((c: { content: string }) => c.content)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('paginates comments forward without repeating one', async () => {
    const a = await signUp();
    const id = await createPost(a);
    for (let i = 0; i < 7; i++) {
      await request(app)
        .post(`/api/v1/posts/${id}/comment`)
        .set(auth(a))
        .send({ content: `c${i}` })
        .expect(201);
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const url = `/api/v1/posts/${id}/comments?limit=3${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const page: { body: { data: { id: string }[]; meta: { nextCursor: string | null } } } =
        await request(app).get(url).set(auth(a)).expect(200);
      seen.push(...page.body.data.map((c) => c.id));
      cursor = page.body.meta.nextCursor;
    } while (cursor);

    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
  });

  it('refuses a comment on a deleted post with 422', async () => {
    const a = await signUp();
    const id = await createPost(a);
    await request(app).delete(`/api/v1/posts/${id}`).set(auth(a)).expect(204);

    const res = await request(app)
      .post(`/api/v1/posts/${id}/comment`)
      .set(auth(a))
      .send({ content: 'hello?' })
      .expect(422);
    expect(res.body.error.code).toBe('UNPROCESSABLE');
  });

  it('lets the post author delete someone else’s comment on their post', async () => {
    const author = await signUp();
    const commenter = await signUp();
    const stranger = await signUp();
    const postId = await createPost(author);

    const c = await request(app)
      .post(`/api/v1/posts/${postId}/comment`)
      .set(auth(commenter))
      .send({ content: 'a reply' })
      .expect(201);
    const commentId = c.body.data.id as string;

    await request(app).delete(`/api/v1/comments/${commentId}`).set(auth(stranger)).expect(403);
    await request(app).delete(`/api/v1/comments/${commentId}`).set(auth(author)).expect(204);
  });
});

describe('notifications', () => {
  /** Case 6. */
  it('creates nothing when the actor is the post author', async () => {
    const a = await signUp();
    const id = await createPost(a);

    await request(app).post(`/api/v1/posts/${id}/like`).set(auth(a)).expect(200);
    // Awaited directly rather than through enqueue, so the assertion does not
    // race the dispatcher's setImmediate.
    await dispatch({ type: 'LIKE', actorId: a.id, postId: id });

    expect(await prisma.notification.count()).toBe(0);
  });

  it('notifies the author when somebody else likes, once per window', async () => {
    const author = await signUp();
    const liker = await signUp();
    const id = await createPost(author);

    await dispatch({ type: 'LIKE', actorId: liker.id, postId: id });
    await dispatch({ type: 'LIKE', actorId: liker.id, postId: id });

    // Rule N-3: unlike-then-relike inside 60s does not notify twice.
    const rows = await prisma.notification.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.recipientId).toBe(author.id);
    expect(rows[0]?.actorId).toBe(liker.id);
  });

  it('lists notifications and marks them read for the recipient only', async () => {
    const author = await signUp();
    const actor = await signUp();
    const id = await createPost(author);
    await dispatch({ type: 'LIKE', actorId: actor.id, postId: id });

    const list = await request(app).get('/api/v1/notifications').set(auth(author)).expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].read).toBe(false);

    // The actor sees nothing: it is not their notification.
    const other = await request(app).get('/api/v1/notifications').set(auth(actor)).expect(200);
    expect(other.body.data).toHaveLength(0);

    await request(app)
      .post('/api/v1/notifications/read')
      .set(auth(author))
      .send({ all: true })
      .expect(200);

    const after = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set(auth(author))
      .expect(200);
    expect(after.body.data.unread).toBe(0);
  });
});

describe('devices', () => {
  it('moves a handset token to whoever signed in last', async () => {
    const first = await signUp();
    const second = await signUp();
    const token = 'fcm-token-for-one-physical-handset';

    await request(app).post('/api/v1/devices').set(auth(first)).send({ fcmToken: token }).expect(200);
    await request(app).post('/api/v1/devices').set(auth(second)).send({ fcmToken: token }).expect(200);

    const rows = await prisma.device.findMany({ where: { fcmToken: token } });
    expect(rows).toHaveLength(1);
    // Otherwise the previous account keeps getting pushes on a phone it no
    // longer has a session on.
    expect(rows[0]?.userId).toBe(second.id);
  });
});
