/**
 * Firebase Admin, initialised once and only if credentials exist.
 *
 * With no service account configured the module reports itself disabled and
 * the dispatcher logs what it would have sent. That keeps the whole API — and
 * every test — runnable by someone who has not set up a Firebase project yet,
 * which is most people cloning this repo for the first time.
 */
import admin from 'firebase-admin';
import { env } from './env';
import { logger } from '../lib/logger';

let messaging: admin.messaging.Messaging | null = null;

if (env.firebaseEnabled) {
  try {
    const json = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
    const credentials = JSON.parse(json) as admin.ServiceAccount;
    const app = admin.apps.length
      ? admin.app()
      : admin.initializeApp({ credential: admin.credential.cert(credentials) });
    messaging = app.messaging();
    logger.info({ projectId: (credentials as { projectId?: string }).projectId }, 'firebase ready');
  } catch (err) {
    // A broken credential is a configuration bug worth shouting about, but it
    // must not take the API down: everything except push still works.
    logger.error({ err }, 'FIREBASE_SERVICE_ACCOUNT_B64 could not be parsed — push disabled');
    messaging = null;
  }
} else {
  logger.warn('No Firebase credentials: notifications will be recorded and logged, not delivered');
}

export const fcm = {
  get enabled() {
    return messaging !== null;
  },
  get client() {
    return messaging;
  },
};
