/**
 * Every server interaction the app makes, as TanStack Query hooks.
 *
 * The optimistic like is the one worth reading closely: it flips the post in
 * *every* cached page that holds it, in the detail cache, and rolls all of it
 * back together on failure. Touching only the visible page leaves the same
 * post showing two different counts on two screens.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { api } from './client';
import type { Comment, Notification, Paged, Post, SessionUser } from './types';

export const keys = {
  feed: (username?: string) => ['posts', { username: username ?? null }] as const,
  post: (id: string) => ['post', id] as const,
  comments: (postId: string) => ['comments', postId] as const,
  notifications: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  stats: ['users', 'me', 'stats'] as const,
  people: (search: string) => ['users', search] as const,
};

const PAGE = 20;

type FeedCache = InfiniteData<Paged<Post>> | undefined;

/* ---------------------------------------------------------------- feed */

export function useFeed(username?: string) {
  return useInfiniteQuery({
    queryKey: keys.feed(username),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<Paged<Post>>('/posts', {
        params: { limit: PAGE, cursor: pageParam ?? undefined, username },
      });
      return res.data;
    },
    getNextPageParam: (last) => last.meta.nextCursor,
    staleTime: 30_000,
  });
}

export function usePost(id: string | null) {
  return useQuery({
    queryKey: keys.post(id ?? ''),
    enabled: !!id,
    // Zero, not 30s: someone arriving from a notification is here to see
    // something that just changed.
    staleTime: 0,
    queryFn: async () => (await api.get<{ data: Post }>(`/posts/${id}`)).data.data,
  });
}

export function useComments(postId: string | null) {
  return useInfiniteQuery({
    queryKey: keys.comments(postId ?? ''),
    enabled: !!postId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<Paged<Comment>>(`/posts/${postId}/comments`, {
        params: { limit: PAGE, cursor: pageParam ?? undefined },
      });
      return res.data;
    },
    getNextPageParam: (last) => last.meta.nextCursor,
  });
}

/* ------------------------------------------------------------ mutations */

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) =>
      (await api.post<{ data: Post }>('/posts', { content })).data.data,
    onSuccess: (post) => {
      // Written straight into the first page: a refetch here would reset
      // scroll position and make the user's own post appear to arrive late.
      qc.setQueryData<InfiniteData<Paged<Post>>>(keys.feed(undefined), (old: FeedCache) => {
        if (!old) return old;
        const [first, ...rest] = old.pages;
        if (!first) return old;
        return { ...old, pages: [{ ...first, data: [post, ...first.data] }, ...rest] };
      });
      void qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

function patchPostEverywhere(
  qc: ReturnType<typeof useQueryClient>,
  postId: string,
  patch: (p: Post) => Post,
) {
  qc.setQueriesData<FeedCache>({ queryKey: ['posts'] }, (old: FeedCache) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((pg: Paged<Post>) => ({
        ...pg,
        data: pg.data.map((p: Post) => (p.id === postId ? patch(p) : p)),
      })),
    };
  });
  qc.setQueryData<Post>(keys.post(postId), (old: Post | undefined) => (old ? patch(old) : old));
}

export function useToggleLike() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) =>
      (await api.post<{ data: { postId: string; liked: boolean; likeCount: number } }>(
        `/posts/${postId}/like`,
      )).data.data,

    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ['posts'] });
      const snapshot = qc.getQueriesData({ queryKey: ['posts'] });
      const detail = qc.getQueryData<Post>(keys.post(postId));

      patchPostEverywhere(qc, postId, (p) => ({
        ...p,
        likedByMe: !p.likedByMe,
        likeCount: Math.max(0, p.likeCount + (p.likedByMe ? -1 : 1)),
      }));

      return { snapshot, detail };
    },

    onError: (_err, postId, ctx) => {
      // Roll back visibly. A silent revert looks like the tap never landed.
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.detail) qc.setQueryData(keys.post(postId), ctx.detail);
    },

    onSuccess: (result) => {
      // Reconcile against the server's number rather than trusting the guess.
      patchPostEverywhere(qc, result.postId, (p) => ({
        ...p,
        likedByMe: result.liked,
        likeCount: result.likeCount,
      }));
    },
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) =>
      (await api.post<{ data: Comment & { postCommentCount: number } }>(
        `/posts/${postId}/comment`,
        { content },
      )).data.data,
    onSuccess: (comment) => {
      qc.setQueryData<InfiniteData<Paged<Comment>>>(keys.comments(postId), (old: InfiniteData<Paged<Comment>> | undefined) => {
        if (!old) return old;
        const pages = [...old.pages];
        const lastIndex = pages.length - 1;
        const last = pages[lastIndex];
        if (last) pages[lastIndex] = { ...last, data: [...last.data, comment] };
        return { ...old, pages };
      });
      patchPostEverywhere(qc, postId, (p) => ({
        ...p,
        commentCount: comment.postCommentCount,
      }));
    },
  });
}

/* -------------------------------------------------------- notifications */

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: keys.notifications,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<Paged<Notification>>('/notifications', {
        params: { limit: PAGE, cursor: pageParam ?? undefined },
      });
      return res.data;
    },
    getNextPageParam: (last) => last.meta.nextCursor,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: keys.unread,
    queryFn: async () =>
      (await api.get<{ data: { unread: number } }>('/notifications/unread-count')).data.data.unread,
    staleTime: 20_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ids?: string[]; all?: boolean }) =>
      (await api.post('/notifications/read', payload)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.notifications });
      void qc.invalidateQueries({ queryKey: keys.unread });
    },
  });
}

/* --------------------------------------------------------------- people */

export function usePeople(search: string) {
  return useQuery({
    queryKey: keys.people(search),
    queryFn: async () =>
      (await api.get<{ data: SessionUser[] }>('/users', { params: { search: search || undefined, limit: 12 } }))
        .data.data,
    staleTime: 5 * 60_000,
  });
}

export function useMyStats() {
  return useQuery({
    queryKey: keys.stats,
    queryFn: async () =>
      (
        await api.get<{
          data: { user: SessionUser; postCount: number; likesReceived: number };
        }>('/users/me/stats')
      ).data.data,
  });
}
