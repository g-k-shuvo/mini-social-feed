import { z } from 'zod';

export const POST_MAX = 500;
export const COMMENT_MAX = 300;

/**
 * Strips control characters but keeps newline and tab: people write short
 * paragraphs, and a stray NUL or bell should never reach the database.
 * Built from a string so the source file itself stays plain ASCII.
 *
 * Length is measured after this and after trimming, so whitespace padding
 * cannot buy extra characters.
 */
const CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]', 'g');
const cleanText = (s: string) => s.replace(CONTROL_CHARS, '').trim();

export const createPostBody = z.object({
  content: z
    .string({ required_error: 'Say something first.' })
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, 'Say something first.')
        .max(POST_MAX, `Posts are limited to ${POST_MAX} characters.`),
    ),
});

export const createCommentBody = z.object({
  content: z
    .string({ required_error: 'Write something first.' })
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, 'Write something first.')
        .max(COMMENT_MAX, `Comments are limited to ${COMMENT_MAX} characters.`),
    ),
});

/**
 * Out-of-range values are rejected, never silently clamped: a client asking
 * for 500 rows has a bug, and hiding it makes the bug harder to find.
 */
export const feedQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
  username: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, 'That is not a valid username.')
    .optional(),
});

export const commentsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
});
