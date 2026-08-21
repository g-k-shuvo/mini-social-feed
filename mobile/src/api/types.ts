export interface Author {
  id: string;
  username: string;
  displayName: string | null;
  avatarColor: string;
}

export interface Post {
  id: string;
  content: string;
  author: Author;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: Author;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT';
  actor: Author;
  postId: string;
  commentId: string | null;
  preview: string;
  read: boolean;
  createdAt: string;
}

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Paged<T> {
  data: T[];
  meta: PageMeta;
}

export interface SessionUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarColor: string;
  createdAt: string;
}

export interface AuthPayload {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}
