import "server-only";

import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Lazily initialize the Firebase Admin SDK. Returns null when no credentials
 * are configured, in which case callers fall back to the bundled seed data so
 * the site still renders end-to-end without a live backend.
 */
function loadCredential() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    try {
      return cert(JSON.parse(inline));
    } catch {
      return null;
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return applicationDefault();
    } catch {
      return null;
    }
  }
  return null;
}

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

function init() {
  if (adminApp) return;
  const credential = loadCredential();
  if (!credential) return; // offline / seed-data mode
  adminApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
  adminDb = getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
}

export function getAdminDb(): Firestore | null {
  init();
  return adminDb;
}

export function getAdminAuth(): Auth | null {
  init();
  return adminAuth;
}

/** True when a real Firebase Admin backend is wired up. */
export function adminEnabled(): boolean {
  init();
  return adminDb !== null;
}
