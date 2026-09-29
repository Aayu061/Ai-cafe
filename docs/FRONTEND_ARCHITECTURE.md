# AI CAFÉ — Frontend Architecture Specification
**Phase 7.4 Standard | "Your Drink. Your Way."**

---

## 1. Architectural Philosophy

AI CAFÉ follows a **Domain-Driven, Layered Presentation Architecture** built on Next.js 15 (App Router), React 19, TypeScript, and Tailwind CSS. The server is always authoritative; the client serves as an immersive, resilient presentation layer.

```
┌────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                    │
│   (app/ route groups, layout, pages, presentational UI)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                       FEATURE LAYER                    │
│      (Domain logic: barista, builder, catalog, auth)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    API & SERVICE LAYER                 │
│      (api-client, Firebase client, authentication)     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                SERVER-AUTHORITATIVE BACKEND            │
│         (Express REST API, Firebase Admin SDK)         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Directory Hierarchy

```
src/
├── app/                        # Next.js App Router root & route groups
│   ├── (customer)/             # Customer public facing pages (/barista, /builder, etc.)
│   ├── (auth)/                 # Customer auth portals (/login, /signup, /forgot-password)
│   ├── (staff)/                # Staff operations & staff portal (/staff, /staff-login)
│   ├── (admin)/                # Admin portal & admin auth (/admin, /admin-login)
│   ├── (super-admin)/          # Super Admin portal & auth (/super-admin, /super-admin-login)
│   ├── layout.tsx              # Root HTML shell, fonts, BrandOpeningScreen, CookieNotice
│   ├── page.tsx                # Homepage featuring 192-frame Canvas hero & showcase
│   ├── not-found.tsx           # Premium branded 404 experience
│   ├── error.tsx               # Global client error boundary
│   ├── sitemap.ts              # Dynamic XML sitemap for public routes
│   ├── robots.ts               # Robots directives protecting private portals
│   ├── manifest.ts             # Web manifest
│   ├── icon.tsx                # Dynamic 32x32 cold-brew brand favicon
│   ├── opengraph-image.tsx     # Dynamic 1200x630 social card
│   └── globals.css             # Theme variables, utility styles
│
├── components/                 # Presentation layer components
│   ├── brand/                  # Official logo mark, brand lockups, variants
│   ├── ui/                     # Generic reusable UI (button, input, modal, badge, card, skeleton, spinner)
│   ├── layout/                 # Site-wide layout (navbar, footer, container, cookie-notice)
│   ├── hero/                   # Homepage 192-frame Canvas, overlay, music player
│   ├── loading/                # Phase 7.4 brand opening screen & hero fallback
│   ├── menu/                   # Menu presentation components
│   ├── barista/                # AI Barista presentation wrappers
│   └── builder/                # Drink Builder presentation wrappers
│
├── features/                   # Domain & business logic
│   ├── auth/                   # Authentication services, domain guards, role guards
│   ├── barista/                # AI Barista chat, radar DNA, prompts, recommendations
│   ├── builder/                # Interactive drink studio, canvas, DNA visualizer
│   ├── drinks/                 # Signature drinks catalog presentation
│   ├── story/                  # Café philosophy & story presentation
│   ├── cart/                   # [Phase 8] Cart item contracts & state
│   ├── checkout/               # [Phase 8] Checkout session contracts
│   ├── payments/               # [Phase 8] Payment verification interfaces
│   ├── orders/                 # [Phase 8] Live order tracking contracts
│   └── kitchen/                # [Phase 8] Kitchen display queue ticket interfaces
│
├── lib/                        # Infrastructure, utilities & helpers
│   ├── firebase/               # Client Firebase SDK initialization & auth helpers
│   ├── analytics.ts            # Privacy-safe telemetry boundary
│   ├── api-client.ts           # Type-safe fetch client with auth token headers
│   ├── constants.ts            # Brand constants, navigation items, approved drinks
│   ├── security.ts             # Client input sanitization & safe redirect verification
│   ├── seo.ts                  # Metadata constructor helper
│   └── utils.ts                # Class merging utility (cn)
│
├── hooks/                      # Custom React hooks
│   ├── use-auth.ts             # Authentication state hook
│   ├── use-boot.ts             # Application boot sequence hook
│   ├── use-hero-frames.ts      # 192-frame queueing, decoding & scrubbing hook
│   ├── use-reduced-motion.ts   # Accessibility media query hook
│   └── index.ts                # Barrel export
│
├── contexts/                   # Shared React context providers
│   ├── auth-context.tsx        # Authentication provider re-export
│   └── index.ts                # Barrel export
│
├── types/                      # TypeScript definitions
│   ├── brand.ts                # Logo variants, themes, boot task types
│   ├── barista.ts              # Barista intent, chat, and recommendation types
│   ├── drink.ts                # Drink item and sensory profile types
│   ├── models.ts               # User, role, product, ingredient, order models
│   ├── navigation.ts           # Navigation item types
│   └── index.ts                # Barrel export
│
└── config/                     # Configuration definitions
    └── site.ts                 # Central site metadata, brand tokens, opening timings
```

---

## 3. Route Organization & URL Contracts

All public and internal URLs are preserved with **zero change**:

| Route Group | Path Segments | Public URL | Description |
|---|---|---|---|
| Root | `/` | `/` | Homepage with 192-frame hero |
| `(customer)` | `barista/page.tsx` | `/barista` | AI Barista Consultation |
| `(customer)` | `builder/page.tsx` | `/builder` | Build Your Drink Studio |
| `(customer)` | `profile/page.tsx` | `/profile` | Customer Profile & Favorites |
| `(customer)` | `contact/page.tsx` | `/contact` | Store Contact & Locations |
| `(customer)` | `privacy/page.tsx` | `/privacy` | Privacy & Data Policy |
| `(customer)` | `terms/page.tsx` | `/terms` | Terms of Service |
| `(customer)` | `team/page.tsx` | `/team` | Artisan Barista Team |
| `(auth)` | `login/page.tsx` | `/login` | Customer Authentication |
| `(auth)` | `signup/page.tsx` | `/signup` | Customer Account Creation |
| `(auth)` | `forgot-password/page.tsx` | `/forgot-password` | Password Recovery |
| `(staff)` | `staff/page.tsx` | `/staff` | Staff Operations Hub |
| `(staff)` | `staff/orders/page.tsx` | `/staff/orders` | Active Orders Queue |
| `(staff)` | `staff/inventory/page.tsx` | `/staff/inventory` | Inventory Management |
| `(staff)` | `staff/profile/page.tsx` | `/staff/profile` | Staff Profile |
| `(staff)` | `staff-login/page.tsx` | `/staff-login` | Isolated Staff Sign-in |
| `(staff)` | `staff-forgot-password/page.tsx`| `/staff-forgot-password` | Staff Password Recovery |
| `(admin)` | `admin/page.tsx` | `/admin` | Administrative Portal |
| `(admin)` | `admin/analytics/page.tsx` | `/admin/analytics` | Café Business Analytics |
| `(admin)` | `admin/customers/page.tsx` | `/admin/customers` | Customer Management |
| `(admin)` | `admin/inventory/page.tsx` | `/admin/inventory` | Inventory Control |
| `(admin)` | `admin/orders/page.tsx` | `/admin/orders` | Order History & Auditing |
| `(admin)` | `admin/products/page.tsx` | `/admin/products` | Menu & Catalog Editor |
| `(admin)` | `admin/settings/page.tsx` | `/admin/settings` | System Settings & Logs |
| `(admin)` | `admin/staff/page.tsx` | `/admin/staff` | Staff Account Management |
| `(admin)` | `admin-login/page.tsx` | `/admin-login` | Admin Sign-in Portal |
| `(admin)` | `admin-forgot-password/page.tsx`| `/admin-forgot-password` | Admin Password Recovery |
| `(super-admin)` | `super-admin/page.tsx` | `/super-admin` | Super Admin Root Console |
| `(super-admin)` | `super-admin-login/page.tsx` | `/super-admin-login` | Super Admin Auth Portal |
| `(super-admin)` | `super-admin-forgot-password/page.tsx`| `/super-admin-forgot-password`| Super Admin Recovery |

---

## 4. Import Conventions

The `@/*` TypeScript path alias is configured in `tsconfig.json` mapping to `./src/*`:
- Prefer `@/components/ui/button` or `@/components/brand/logo`
- Prefer `@/features/auth/hooks/use-auth` or `@/hooks/use-auth`
- Prefer `@/lib/constants` or `@/config/site`
- Avoid deeply nested relative paths (`../../../../components/...`)

---

## 5. Phase 8 Commerce & Kitchen Extension Points

Pre-scaffolded type contracts in `src/features/` enable seamless Phase 8 development:
1. `src/features/cart/`: Prepares client cart item structures and server-verified unit prices.
2. `src/features/checkout/`: Prepares checkout sessions, dine-in/takeaway toggles, and total validation.
3. `src/features/payments/`: Prepares gateway verification contracts (Razorpay/Stripe webhook verification).
4. `src/features/orders/`: Prepares customer real-time tracking states (`placed` → `brewing` → `ready`).
5. `src/features/kitchen/`: Prepares Barista Kitchen Display System (KDS) queue tickets with priority ordering.
