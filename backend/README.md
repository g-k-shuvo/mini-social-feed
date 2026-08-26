# Mini Social Feed — API

Node.js + Express + PostgreSQL REST API for a text-only social feed: auth, posts, likes, comments, and Firebase Cloud Messaging push notifications.

**Get it running in under ten minutes** — that is the promise this README is written to keep. If any step below takes longer than it says, that is a bug in the README, not in your setup.

---

## Contents

- [Quick start](#quick-start)
- [Environment](#environment)
- [Commands](#commands)
- [API reference](#api-reference)
- [Firebase setup](#firebase-setup)
- [Architecture](#architecture)
- [Testing](#testing)
- [Deploying](#deploying)
- [Troubleshooting](#troubleshooting)

---

## Quick start

**Prerequisites:** Node 20+ and Docker. Nothing else — Postgres runs in a container.

```bash
cd backend
cp .env.example .env

# Generate a real signing secret and paste it into JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

npm install
npm run setup      # starts Postgres, generates the client, migrates, seeds
npm run dev
```

`http://localhost:4000/health` should answer `{"status":"ok","db":"ok"}`.

The seed creates six accounts with a populated feed. Sign in with any of them:

| Username | Password |
|---|---|
| `priya` | `demo1234` |
| `rahul` | `demo1234` |
| `nadia` · `tomas` · `ify` · `kenji` | `demo1234` |

> **Firebase is optional for development.** With `FIREBASE_SERVICE_ACCOUNT_B64` empty the API records notifications in the database and logs what it *would* have pushed. Every other endpoint behaves identically. Set it up only when you want a real device to buzz — see [Firebase setup](#firebase-setup).

---

## Environment

Every variable is validated at boot by a Zod schema. A missing or malformed value stops the process in the first second and names the offending variable, rather than failing later on the first request that needs it.

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | Controls error verbosity and log format |
| `PORT` | no | `4000` | HTTP port |
| `DATABASE_URL` | yes | `postgresql://minisocial:minisocial@localhost:5433/minisocial?schema=public` | Prisma connection string (pooled, in production) |
| `DIRECT_URL` | yes | same as `DATABASE_URL` locally | Unpooled connection for migrations. A pooler cannot run DDL |
| `JWT_ACCESS_SECRET` | yes | 32+ random characters | Access-token signing key |
| `JWT_ACCESS_TTL` | no | `15m` | Access-token lifetime |
| `REFRESH_TTL_DAYS` | no | `7` | Refresh-token lifetime |
| `FIREBASE_SERVICE_ACCOUNT_B64` | no | base64 of the service-account JSON | Firebase Admin credentials. Empty disables push |
| `CORS_ORIGINS` | no | `http://localhost:8081` | Comma-separated allowlist. Empty allows all |
| `LOG_LEVEL` | no | `info` | pino level |

The container publishes Postgres on **5433**, not 5432, so it does not collide with a Postgres you may already have installed.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Watch mode on `http://localhost:4000` |
| `npm run setup` | Database up → client → migrate → seed, in one go |
| `npm run db:up` / `npm run db:down` | Start / stop the Postgres container |
| `npm run migrate` | Create and apply a new migration |
| `npm run migrate:deploy` | Apply existing migrations (what production runs) |
| `npm run seed` | Reset demo data. Idempotent |
| `npm test` | Integration suite against a throwaway `minisocial_test` database |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm run reconcile:counters` | Recompute `likeCount` / `commentCount` from source rows |

---

## API reference

### Conventions

- **Base URL** `http://localhost:4000/api/v1`. The version is in the path so a breaking change can never silently reach an already-installed APK.
- **Auth** `Authorization: Bearer <accessToken>` on everything except signup, login, refresh, and `/health`.
- **Timestamps** ISO 8601 UTC. **Ids** UUID v4.
- Every response carries `X-Request-Id`, and the same id appears on the matching server log line and inside error bodies.

**Success**

```json
{ "success": true, "data": { }, "meta": { "nextCursor": "...", "hasMore": true } }
```

`meta` appears only on paginated responses.

**Error** — one shape for every failure, including unhandled ones:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Posts are limited to 500 characters.",
    "details": [{ "field": "content", "issue": "too_big" }],
    "requestId": "01J9X2K7B4"
  }
}
```

`message` is written for a person and the app renders it verbatim. Do not parse it — branch on `code`.

### Error codes

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body, query, or param failed its schema |
| 401 | `UNAUTHENTICATED` | Missing, malformed, or expired access token |
| 401 | `INVALID_CREDENTIALS` | Wrong identifier or password — deliberately identical for both, to prevent account enumeration |
| 401 | `REFRESH_TOKEN_INVALID` | Refresh token unknown, expired, or already rotated |
| 403 | `FORBIDDEN` | Authenticated, but not the owner |
| 404 | `NOT_FOUND` | Missing or soft-deleted |
| 409 | `USERNAME_TAKEN` / `EMAIL_TAKEN` | Signup conflict |
| 422 | `UNPROCESSABLE` | Well-formed but impossible, e.g. commenting on a deleted post |
| 429 | `RATE_LIMITED` | Bucket exhausted; carries `Retry-After` |
| 500 | `INTERNAL_ERROR` | Unhandled. Never leaks a stack trace in production |

### Pagination

**Cursor-based (keyset), not offset.** The feed is a live, insert-heavy list: with `OFFSET`, a post published while someone is reading shifts every later page by one, duplicating rows across page boundaries and skipping others. The cursor is an opaque base64 encoding of the last row's `(createdAt, id)`.

`limit` defaults to 20, bounded 1–50. Out-of-range values are **rejected**, not clamped. A malformed cursor is a 400, never a silent reset to page one.

---

### Endpoints

#### `POST /auth/signup` · public

```json
{ "username": "priya", "email": "priya@example.com", "password": "correcthorse9", "displayName": "Priya S." }
```

`201` → `{ user, accessToken, refreshToken }`. Errors: `400`, `409 USERNAME_TAKEN`, `409 EMAIL_TAKEN`, `429`.

```bash
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"username":"newbie","email":"newbie@example.com","password":"correcthorse9"}'
```

#### `POST /auth/login` · public

Body `{ "identifier": "priya | priya@example.com", "password": "…" }` → `200` with the same shape as signup.

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"priya","password":"demo1234"}'
```

#### `POST /auth/refresh` · public

Body `{ "refreshToken": "…" }` → a **new** access *and* refresh token; the presented one is revoked in the same transaction.

Replaying an already-rotated token revokes the entire token family and returns `401`. That is deliberate: replay is the signature of a stolen token, and forcing one honest user to sign in again beats leaving a hijacked session alive.

#### `POST /auth/logout` · authed

Body `{ "refreshToken"?, "fcmToken"? }` → always `204`, even when both are already gone. A logout that can fail leaves people signed in by accident.

#### `GET /auth/me` · authed → the current user.

---

#### `POST /devices` · authed

Body `{ "fcmToken": "…", "platform": "ANDROID" }` → `200 { "registered": true }`.

Upserts on the **token**, not on (user, token): one handset has one token, so a second account signing in on it takes ownership. Otherwise the previous account keeps receiving pushes on a phone it no longer has a session on.

#### `DELETE /devices/:fcmToken` · authed → `204`.

---

#### `POST /posts` · authed

Body `{ "content": "…" }`, 1–500 characters after trimming and control-character stripping.

```json
{ "success": true, "data": {
  "id": "…", "content": "Shipping the feed today.",
  "author": { "id": "…", "username": "priya", "displayName": "Priya S.", "avatarColor": "hsl(57 78% 58%)" },
  "likeCount": 0, "commentCount": 0, "likedByMe": false,
  "createdAt": "2026-08-21T14:03:11.482Z"
}}
```

#### `GET /posts?limit=&cursor=&username=` · authed

Newest first. `username` filters by author, exact and case-insensitive.

`likedByMe` is hydrated for the whole page in a single query — never N+1. An unknown `username` returns `200` with an empty array, not `404`: "nobody by that name has posted" and "no posts yet" are the same fact to the reader.

```bash
TOKEN=... # from login
curl "http://localhost:4000/api/v1/posts?limit=20" -H "Authorization: Bearer $TOKEN"
curl "http://localhost:4000/api/v1/posts?username=nadia" -H "Authorization: Bearer $TOKEN"
```

#### `GET /posts/:id` · authed → one post. `404` if missing or soft-deleted.

#### `DELETE /posts/:id` · authed, author only → `204`. Soft delete. `403` for anyone else.

#### `POST /posts/:id/like` · authed — **toggle**, no body

```json
{ "success": true, "data": { "postId": "…", "liked": true, "likeCount": 12 } }
```

Idempotent by construction: the insert is guarded by `UNIQUE (post_id, user_id)` and the counter moves in the same transaction. A double tap produces one like — not two rows, and not a 500. A notification fires only on the `false → true` transition, and only when the actor is not the author.

#### `POST /posts/:id/comment` · authed

Body `{ "content": "…" }`, 1–300 characters → `201` with the comment plus the post's new `postCommentCount`.

#### `GET /posts/:id/comments?limit=&cursor=` · authed

Oldest-first within a post, so a thread reads top to bottom.

#### `DELETE /comments/:id` · authed — the comment's author **or** the post's author → `204`.

---

#### `GET /users?search=pri&limit=10` · authed → username prefix match, for the feed filter's autocomplete.

#### `GET /users/me/stats` · authed → `{ user, postCount, likesReceived }` for the Profile screen.

#### `GET /notifications?limit=&cursor=` · authed → newest first, each row with `actor`, `type`, `preview`, `read`.

#### `POST /notifications/read` · authed → body `{ "ids": [...] }` or `{ "all": true }`.

#### `GET /notifications/unread-count` · authed → `{ "unread": 4 }`.

#### `GET /health` · public, unversioned → `{ "status", "db", "uptime" }`.

---

### Rate limits

| Bucket | Limit | Keyed on |
|---|---|---|
| Signup | 5 / hour | IP |
| Login & refresh | 10 / 15 min | IP + identifier |
| Create post | 10 / min | user |
| Create comment | 30 / min | user |
| Like toggle | 60 / min | user |
| Global | 300 / min | IP |

Login is keyed on IP **and** identifier so one attacker cannot lock a real account out by name alone. All limits are disabled under `NODE_ENV=test`.

---

## Firebase setup

Skip this entirely until you want a physical device to buzz.

1. **Create a project** at [console.firebase.google.com](https://console.firebase.google.com).
2. **Add an Android app.** The package name must match `mobile/app.config.ts` — `com.minisocialfeed.app`. Download `google-services.json` and put it in `mobile/`.
3. **Generate a service account:** Project settings → Service accounts → *Generate new private key*. A JSON file downloads.
4. **Base64 it into the env var** — the JSON file itself is never committed:

   ```bash
   node -e "console.log(Buffer.from(require('fs').readFileSync('service-account.json')).toString('base64'))"
   ```

   Paste the output into `FIREBASE_SERVICE_ACCOUNT_B64` in `.env` and restart. The log line `firebase ready` confirms it.

5. **Verify before wiring the app.** Register a device token, then like one of that user's posts from a second account and watch for `push sent` in the log with `successCount: 1`.

Dead tokens are pruned automatically: FCM's `registration-token-not-registered` deletes the device row, because a token the handset no longer owns is dead forever and retrying it wastes a send on every future notification.

---

## Architecture

```
src/
├── app.ts              express assembly — no listen, so tests mount it in-process
├── server.ts           listen + graceful shutdown
├── config/             env parsing (zod), firebase init
├── middleware/         requestId · auth · validate · rateLimit · errorHandler
├── modules/
│   ├── auth/           routes · service · schema
│   ├── posts/          routes · service · schema
│   ├── comments/       service
│   ├── devices/        routes
│   ├── users/          routes
│   └── notifications/  routes · dispatcher
├── lib/                prisma · tokens · password · pagination · apiError · logger
└── scripts/            reconcileCounters
```

**Layering rule, enforced in review:** routes declare, services hold business logic, Prisma is touched only from services. No business logic in a route file; no `req` or `res` inside a service.

**Three decisions worth knowing about:**

*Likes are idempotent in the database, not in application code.* `UNIQUE (post_id, user_id)` is the whole story. Application-level "check then insert" loses under concurrency; a constraint does not.

*Counters are denormalised and transactional.* `likeCount` and `commentCount` live on the post so the feed never runs a correlated subquery per row. Every change shares a transaction with the row it counts. `npm run reconcile:counters` recomputes them from source, and the integration suite asserts the result is empty.

*Push never blocks a response.* The dispatcher is enqueued with `setImmediate` after the HTTP response is already sent. An FCM outage degrades notifications and never the API.

---

## Testing

```bash
npm test
```

Spins up a throwaway `minisocial_test` database on the same container, migrates it, and truncates between cases. 31 integration tests through the real HTTP stack via supertest.

Eight of them exist because each maps to a specific bug this design prevents:

1. Double `POST /posts/:id/like` leaves one row and the original count.
2. Two users liking the same post concurrently land on exactly 2.
3. Paging across a boundary while a post is inserted mid-scroll yields no duplicate and no skip.
4. A replayed refresh token returns 401 and revokes the family.
5. User A cannot delete user B's post — 403, and the row survives.
6. A self-like creates no notification row.
7. A malformed cursor returns 400, not 500.
8. A soft-deleted post is absent from the feed and 404s by id.

---

## Deploying

`render.yaml` at the repo root is a Render blueprint: New → Blueprint → pick this repo, and the service is provisioned from that file rather than from a dozen web-form fields.

**Bring your own database.** The blueprint deliberately does not declare one. Render's free Postgres expires after 90 days, which would quietly kill a submitted deliverable mid-review. [Neon](https://neon.tech)'s free tier does not expire.

1. Create a Neon project. From **Connection Details**, copy two strings:
   - **pooled** (has `-pooler` in the host) → `DATABASE_URL`
   - **direct** (untick *Connection pooling*) → `DIRECT_URL`
   Both need `?sslmode=require`.
2. Deploy the blueprint. Render prompts for `DATABASE_URL`, `DIRECT_URL` and `FIREBASE_SERVICE_ACCOUNT_B64`, and mints `JWT_ACCESS_SECRET` itself — that one is never typed by a human or stored in the repo.
3. Seed once, from the Render shell: `npm run seed`.

**Verify:** `curl https://<your-service>.onrender.com/health` → `{"status":"ok","db":"ok"}`.

`--include=dev` in the build command is load-bearing. `NODE_ENV=production` applies to the build as well as the runtime, and npm honours it by skipping devDependencies — which is where `typescript` and every `@types` package live. Drop the flag and the compile fails with a wall of implicit-`any` errors about modules that are installed but have no declarations.

> The free web service sleeps after ~15 minutes idle and takes roughly 50 seconds to wake. The app already handles this: a 20-second client timeout with *"That took too long. The server may be waking up."* rather than a bare failure. Warm it up before a demo.

Why the two URLs: the pooler in front of `DATABASE_URL` is right for an instance that sleeps and wakes, but it cannot run DDL, so Prisma is configured with `directUrl` and migrations use the unpooled endpoint.

---

## Troubleshooting

**`Invalid environment configuration: DATABASE_URL: Required`**
No `.env`. Run `cp .env.example .env` and fill in `JWT_ACCESS_SECRET`.

**`Can't reach database server at localhost:5433`**
The container is not up. `npm run db:up`, then `docker ps` to confirm `minisocial-db` is running. If Docker itself is not running, start Docker Desktop first.

**`EADDRINUSE: address already in use :::4000`**
Something else holds the port. `PORT=4001 npm run dev`, or find it with `npx kill-port 4000`.

**`No Firebase credentials` in the log**
Expected, and harmless. Notifications are recorded and logged rather than delivered. See [Firebase setup](#firebase-setup) when you want real pushes.

**Tests fail with `database "minisocial_test" does not exist`**
The suite creates it on first run and needs the container up. `npm run db:up` first.

**Migrations drifted after editing `schema.prisma`**
`npx prisma migrate dev --name <what-changed>`. To start clean: `npm run db:down && docker volume rm backend_minisocial-data && npm run setup`.
