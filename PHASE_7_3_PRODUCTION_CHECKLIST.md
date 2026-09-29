# AI CAFÉ — PHASE 7.3 PRODUCTION READINESS CHECKLIST

Every item in this checklist has been verified against active code and automated tests.

---

### Security
- [x] Server-authoritative catalog & pricing enforced (`CatalogService`, `BaristaToolsService`)
- [x] Client price assertions completely ignored by server calculation
- [x] Express emits `X-Content-Type-Options: nosniff`
- [x] Express emits `X-Frame-Options: DENY`
- [x] Express emits `Referrer-Policy: strict-origin-when-cross-origin`
- [x] Next.js enforces Content Security Policy (CSP) in `next.config.mjs`
- [x] Input sanitization utility cleanses HTML tags, scripts, and event handlers (`sanitize.ts`)
- [x] 30-second bounded request timeout protection in `app.ts`

---

### Authentication
- [x] 4 segregated portals: `/login` (Customer), `/staff-login`, `/admin-login`, `/super-admin-login`
- [x] Zero public signup for privileged staff or admin accounts
- [x] Firebase ID tokens verified server-side with Firebase Admin SDK
- [x] `TOKEN_EXPIRED` and `INVALID_TOKEN` handled with safe production messages
- [x] Suspended accounts actively rejected (`403 ACCOUNT_SUSPENDED`)
- [x] Passwords never stored in Firestore or plaintext

---

### RBAC
- [x] Route-level authorization middleware (`requireRole`, `requireAnyRole`, `requireAccountDomain`)
- [x] Granular permission verification (`requirePermission`)
- [x] Customer access to staff/admin routes blocked (`403 FORBIDDEN`)
- [x] Staff access to admin routes blocked (`403 FORBIDDEN`)
- [x] Admin self-promotion to `super_admin` blocked (`403 FORBIDDEN`)
- [x] Mass assignment protection on `PATCH /api/users/me` (unprivileged role modifications discarded)

---

### Firestore
- [x] Strict ownership rules on `/users/{userId}`
- [x] `staffAccounts`, `adminAccounts`, `superAdminAccounts` write-locked from client (`allow write: if false;`)
- [x] `products` and `ingredients` publicly readable, write-locked from client
- [x] `inventory`, `inventoryMovements`, `recipes`, `auditLogs` write-locked from client
- [x] `orders` collection write-locked from client (`allow write: if false;`); creation reserved strictly for server Admin SDK

---

### API
- [x] Zod schema validation across all POST/PATCH endpoints
- [x] Malformed JSON payloads return `400 MALFORMED_JSON_PAYLOAD` instead of 500
- [x] 1MB payload size limits on JSON and urlencoded body parsers
- [x] Production error handler strips stack traces and technical internals
- [x] CORS configured with strict origin whitelist and method restrictions

---

### AI Safety
- [x] LLM is NOT the source of truth for pricing, availability, or configurations
- [x] Controlled tools layer executes all catalog lookups and calculations server-side
- [x] Adversarial system prompt leakage attacks defused safely
- [x] Credential and API key probes intercepted and refused
- [x] Privilege escalation attempts intercepted and refused
- [x] Price override attempts intercepted with server-authoritative affirmation
- [x] Hallucination prevention: Only real catalog products are surfaced

---

### Secrets
- [x] `.env*` files strictly excluded in `.gitignore`
- [x] Zero sensitive credentials or API keys tracked in Git history
- [x] Client bundle uses only standard `NEXT_PUBLIC_FIREBASE_*` config
- [x] Server private keys and Gemini keys accessed strictly in backend environment

---

### Abuse Protection
- [x] Sliding-window in-memory rate limiter factory (`rate-limit.middleware.ts`)
- [x] `baristaRateLimiter` enforces 10 req/min on `/api/barista/recommend`
- [x] `authRateLimiter` enforces 25 req/min on `/api/users/*`
- [x] `adminSensitiveRateLimiter` enforces 20 req/min on admin mutations
- [x] 429 response includes standard `Retry-After` header

---

### Accessibility
- [x] `prefers-reduced-motion` respected by 192-frame Canvas hero
- [x] Screen-reader skip-to-content link in `RootLayout` (`#main-content`)
- [x] Form inputs possess accessible `<label>`s and descriptive placeholders
- [x] Barista chat input and buttons equipped with explicit `aria-label`s
- [x] Music player controls fully accessible with `aria-label` toggles
- [x] Keyboard focus visible across interactive cards and buttons

---

### SEO
- [x] Dynamic sitemap generated at `/sitemap.xml` with prioritized public routes
- [x] Robots directive generated at `/robots.txt` disallowing private portals
- [x] Dynamic Open Graph 1200x630 card rendered at `/opengraph-image`
- [x] Dynamic high-DPI favicon generated at `/icon`
- [x] PWA Web Manifest generated at `/manifest.webmanifest`
- [x] Canonical URL metadata configured in `layout.tsx`

---

### Privacy
- [x] Production `/privacy` policy documenting Firebase Auth, preferences, and AI safety
- [x] No third-party advertising cookies or tracking scripts
- [x] Transparent `CookieNotice` component for essential local storage
- [x] User data access and deletion rights outlined

---

### Analytics
- [x] Privacy-preserving `trackEvent` helper in `src/lib/analytics.ts`
- [x] Automatic scrubbing of tokens, passwords, and payment card patterns
- [x] Silent failure boundary preventing analytics from disrupting UI

---

### Performance
- [x] 192-frame Canvas sequence preloaded with first-frame `<link rel="preload">`
- [x] 37 static routes generated and optimized at build time
- [x] Shared First Load JS size kept lean (103 kB)
- [x] Dynamic imports and debounced server validation in Drink Builder

---

### Mobile
- [x] Responsive layout verified from 320px up to 1440px+
- [x] Slide-out mobile menu drawer with touch-friendly navigation targets
- [x] Sticky action buttons in Drink Builder and Barista Chat
- [x] No horizontal viewport overflow

---

### Monitoring
- [x] `GET /health` endpoint operational, returning 200 with clean status
- [x] Zero environment secrets, file paths, or credentials leaked in health payload
- [x] Structured request logging via `requestLogger` middleware

---

### Backup & Disaster Recovery
- [x] **Documented Firestore Strategy:** Scheduled Cloud Firestore exports to Google Cloud Storage (`gs://ai-cafe-backups/firestore`)
- [x] **Rollback Procedure:** Git commit tags (`origin/main`) paired with Vercel and Render deployment rollbacks
- [x] **Credential Rotation:** Documented procedure for rotating Firebase Admin service account keys and Gemini API keys

---

### Deployment
- [x] **Backend:** Production Node.js + Express + TypeScript on Render (`ai-cafe-backend`)
- [x] **Frontend:** Next.js 15 on Vercel (`ai-cafe-zeta.vercel.app`)
- [x] **Environment Variables:** Documented in `.env.example` and `backend/.env.example`

---

### Phase 8 Preparation
- [x] `PaymentStatus` union type defined (`unpaid`, `processing`, `paid`, `failed`, `refunded`)
- [x] `CartItem` and `CartDoc` data structures defined in `operations.ts`
- [x] `ServerPriceVerificationContract` defined for cryptographic payment gateway handshake
- [x] Operational order status transition lifecycle (`new` -> `preparing` -> `ready` -> `completed`) fully integrated into `OrderService` and audited
