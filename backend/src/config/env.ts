/**
 * Owns the process's environment contract. Every variable is parsed and
 * validated here at boot, so a misconfigured deployment fails in the first
 * second with the offending variable named, rather than at the first request
 * that happens to need it.
 */
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(7),

  FIREBASE_SERVICE_ACCOUNT_B64: z.string().optional().default(''),

  CORS_ORIGINS: z.string().optional().default(''),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
  // Deliberately not the logger: the logger is configured from this file.
  console.error('Invalid environment configuration:\n' + lines.join('\n'));
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** When false the dispatcher logs what it would have sent and moves on. */
  firebaseEnabled: raw.FIREBASE_SERVICE_ACCOUNT_B64.length > 0,
} as const;

export type Env = typeof env;
