import * as admin from "firebase-admin";
import { env } from "./env";

export class FirebaseAdminNotConfiguredError extends Error {
  public readonly code = "FIREBASE_ADMIN_NOT_CONFIGURED";
  constructor(message?: string) {
    super(
      message ||
        "Firebase Admin SDK credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
    this.name = "FirebaseAdminNotConfiguredError";
  }
}

interface FirebaseAdminState {
  app: admin.app.App | null;
  auth: admin.auth.Auth | null;
  db: admin.firestore.Firestore | null;
  isConfigured: boolean;
  initError: string | null;
}

const state: FirebaseAdminState = {
  app: null,
  auth: null,
  db: null,
  isConfigured: false,
  initError: null,
};

function initializeFirebaseAdmin(): void {
  // Ensure we only initialize once
  if (admin.apps.length > 0) {
    state.app = admin.apps[0]!;
    state.auth = admin.auth(state.app);
    state.db = admin.firestore(state.app);
    state.isConfigured = true;
    return;
  }

  let credential: admin.credential.Credential | null = null;

  try {
    // Option 1: Full JSON string via FIREBASE_SERVICE_ACCOUNT_KEY (Recommended for Render)
    if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const parsedKey = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
        credential = admin.credential.cert(parsedKey);
        console.log("🔒 [Firebase Admin]: Configured via FIREBASE_SERVICE_ACCOUNT_KEY (JSON).");
      } catch (jsonErr) {
        throw new Error(
          `Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON: ${(jsonErr as Error).message}`
        );
      }
    }
    // Option 2: Discrete fields via FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY
    else if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      const formattedPrivateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
      credential = admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedPrivateKey,
      });
      console.log("🔒 [Firebase Admin]: Configured via discrete FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");
    }

    if (credential) {
      state.app = admin.initializeApp({
        credential,
        projectId: env.FIREBASE_PROJECT_ID,
      });
      state.auth = admin.auth(state.app);
      state.db = admin.firestore(state.app);
      state.isConfigured = true;
      console.log(`✅ [Firebase Admin]: Initialized successfully for project "${env.FIREBASE_PROJECT_ID}".`);
    } else {
      // Explicit configuration required — do NOT silently fall back to applicationDefault() in production
      state.isConfigured = false;
      state.initError =
        "Firebase Admin credentials are not provided. Protected operations requiring token verification or Firestore Admin will fail with FIREBASE_ADMIN_NOT_CONFIGURED.";
      console.warn(
        "⚠️ [Firebase Admin]: No server credentials found in environment. Protected Firebase operations will be rejected with an explicit configuration error."
      );
    }
  } catch (err: unknown) {
    const message = (err as Error).message;
    state.isConfigured = false;
    state.initError = message;
    console.error("❌ [Firebase Admin Initialization Failed]:", message);
  }
}

// Run initialization immediately on module load
initializeFirebaseAdmin();

export function isFirebaseAdminConfigured(): boolean {
  return state.isConfigured;
}

export function getFirebaseAdminAuth(): admin.auth.Auth {
  if (!state.isConfigured || !state.auth) {
    throw new FirebaseAdminNotConfiguredError(state.initError || undefined);
  }
  return state.auth;
}

export function getFirebaseAdminDb(): admin.firestore.Firestore {
  if (!state.isConfigured || !state.db) {
    throw new FirebaseAdminNotConfiguredError(state.initError || undefined);
  }
  return state.db;
}
