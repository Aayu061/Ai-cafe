# AI CAFÉ — Backend Service (Express + TypeScript + Firebase Admin)

Production-structured Node.js + Express + TypeScript backend serving the trusted server layer for **AI CAFÉ**.

---

## 1. Architecture Overview

```
Browser (Client)
   ↓
Next.js Frontend (Static / SSR)
   ↓ (Bearer Firebase ID Token)
Node.js + Express + TypeScript Backend
   ↓ (verifyIdToken)
Firebase Admin SDK (Server Identity)
   ↓
Cloud Firestore (Database: ai-cafe-2deb5)
```

- **Client Authentication**: Handled by Firebase Client SDK on the frontend.
- **Server Authentication**: Express validates incoming requests using `Authorization: Bearer <Firebase ID Token>` with the Firebase Admin SDK (`verifyIdToken`).
- **Data Access**: Firestore Admin SDK provides trusted server-side read/write access.
- **Deployment Target**: Render Web Service.

---

## 2. Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Zod-validated environment config
│   │   └── firebase-admin.ts   # Explicit Firebase Admin initialization & health assertion
│   ├── middleware/
│   │   ├── auth.middleware.ts  # Bearer ID token verification
│   │   ├── error.middleware.ts # Centralized JSON error handler
│   │   ├── not-found.middleware.ts # 404 handler
│   │   └── logger.middleware.ts # Safe request logger (no secrets logged)
│   ├── routes/
│   │   ├── health.routes.ts    # GET /health
│   │   └── user.routes.ts      # GET /api/me & GET /api/users/me
│   ├── controllers/
│   │   ├── health.controller.ts
│   │   └── user.controller.ts
│   ├── services/
│   │   └── user.service.ts     # Firestore Admin users/{uid} access
│   ├── validators/
│   │   └── common.schemas.ts   # Common Zod validation schemas
│   ├── types/
│   │   └── express.d.ts        # Typed Express.Request with req.user
│   ├── app.ts                  # Express app setup & middleware pipeline
│   └── server.ts               # HTTP server entry point & graceful shutdown
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Endpoints

| Method | Endpoint | Protection | Description |
|:---|:---|:---|:---|
| **GET** | `/health` | Public | Lightweight health check returning `{ "success": true, "service": "ai-cafe-api", "status": "healthy" }`. Suitable for Render health check. |
| **GET** | `/api/me` | Firebase Auth | Returns safe verified identity from token: `{ "success": true, "user": { "uid", "email", "name", "picture" } }`. |
| **GET** | `/api/users/me` | Firebase Auth | Fetches the caller's Firestore user document (`users/{req.user.uid}`) via Firebase Admin SDK. |

---

## 4. Local Development

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Setup
```bash
cd backend
cp .env.example .env
npm install
```

### Running Locally
```bash
# Start with hot-reloading (via tsx)
npm run dev

# Typecheck without emitting
npm run typecheck

# Build for production
npm run build

# Run compiled production build
npm start
```

---

## 5. Render Deployment Configuration

When deploying this backend as a **Render Web Service**:

### Settings
- **Environment**: `Node`
- **Root Directory**: `backend`
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```
- **Health Check Path**:
  ```
  /health
  ```

### Required Environment Variables on Render

| Key | Example Value | Description |
|:---|:---|:---|
| `NODE_ENV` | `production` | Enables production mode (suppresses stacks in error responses). |
| `PORT` | `10000` (Render sets automatically) | Port the Express server listens on. |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Production origin allowed by CORS. |
| `FIREBASE_PROJECT_ID` | `ai-cafe-2deb5` | Target Firebase project ID. |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `{"type":"service_account",...}` | **Option 1 (Recommended)**: Raw JSON content of Firebase service account key. |
| *or* `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@ai-cafe-2deb5.iam.gserviceaccount.com` | **Option 2**: Service account email. |
| *or* `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` | **Option 2**: Service account private key (with escaped `\n`). |

> [!IMPORTANT]
> - Never commit a service account JSON file into Git.
> - Never use `NEXT_PUBLIC_*` variables in the backend.
> - If Firebase Admin credentials are not provided, `/health` will remain healthy, but protected operations will fail explicitly with `500 FIREBASE_ADMIN_NOT_CONFIGURED` rather than silently failing.
