# AI CAFÉ — PHASE 7.1 ARCHITECTURE SPECIFICATION
## Multi-Domain Authentication Separation & Hierarchical Governance

---

## 1. Objective

Phase 7.1 establishes a strict separation between consumer-facing authentication experiences and operational/enterprise authentication experiences for the **AI CAFÉ** production platform.

The four account domains are:
1. **CUSTOMER**: Consumer orders, Drink Builder, Drink DNA, and personalization.
2. **STAFF**: Kitchen and barista operational queues, stock monitoring, and shift readiness.
3. **ADMIN**: Café business management, catalog curation, inventory adjustments, and staff roster oversight.
4. **SUPER ADMIN**: Root governance, administrator provisioning, security audit oversight, and system control.

---

## 2. Authentication vs. Authorization Distinction

A critical architectural pillar of Phase 7.1 is the clear boundary between Authentication and Authorization:

| Dimension | Authentication (Identity) | Authorization (Clearance) |
| :--- | :--- | :--- |
| **Provider** | Firebase Authentication (Client & Server SDKs) | Firestore Account Collections & Backend Middleware |
| **Responsibility** | Password hashing, verification, reset, session tokens | Role assignment, domain isolation, permission checks |
| **Storage** | Secure Firebase Auth (NO passwords in Firestore) | `users`, `staffAccounts`, `adminAccounts`, `superAdminAccounts` |
| **Verification** | Verified JWT ID Token | Server-authoritative `resolveAccount(uid)` service |

---

## 3. Customer Authentication

* **Routes**: `/login`, `/signup`, `/forgot-password`, `/profile`
* **Supported Methods**:
  * Google OAuth Popup (`signInWithGoogle`)
  * Email + Password (`signInWithEmailAndPassword`)
* **Registration**: Public registration allowed via `/signup`. Creates documents strictly in `users/{uid}` with:
  ```json
  {
    "role": "customer",
    "status": "active"
  }
  ```
* **Guardrails**:
  * Customers **never** see operational role options during signup.
  * Attempted role self-promotion via `PATCH /users/me` is server-sanitized.
  * Subtle `Café Team Access →` link is provided at the bottom of `/login` routing to `/team`.

---

## 4. Staff Authentication

* **Routes**: `/staff-login`, `/staff-forgot-password`
* **Dashboard**: `/staff` (protected by `StaffGuard`)
* **Supported Methods**: **Email + Password ONLY**. No Google, no social login, no public signup.
* **Storage**: `staffAccounts/{uid}`
  ```json
  {
    "uid": "staff-uid",
    "email": "barista@aicafe.com",
    "displayName": "Artisan Barista",
    "employeeId": "STF-2041",
    "role": "staff",
    "status": "active",
    "permissions": ["view_orders", "update_order_status"],
    "createdAt": "ISO-TIMESTAMP",
    "updatedAt": "ISO-TIMESTAMP",
    "createdBy": "admin-uid"
  }
  ```
* **Design Identity**: Premium AI CAFÉ operations visual language (warm cream `#F7F1E7`, espresso `#3A2418`, deep sage `#263A2E`, caramel `#C98A4A`).
* **Logout**: Firebase `signOut` $\to$ `/staff-login`.

---

## 5. Admin Authentication

* **Routes**: `/admin-login`, `/admin-forgot-password`
* **Dashboard**: `/admin` (protected by `AdminGuard`)
* **Supported Methods**: **Email + Password ONLY**. No Google, no public signup.
* **Storage**: `adminAccounts/{uid}`
  ```json
  {
    "uid": "admin-uid",
    "email": "manager@aicafe.com",
    "displayName": "General Manager",
    "employeeId": "ADM-1001",
    "role": "admin",
    "status": "active",
    "permissions": ["manage_catalog", "manage_inventory", "manage_staff", "view_reports"],
    "createdAt": "ISO-TIMESTAMP",
    "updatedAt": "ISO-TIMESTAMP",
    "createdBy": "super-admin-uid"
  }
  ```
* **Capabilities**: Can provision and suspend Staff accounts (`POST /api/admin/staff`, `PATCH /api/admin/staff/:id/status`). Cannot provision Super Admins.
* **Logout**: Firebase `signOut` $\to$ `/admin-login`.

---

## 6. Super Admin Authentication

* **Routes**: `/super-admin-login`, `/super-admin-forgot-password`
* **Dashboard**: `/super-admin` (protected by `SuperAdminGuard`)
* **Supported Methods**: **Email + Password ONLY**.
* **Storage**: `superAdminAccounts/{uid}`
  ```json
  {
    "uid": "super-admin-uid",
    "email": "governance@aicafe.com",
    "displayName": "Root Controller",
    "role": "super_admin",
    "status": "active",
    "permissions": ["all_permissions"],
    "createdAt": "ISO-TIMESTAMP",
    "updatedAt": "ISO-TIMESTAMP",
    "createdBy": "system_bootstrap"
  }
  ```
* **Capabilities**: Full system governance, provisioning and suspension of Administrator accounts (`POST /api/super-admin/admins`, `PATCH /api/super-admin/admins/:uid/status`), and security audit inspection.
* **Logout**: Firebase `signOut` $\to$ `/super-admin-login`.

---

## 7. Firestore Account Collections

To guarantee strict account domain separation, four distinct Firestore root collections are maintained:

```
firestore
├── users/{uid}               # Customer accounts (Self-registered)
├── staffAccounts/{uid}       # Staff accounts (Admin provisioned)
├── adminAccounts/{uid}       # Admin accounts (Super Admin provisioned)
└── superAdminAccounts/{uid}  # Super Admin accounts (Bootstrap provisioned)
```

Existing operational collections (`products`, `ingredients`, `inventory`, `inventoryMovements`, `recipes`, `orders`, `auditLogs`) remain intact and protected from arbitrary client writes.

---

## 8. Firestore Security Rules

Validated using Firebase MCP tools and deployed:

```javascript
// Customer profile access
match /users/{userId} {
  allow read: if isOwner(userId);
  allow create: if isOwner(userId) && request.resource.data.role == "customer";
  allow update: if isOwner(userId) && request.resource.data.role == resource.data.role;
  allow delete: if false;
}

// Staff accounts: Isolated
match /staffAccounts/{userId} {
  allow read: if isOwner(userId);
  allow write: if false; // Privileged server mutations only
}

// Admin accounts: Isolated
match /adminAccounts/{userId} {
  allow read: if isOwner(userId);
  allow write: if false; // Privileged server mutations only
}

// Super Admin accounts: Isolated
match /superAdminAccounts/{userId} {
  allow read: if isOwner(userId);
  allow write: if false; // Privileged server mutations only
}
```

---

## 9. Backend Account Resolution & Authorization Middleware

The centralized backend service `AccountResolutionService.resolveAccount(uid)` resolves identity hierarchically:

$$\text{superAdminAccounts} \longrightarrow \text{adminAccounts} \longrightarrow \text{staffAccounts} \longrightarrow \text{users}$$

Re-usable middleware ensures defense in depth:
* `requireAuth`: Validates Bearer token format and verifies token cryptographically.
* `requireRole("staff" | "admin" | "super_admin")`: Enforces minimum role clearance.
* `requireAnyRole(["admin", "super_admin"])`: Permits multi-tier administrative access.
* `requireAccountDomain("staff" | "admin" | "super_admin")`: Validates explicit account domain origin.

---

## 10. Frontend Route Guards

Located in `src/features/auth/components/domain-guards.tsx`:

* **`CustomerGuard`**: Protects consumer routes; redirects unauthenticated users to `/login`.
* **`StaffGuard`**: Protects `/staff`; redirects unauthenticated users to `/staff-login`. Excludes customers with clean unauthorized states.
* **`AdminGuard`**: Protects `/admin`; redirects unauthenticated users to `/admin-login`. Excludes staff and customers.
* **`SuperAdminGuard`**: Protects `/super-admin`; redirects unauthenticated users to `/super-admin-login`. Excludes admins, staff, and customers.

---

## 11. Account Creation Hierarchy

```
Super Admin (Provisioned via initial bootstrap or root process)
   ↓
Admin Accounts (Created by Super Admin via POST /api/super-admin/admins)
   ↓
Staff Accounts (Created by Admin via POST /api/admin/staff)
   ↓
Customers (Self-registered via /signup)
```

No public signup exists for Staff, Admin, or Super Admin portals.

---

## 12. Security Model & Self-Promotion Defense

1. **Client Role Distrust**: The frontend never determines authorization from `localStorage`, cookies, or unverified claims.
2. **Profile Sanitization**: Customer mutations via `PATCH /users/me` automatically strip `role`, `status`, `permissions`, and `employeeId`.
3. **Privilege Escalation Defense**: Admin endpoints explicitly block creating accounts with `role: "super_admin"`.
4. **Suspension Enforcement**: Accounts flagged with `status: "suspended"` are immediately rejected across all operational endpoints with `403 ACCOUNT_SUSPENDED`.

---

## 13. Audit Logging

Security-sensitive operations are logged via `AuditService` with structured metadata:
* `STAFF_ACCOUNT_CREATED`, `STAFF_ACCOUNT_SUSPENDED`, `STAFF_ACCOUNT_REACTIVATED`
* `ADMIN_ACCOUNT_CREATED`, `ADMIN_ACCOUNT_SUSPENDED`, `ADMIN_ACCOUNT_REACTIVATED`
* `USER_ROLE_ASSIGNED`

Passwords, session secrets, and API tokens are **strictly excluded** from audit logs.

---

## 14. Testing Suite

The comprehensive backend verification test suite (`backend/src/test-verify.ts`) validates 60 separate assertions covering:
* Customer authentication, role safety, and self-promotion defense.
* Staff queue and inventory access, role isolation from admin portals.
* Admin catalog, inventory, and staff management permissions.
* Super Admin governance, admin provisioning, and system telemetry.
* Cross-domain rejection matrix (Customer $\to$ Staff $\to$ Admin $\to$ Super Admin).
* Account suspension across all tiers.

---

## 15. Known Limitations & Future Improvements

* **Email Dispatch Integration**: Password reset relies on Firebase client SDK dispatch. In future phases, enterprise transactional email (SendGrid/Postmark) can provide branded HTML email templates for staff/admin invitations.
* **MFA (Multi-Factor Authentication)**: SMS or TOTP second-factor authentication can be enabled for Admin and Super Admin tiers in subsequent security hardening phases.
