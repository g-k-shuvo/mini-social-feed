/**
 * Owns account creation, sign-in, and the refresh-token rotation family.
 *
 * Rotation rule: every refresh spends the presented token and issues a new one
 * in the same transaction. Presenting an already-spent token is the signature
 * of a stolen token being replayed, so the whole family is revoked and both
 * the thief and the victim are forced to sign in again. That is the correct
 * trade — one inconvenienced user beats one silently hijacked session.
 */
import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/apiError';
import { hashPassword, verifyPassword } from '../../lib/password';
import {
  hashRefreshToken,
  newRefreshToken,
  refreshExpiry,
  signAccessToken,
} from '../../lib/tokens';
import { avatarColorFor } from '../../lib/respond';
import type { SignupInput } from './schema';

export interface PublicUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarColor: string;
  createdAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

const publicUser = (u: {
  id: string;
  username: string;
  displayName: string | null;
  avatarColor: string;
  createdAt: Date;
}): PublicUser => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
  avatarColor: u.avatarColor,
  createdAt: u.createdAt,
});

async function issueSession(
  user: { id: string; username: string; displayName: string | null; avatarColor: string; createdAt: Date },
  familyId: string,
): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: user.id, username: user.username });
  const { token, hash } = newRefreshToken();

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hash, familyId, expiresAt: refreshExpiry() },
  });

  return { user: publicUser(user), accessToken, refreshToken: token };
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  // Checked up front for a clean field-level message; the unique indexes are
  // still the real guard against two signups racing each other.
  const clash = await prisma.user.findFirst({
    where: { OR: [{ username: input.username }, { email: input.email }] },
    select: { username: true, email: true },
  });
  if (clash) {
    if (clash.username.toLowerCase() === input.username.toLowerCase()) {
      throw new ApiError('USERNAME_TAKEN', 'That username is taken.');
    }
    throw new ApiError('EMAIL_TAKEN', 'That email is already registered.');
  }

  const id = crypto.randomUUID();
  const user = await prisma.user.create({
    data: {
      id,
      username: input.username,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      displayName: input.displayName || null,
      avatarColor: avatarColorFor(id),
    },
  });

  return issueSession(user, crypto.randomUUID());
}

export async function login(identifier: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
  });

  // Same error whether the account is missing or the password is wrong, and
  // a hash comparison runs either way so the timing does not leak the answer.
  const hash = user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const okPassword = await verifyPassword(password, hash);

  if (!user || !okPassword) {
    throw new ApiError('INVALID_CREDENTIALS', "That username and password don't match.");
  }

  return issueSession(user, crypto.randomUUID());
}

export async function refresh(presented: string): Promise<AuthResult> {
  const hash = hashRefreshToken(presented);
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash },
    include: { user: true },
  });

  if (!existing) {
    throw new ApiError('REFRESH_TOKEN_INVALID', 'Your session expired. Sign in again.');
  }

  // Replay of a token already spent: burn the family.
  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: existing.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new ApiError('REFRESH_TOKEN_INVALID', 'Your session expired. Sign in again.');
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw new ApiError('REFRESH_TOKEN_INVALID', 'Your session expired. Sign in again.');
  }

  const rotated = newRefreshToken();

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: rotated.hash,
        familyId: existing.familyId,
        expiresAt: refreshExpiry(),
      },
    }),
  ]);

  return {
    user: publicUser(existing.user),
    accessToken: signAccessToken({ sub: existing.user.id, username: existing.user.username }),
    refreshToken: rotated.token,
  };
}

/** Always succeeds. A logout that can fail leaves people signed in by accident. */
export async function logout(
  userId: string,
  refreshToken?: string,
  fcmToken?: string,
): Promise<void> {
  const jobs: Promise<unknown>[] = [];

  if (refreshToken) {
    jobs.push(
      prisma.refreshToken.updateMany({
        where: { tokenHash: hashRefreshToken(refreshToken), userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    );
  }
  if (fcmToken) {
    jobs.push(prisma.device.deleteMany({ where: { fcmToken, userId } }));
  }

  await Promise.allSettled(jobs);
}

export async function me(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthenticated('Sign in again.');
  return publicUser(user);
}
