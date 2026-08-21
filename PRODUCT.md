# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Stack

Two stacks, deliberately separate.

- **This prototype** — self-contained static HTML/CSS/JS, single page, no build step, no external runtime dependencies. Chosen by the user over scaffolding the real Expo project, so the visual bar can be reviewed and shared as a link before any React Native code is committed.
- **The production app it specifies** — Expo SDK 54 + expo-router (React Native), TanStack Query, `expo-secure-store`, `@react-native-firebase/messaging`. Backend: Node 20 + Express 4 + PostgreSQL 16 + Prisma. Recorded in `docs/PRD.md` §4.2; the prototype must be buildable in that stack without invention.

The prototype renders an **Android** application, not a website. Its design language answers to Android conventions, not web ones.

## Users

- **Priya, the poster.** Opens the app to say something short and find out who responded. 6.1″ Android phone, one-handed, on mobile data. Success is publishing in one tap and being told immediately when someone reacts.
- **Rahul, the reader.** Mostly scrolls, occasionally likes. 10″ Android tablet, landscape, at a desk. Success is a feed that loads fast, keeps his place, and never loses scroll position on refresh.
- **The evaluator.** Clones the repo, reads the README, installs the APK, and tries to break it. Judges setup friction, validation behaviour, authorisation holes, whether the push actually arrives, and whether the app was built for a tablet or merely stretched to one.

## Product Purpose

A text-only social feed. A user signs up, publishes short posts, reads one shared reverse-chronological feed of everyone's posts, likes and comments, filters the feed to a single author, and receives a push notification when someone interacts with a post of theirs.

Success is that the whole loop — auth, post, interact, notify — works end to end on a real device, and that the two form factors named in the brief each feel designed for.

## Positioning

This is a build-and-evaluate deliverable, not a product competing in a market. Stating otherwise would be a fabrication. What distinguishes it is execution, not category: a narrow feature set taken to a finish most submissions do not reach — a genuine tablet layout rather than a stretched phone one, every data surface carrying designed loading, empty, error, and offline states, and interactions that resolve optimistically instead of waiting on the network.

## Operating Context

- Phone use is one-handed, in motion, on mobile data with intermittent connectivity. Reach matters: primary actions belong in the lower half of the screen.
- Tablet use is stationary, landscape, two-handed, at a desk. Screen width is abundant; a single centred column wastes it.
- The evaluator's session is short and adversarial. First launch must land on populated content, not an empty feed.
- Notifications arrive while the app is in the foreground, in the background, and killed. All three are part of normal use.

## Capabilities and Constraints

**Confirmed capabilities** — signup and login; a global feed paginated newest-first; text-only posts, 1–500 characters; comments, 1–300 characters; a like that toggles; a feed filter by author username; push notifications on like and comment, deep-linking to the post; an in-app notification list; logout.

**Confirmed constraints**

- Text only. No images, video, or link previews anywhere in v1.
- Posts are public. Every authenticated user sees every post. There is no privacy model, no follow graph, no personalised ranking.
- No post editing, no nested comment replies, no reactions beyond a single like, no search, no hashtags or mentions.
- Android only. No iOS surface exists to design for.
- Avatars are generated: the user's initials on a colour derived deterministically from their id. There is no upload path, so no design may assume a photograph.
- The two device classes that will be tested are a 411×891 dp phone and an 800×1280 dp tablet, each in portrait and landscape.

**Terminology** — *post* (never "status" or "tweet"), *comment*, *like*, *feed*. A person is a *user* with a *username*.

**Undecided** — whether a browser client is also expected (`docs/PRD.md` OQ-1). Unresolved; the mobile app is treated as the only client until answered.

## Brand Commitments

- **Name: "Mini Social Feed."** Confirmed by the user as the shipping name, not a working title.
- No logo, wordmark, colour, typeface, photography, or illustration asset exists yet. Nothing is inherited and nothing is off-limits.
- No voice guide exists. The PRD's user-facing strings are the only established copy, and they set the register: plain, short, second person, no apologies — "Say something first.", "No posts from @priya yet.", "You're going a bit fast — try again in a moment."

## Evidence on Hand

- `docs/PRD.md` — the full product requirements document: API contract, data model, screen inventory, notification rules, responsive breakpoints, acceptance criteria. This is the authoritative specification and the prototype must not contradict it.
- Two named demo personas, Priya and Rahul, used in PRD examples and intended as the seeded demo accounts.
- **Nothing else exists.** No real users, no usage data, no testimonials, no press, no metrics, no screenshots, no brand assets. All feed content in the prototype is demonstration copy and must read as such — never as a real person's words presented as genuine.

## Product Principles

1. **The loop is the product.** Post, react, get told. Every design decision serves the speed and clarity of that circuit; nothing else earns space.
2. **The tablet is a different product, not a wider one.** Abundant width gets a layout designed for it, not a centred phone column.
3. **Nothing waits on the network to feel done.** Likes resolve on tap, a new post appears before the server confirms it, and a failure rolls back visibly rather than silently.
4. **Every state is designed.** Loading, empty, error, and offline are screens someone will see, not fallbacks. A skeleton matches the geometry it replaces so nothing shifts on arrival.
5. **Say it plainly.** Copy names what happened and what to do next. No apologies, no jargon, no cleverness in an error message.

## Accessibility & Inclusion

- Every interactive target is at least 44 dp.
- Typography scales with the OS font-size setting up to 1.3×, and layouts are verified at that scale rather than clipping.
- Safe-area insets are respected on all four edges, including gesture-navigation bars.
- Text contrast meets WCAG AA against its own surface, in both the light and dark themes.
- Colour never carries meaning alone: liked state, unread state, and error state each read through form or icon as well as hue.
- Rotation preserves scroll position and any in-progress composer text.
