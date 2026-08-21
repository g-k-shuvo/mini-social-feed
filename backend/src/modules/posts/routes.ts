import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, currentUser } from '../../middleware/auth';
import { validate, uuidParam } from '../../middleware/validate';
import { commentLimiter, createPostLimiter, likeLimiter } from '../../middleware/rateLimit';
import { created, noContent, ok } from '../../lib/respond';
import { commentsQuery, createCommentBody, createPostBody, feedQuery } from './schema';
import * as posts from './service';
import * as comments from '../comments/service';

export const postsRouter = Router();

postsRouter.use(requireAuth);

postsRouter.post(
  '/',
  createPostLimiter,
  validate({ body: createPostBody }),
  async (req, res, next) => {
    try {
      created(res, await posts.createPost(currentUser(req).id, req.body.content));
    } catch (err) {
      next(err);
    }
  },
);

postsRouter.get('/', validate({ query: feedQuery }), async (req, res, next) => {
  try {
    const q = req.query as unknown as z.infer<typeof feedQuery>;
    const result = await posts.feed({
      viewerId: currentUser(req).id,
      limit: q.limit,
      cursor: q.cursor,
      username: q.username,
    });
    ok(res, result.data, result.meta);
  } catch (err) {
    next(err);
  }
});

postsRouter.get('/:id', validate({ params: uuidParam('id') }), async (req, res, next) => {
  try {
    ok(res, await posts.getPost(currentUser(req).id, req.params.id as string));
  } catch (err) {
    next(err);
  }
});

postsRouter.delete('/:id', validate({ params: uuidParam('id') }), async (req, res, next) => {
  try {
    await posts.deletePost(currentUser(req).id, req.params.id as string);
    noContent(res);
  } catch (err) {
    next(err);
  }
});

postsRouter.post(
  '/:id/like',
  likeLimiter,
  validate({ params: uuidParam('id') }),
  async (req, res, next) => {
    try {
      ok(res, await posts.toggleLike(currentUser(req).id, req.params.id as string));
    } catch (err) {
      next(err);
    }
  },
);

postsRouter.post(
  '/:id/comment',
  commentLimiter,
  validate({ params: uuidParam('id'), body: createCommentBody }),
  async (req, res, next) => {
    try {
      created(
        res,
        await comments.addComment(currentUser(req).id, req.params.id as string, req.body.content),
      );
    } catch (err) {
      next(err);
    }
  },
);

postsRouter.get(
  '/:id/comments',
  validate({ params: uuidParam('id'), query: commentsQuery }),
  async (req, res, next) => {
    try {
      const q = req.query as unknown as z.infer<typeof commentsQuery>;
      const result = await comments.listComments(req.params.id as string, q.limit, q.cursor);
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },
);
