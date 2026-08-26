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
    const credentials = JSON.parse(json) as admin.ServiceAccount & {
      project_id?: string;
      client_email?: string;
    };
    const app = admin.apps.length
      ? admin.app()
      : admin.initializeApp({ credential: admin.credential.cert(credentials) });
    messaging = app.messaging();
    // The file is snake_case; reading only `projectId` logged undefined and
    // defeated the point of the line, which is to prove you wired the project
    // you meant to. Never log client_email's sibling — the private key.
    logger.info(
      {
        projectId: credentials.project_id ?? credentials.projectId,
        clientEmail: credentials.client_email ?? credentials.clientEmail,
      },
      'firebase ready',
    );
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
