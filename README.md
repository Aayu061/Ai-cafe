# AI CAFÉ — “Your Drink. Your Way.”

> **Crafted by AI. Inspired by You.**  
> A premium cinematic café platform integrating a 192-frame hero experience, real Firestore product catalog, Gemini-powered intent-aware AI Barista V2, and server-authoritative Drink Studio.

---

## ☕ Core Highlights

- **Cinematic Experience**: 192-frame WebP canvas animation (`/asset/caramel-cold-brew/`) with smooth scroll-driven playback and frame prioritization.
- **Authentic Boot Sequence**: Zero fake timers or synthetic progress bars; boot progression tracks genuine font loading, hero poster decoding, catalog preloading, AI Barista `/health` availability, and Firebase Auth state resolution.
- **AI Barista V2 Intent Engine**:
  - Distinguishes 12 distinct intents: `recommend`, `cheapest`, `most_expensive`, `random` (repetition avoidance), `category`, `budget`, `ingredient`, `compare`, `customize`, `details`, `availability`, `pairing`.
  - **Deterministic Catalog Query**: The catalog is the authoritative source of truth. The AI model never invents prices, availability, or items.
  - **Conversation Memory**: Multi-turn preference accumulation (`temperature`, `sweetness`, `strength`, `creaminess`, `flavor`, `milk`, `budget`).
  - **Side-by-side Comparisons & Food Pairings**: Highlighting sensory differences and chef-curated snack pairings with calculated pricing in INR (`₹`).
- **Interactive Drink Studio**: Server-validated drink customization with 5-axis Drink DNA radar (Sweetness, Strength, Creaminess, Chill, Richness).
- **Server-Authoritative Pricing**: All pricing calculated and validated server-side in Indian Rupees (`₹`). Client prices are display-only.
- **Enterprise Security**: Production Express backend, rate-limited at 10 req/min for AI endpoints, protected Firebase Admin SDK integration, CORS whitelist.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, GSAP ScrollTrigger.
- **Backend**: Node.js, Express, TypeScript, Zod, Firebase Admin SDK, Google GenAI SDK (Gemini).
- **Database & Auth**: Google Cloud Firestore & Firebase Authentication.
- **Deployment**: Vercel (Frontend), Render (Backend).

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run build
npm test # Runs 25 automated Phase 6 verification tests
npm run dev # Starts on port 5000
```

### 2. Frontend Setup
```bash
# In project root
npm install
npm run build
npm run dev # Starts on port 3000
```

### 3. Environment Variables
#### Frontend (`.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Backend (`backend/.env`):
```env
PORT=5000
CORS_ORIGIN=http://localhost:3000
AI_PROVIDER=gemini # or mock for local development without API key
GEMINI_API_KEY=...
# Optional Firebase Service Account
FIREBASE_SERVICE_ACCOUNT_KEY=...
```

---

## 🧪 Verification & Testing
Run backend test suite:
```bash
cd backend
npm test
```
All 25 automated tests pass covering:
1. Health check & CORS preflight
2. Protected auth token & bearer handling
3. Catalog & ingredient endpoints
4. Server-authoritative drink configuration validation
5. Rate limiting (429 handling)
6. All 12 Barista intents (`cheapest`, `most_expensive`, `budget`, `compare`, `details`, `availability`, `pairing`, `random`, `ingredient`, etc.)
7. Multi-turn preference state accumulation
8. Repetition avoidance downranking
