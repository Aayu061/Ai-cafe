import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

export const EXPECTED_PROJECT_ID = "ai-cafe-2deb5";

const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || EXPECTED_PROJECT_ID;

if (
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== EXPECTED_PROJECT_ID
) {
  console.warn(
    `[Firebase Configuration Warning]: Detected project ID "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}" does not match required project "${EXPECTED_PROJECT_ID}".`
  );
}

// Ensure Next.js build-time static prerender does not crash on empty string
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSy_build_placeholder_key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${EXPECTED_PROJECT_ID}.firebaseapp.com`,
  projectId: configuredProjectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${EXPECTED_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000",
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === EXPECTED_PROJECT_ID
);

// Initialize Firebase safely for SSR & Static Site Generation
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export { app };
export default app;
