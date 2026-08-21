# Mini Social Feed — Product Requirements Document

| | |
|---|---|
| **Version** | 1.0 |
| **Status** | Draft for approval |
| **Date** | 2026-08-21 |
| **Owner** | Golam Kibria (golam.kibria@techjays.com) |
| **Delivery window** | 10 working days (see §14) |

---

## 1. Overview

### 1.1 Summary

Mini Social Feed is a lightweight, text-only social application composed of two shipped artifacts: a **Node.js/Express REST API** and a **React Native (Expo) Android app**. A user signs up, publishes short text posts, reads a shared reverse-chronological feed, likes and comments on posts, filters the feed by author, and receives a Firebase Cloud Messaging push notification the moment someone likes or comments on one of their posts.

The product is deliberately narrow. Its value is not feature breadth — it is that the full loop (auth → post → interact → notify) works end to end, is secure, is documented, and feels good on both a phone and a tablet.

### 1.2 Context

This is a build-and-evaluate project. The graded surface is not only the running app but the code, the API contract, the README, and the polish of the mobile experience on two form factors. Every requirement below is written so it can be verified by someone who has the repo and an Android device and nothing else.

### 1.3 Goals

| ID | Goal | Measured by |
|---|---|---|
| G-1 | Working end-to-end interaction loop | A second device receives a push within 5 s of a like or comment |
| G-2 | Secure, consistently designed API | Every endpoint validated, authorised, and documented in the README |
| G-3 | Smooth feed experience | 60 fps scroll on a mid-range Android phone; no visible stall on pagination |
| G-4 | Genuine responsiveness | Purpose-built layout at phone and tablet widths, not a stretched phone UI |
| G-5 | Reviewable codebase | Modular layering, typed, linted, tested; a reviewer can find any behaviour in under a minute |
| G-6 | Zero-friction setup | A reviewer clones, follows the README, and has the API running in under 10 minutes |

### 1.4 Non-goals

Explicitly not built in v1: images, video, link previews, direct messages, follows or a personalised graph feed, post editing, nested comment replies, reactions beyond a single like, full-text search, hashtags and mentions, moderation tooling, admin dashboard, iOS build, web client (see §3.3), analytics, internationalisation.

### 1.5 Assumptions and scope clarifications

- **A-1 — "Frontend: functional and user-friendly web interface" in the evaluation criteria is read as referring to the mobile client.** The stated requirements list only a React Native app; no web deliverable is specified anywhere else in the brief. The mobile app is therefore treated as the graded frontend. §3.3 defines a contingency web client that can be added in roughly 1.5 days if the evaluator confirms a browser UI is genuinely expected. **This is the single most important open question — see §17, OQ-1.**
- **A-2** — Android only. iOS is out of scope; the deliverable is an APK.
- **A-3** — Posts are public. Any authenticated user sees every post. There is no privacy model in v1.
- **A-4** — A single backend instance is sufficient. No horizontal scaling or multi-region requirement.
- **A-5** — Expected load during evaluation: tens of users, thousands of posts. The design must not be hostile to more, but is not optimised for it.

---

## 2. Users

### 2.1 Personas

**Priya — the poster.** Opens the app to say something short and see who responded. Cares that publishing is one tap away and that she is told immediately when someone reacts. Uses a 6.1" Android phone, one-handed, on mobile data.

**Rahul — the reader.** Mostly scrolls. Occasionally likes. Wants the feed to load fast, keep his place, and never lose scroll position on refresh. Uses a 10" tablet in landscape at his desk.

**The evaluator.** Clones the repo, reads the README, runs the API, installs the APK, and tries to break it. Cares about setup friction, validation errors, authorisation holes, and whether the notification actually arrives.

### 2.2 User stories

| ID | Story | Acceptance criteria |
|---|---|---|
| US-1 | As a new user, I can create an account with a username, email, and password | Duplicate username or email returns a field-level error; on success I land in the feed already authenticated |
| US-2 | As a returning user, I can log in and stay logged in across app restarts | Tokens persist in secure storage; an expired access token refreshes silently without bouncing me to login |
| US-3 | As a user, I can publish a text post | Empty or whitespace-only input is blocked on both client and server; the new post appears at the top of the feed immediately |
| US-4 | As a user, I can scroll a feed of everyone's posts, newest first | Infinite scroll loads the next page before I reach the bottom; pull-to-refresh returns to the newest page |
| US-5 | As a user, I can filter the feed to a single author | The filter is applied server-side; clearing it restores the global feed; the active filter is visible at all times |
| US-6 | As a user, I can like and unlike a post | Like state and count update optimistically and reconcile with the server; liking twice never creates two likes |
| US-7 | As a user, I can comment on a post and read its comments | Comments are paginated, oldest-first within a post; my comment appears immediately |
| US-8 | As a post author, I get a push notification when someone likes or comments | Notification arrives on a physical device in foreground, background, and killed states; tapping it deep-links to the post |
| US-9 | As a user, I am never notified about my own actions | Self-like and self-comment produce no push and no notification row |
| US-10 | As a user, I can log out | Tokens are cleared, the FCM token is unregistered server-side, and the feed is unreachable until I log in again |

---

## 3. Scope

### 3.1 In scope

Priority uses MoSCoW: **M** must ship, **S** should ship, **C** ship if time allows.

| ID | Feature | Layer | Priority |
|---|---|---|---|
| FR-1 | Signup with username, email, password | API + App | M |
| FR-2 | Login issuing JWT access + refresh tokens | API + App | M |
| FR-3 | Token refresh with rotation | API + App | M |
| FR-4 | Logout with device-token cleanup | API + App | M |
| FR-5 | Create text-only post | API + App | M |
| FR-6 | Paginated global feed, newest first | API + App | M |
| FR-7 | Feed filter by author username | API + App | M |
| FR-8 | Like / unlike toggle | API + App | M |
| FR-9 | Add comment to a post | API + App | M |
| FR-10 | List comments for a post, paginated | API + App | M |
| FR-11 | FCM device-token registration and deregistration | API + App | M |
| FR-12 | Push notification on like | API + App | M |
| FR-13 | Push notification on comment | API + App | M |
| FR-14 | Deep-link from a notification tap to post detail | App | M |
| FR-15 | Persisted notification history and in-app list | API + App | S |
| FR-16 | Delete own post / own comment | API + App | S |
| FR-17 | User directory endpoint for filter autocomplete | API + App | S |
| FR-18 | Unread notification badge | App | C |
| FR-19 | Health and readiness endpoint | API | S |
| FR-20 | Seed script with demo users and posts | API | S |

### 3.2 Out of scope

Everything listed in §1.4.

### 3.3 Contingency scope — minimal web client

Activated only if OQ-1 resolves to "a web UI is expected". A Vite + React SPA reusing the same API: login, feed with author filter, create post, like, comment. No push notifications — in-app polling instead. Estimated 1.5 days. It is deliberately **not** built speculatively: a half-finished second frontend would cost more marks than an absent one.

---

## 4. Architecture

### 4.1 System diagram

```mermaid
flowchart LR
  subgraph Device["Android device"]
    APP["Expo React Native app<br/>expo-router · TanStack Query"]
  end
  subgraph Server["Node.js API"]
    API["Express<br/>routes → controllers → services"]
    DISP["Notification dispatcher<br/>async, non-blocking"]
  end
  DB[("PostgreSQL<br/>Prisma")]
  FCM["Firebase Cloud Messaging"]

  APP -- "HTTPS + Bearer JWT" --> API
  API --> DB
  API -- "enqueue" --> DISP
  DISP --> DB
  DISP -- "Admin SDK · sendEachForMulticast" --> FCM
  FCM -- "push" --> APP
```

### 4.2 Stack and rationale

| Concern | Choice | Why this, not the alternative |
|---|---|---|
| Runtime | Node.js 20 LTS | Required by the brief; LTS through 2026 |
| Framework | Express 4 | Required by the brief; smallest surface for a reviewer to read |
| Language | TypeScript, strict | Compile-time contract between routes, services, and the client's shared types |
| Database | PostgreSQL 16 | Likes need a real `UNIQUE (post_id, user_id)` constraint and counters need transactional integrity; MongoDB pushes both into application code |
| ORM | Prisma | Typed queries, first-class migrations, and a schema file that doubles as data-model documentation |
| Validation | Zod | One schema per endpoint, used for both runtime validation and inferred types |
| Auth | `jsonwebtoken` + `bcrypt` | Stateless access tokens; hashed, rotating refresh tokens in the database |
| Push | `firebase-admin` (FCM HTTP v1) | Server-authoritative sending; no send credentials on the client |
| Logging | `pino` + `pino-http` | Structured JSON logs carrying a request id on every line |
| Mobile | Expo SDK 54 + expo-router | Required by the brief; file-based routing keeps navigation legible |
| Mobile data layer | TanStack Query v5 | Infinite queries, cache invalidation, and optimistic likes without hand-rolled reducers |
| Mobile push | `@react-native-firebase/messaging` | Native FCM as the brief requires. **Needs an Expo development build — it does not run in Expo Go** (see R-2) |
| Token storage | `expo-secure-store` | Keystore-backed; `AsyncStorage` is plaintext |
| Build | EAS Build, `preview` profile | Produces the installable APK deliverable |

### 4.3 Environments

| Env | API | Database | Firebase project | Purpose |
|---|---|---|---|---|
| Local | `http://localhost:4000` | Docker Postgres | `mini-social-dev` | Development |
| Test | in-process (supertest) | ephemeral Docker Postgres | mocked | CI |
| Demo | Railway or Render free tier | managed Postgres | `mini-social-dev` | The URL compiled into the delivered APK |

The delivered APK must point at a **publicly reachable** demo URL, never `localhost` — an evaluator cannot run the backend on the phone. This is a hard release gate (§16).

### 4.4 Repository structure

```
mini-social-feed/
├── README.md                  # what it is, architecture, links, APK download
├── docs/
│   ├── PRD.md
│   └── screenshots/
├── backend/
│   ├── README.md              # setup + full API reference
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── app.ts             # express app assembly, no listen
│   │   ├── server.ts          # listen + graceful shutdown
│   │   ├── config/            # env parsing (zod), firebase init
│   │   ├── middleware/        # auth, validate, rateLimit, errorHandler, requestId
│   │   ├── modules/
│   │   │   ├── auth/          # routes · controller · service · schema
│   │   │   ├── posts/
│   │   │   ├── comments/
│   │   │   ├── likes/
│   │   │   ├── users/
│   │   │   └── notifications/
│   │   ├── lib/               # prisma client, jwt, password, pagination, ApiError
│   │   └── types/
│   └── tests/
├── mobile/
│   ├── README.md              # setup + build instructions
│   ├── app/                   # expo-router routes
│   ├── src/
│   │   ├── api/               # typed client + query hooks
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── theme/
│   │   └── lib/
│   ├── app.config.ts
│   └── eas.json
└── .github/workflows/ci.yml
```

**Layering rule, enforced in review:** routes declare, controllers translate HTTP, services hold business logic, Prisma is touched only from services. No business logic in a route file; no `req` or `res` in a service.

---

## 5. Data model

### 5.1 Entity relationships

```mermaid
erDiagram
  USER ||--o{ POST : authors
  USER ||--o{ COMMENT : writes
  USER ||--o{ LIKE : gives
  USER ||--o{ DEVICE : registers
  USER ||--o{ NOTIFICATION : receives
  POST ||--o{ COMMENT : has
  POST ||--o{ LIKE : has
  POST ||--o{ NOTIFICATION : about
```

### 5.2 Entities

**`users`**

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `username` | citext | UNIQUE, NOT NULL, 3–20 chars, `^[a-zA-Z0-9_]+$` |
| `email` | citext | UNIQUE, NOT NULL, valid email |
| `password_hash` | text | NOT NULL, bcrypt cost 12 |
| `display_name` | text | NULL, ≤ 50 chars |
| `avatar_color` | text | NOT NULL, derived deterministically from the user id — avatars are initials on a generated colour, no uploads |
| `created_at`, `updated_at` | timestamptz | NOT NULL |

**`posts`**

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `author_id` | uuid | FK → `users.id`, ON DELETE CASCADE |
| `content` | text | NOT NULL, 1–500 chars after trim |
| `like_count` | int | NOT NULL, default 0, check `>= 0` |
| `comment_count` | int | NOT NULL, default 0, check `>= 0` |
| `created_at`, `updated_at` | timestamptz | NOT NULL |
| `deleted_at` | timestamptz | NULL — soft delete |

**`likes`**

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `post_id` | uuid | FK → `posts.id`, ON DELETE CASCADE |
| `user_id` | uuid | FK → `users.id`, ON DELETE CASCADE |
| `created_at` | timestamptz | NOT NULL |
| — | — | **UNIQUE (`post_id`, `user_id`)** — the constraint that makes the toggle idempotent |

**`comments`**

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `post_id` | uuid | FK → `posts.id`, ON DELETE CASCADE |
| `author_id` | uuid | FK → `users.id`, ON DELETE CASCADE |
| `content` | text | NOT NULL, 1–300 chars after trim |
| `created_at` | timestamptz | NOT NULL |
| `deleted_at` | timestamptz | NULL |

**`devices`**

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `users.id`, ON DELETE CASCADE |
| `fcm_token` | text | UNIQUE, NOT NULL — re-registering an existing token reassigns it to the current user |
| `platform` | enum | `ANDROID` / `IOS` |
| `last_seen_at` | timestamptz | NOT NULL, refreshed on every app foreground |

**`notifications`**

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `recipient_id` | uuid | FK → `users.id` |
| `actor_id` | uuid | FK → `users.id` |
| `type` | enum | `LIKE` / `COMMENT` |
| `post_id` | uuid | FK → `posts.id` |
| `comment_id` | uuid | FK → `comments.id`, NULL for likes |
| `read_at` | timestamptz | NULL |
| `created_at` | timestamptz | NOT NULL |

**`refresh_tokens`**

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `users.id`, ON DELETE CASCADE |
| `token_hash` | text | UNIQUE, NOT NULL — SHA-256 of the token; the raw value is never stored |
| `expires_at` | timestamptz | NOT NULL |
| `revoked_at` | timestamptz | NULL |

### 5.3 Indexes

| Index | Purpose |
|---|---|
| `posts (created_at DESC, id DESC) WHERE deleted_at IS NULL` | Global feed keyset scan |
| `posts (author_id, created_at DESC, id DESC)` | Username-filtered feed |
| `comments (post_id, created_at ASC, id ASC)` | Comment pagination within a post |
| `likes (post_id)` | Counter reconciliation |
| `likes (user_id, post_id)` | "Did I like this?" hydration for a whole page of posts |
| `devices (user_id)` | Fan-out on notification send |
| `notifications (recipient_id, created_at DESC)` | Notification list |

### 5.4 Counter integrity

`like_count` and `comment_count` are denormalised so the feed never runs a correlated subquery per row. Every mutation updates the source row and its counter **inside one Prisma transaction**; a failure rolls back both. A `npm run reconcile:counters` maintenance command recomputes counters from source rows, and the same recomputation is the assertion used in the integration test for FR-8.

---

## 6. API specification

### 6.1 Conventions

- **Base URL** `{HOST}/api/v1`. The version sits in the path so a breaking change can never silently reach an already-installed APK.
- **Content type** `application/json; charset=utf-8` on request and response.
- **Auth** `Authorization: Bearer <accessToken>` on every endpoint except signup, login, refresh, and health.
- **Timestamps** ISO 8601 UTC, e.g. `2026-08-21T14:03:11.482Z`.
- **Identifiers** UUID v4 strings.
- **Correlation** every response carries `X-Request-Id`; the same id appears on the server log line and in error bodies.

**Success envelope**

```json
{
  "success": true,
  "data": {},
  "meta": { "nextCursor": "...", "hasMore": true }
}
```

`meta` appears only on paginated responses.

**Error envelope**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Posts are limited to 500 characters.",
    "details": [{ "field": "content", "issue": "too_long" }],
    "requestId": "01J9X2K7B4"
  }
}
```

One shape for every failure, including unhandled ones. The app renders `error.message` directly, so every message is written for a person, not for a log.

### 6.2 Error catalogue

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body, query, or param failed its Zod schema |
| 401 | `UNAUTHENTICATED` | Missing, malformed, or expired access token |
| 401 | `INVALID_CREDENTIALS` | Wrong identifier or password — deliberately identical for both, to prevent account enumeration |
| 401 | `REFRESH_TOKEN_INVALID` | Refresh token unknown, expired, or already rotated |
| 403 | `FORBIDDEN` | Authenticated but not the owner of the resource |
| 404 | `NOT_FOUND` | Resource missing or soft-deleted |
| 409 | `USERNAME_TAKEN` / `EMAIL_TAKEN` | Signup conflict |
| 422 | `UNPROCESSABLE` | Well-formed but semantically invalid, e.g. commenting on a deleted post |
| 429 | `RATE_LIMITED` | Bucket exhausted; response carries `Retry-After` |
| 500 | `INTERNAL_ERROR` | Anything unhandled. Never leaks a stack trace or driver message in production |

### 6.3 Pagination

**Cursor-based (keyset), not offset.** The feed is a live, insert-heavy list; with `OFFSET`, a post published while the user reads shifts every later page and duplicates rows across page boundaries. The cursor is a base64 encoding of `{createdAt, id}`, and the query is:

```sql
WHERE (created_at, id) < (:cursorCreatedAt, :cursorId)
ORDER BY created_at DESC, id DESC
LIMIT :limit + 1
```

The extra row is discarded and only sets `hasMore`.

| Query param | Type | Default | Bounds |
|---|---|---|---|
| `limit` | int | 20 | 1–50 |
| `cursor` | string | — | Opaque; a malformed cursor is a `VALIDATION_ERROR`, never a silent reset to page one |

### 6.4 Endpoints

#### Authentication

**`POST /api/v1/auth/signup`** — public

```json
{ "username": "priya", "email": "priya@example.com", "password": "correct-horse-9", "displayName": "Priya S." }
```

```json
{ "success": true, "data": {
  "user": { "id": "…", "username": "priya", "displayName": "Priya S.", "avatarColor": "#0B6E68", "createdAt": "…" },
  "accessToken": "eyJ…",
  "refreshToken": "eyJ…"
}}
```

`201`. Errors: 400 `VALIDATION_ERROR`, 409 `USERNAME_TAKEN`, 409 `EMAIL_TAKEN`, 429.

**`POST /api/v1/auth/login`** — public. Body `{ "identifier": "priya | priya@example.com", "password": "…" }`. Same response shape as signup. Errors: 400, 401 `INVALID_CREDENTIALS`, 429.

**`POST /api/v1/auth/refresh`** — public. Body `{ "refreshToken": "…" }`. Returns a new access **and** refresh token; the presented refresh token is revoked in the same transaction (rotation). Reuse of an already-rotated token revokes the entire token family and returns 401 `REFRESH_TOKEN_INVALID`.

**`POST /api/v1/auth/logout`** — authenticated. Body `{ "refreshToken": "…", "fcmToken": "…" }`. Revokes the refresh token and deletes the device row. Always `204`, even when the tokens were already gone — logout must never fail.

**`GET /api/v1/auth/me`** — authenticated. Returns the current user.

#### Devices

**`POST /api/v1/devices`** — authenticated. Body `{ "fcmToken": "…", "platform": "ANDROID" }`. Upsert keyed on `fcm_token`, reassigning ownership when the token previously belonged to another user on the same handset. `200` with `{ "registered": true }`.

**`DELETE /api/v1/devices/:fcmToken`** — authenticated. `204`.

#### Posts

**`POST /api/v1/posts`** — authenticated. Body `{ "content": "…" }`, 1–500 chars after trim.

```json
{ "success": true, "data": {
  "id": "…",
  "content": "Shipping the feed today.",
  "author": { "id": "…", "username": "priya", "displayName": "Priya S.", "avatarColor": "#0B6E68" },
  "likeCount": 0,
  "commentCount": 0,
  "likedByMe": false,
  "createdAt": "2026-08-21T14:03:11.482Z"
}}
```

**`GET /api/v1/posts`** — authenticated. Query: `limit`, `cursor`, `username` (optional, exact match, case-insensitive).

```json
{ "success": true,
  "data": [ /* post objects, newest first */ ],
  "meta": { "nextCursor": "eyJjcmVh…", "hasMore": true } }
```

`likedByMe` is hydrated for the whole page in a single `likes WHERE user_id = ? AND post_id IN (…)` query — never N+1. An unknown `username` returns `200` with an empty array, not `404`: an empty filter result is a valid state, not an error.

**`GET /api/v1/posts/:id`** — authenticated. Single post; `404` if missing or soft-deleted.

**`DELETE /api/v1/posts/:id`** — authenticated, author only. Soft delete. `403 FORBIDDEN` for non-authors. *(FR-16)*

#### Interactions

**`POST /api/v1/posts/:id/like`** — authenticated. **Toggle**, no body.

```json
{ "success": true, "data": { "postId": "…", "liked": true, "likeCount": 12 } }
```

Idempotent by construction: the handler attempts an insert guarded by the unique constraint and deletes on conflict, inside a transaction that also adjusts `like_count`. A double-tap produces one like — not two rows, and not a 500. A notification fires only on the `liked: true` transition, and only when actor ≠ author.

**`POST /api/v1/posts/:id/comment`** — authenticated. Body `{ "content": "…" }`, 1–300 chars.

```json
{ "success": true, "data": {
  "id": "…",
  "postId": "…",
  "content": "Congrats!",
  "author": { "id": "…", "username": "rahul", "displayName": "Rahul", "avatarColor": "#1F5FA8" },
  "createdAt": "…",
  "postCommentCount": 5
}}
```

**`GET /api/v1/posts/:id/comments`** — authenticated. Query `limit`, `cursor`. Oldest-first within a post so a conversation reads top to bottom; the cursor comparison direction inverts accordingly.

**`DELETE /api/v1/comments/:id`** — authenticated; the comment author **or** the post author. *(FR-16)*

#### Users and notifications

**`GET /api/v1/users?search=pri&limit=10`** — authenticated. Prefix match on username, powering the feed filter's autocomplete. *(FR-17)*

**`GET /api/v1/notifications`** — authenticated, paginated, newest first, each row carrying `actor`, `type`, and a post preview. *(FR-15)*

**`POST /api/v1/notifications/read`** — authenticated. Body `{ "ids": ["…"] }` or `{ "all": true }`. *(FR-15)*

**`GET /health`** — public, unversioned. `{ "status": "ok", "db": "ok", "uptime": 1284 }`. *(FR-19)*

### 6.5 Validation rules

Every rule is enforced server-side by Zod **and** mirrored in the client form, so the user sees the problem before the round trip. The server is the authority; the client is a courtesy.

| Field | Rule | Message shown to the user |
|---|---|---|
| `username` | 3–20 chars, `[a-zA-Z0-9_]`, unique | "Usernames use letters, numbers, and underscores, 3–20 characters." |
| `email` | RFC-valid, unique, lowercased on write | "That doesn't look like an email address." |
| `password` | 8–72 chars (72 is bcrypt's byte ceiling), at least one letter and one digit | "Use at least 8 characters with a letter and a number." |
| `displayName` | optional, ≤ 50 chars | "Display name is too long." |
| post `content` | trimmed, 1–500 chars, control characters stripped | "Say something first." / "Posts are limited to 500 characters." |
| comment `content` | trimmed, 1–300 chars, control characters stripped | "Comments are limited to 300 characters." |
| any `:id` | UUID v4 | 400, not a 500 from the database driver |
| `limit` | int 1–50 | Out-of-range values are rejected, not silently clamped |

Post and comment bodies are stored as **plain text and never rendered as markup**. React Native does not interpret HTML, so stored values are safe by default; the escaping obligation moves to any future web client, and is recorded here so it is not forgotten.

### 6.6 Rate limits

| Bucket | Limit | Key | Rationale |
|---|---|---|---|
| Signup | 5 / hour | IP | Blocks bulk account creation |
| Login and refresh | 10 / 15 min | IP + identifier | Slows credential stuffing without locking out a fat-fingered real user |
| Create post | 10 / min | user id | Spam ceiling |
| Create comment | 30 / min | user id | Spam ceiling |
| Like toggle | 60 / min | user id | Absorbs enthusiastic tapping, stops scripted fan-out |
| Global | 300 / min | IP | Backstop |

429 responses carry `Retry-After`; the app surfaces "You're going a bit fast — try again in a moment." rather than a raw error.

---

## 7. Authentication and security

| ID | Requirement |
|---|---|
| SEC-1 | Passwords hashed with bcrypt, cost factor 12. Plaintext passwords never logged, never returned, never stored |
| SEC-2 | Access token: JWT HS256, 15-minute TTL, payload `{ sub, username, iat, exp }`. No sensitive claims |
| SEC-3 | Refresh token: opaque random 256-bit value, 7-day TTL, stored as a SHA-256 hash, single-use with rotation. Detected reuse revokes the whole family |
| SEC-4 | Tokens stored on device in `expo-secure-store` (Android Keystore), never `AsyncStorage` |
| SEC-5 | Every mutating endpoint re-checks ownership server-side. The client never sends "I am the author" — the server derives it from the token |
| SEC-6 | `helmet` for security headers; CORS restricted to an explicit origin allowlist |
| SEC-7 | JSON body limit 16 KB. Oversized bodies are rejected before parsing |
| SEC-8 | Rate limits per §6.6 |
| SEC-9 | All secrets from environment variables, validated at boot by a Zod schema; the process refuses to start on a missing or malformed secret rather than failing at first use |
| SEC-10 | The Firebase service-account JSON is **never** committed. It is supplied as a base64 environment variable, and `.gitignore` plus a pre-commit secret scan enforce it |
| SEC-11 | Prisma parameterises every query; no string-concatenated SQL anywhere |
| SEC-12 | HTTPS enforced in the demo environment; the app refuses plain-HTTP base URLs outside development |
| SEC-13 | Error responses in production expose `code` and `message` only. Stack traces go to logs, never to the client |
| SEC-14 | Structured logs redact `password`, `accessToken`, `refreshToken`, `fcmToken`, and `authorization` |

---

## 8. Notifications

### 8.1 Flow

```mermaid
sequenceDiagram
  participant R as Rahul (actor)
  participant API as Express API
  participant DB as PostgreSQL
  participant D as Dispatcher
  participant F as FCM
  participant P as Priya (author)

  R->>API: POST /posts/:id/like
  API->>DB: tx — insert like, bump like_count
  API-->>R: 200 { liked: true, likeCount: 12 }
  Note over API,D: response is already sent — push never blocks the request
  API->>D: enqueue(LIKE, postId, actorId)
  D->>DB: skip if actor == author; else insert notification
  D->>DB: select fcm_token from devices where user_id = author
  D->>F: sendEachForMulticast(tokens, payload)
  F-->>P: push
  D->>DB: delete tokens rejected as unregistered
```

### 8.2 Payload contract

```json
{
  "notification": {
    "title": "rahul liked your post",
    "body": "Shipping the feed today."
  },
  "data": {
    "type": "LIKE",
    "postId": "…",
    "commentId": "",
    "actorUsername": "rahul",
    "notificationId": "…"
  },
  "android": {
    "priority": "high",
    "collapseKey": "post_<postId>",
    "notification": {
      "channelId": "social-interactions",
      "tag": "post_<postId>"
    }
  }
}
```

| Rule | Detail |
|---|---|
| Title | `"{actorUsername} liked your post"` / `"{actorUsername} commented on your post"` |
| Body | Like → first 80 chars of the post. Comment → first 80 chars of the comment. Truncation adds an ellipsis on a word boundary |
| `data` values | All strings — FCM rejects non-string data values |
| `collapseKey` | Per post, so ten likes on one post while the phone is offline deliver as one notification, not ten |
| Channel | `social-interactions`, created at app start with importance HIGH; required on Android 8+ |

### 8.3 Token lifecycle

| Event | Action |
|---|---|
| First launch after login | Request `POST_NOTIFICATIONS` (Android 13+), fetch the FCM token, `POST /devices` |
| `onTokenRefresh` | Re-register the new token immediately |
| App foreground | Touch `last_seen_at` via re-registration, at most once per hour |
| Logout | `DELETE /devices/:token` **before** clearing local tokens, then delete the FCM instance id |
| Send rejected with `messaging/registration-token-not-registered` | Delete the device row; a stale token is never retried |
| User declines permission | The app works fully; a dismissible banner in Settings explains what they will miss and offers a jump to system settings |

### 8.4 Rules and edge cases

| ID | Rule |
|---|---|
| N-1 | No notification when the actor is the post author (US-9) |
| N-2 | Unliking never notifies, and never deletes the original notification row |
| N-3 | Re-liking after an unlike within 60 seconds does not re-notify — the dispatcher suppresses a duplicate `(recipient, actor, type, post)` inside a 60-second window |
| N-4 | Sending is fire-and-forget relative to the HTTP response. An FCM outage degrades notifications, never the API |
| N-5 | Delivery to multiple devices per user via `sendEachForMulticast`; partial failure is per-token, and a failed token never fails the batch |
| N-6 | Every send attempt is logged with `{ notificationId, recipientId, tokenCount, successCount, failureCount }` |
| N-7 | Foreground pushes do not raise a system tray notification. The app shows an in-app banner instead, because a tray notification for the screen you are looking at is noise |
| N-8 | Tapping a notification from background or killed state opens `/post/{postId}` directly, not the feed. Cold-start deep links are resolved after auth restore, so an expired session lands on login and then continues to the post |

---

## 9. Mobile application

### 9.1 Navigation map

```
app/
├── _layout.tsx              # providers: QueryClient, Auth, Theme, notification handlers
├── (auth)/
│   ├── login.tsx
│   └── signup.tsx
└── (app)/
    ├── _layout.tsx          # tabs: Feed · Notifications · Profile
    ├── index.tsx            # Feed
    ├── compose.tsx          # Create post (modal presentation)
    ├── post/[id].tsx        # Post detail + comments
    ├── notifications.tsx
    └── profile.tsx
```

An auth gate in the root layout redirects to `(auth)/login` when no valid session exists, and holds a pending deep link until the session resolves.

### 9.2 Screens

| Screen | Contents | Key behaviours |
|---|---|---|
| **Splash / auth restore** | Logo, spinner | Reads secure store, validates the token via `GET /auth/me`, refreshes once on 401 before giving up. Never flashes the login screen for an already-authenticated user |
| **Login** | Identifier, password, submit, link to signup | Inline field errors, one submit at a time, password visibility toggle, keyboard-aware scroll, submit on keyboard "go" |
| **Signup** | Username, email, password, optional display name | Live username availability hint (debounced 400 ms), password rules shown before submission rather than after failure |
| **Feed** | Post list, author filter, floating compose button, pull-to-refresh | Infinite scroll with a 2-screen prefetch threshold. Optimistic like. Filter chip pinned under the header while active. Empty, error, and offline states are designed, not default |
| **Compose** | Multiline input, live character counter, Post button | Counter turns amber at 450 and red at 500. Post disabled while empty or submitting. On success the modal closes and the new post is prepended to the cached feed without a refetch |
| **Post detail** | Full post, like/comment counts, comment list, sticky composer | Comments paginate on scroll. The composer stays above the keyboard. Deep-link target from a notification |
| **Notifications** *(FR-15)* | Grouped list of likes and comments, unread state | Tapping opens the related post and marks the row read |
| **Profile** | Avatar, username, post count, notification permission state, logout | Logout confirms first, then deregisters the device token before clearing state |

### 9.3 State and data

| Concern | Approach |
|---|---|
| Server state | TanStack Query. `['posts', {username}]` infinite query; `['post', id]`; `['comments', postId]` infinite query; `['notifications']` |
| Auth state | React context over `expo-secure-store`, exposing `user`, `signIn`, `signOut`, `status` |
| Token refresh | A single Axios response interceptor. Concurrent 401s share one in-flight refresh promise and replay after it resolves — never N parallel refreshes |
| Optimistic like | `onMutate` flips `likedByMe` and adjusts `likeCount` across every cached page holding that post; `onError` rolls back to the snapshot; `onSettled` reconciles from the server value |
| Feed after compose | The created post is written into the first page of the cache directly. No refetch, no scroll jump |
| Cache lifetime | `staleTime` 30 s for the feed, 0 for a post detail opened from a notification (that user is arriving to see something new) |
| Push arriving in-app | Invalidates the affected post and the notifications list so counts stay truthful |

### 9.4 Responsive behaviour

Breakpoints come from `useWindowDimensions`, so rotation is handled without remount.

| Width | Layout |
|---|---|
| `< 600 dp` (phone) | Single column, full-bleed cards, bottom tab bar, compose as a floating action button |
| `600–899 dp` (small tablet / phone landscape) | Single column capped at 600 dp and centred; larger touch targets retained |
| `≥ 900 dp` (tablet landscape) | Two-pane: feed list on the left (max 420 dp), selected post detail on the right. Tapping a post fills the right pane instead of pushing a new screen. Navigation moves to a left rail |

| Rule | Detail |
|---|---|
| RES-1 | Every interactive target ≥ 44 dp |
| RES-2 | `SafeAreaView` insets respected on all four edges, including gesture-navigation bars |
| RES-3 | Typography scales with the OS font-size setting up to 1.3×, with layouts verified at that scale |
| RES-4 | Rotation preserves scroll position and any in-progress composer text |
| RES-5 | Verified on a 411×891 dp phone and an 800×1280 dp tablet, portrait and landscape — the four configurations named in the evaluation criteria |

### 9.5 State coverage

Every data-bearing surface defines four states, and each is built:

| State | Treatment |
|---|---|
| Loading | Skeleton rows matched to the real card geometry, so nothing shifts on arrival. No full-screen spinners after first paint |
| Empty | An illustration-free, sentence-plus-action block: "No posts yet — be the first." with a compose button. The filtered feed reads "No posts from @priya yet." with a clear-filter action |
| Error | Plain-language cause plus a Retry button. Network failure and server failure read differently, because the user's next move differs |
| Offline | A persistent top banner. Cached feed content remains readable; write actions are disabled with an explanatory tooltip rather than failing on tap |

### 9.6 Visual system

A compact token set defined once in `src/theme` and used everywhere: an 8-point spacing scale, a five-step type scale, two font weights, a 12 dp corner radius, and one elevation level. Colour follows the system light/dark setting. Avatars are the user's initials on a colour derived from their id — deterministic, zero-network, and enough visual variety to make the feed scannable.

---

## 10. Non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-1 | Feed page (20 posts) responds in < 300 ms p95 on the demo tier | `autocannon` run recorded in the README |
| NFR-2 | Like toggle responds in < 150 ms p95 | Same |
| NFR-3 | Push arrives within 5 s of the triggering action p95 | Two-device manual test, recorded on video |
| NFR-4 | Feed scrolls at 60 fps with 200 posts loaded | Expo performance monitor |
| NFR-5 | Cold start to feed content < 3 s on a mid-range device | Stopwatch, three runs |
| NFR-6 | No unhandled promise rejection crashes the process; a global handler logs and continues | Chaos test in CI |
| NFR-7 | Graceful shutdown drains in-flight requests on SIGTERM | Manual |
| NFR-8 | APK ≤ 60 MB | Build output |
| NFR-9 | Zero ESLint errors, zero TypeScript errors on both packages | CI gate |
| NFR-10 | Backend service-layer test coverage ≥ 70 % | `nyc`/`vitest` report in CI |
| NFR-11 | No secret, key, or service-account file present in git history | `gitleaks` in CI |

---

## 11. Testing and QA

### 11.1 Backend

| Level | Tool | Coverage |
|---|---|---|
| Unit | Vitest | Password hashing, JWT sign/verify, cursor encode/decode, notification-suppression window |
| Integration | Vitest + supertest against an ephemeral Postgres | Every endpoint: happy path, validation failure, auth failure, authorisation failure |
| Contract regressions | supertest snapshots | Response envelope shape for each endpoint |

Named cases that must exist, because each maps to a bug this design specifically prevents:

1. Double `POST /posts/:id/like` yields one like row and `likeCount` back to its original value after the second call.
2. Concurrent likes from two users on the same post leave `like_count` exactly 2.
3. Pagination across a page boundary returns no duplicate and no skipped post while a new post is inserted mid-scroll.
4. A reused refresh token returns 401 and revokes the family.
5. User A cannot delete user B's post (403, and the row survives).
6. Self-like creates no notification row.
7. A malformed cursor returns 400, not a 500.
8. A soft-deleted post is absent from the feed and returns 404 by id.

### 11.2 Mobile

| Level | Tool | Coverage |
|---|---|---|
| Component | Jest + React Native Testing Library | Post card render, like toggle optimistic path and rollback, character counter thresholds, form validation |
| Hook | RNTL `renderHook` | Auth context transitions, refresh-interceptor single-flight behaviour |
| Manual matrix | Physical devices | The four screen configurations in RES-5 × the three notification states (foreground, background, killed) |

### 11.3 Release QA checklist

Fresh install → signup → post → second device likes → push received → tap deep-links to the post → comment → first device receives push → filter feed by username → clear filter → kill app → reopen (still authenticated) → logout → confirm push no longer arrives.

---

## 12. CI/CD and release

| Stage | Trigger | Steps |
|---|---|---|
| CI | Every push and PR | Install → typecheck → lint → backend tests against a Postgres service container → mobile tests → `gitleaks` |
| Deploy | Merge to `main` | Railway/Render auto-deploy; `prisma migrate deploy` runs before the new process accepts traffic |
| APK | Manual tag `v*` | `eas build -p android --profile preview` → download → upload to Google Drive → link in the root README |

`eas.json` `preview` profile builds an APK (`buildType: "apk"`), not an AAB — the deliverable must be sideloadable. `google-services.json` is supplied to EAS as a file secret, never committed.

---

## 13. Documentation deliverables

**Root `README.md`** — what the project is (2–3 sentences), a screenshot strip of the app, the architecture diagram, the tech stack, links to the two package READMEs, the live API base URL, the Google Drive APK link with its SHA-256 checksum, demo credentials for two seeded accounts, and a 60-second "try it" path.

**`backend/README.md`** — prerequisites; `.env` table (every variable, purpose, example, required/optional); Docker Postgres one-liner; migrate and seed commands; run and test commands; **the full API reference** with a section per endpoint carrying method, path, auth requirement, request schema, response example, and error list; a copy-pasteable cURL block per endpoint; the Firebase setup walkthrough (create project → generate service account → base64 encode → set env var); and a troubleshooting section for the three failures a reviewer will actually hit — Postgres not running, missing Firebase credentials, port already bound.

**`mobile/README.md`** — prerequisites; env config and how to point the app at a different API; why a development build is required rather than Expo Go; `google-services.json` placement; run on a device; build the APK; and how to test notifications with two accounts on one machine.

Documentation is a graded deliverable, not an afterthought: a reviewer who cannot run the project in ten minutes scores the code they never ran.

---

## 14. Milestones

Estimates assume one developer at a full working day.

| Phase | Days | Output | Exit criterion |
|---|---|---|---|
| P0 — Foundations | 1.0 | Repo, both packages scaffolded, TypeScript, ESLint, Prettier, CI skeleton, Docker Postgres, Prisma schema, first migration | `npm test` and CI both green on an empty suite |
| P1 — Auth API | 1.5 | FR-1 to FR-4, middleware stack, error handler, rate limiting, auth tests | Signup → login → refresh → logout passes end to end via cURL |
| P2 — Content API | 1.5 | FR-5 to FR-10, FR-17, FR-19, FR-20, pagination, counters, tests | All eight named cases in §11.1 pass |
| P3 — Notifications | 1.5 | FR-11 to FR-13, FR-15, dispatcher, token lifecycle, Firebase wiring | Two real devices exchange a push in under 5 s |
| P4 — Mobile core | 2.0 | Auth screens, feed, compose, post detail, filter, optimistic like, all four states per surface | Full loop usable on a physical phone |
| P5 — Mobile push + polish | 1.5 | FR-14, FR-18, deep links, tablet layout, responsive pass, empty/error/offline states, accessibility | RES-5 matrix verified across all four configurations |
| P6 — Harden and ship | 1.0 | READMEs, seed data, deploy, EAS APK build, Drive upload, release QA checklist | A reviewer installs the APK and completes §11.3 without assistance |
| **Total** | **10.0** | | |

Risk buffer: P4 and P5 are the likeliest to overrun. FR-18 and the two-pane tablet layout are the designated cut lines if the schedule slips — they are dropped before quality on FR-1 to FR-14 is compromised.

---

## 15. Risks

| ID | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R-1 | Push notifications do not arrive on a physical device — the classic FCM setup wall (wrong `google-services.json`, missing SHA-1, unmatched package name) | High | Medium | Land P3 before any UI polish. Verify with a raw `curl` to FCM before wiring the app. Keep a working reference device |
| R-2 | `@react-native-firebase/messaging` cannot run in Expo Go, discovered late | High | Medium | Committed on day 1: development builds via EAS from P0. The README states this prominently so no reviewer tries Expo Go |
| R-3 | Free-tier demo backend cold-starts, so the reviewer's first request times out | Medium | High | A keep-alive ping every 10 minutes, a generous client timeout with a "waking up the server" message, and a note in the README |
| R-4 | Android 13+ notification permission denied, making notifications look broken | Medium | Medium | Request the permission in context with a clear rationale; show the permission state in Profile with a path to system settings |
| R-5 | Feed pagination duplicates or skips posts under concurrent writes | Medium | Medium | Keyset pagination (§6.3) plus the explicit test case in §11.1 |
| R-6 | Denormalised counters drift from reality | Low | Medium | Single-transaction updates plus the `reconcile:counters` command and its test |
| R-7 | Scope creep from the ambiguous web-interface criterion | Medium | Medium | OQ-1 resolved before P4 starts; contingency scoped and time-boxed at §3.3 |
| R-8 | APK exceeds the size budget or fails to install on the tablet | Low | Low | Build the APK at the end of P3, not P6 — the first build is the one that fails, so it happens early |

---

## 16. Definition of done

Mapped to the stated evaluation criteria. Every line is binary and independently checkable.

**Code quality**
- [ ] Both packages TypeScript strict, zero `any` outside declared third-party shims
- [ ] Layering rule (§4.4) holds — no Prisma call outside a service, no `req`/`res` inside one
- [ ] Zero lint errors; CI green on `main`
- [ ] Every module has a one-paragraph header comment stating what it owns

**API design**
- [ ] Every endpoint in §6.4 implemented with the documented shape
- [ ] Every endpoint validated by a Zod schema
- [ ] One error envelope, one error catalogue, no exceptions
- [ ] Auth and ownership enforced server-side on every mutation
- [ ] Rate limits active and documented

**Frontend / mobile**
- [ ] All screens in §9.2 built, with all four states from §9.5 on every data surface
- [ ] Optimistic like with rollback
- [ ] Feed filter by username, applied server-side
- [ ] Infinite scroll with no duplicate or skipped posts
- [ ] RES-5 matrix verified across all four device configurations

**Notifications**
- [ ] Push on like and on comment, verified on two physical devices
- [ ] Foreground, background, and killed states all handled
- [ ] Deep link to post detail from a notification tap
- [ ] No self-notification
- [ ] Stale token pruning proven by log evidence

**Deliverables**
- [ ] Public GitHub repo containing `backend/` and `mobile/`
- [ ] Root README plus both package READMEs per §13
- [ ] APK on Google Drive, link and checksum in the README, installs cleanly on a phone and a tablet
- [ ] APK points at the public demo API, not `localhost`
- [ ] Seeded demo accounts documented so a reviewer can see a populated feed on first launch

---

## 17. Open questions

| ID | Question | Owner | Needed by | Default if unanswered |
|---|---|---|---|---|
| OQ-1 | The evaluation criteria mention a "web interface" while the requirements specify only a React Native app. Is a browser client expected? | Evaluator | Before P4 | Proceed mobile-only per A-1; §3.3 stays unbuilt |
| OQ-2 | Should the feed be global for everyone, or scoped to a follow graph? | Evaluator | Before P2 | Global, per A-3 |
| OQ-3 | Is a post character limit prescribed? | Evaluator | Before P2 | 500 characters |
| OQ-4 | Should notifications be readable in-app, or is push-only sufficient? | Evaluator | Before P3 | Build FR-15 — it makes the feature demonstrable without two devices |
| OQ-5 | Is a specific database mandated? | Evaluator | Before P0 | PostgreSQL, per §4.2 |
| OQ-6 | Should the demo backend stay live after submission, and for how long? | Evaluator | Before P6 | Keep it up for 30 days after submission |

---

## 18. After v1

Ordered by value per unit of effort, should the project continue: image posts via signed direct-to-storage uploads; a follow graph with a "Following" feed tab; notification grouping ("rahul and 4 others liked your post"); read receipts and an unread count synced across devices; full-text search over posts; post editing with an edit history; WebSocket live-updating feed; an iOS build; moderation and reporting.

---

## Appendix A — Environment variables

**`backend/.env`**

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | Controls error verbosity and logging format |
| `PORT` | no | `4000` | HTTP port, default 4000 |
| `DATABASE_URL` | yes | `postgresql://user:pass@localhost:5432/minisocial` | Prisma connection string |
| `JWT_ACCESS_SECRET` | yes | 32+ random bytes | Access-token signing key |
| `JWT_ACCESS_TTL` | no | `15m` | Access-token lifetime |
| `REFRESH_TTL_DAYS` | no | `7` | Refresh-token lifetime |
| `FIREBASE_SERVICE_ACCOUNT_B64` | yes | base64 of the service-account JSON | Firebase Admin credentials — never a committed file |
| `CORS_ORIGINS` | no | `http://localhost:8081` | Comma-separated allowlist |
| `LOG_LEVEL` | no | `info` | pino level |

**`mobile/.env`**

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | yes | `https://mini-social-api.up.railway.app/api/v1` | API base URL compiled into the build |

Boot validation rejects a missing or malformed value and prints the offending variable name, so a misconfigured environment fails in the first second rather than on the first request.

## Appendix B — cURL walkthrough

```bash
API=http://localhost:4000/api/v1

# 1. Sign up and capture the token
TOKEN=$(curl -s -X POST $API/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"username":"priya","email":"priya@example.com","password":"correct-horse-9"}' \
  | jq -r '.data.accessToken')

# 2. Publish a post and capture its id
POST_ID=$(curl -s -X POST $API/posts \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"content":"Shipping the feed today."}' | jq -r '.data.id')

# 3. Read the feed
curl -s "$API/posts?limit=20" -H "Authorization: Bearer $TOKEN" | jq

# 4. Filter the feed by author
curl -s "$API/posts?username=priya" -H "Authorization: Bearer $TOKEN" | jq

# 5. Like it (run twice — the count returns to where it started)
curl -s -X POST $API/posts/$POST_ID/like -H "Authorization: Bearer $TOKEN" | jq

# 6. Comment on it
curl -s -X POST $API/posts/$POST_ID/comment \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"content":"Congrats!"}' | jq

# 7. Read the comments
curl -s "$API/posts/$POST_ID/comments" -H "Authorization: Bearer $TOKEN" | jq
```
