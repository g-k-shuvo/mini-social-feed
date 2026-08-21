/**
 * Points the whole suite at a dedicated test database and migrates it once.
 *
 * A separate database, not a separate schema: these tests truncate every table
 * between cases, and pointing that at the development database would delete
 * the seed data a reviewer is halfway through looking at.
 */
import { execSync } from 'node:child_process';
import { beforeAll, afterAll, beforeEach } from 'vitest';

const TEST_DB = 'minisocial_test';
const ADMIN_URL =
  process.env.TEST_ADMIN_URL ?? 'postgresql://minisocial:minisocial@localhost:5433/postgres';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://minisocial:minisocial@localhost:5433/${TEST_DB}?schema=public`;
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-secret-that-is-definitely-long-enough-32';
process.env.FIREBASE_SERVICE_ACCOUNT_B64 = '';
process.env.LOG_LEVEL = 'silent';

beforeAll(async () => {
  const { Client } = await import('pg');
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB]);
  if (exists.rowCount === 0) await admin.query(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();

  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
});

beforeEach(async () => {
  const { prisma } = await import('../src/lib/prisma');
  // TRUNCATE ... CASCADE in one statement: faster than six deleteMany calls
  // and immune to foreign-key ordering.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE notifications, likes, comments, posts, devices, refresh_tokens, users RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  const { prisma } = await import('../src/lib/prisma');
  await prisma.$disconnect();
});
