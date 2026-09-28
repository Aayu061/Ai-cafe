# AI CAFÉ — PHASE 7 ARCHITECTURE DOCUMENT
## Identity, Roles & Café Operations Foundation

**"Your Drink. Your Way."**  
**"Crafted by AI. Inspired by You."**

---

### 1. Role Architecture

AI CAFÉ operates on a unified single-application platform governed by a 4-tier Role-Based Access Control (RBAC) hierarchy:

| Role | Hierarchy Level | Primary Persona | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **`customer`** | Tier 1 (Base) | Café Guest & Patron | Menu browsing, AI Barista consultations, Drink Studio builder, personalized Drink DNA, profile management, order history viewing. Cannot access staff or admin tools. |
| **`staff`** | Tier 2 | Baristas & Kitchen Staff | Operational order fulfillment board (accept, brew, ready, complete), operational stock level monitoring, low-stock alerts. Cannot alter pricing or delete catalog items. |
| **`admin`** | Tier 3 | Store Manager / Café Lead | Catalog management (pricing, availability, product details), inventory stock adjustments (purchases, waste, corrections), order inspection, customer account status (active/suspended), staff promotions, business analytics. |
| **`super_admin`**| Tier 4 (Root) | Platform Executive | All admin capabilities plus full role management, admin user creation, and unrestricted system settings. |

---

### 2. Authentication Flow

Existing Firebase Authentication is preserved without modification:
1. **Credentials**: Email/Password, Google OAuth, Password Reset, and Sign Out.
2. **Session**: Handled client-side by Firebase Auth observer (`onAuthStateChanged`).
3. **ID Token**: Clients transmit standard JWT `Bearer <token>` in HTTP `Authorization` headers.
4. **Token Verification**: Handled server-side by the Firebase Admin SDK (`verifyIdToken`).

---

### 3. Authorization Flow

Authorization is strictly server-authoritative and centralized in `backend/src/middleware/auth.middleware.ts`:
1. **`requireAuth`**: Extracts Bearer token, verifies signature, loads user document from Firestore, resolves role and account status.
2. **Account Suspension Defense**: If user's status is `"suspended"`, the request immediately halts with HTTP 403 `ACCOUNT_SUSPENDED`.
3. **`authorize(...allowedRoles)`**: Evaluates verified user role against endpoint requirements. Rejects unauthorized access with HTTP 403 `FORBIDDEN`.
4. **`requirePermission(...requiredPermissions)`**: Verifies granular permission flags with automatic bypass for `super_admin`.

---

### 4. Permission Model

Centralized permission mapping in `backend/src/types/roles.ts`:
- **`customer`**: `catalog.read`, `orders.read.own`, `orders.create.own`, `profile.read.own`, `profile.update.own`
- **`staff`**: Customer permissions + `orders.read`, `orders.update.status`, `inventory.read`
- **`admin`**: Staff permissions + `catalog.create`, `catalog.update`, `catalog.availability`, `inventory.create`, `inventory.adjust`, `customers.read`, `customers.status`, `staff.read`, `staff.assign`, `analytics.read`, `audit.read`
- **`super_admin`**: Full system permissions (`settings.manage`, `admin.manage`)

---

### 5. Customer Dashboard & Profile

Located at `/profile`:
- **Profile Overview**: Avatar, display name, verified credentials, membership duration, security tier.
- **Operational Banner**: Appears only for elevated users (`staff`, `admin`, `super_admin`) with direct links to the Staff Kitchen Terminal or Admin Portal.
- **Taste Profile**: Sensory preferences informing AI Barista consultations (preferred bases, milk, sweetness, flavor notes).
- **Favorites**: Clean empty state encouraging menu exploration.
- **Saved Creations**: Clean empty state linking to the Drink Studio.
- **Orders**: Clean empty state reflecting live order readiness.

---

### 6. Staff Dashboard

Located at `/staff` (and `/staff/orders`, `/staff/inventory`, `/staff/profile`):
- **Today's Orders Board**: Categorized into 4 operational columns (`NEW ORDERS`, `PREPARING`, `READY FOR PICKUP`, `COMPLETED`).
- **Kitchen Actions**: One-click status transitions (Accept & Brew $\to$ Mark Ready $\to$ Complete).
- **Operational Inventory**: Real-time ingredient levels with color-coded low-stock warnings.
- **Responsive Layout**: Designed for mobile and tablet touchscreens behind the espresso bar.

---

### 7. Admin Dashboard

Located at `/admin`:
- **Executive Navigation**: Responsive sidebar on desktop, drawer on mobile.
- **Products Catalog (`/admin/products`)**: Table with search, category filters, and server-authoritative availability toggles (`PATCH /api/admin/products/:id/availability`).
- **Inventory Architecture (`/admin/inventory`)**: Stock overview and adjustment modal supporting restocks, kitchen waste, and audit corrections.
- **Orders Inspection (`/admin/orders`)**: Pipeline inspection with authentic empty states ("No order data yet.").
- **Customer Directory (`/admin/customers`)**: Account listing and suspension toggle (`PATCH /api/admin/customers/:id/status`).
- **Staff Clearances (`/admin/staff`)**: Role assignment engine (`POST /api/admin/staff/role`).
- **Analytics (`/admin/analytics`)**: Authentic business counts. **Zero fabricated sales, projections, or synthetic revenue**.
- **Settings & Audit Logs (`/admin/settings`)**: Chronological audit trail viewer and active security architecture status.

---

### 8. Inventory Architecture

- **Collection**: `inventory/{inventoryId}`
- **Authoritative Status Derivation**:
  $$\text{status} = \begin{cases} \text{"out\_of\_stock"}, & \text{if } \text{quantity} \le 0 \\ \text{"low\_stock"}, & \text{if } 0 < \text{quantity} \le \text{reorderThreshold} \\ \text{"in\_stock"}, & \text{if } \text{quantity} > \text{reorderThreshold} \end{cases}$$
- **Seed Inventory Items**:
  - `inv-cold-brew`: Slow-Steeped Cold Brew Concentrate (`18.5 l`, threshold `5.0 l`)
  - `inv-espresso-beans`: Artisan Espresso Roast Beans (`7.2 kg`, threshold `2.5 kg`)
  - `inv-oat-milk`: Barista Blend Oat Milk (`24.0 l`, threshold `8.0 l`)
  - `inv-almond-milk`: Unsweetened Almond Milk (`12.0 l`, threshold `5.0 l`)
  - `inv-caramel-syrup`: Handcrafted Madagascar Caramel (`6.5 l`, threshold `2.0 l`)
  - `inv-vanilla-syrup`: Pure Bourbon Vanilla Syrup (`5.0 l`, threshold `2.0 l`)
  - `inv-matcha-powder`: Ceremonial Grade Uji Matcha (`1.8 kg`, threshold `0.5 kg`)
  - `inv-cocoa-powder`: Single-Origin Cocoa Powder (`0.8 kg`, threshold `1.0 kg` $\to$ **LOW STOCK ALERT**)

---

### 9. Recipe Architecture

- **Collection**: `recipes/{recipeId}`
- Maps a catalog product to specific inventory ingredients, quantities, and units.
- **Pre-Seeded Recipes**:
  - **Caramel Cold Brew**: Cold Brew (`250 ml`), Sweet Cream / Milk (`80 ml`), Caramel Syrup (`20 ml`)
  - **Vanilla Latte**: Espresso Beans (`18 g`), Oat Milk (`220 ml`), Vanilla Syrup (`20 ml`)
  - **Matcha Cloud**: Matcha Powder (`10 g`), Oat Milk (`200 ml`), Vanilla Syrup (`10 ml`)
  - **Chocolate Frappe**: Cocoa Powder (`30 g`), Whole Milk (`180 ml`), Vanilla Syrup (`15 ml`)

---

### 10. Audit Architecture

- **Collection**: `auditLogs/{logId}`
- Every administrative state change generates a structured, immutable log entry:
  - `actorId`: UID of administrator or staff member.
  - `actorRole`: Clearance tier at the time of execution.
  - `action`: e.g. `PRODUCT_UPDATED`, `INVENTORY_STOCK_ADJUSTED`, `USER_ROLE_ASSIGNED`.
  - `resourceType`: `product`, `inventory`, `order`, `customer`, `staff`.
  - `resourceId`: Identifier of the impacted document.
  - `metadata`: Sanitized contextual payload.
  - `createdAt`: ISO 8601 timestamp.
- **Privacy Guarantee**: Passwords, API keys, and sensitive secrets are strictly excluded from audit logs.

---

### 11. API Structure

```
/api
  ├── /health                           (Public)
  ├── /products                         (Public catalog)
  ├── /ingredients                      (Public ingredients)
  ├── /drinks/validate                  (Public Drink Studio validation)
  ├── /barista/recommend                (Public Barista AI)
  ├── /me                               (Authenticated user profile)
  ├── /users/me                         (Authenticated profile update)
  │
  ├── /staff                            (Requires: staff, admin, super_admin)
  │     ├── GET   /orders               (Operational order queue)
  │     ├── PATCH /orders/:id           (Status: new, preparing, ready, completed)
  │     ├── GET   /inventory            (Operational stock & low stock alerts)
  │     └── GET   /profile              (Staff operational clearances)
  │
  └── /admin                            (Requires: admin, super_admin)
        ├── GET   /products             (Full products catalog)
        ├── POST  /products             (Create new catalog product)
        ├── PUT   /products/:id         (Update product details & price)
        ├── PATCH /products/:id/availability (Toggle customer availability)
        ├── GET   /inventory            (Full inventory stock table)
        ├── POST  /inventory            (Create inventory item)
        ├── POST  /inventory/adjust     (Adjust stock & record movement)
        ├── GET   /inventory/movements  (Inspect stock movement history)
        ├── GET   /orders               (Inspect operational orders)
        ├── GET   /customers            (List customer accounts)
        ├── PATCH /customers/:id/status (Toggle account active/suspended)
        ├── GET   /staff                (List staff & administrators)
        ├── POST  /staff/role           (Assign staff/admin role)
        ├── GET   /analytics            (Real business metrics)
        └── GET   /audit-logs           (Chronological audit trail)
```

---

### 12. Firestore Collections & Security

Updated in `firestore.rules`:
1. **`users/{userId}`**:
   - Clients can read and write only their own document.
   - **Self-Promotion Block**: `allow update: if isOwner(userId) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status', 'permissions']);`
2. **`inventory/{inventoryId}`**: Read allowed for authenticated users; write restricted to Admin SDK (`if false;`).
3. **`inventoryMovements/{movementId}`**: Direct client read/write forbidden (`if false;`).
4. **`recipes/{recipeId}`**: Read allowed for authenticated users; write restricted to Admin SDK (`if false;`).
5. **`auditLogs/{logId}`**: Direct client read/write forbidden (`if false;`).
6. **`products/{productId}`**: Publicly readable; write restricted to Admin SDK (`if false;`).

---

### 13. Security Model

1. **Defense in Depth**: Frontend checks (`RoleGuard`, navigation links) are for user experience only. All access control is enforced authoritatively on the Express backend and Firestore security rules.
2. **Self-Promotion Defense**: Customers cannot elevate their role to `admin` via profile endpoints or Firestore writes.
3. **Account Suspension Defense**: Suspended accounts are immediately rejected by middleware before any controller logic executes.
4. **Server-Authoritative Pricing**: Pricing calculations for Drink Studio and recommendations remain strictly server-authoritative in INR (`₹`).
5. **Rate Limiting**: Maintained at 60 requests/minute per client IP.

---

### 14. Future Order Architecture (Foundation)

When the full payment and checkout system is deployed in subsequent phases:
1. Customer initiates checkout $\to$ Server validates recipe & inventory availability.
2. Order placed in state `"new"` $\to$ Staff kitchen terminal receives live notification.
3. Barista marks order `"preparing"` $\to$ Kitchen brews beverage.
4. Barista marks order `"ready"` $\to$ Customer notified for pickup.
5. Barista marks order `"completed"` $\to$ Inventory automatically decrements according to the recipe via `order_consumption` stock movement.
