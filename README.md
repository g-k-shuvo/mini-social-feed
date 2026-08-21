# Mini Social Feed

A text-only social app in two parts: a **Node.js + Express + PostgreSQL** API and a **React Native (Expo)** Android client. Sign up, post, read one shared feed, like and reply, filter by author, and get a Firebase push the moment someone reacts to something you wrote.

Nothing here carries an image. That is the point — the constraint is what makes the feed fast, the layout honest, and the writing carry itself.

```
mini-social-feed/
├── backend/      Express API · Prisma · PostgreSQL · FCM        → backend/README.md
├── mobile/       Expo app · phone + tablet                      → mobile/README.md
├── prototype/    the interactive UI prototype the app was built from
└── docs/PRD.md   the full product requirements document
```

---

## Try it in sixty seconds

```bash
git clone <this repo> && cd mini-social-feed

# API — needs Node 20+ and Docker, nothing else
cd backend
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   # paste into JWT_ACCESS_SECRET
npm install && npm run setup && npm run dev
```

`http://localhost:4000/health` → `{"status":"ok","db":"ok"}`, with six seeded accounts and a populated feed.

Sign in as **`priya` / `demo1234`** (also `rahul`, `nadia`, `tomas`, `ify`, `kenji`).

Then the app — see [mobile/README.md](mobile/README.md), and note it needs a **development build**, not Expo Go, because it uses real FCM.

---

## What it does

| | |
|---|---|
| **Auth** | Signup and login with JWT access tokens plus rotating, hashed refresh tokens |
| **Feed** | One shared feed, newest first, cursor-paginated, filterable by author |
| **Posts** | Text only, 1–500 characters |
| **Interactions** | A like that toggles, and comments 1–300 characters |
| **Notifications** | FCM push on like and comment, deep-linking to the post; plus an in-app history |
| **Two form factors** | Navigation bar and single column on a phone; navigation rail and two panes on a tablet |

---

## Architecture

```
┌─────────────────────┐        HTTPS + Bearer JWT        ┌──────────────────────┐
│  Expo React Native  │ ───────────────────────────────► │  Express API         │
│  expo-router        │ ◄─────────────────────────────── │  routes → services   │
│  TanStack Query     │                                  └──────────┬───────────┘
└──────────▲──────────┘                                             │
           │                                              ┌─────────▼──────────┐
           │                                              │  PostgreSQL        │
           │                                              │  Prisma            │
           │                                              └─────────┬──────────┘
           │                                                        │ enqueue
           │                                              ┌─────────▼──────────┐
           │                push                          │  Dispatcher        │
           └────────────  Firebase Cloud  ◄───────────────│  async, after the  │
                            Messaging                     │  response is sent  │
                                                          └────────────────────┘
```

**Stack:** Node 20 · Express 4 · TypeScript (strict) · PostgreSQL 16 · Prisma · Zod · Firebase Admin · Expo SDK 51 · expo-router · TanStack Query.

### Five decisions that shaped the rest

**Keyset pagination, not offset.** The feed is a live, insert-heavy list. With `OFFSET`, a post published while someone is reading shifts every later page by one — duplicating rows across page boundaries and skipping others. The cursor encodes the last row's sort key, so a boundary means the same thing however much was written since. There is a test for exactly this.

**The like toggle is idempotent in the database, not in application code.** `UNIQUE (post_id, user_id)` is the whole story. "Check, then insert" loses under concurrency; a constraint does not. Two users liking the same post at once land on exactly 2, and a double tap produces one like rather than a 500.

**Counters are denormalised and transactional.** `likeCount` and `commentCount` live on the post, so the feed never runs a correlated subquery per row. Every change shares a transaction with the row it counts, and `npm run reconcile:counters` can prove it.

**Push never blocks a response.** The dispatcher runs after the HTTP response is already sent. A Firebase outage degrades notifications and never the API.

**PostgreSQL over MongoDB.** Both of the first two decisions are database constraints doing work that application code would otherwise have to do badly.

---

## Design

The app is not a generic feed with a colour swapped. It is built on a committed visual world — **Star Atlas** — where a post is a charted object rather than a card:

- **A post's like count *is* the diameter of its mark**, on a fixed five-step magnitude ramp. Hierarchy lives in the marks, so the feed needs no cards, no avatar discs, and no row of ghost icons.
- **One unbroken filing axis** runs down the left of the whole feed, joining every mark, so scroll position reads as a position on a spike.
- **Counts sit in fixed-width ruled cells**, so a number holds the same column all the way down.
- **Two themes, neither an inversion of the other.** Dark is the sky at the eyepiece. Light is the same atlas *printed* — cool blue-grey plate stock, deep-indigo ink, marks filled dark.
- **One signal colour**, star amber, and it is the only warm thing on screen. Selection surfaces use chart blue: an accent that becomes a field stops being a signal.

Material 3 governs structure throughout — navigation bar at compact width, navigation rail at expanded, real bottom sheets, chips, switches. The world lives in colour roles, type scale, shape and motion, which is exactly where Android says brand belongs.

`prototype/index.html` is the interactive prototype the app was built from: a single self-contained page with every screen on both device classes, in both themes, with the loading, empty, error and offline states forced from a control bar. Open it in any browser.

Design records: [`PRODUCT.md`](PRODUCT.md) (product truth) and [`.impeccable/surfaces/`](.impeccable/surfaces) (surface brief).

---

## Testing

```bash
cd backend && npm test
```

31 integration tests through the real HTTP stack against a throwaway database. Eight exist because each maps to a specific bug the design prevents — double-tap likes, concurrent likes, pagination under insertion, refresh-token replay, cross-user deletion, self-notification, malformed cursors, and soft-deleted posts. The list is in [backend/README.md](backend/README.md#testing).

---

## Deliverables status

| | |
|---|---|
| Backend, runnable and tested | ✅ |
| Mobile app, all screens, phone + tablet | ✅ |
| API documentation | ✅ [backend/README.md](backend/README.md#api-reference) |
| Setup instructions | ✅ both READMEs |
| **Deployed API URL** | ⬜ deploy to Railway/Render, then set it in `mobile/eas.json` |
| **APK on Google Drive** | ⬜ `eas build -p android --profile preview`, then upload |
| **Firebase project** | ⬜ needs your own project — [setup](backend/README.md#firebase-setup) |

The three unchecked items need credentials only you can supply: a Firebase project, a hosting account, and a Drive account. Everything they depend on is built and waiting. Add the APK link and the live URL here when they exist.

---

## Open question

The evaluation criteria mention a *"functional and user-friendly web interface"*, while the requirements specify only a React Native app and name no web deliverable. This build treats the mobile app as the graded frontend. A minimal web client reusing the same API is scoped at roughly 1.5 days in [docs/PRD.md §3.3](docs/PRD.md) and deliberately left unbuilt — a half-finished second frontend would cost more than an absent one. Say the word if a browser client is genuinely expected.
