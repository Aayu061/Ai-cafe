# AI CAFÉ — Firebase Admin SDK Backend Architecture

This document details the architectural preparation for connecting the future **Express API** backend to Firebase using the **Firebase Admin SDK**.

---

## 1. System Architecture Overview

The production architecture maintains a clean separation between the presentation tier, business logic server, and data tier:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│  Next.js 15 App (React 19, TypeScript, Tailwind, GSAP)      │
│  Client Firebase Auth SDK (Session state, Google Sign-In)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                HTTP Requests with Bearer Token
              Authorization: Bearer <Firebase_ID_Token>
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express API Backend                    │
│  Node.js + Express + TypeScript                             │
│  - Token Verification Middleware (`verifyAuthToken`)        │
│  - Business logic (Order placement, inventory, AI Barista)  │
│  - Input validation (Zod)                                   │
│  - Firebase Admin SDK (`firebase-admin`)                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Google Cloud / Firebase                 │
│  - Firebase Authentication Service (Identity provider)     │
│  - Cloud Firestore (Database)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Server-Side Initialization Pattern

When the Express backend is introduced in future phases, it will initialize the Admin SDK using a service account private key stored securely in environment variables (e.g. on Render):

```typescript
// server/src/config/firebase-admin.ts (Future Backend File)
import admin from "firebase-admin";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
```

---

## 3. JWT Verification Middleware

Incoming protected requests to the Express server will be authenticated using Firebase ID Tokens:

```typescript
// server/src/middleware/auth.middleware.ts (Future Backend File)
import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../config/firebase-admin";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
```

---

## 4. Key Security Boundaries

1. **Client Isolation**: The Next.js client application only includes the Firebase Client SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`). `firebase-admin` is never imported into client-side code.
2. **Credential Protection**: Private service account keys (`FIREBASE_SERVICE_ACCOUNT_KEY`) are kept strictly on the backend server environment and must never be prefixed with `NEXT_PUBLIC_`.
3. **Least Privilege**: Client writes to sensitive collections (e.g., catalog prices, stock quantity, order status changes) are disallowed by `firestore.rules` and must pass through the Express API using the Admin SDK.
