---
version: 1
slug: "prototype-index-html"
primary_target: "prototype/index.html"
related_targets: []
---

## Scope

`prototype/index.html` — a single self-contained page that renders the whole Android app inside a phone frame (411×891 dp) and a tablet frame (1280×800 dp), both driven by one shared in-memory state. Covers all seven screens (Login, Signup, Feed, Create Post, Post Detail, Notifications, Profile) plus the loading, empty, error and offline states, in both themes.

It is the visual and interaction contract for the real Expo build, not a throwaway. The user chose it over scaffolding React Native first so the bar could be reviewed and shared as a link before any native code is committed.

## Visitor mode

**Operate.** The visitor completes a task — read the feed, react, file a post. Expression may never obscure the task, the state, or a familiar Android affordance. Material 3 governs structure, navigation and interaction; the world expresses through colour roles, type scale, shape and motion, never by replacing a component.

## Audience and job

Two device scenes, and they are different products, not one product at two widths:

- **Phone** — one-handed, in motion, on mobile data, any hour. Scan, react, occasionally file. Primary action within thumb reach.
- **Tablet** — stationary, landscape, two-handed, at a desk. Read at length, move between posts without losing the list.
- **The evaluator** — short, adversarial session. Judges whether the tablet was designed for or merely stretched to, and whether every state was built or defaulted.

## Task and states

The loop is post → react → get told. Every data-bearing surface owes four built states: skeletons matched to real geometry, an empty state that names the next action, an error that separates network failure from server failure, and an offline banner that keeps cached content readable while disabling writes with a reason.

## Content

All feed content is synthetic demonstration copy and is labelled as such on the page. Two seeded personas, Priya and Rahul, come from the PRD. No real users, metrics, testimonials or brand assets exist and none may be invented. Product nouns are fixed: post, comment, like, feed, user, username — the world may not rename them.

## Chosen direction

**Star Atlas** — celestial chart plates, magnitudes as ranked dots. Chosen by the user from a bolder-register hand; seed key `c1a02fe4`, dealt challenger 1. The thesis is that a post is a charted object, not a card: its like count *is* the diameter of its mark on a fixed five-step magnitude ramp, so hierarchy lives in the marks and the feed carries no avatar-and-icon card row at all.

Five disciplines were donated by declined challengers and are binding on this surface: one seed rule derives every user ink; counts sit in fixed-width ruled cells so numbers hold their column; no hedge greys; one unbroken filing axis down the whole feed; and four visually distinct compose-counter states rather than four tints.

## Memorable moment

Logging an observation. A like fills the star mark, steps the post's magnitude dot up one place on the ramp, and pulses a single amber acquisition ring outward once — the reticle acquiring its object. It is the only celebratory motion in the app.

Ambient motion is one authored moment and one only: sidereal drift, a slow constant starfield behind the plate on canvas. Everything else is discrete and damped. Reduced motion parks the drift entirely.

## Unresolved

- **OQ-1** (`docs/PRD.md`): the evaluation criteria mention a web interface while the requirements specify only React Native. Until answered, the mobile app is the only client and no browser UI is designed. This prototype is a review artifact, not that web client.
- The light theme is the atlas as a photographic plate. It is fully designed, but the dark theme is the world's native rendition and the one the direction was chosen on.
- Capture path: this surface cannot be verified on an emulator the way `android.md` specifies, because the deliverable is a web prototype rather than an installed APK. Verification is browser capture at true dp dimensions, and that substitution is disclosed with every review packet.
