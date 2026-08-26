# Mini Social Feed — Android app

React Native (Expo) client for the Mini Social Feed API. Feed, posting, likes, comments, author filtering, and FCM push notifications, on phone and tablet.

---

## Read this first

**This app cannot run in Expo Go.** It uses `@react-native-firebase/messaging`, which is native code Expo Go does not contain. You need a **development build** (once), or the prebuilt APK.

That is not a workaround to route around — it is the cost of using real FCM instead of Expo's push proxy, which the brief asks for. Budget ten minutes for the first build.

---

## Quick start

**Prerequisites:** Node 20+, the [backend](../backend/README.md) running, and either an Android emulator or a physical device with USB debugging on. A first native build also needs Android Studio and a JDK.

```bash
cd mobile
npm install
cp .env.example .env      # point EXPO_PUBLIC_API_URL at your API
npx expo prebuild --clean # generates android/
npm run android           # builds, installs, and launches
```

After the first build, day-to-day work is just `npm start`.

### Pointing the app at the API

| Where the app runs | `EXPO_PUBLIC_API_URL` |
|---|---|
| Android **emulator** | `http://10.0.2.2:4000/api/v1` — `10.0.2.2` is the emulator's alias for your machine's localhost |
| Physical device on your Wi‑Fi | `http://192.168.x.x:4000/api/v1` — your machine's LAN address |
| Shipped APK | `https://mini-social-feed-api.onrender.com/api/v1` (already set in `eas.json`) |

`localhost` from the device means *the device*, which is why the emulator needs `10.0.2.2`. Getting this wrong produces "Can't reach the server" and nothing else.

Sign in with `priya` / `demo1234` (see the [backend seed](../backend/README.md#quick-start)).

---

## Firebase

Push is the only part that needs setup. Skip it and everything else works — you simply never get notified.

1. In the [Firebase console](https://console.firebase.google.com), add an **Android app** to your project with package name **`com.minisocialfeed.app`**. It must match `app.config.ts` exactly, or `google-services.json` is ignored and push silently never arrives.
2. Download `google-services.json` into `mobile/`. It is gitignored.
3. Set `FIREBASE_SERVICE_ACCOUNT_B64` on the backend — see the [backend README](../backend/README.md#firebase-setup).
4. Rebuild: `npx expo prebuild --clean && npm run android`. A config file added after a build is not in that build.

### Testing notifications with two accounts

You need two sessions, because the API never notifies you about your own actions.

- **Two devices** is the honest test: sign in as `priya` on one and `rahul` on the other, then like `priya`'s post from `rahul`'s device.
- **One device** works too: sign in as `priya`, note a post id, then like it from your laptop with cURL as `rahul` — see the backend README's walkthrough. The push lands on the phone.

Check all three states, because they take different code paths:

| State | What should happen |
|---|---|
| App open and on screen | An in-app banner slides down from the top. **No** tray notification — a tray alert for the screen you are looking at is noise |
| App backgrounded | A tray notification. Tapping it opens the post |
| App killed | A tray notification. Tapping it cold-starts the app and still lands on the post |

---

## Building the APK

```bash
npm install -g eas-cli
eas login
eas build:configure

eas build -p android --profile preview
```

`preview` produces an **APK** (`buildType: "apk"`), not an AAB, so it can be sideloaded. `google-services.json` is uploaded to EAS as a file secret rather than committed.

Build locally instead with `npm run build:local` if you would rather not use EAS servers — it needs Docker and a lot of patience.

> **Before shipping an APK:** confirm `EXPO_PUBLIC_API_URL` points at a **publicly reachable HTTPS** address. An APK built against `localhost` installs fine and then fails at the login screen for everyone who is not you.

---

## Architecture

```
app/                          expo-router routes
├── _layout.tsx               providers · auth gate · push handlers · deep links
├── (auth)/login · signup
└── (app)/
    ├── _layout.tsx           navigation bar (compact) / navigation rail (expanded)
    ├── index.tsx             Feed, and the tablet's two-pane layout
    ├── compose.tsx           Create post, as a Material bottom sheet
    ├── post/[id].tsx         Post detail — the deep-link target
    ├── notifications.tsx
    └── profile.tsx
src/
├── api/                      axios client · typed query hooks
├── components/               Icons · chrome · PostRow · InAppBanner
├── features/auth             session context
├── features/push             FCM token lifecycle and handlers
├── features/post             the detail pane both layouts share
├── theme/                    tokens and the two palettes
└── lib/                      time formatting
```

### Decisions worth knowing about

**One in-flight refresh, shared.** When an access token expires, several queries fail at once. A naive interceptor fires one refresh each — and because the API *rotates* refresh tokens, the second replays a token the first already spent, which the server correctly reads as theft and revokes the whole family. The user is logged out for doing nothing. `src/api/client.ts` keeps a single refresh promise that everyone waits on.

**Optimistic likes patch every cache that holds the post.** Feed pages, the detail cache, all of it, and all of it rolls back together on failure. Patching only the visible page leaves the same post showing two different counts on two screens.

**The tablet is a different layout, not a wider one.** At ≥ 900 dp the navigation bar becomes a navigation rail and the feed becomes two panes: list on the left, the open post on the right. Tapping a post fills the right pane instead of pushing a screen, so the list never disappears. Breakpoints come from `useWindowDimensions`, so rotation needs no remount.

**The design system is `src/theme/tokens.ts` and nothing else.** No screen picks a colour or a spacing value of its own. A post's like count *is* the diameter of its mark on a fixed five-step magnitude ramp — that is the whole hierarchy, which is why the feed has no cards and no avatars.

**Push degrades, it never crashes.** `src/features/push/push.ts` loads Firebase lazily and no-ops with a clear warning when it is unavailable, so the app still runs in Expo Go for UI work even though notifications do not.

---

## Accessibility

- Every interactive target is at least 48 dp with 8 dp between neighbours.
- Colour is never the only signal: a liked post has a **filled** mark, an unread notification has a dot **and** a different surface, and the compose counter's four states are four different forms rather than four tints.
- Safe-area insets are respected on all four edges, including gesture-navigation bars.
- Type scales with the OS font-size setting; layouts are verified at 1.3×.

---

## Troubleshooting

**"Can't reach the server"**
`EXPO_PUBLIC_API_URL` is wrong for where the app is running — see the table above. Emulators need `10.0.2.2`, not `localhost`. Confirm the backend answers: `curl http://localhost:4000/health`.

**App crashes on launch, or `Native module RNFBAppModule not found`**
You are in Expo Go, or the build predates `google-services.json`. Run `npx expo prebuild --clean && npm run android`.

**Notifications never arrive**
In order of likelihood: the package name does not match Firebase; `google-services.json` is missing or was added after the build; `FIREBASE_SERVICE_ACCOUNT_B64` is unset on the backend; notification permission was denied (check Profile → Push notifications); or you are testing with one account — the API never notifies you about your own actions.

**Fonts look wrong**
The three families load from `@expo-google-fonts/*` at startup and the app renders nothing until they resolve. If it hangs there, delete `node_modules` and reinstall.

**Metro cache weirdness after changing config**
`npx expo start --clear`.
