import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, signUp, auth, createPost } from './helpers';

describe('feed', () => {
  it('returns posts newest first', async () => {
    const a = await signUp();
    await createPost(a, 'oldest');
    await createPost(a, 'middle');
    await createPost(a, 'newest');

    const res = await request(app).get('/api/v1/posts').set(auth(a)).expect(200);
    expect(res.body.data.map((p: { content: string }) => p.content)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });

  /**
   * Case 3 of the PRD's named list, and the whole reason the API uses keyset
   * pagination instead of OFFSET. A post inserted mid-scroll must not push a
   * row from page one onto page two, and must not hide one entirely.
   */
  it('never duplicates or skips a post when one is inserted mid-scroll', async () => {
    const a = await signUp();
    for (let i = 0; i < 10; i++) await createPost(a, `post-${i}`);

    const first = await request(app).get('/api/v1/posts?limit=4').set(auth(a)).expect(200);
    const seen: string[] = first.body.data.map((p: { id: string }) => p.id);
    expect(first.body.meta.hasMore).toBe(true);

    // Somebody posts while the reader is between pages.
    await createPost(a, 'inserted-during-scroll');

    let cursor: string | null = first.body.meta.nextCursor;
    while (cursor) {
      const page: { body: { data: { id: string }[]; meta: { nextCursor: string | null } } } =
        await request(app)
          .get(`/api/v1/posts?limit=4&cursor=${encodeURIComponent(cursor)}`)
          .set(auth(a))
          .expect(200);
      seen.push(...page.body.data.map((p) => p.id));
      cursor = page.body.meta.nextCursor;
    }

    expect(new Set(seen).size).toBe(seen.length); // no duplicates
    expect(seen).toHaveLength(10); // the 10 that existed when paging began
  });

  it('filters by author and returns an empty page for an unknown username', async () => {
    const a = await signUp('authorone');
    const b = await signUp('authortwo');
    await createPost(a, 'by a');
    await createPost(b, 'by b');
    await createPost(b, 'also by b');

    const filtered = await request(app)
      .get('/api/v1/posts?username=authortwo')
      .set(auth(a))
      .expect(200);
    expect(filtered.body.data).toHaveLength(2);

    // An unknown author is an empty result, not an error: "nobody by that name
    // has posted" and "no posts yet" read the same to the user.
    const unknown = await request(app)
      .get('/api/v1/posts?username=nobodyatall')
      .set(auth(a))
      .expect(200);
    expect(unknown.body.data).toHaveLength(0);
  });

  /** Case 7. */
  it('answers a malformed cursor with 400, never 500 and never a silent reset', async () => {
    const a = await signUp();
    await createPost(a);
    const res = await request(app).get('/api/v1/posts?cursor=!!!notbase64!!!').set(auth(a));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an out-of-range limit rather than clamping it', async () => {
    const a = await signUp();
    await request(app).get('/api/v1/posts?limit=500').set(auth(a)).expect(400);
    await request(app).get('/api/v1/posts?limit=0').set(auth(a)).expect(400);
  });

  /** Case 8. */
  it('hides a soft-deleted post from the feed and 404s it by id', async () => {
    const a = await signUp();
    const id = await createPost(a, 'about to go');
    await request(app).delete(`/api/v1/posts/${id}`).set(auth(a)).expect(204);

    const feed = await request(app).get('/api/v1/posts').set(auth(a)).expect(200);
    expect(feed.body.data).toHaveLength(0);
    await request(app).get(`/api/v1/posts/${id}`).set(auth(a)).expect(404);
  });

  /** Case 5. */
  it("will not let one user delete another user's post", async () => {
    const owner = await signUp();
    const stranger = await signUp();
    const id = await createPost(owner, 'mine');

    const res = await request(app).delete(`/api/v1/posts/${id}`).set(auth(stranger)).expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');

    // The row survives.
    await request(app).get(`/api/v1/posts/${id}`).set(auth(owner)).expect(200);
  });

  it('rejects a non-uuid id with 400 rather than a driver error', async () => {
    const a = await signUp();
    await request(app).get('/api/v1/posts/not-a-uuid').set(auth(a)).expect(400);
  });

  it('enforces the 500-character ceiling after trimming', async () => {
    const a = await signUp();
    await request(app)
      .post('/api/v1/posts')
      .set(auth(a))
      .send({ content: 'x'.repeat(501) })
      .expect(400);
    await request(app)
      .post('/api/v1/posts')
      .set(auth(a))
      .send({ content: `   ${'x'.repeat(500)}   ` })
      .expect(201);
  });
});
