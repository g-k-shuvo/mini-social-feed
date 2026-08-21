import { z } from 'zod';
import { MAX_PASSWORD_BYTES } from '../../lib/password';

/**
 * Every message here is the exact string the app puts in front of the user,
 * so they are written in second person and say what to do next.
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Usernames use letters, numbers, and underscores, 3–20 characters.')
  .max(20, 'Usernames use letters, numbers, and underscores, 3–20 characters.')
  .regex(/^[a-zA-Z0-9_]+$/, 'Usernames use letters, numbers, and underscores, 3–20 characters.');

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters with a letter and a number.')
  .max(MAX_PASSWORD_BYTES, `Passwords are limited to ${MAX_PASSWORD_BYTES} characters.`)
  .regex(/[a-zA-Z]/, 'Use at least 8 characters with a letter and a number.')
  .regex(/[0-9]/, 'Use at least 8 characters with a letter and a number.');

export const signupBody = z.object({
  username: usernameSchema,
  email: z.string().trim().toLowerCase().email("That doesn't look like an email address."),
  password: passwordSchema,
  displayName: z.string().trim().max(50, 'Display name is too long.').optional(),
});

export const loginBody = z.object({
  identifier: z.string().trim().min(1, 'Enter your username or email.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const refreshBody = z.object({
  refreshToken: z.string().min(1, 'Missing refresh token.'),
});

export const logoutBody = z.object({
  refreshToken: z.string().min(1).optional(),
  fcmToken: z.string().min(1).optional(),
});

export type SignupInput = z.infer<typeof signupBody>;
export type LoginInput = z.infer<typeof loginBody>;
