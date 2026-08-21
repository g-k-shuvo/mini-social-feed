/**
 * FCM token lifecycle and notification handling.
 *
 * This module is written to survive being run where Firebase does not exist —
 * Expo Go, a simulator without Play Services, a build whose
 * `google-services.json` is missing. In all of those it degrades to a no-op
 * and logs why, rather than crashing the app on launch. Push is a feature;
 * the app is not.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import { api } from '../../api/client';

type Messaging = typeof import('@react-native-firebase/messaging').default;

let messaging: ReturnType<Messaging> | null = null;
let loadFailed = false;

function getMessaging() {
  if (messaging || loadFailed) return messaging;
  try {
    // Required lazily: importing at module scope crashes in Expo Go before
    // any of our own error handling can run.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-firebase/messaging') as { default: Messaging };
    messaging = mod.default();
    return messaging;
  } catch (err) {
    loadFailed = true;
    console.warn(
      '[push] Firebase messaging unavailable. This build needs a development build with google-services.json — it will not work in Expo Go.',
      err,
    );
    return null;
  }
}

/** Present only on Android 13+; below that the permission is implicit. */
const POST_NOTIFICATIONS = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as
  | 'android.permission.POST_NOTIFICATIONS'
  | undefined;

const needsRuntimePermission = () =>
  Platform.OS === 'android' &&
  typeof Platform.Version === 'number' &&
  Platform.Version >= 33 &&
  !!POST_NOTIFICATIONS;

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (!needsRuntimePermission() || !POST_NOTIFICATIONS) return true;
  const result = await PermissionsAndroid.request(POST_NOTIFICATIONS);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function hasPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (!needsRuntimePermission() || !POST_NOTIFICATIONS) return true;
  return PermissionsAndroid.check(POST_NOTIFICATIONS);
}

/** Fetches the token and registers it server-side. Safe to call repeatedly. */
export async function registerDevice(): Promise<string | null> {
  const m = getMessaging();
  if (!m) return null;

  try {
    const granted = await requestPermission();
    if (!granted) {
      console.info('[push] notification permission denied — the app works, pushes will not arrive');
      return null;
    }
    const token = await m.getToken();
    if (!token) return null;
    await api.post('/devices', { fcmToken: token, platform: 'ANDROID' });
    return token;
  } catch (err) {
    console.warn('[push] device registration failed', err);
    return null;
  }
}

/** Returns the token so the caller can pass it to /auth/logout. */
export async function unregisterDevice(): Promise<string | undefined> {
  const m = getMessaging();
  if (!m) return undefined;
  try {
    const token = await m.getToken();
    if (token) {
      await api.delete(`/devices/${encodeURIComponent(token)}`).catch(() => undefined);
      await m.deleteToken();
    }
    return token ?? undefined;
  } catch {
    return undefined;
  }
}

export interface PushPayload {
  type: 'LIKE' | 'COMMENT';
  postId: string;
  commentId: string;
  actorUsername: string;
  notificationId: string;
}

function toPayload(data: Record<string, unknown> | undefined): PushPayload | null {
  if (!data || typeof data.postId !== 'string') return null;
  return {
    type: data.type === 'COMMENT' ? 'COMMENT' : 'LIKE',
    postId: data.postId,
    commentId: typeof data.commentId === 'string' ? data.commentId : '',
    actorUsername: typeof data.actorUsername === 'string' ? data.actorUsername : '',
    notificationId: typeof data.notificationId === 'string' ? data.notificationId : '',
  };
}

interface Handlers {
  /** App is open and on screen. Show an in-app banner, not a tray notification. */
  onForeground: (p: PushPayload, title: string, body: string) => void;
  /** User tapped a notification from background or a cold start. */
  onOpened: (p: PushPayload) => void;
}

export function attachHandlers(h: Handlers): () => void {
  const m = getMessaging();
  if (!m) return () => undefined;

  const unsubscribeForeground = m.onMessage(async (remote) => {
    const payload = toPayload(remote.data);
    if (payload) {
      h.onForeground(
        payload,
        remote.notification?.title ?? 'New activity',
        remote.notification?.body ?? '',
      );
    }
  });

  const unsubscribeOpened = m.onNotificationOpenedApp((remote) => {
    const payload = toPayload(remote.data);
    if (payload) h.onOpened(payload);
  });

  // Cold start: the notification that launched the app.
  void m.getInitialNotification().then((remote) => {
    if (!remote) return;
    const payload = toPayload(remote.data);
    if (payload) h.onOpened(payload);
  });

  const unsubscribeRefresh = m.onTokenRefresh(async (token) => {
    try {
      await api.post('/devices', { fcmToken: token, platform: 'ANDROID' });
    } catch {
      // Next foreground will retry.
    }
  });

  return () => {
    unsubscribeForeground();
    unsubscribeOpened();
    unsubscribeRefresh();
  };
}
