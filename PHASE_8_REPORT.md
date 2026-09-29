# AI CAFÉ — PHASE 8: CASHFREE SANDBOX PAYMENT INTEGRATION REPORT

**Project:** AI CAFÉ — Your Drink. Your Way.  
**Tagline:** Crafted by AI. Inspired by You.  
**Phase:** Phase 8 — Cashfree Payments Sandbox Integration  
**Date:** September 30, 2026  
**Status:** COMPLETE & VERIFIED (162/162 Automated Tests Passing, 0 Errors)

---

## 1. Files Created

### Backend:
1. `backend/src/types/payment.ts` — TypeScript contracts (`IPaymentProvider`, `CreatePaymentParams`, `PaymentOrderResult`, `PaymentVerificationResult`, `WebhookVerificationResult`, `PaymentDoc`, `PaymentEventDoc`, `PaymentStatus`, `OrderStatus`).
2. `backend/src/validators/payment.schemas.ts` — Zod runtime schemas for order creation, customization validation, payment session initiation, and parameter validation.
3. `backend/src/services/payment/cashfree.provider.ts` — Official Cashfree Sandbox PG provider implementation with cryptographic HMAC-SHA256 signature verification, replay protection, and error mapping.
4. `backend/src/services/payment/payment.service.ts` — Payment orchestration service decoupling business logic from gateways, implementing webhook idempotency via `paymentEvents`, payment status synchronization, and unit-converted ingredient inventory deductions.
5. `backend/src/controllers/order.controller.ts` — Express controller for order creation, order lookup, payment session creation, and payment inspection with customer ownership & staff RBAC enforcement.
6. `backend/src/controllers/payment.controller.ts` — Express controller for Cashfree return status queries and raw webhook processing.
7. `backend/src/routes/order.routes.ts` — Express routes for `/api/orders`, `/api/orders/:orderId`, `/api/orders/:orderId/payment`.
8. `backend/src/routes/payment.routes.ts` — Express routes for `/api/payments/cashfree/status/:orderId` and `/api/payments/cashfree/webhook`.

### Frontend:
9. `src/features/cart/cart-context.tsx` — React 19 Cart Context and `useCart()` custom hook with `localStorage` persistence, drink customization tracking, count, subtotal, and tray management.
10. `src/components/cart/cart-drawer.tsx` — Accessible sliding cart drawer styled with AI Café warm cream & espresso aesthetic, quantity increment/decrement, and checkout navigation.
11. `src/features/payments/cashfree-checkout.ts` — Cashfree JS SDK v3 client loader and launcher for Web Checkout in `mode: "sandbox"`.
12. `src/app/(customer)/checkout/page.tsx` — Customer checkout screen with dining options (Takeaway, Dine-in, Curbside), customer notes, server-authoritative pricing disclosure, and Cashfree sandbox checkout launcher.
13. `src/app/(customer)/checkout/payment-result/page.tsx` — Authoritative payment verification page querying the backend verification API (`GET /api/payments/cashfree/status/:orderId`) with rich UI states (Success, Pending, Failed, Cancelled) and Sandbox test guide.
14. `docs/PAYMENTS_CASHFREE_SANDBOX.md` — In-depth architectural documentation for Cashfree Sandbox integration, flows, security rules, and production migration.

---

## 2. Files Modified

1. `.gitignore` & `backend/.gitignore` — Explicitly added `APIKey.csv`, `*.csv`, `backend/.env`, and `.env*.local` rules to ensure credentials are never tracked by Git.
2. `backend/src/config/env.ts` — Added Zod validation schema for Cashfree environment variables: `CASHFREE_ENVIRONMENT`, `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, and `CASHFREE_API_VERSION`.
3. `backend/src/app.ts` — Integrated `express.json({ verify: ... })` to preserve untouched `req.rawBody` for webhook HMAC verification, adjusted body sanitizer to preserve webhook byte streams, and mounted `/api/orders` and `/api/payments`.
4. `backend/src/types/operations.ts` — Extended `Order` interface with `cashfreeOrderId`, `paymentId`, and `inventoryDeducted` flags.
5. `backend/src/services/operations/order.service.ts` — Implemented server-authoritative `createOrder` method with catalog item & recipe price computation, internal `AC-YYYY-XXXXXX` ID generation, and payment status updates.
6. `backend/src/services/operations/inventory.service.ts` — Enhanced `getInventory` to overlay Firestore documents on memory defaults for robust testing.
7. `backend/src/test-verify.ts` — Added 42 comprehensive automated payment tests (bringing test suite to 162 tests).
8. `src/components/layout/navbar.tsx` — Connected the cart bag button to `useCart()` with real-time item counter badge and drawer trigger.
9. `src/app/layout.tsx` — Wrapped entire application tree in `<CartProvider>`.
10. `src/app/(customer)/builder/page.tsx` — Wired the "Add to Tray" button in the Drink Builder to add configured drinks directly into the cart.

---

## 3. APIs Added

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/orders` | Customer | Server-authoritative order creation from cart items. Validates product availability and recipe pricing. |
| `GET` | `/api/orders/:orderId` | Customer / Staff | Retrieves order details. Enforces ownership: customers can only view their own orders; staff/admin have RBAC access. |
| `POST` | `/api/orders/:orderId/payment` | Customer | Creates a Cashfree payment order and returns `paymentSessionId`. |
| `GET` | `/api/orders/:orderId/payment` | Customer / Staff | Retrieves payment record metadata associated with an internal order. |
| `GET` | `/api/payments/cashfree/status/:orderId` | Customer / Staff | Server-verifies payment with Cashfree and updates order/payment state accordingly. |
| `POST` | `/api/payments/cashfree/webhook` | Unauthenticated (Signed) | Asynchronous webhook receiver with cryptographic HMAC-SHA256 signature verification and idempotency protection. |

---

## 4. Firestore Changes

### Collections Utilized / Extended:
1. **`orders`**:
   - `orderId`: Internal identifier formatted as `AC-2026-XXXXXX`.
   - `userId`: Customer Firebase Auth UID.
   - `items`: Array of ordered products, selected sizes, quantities, and recipe ingredient customizations.
   - `subtotal`: Server-calculated pre-tax sum in INR.
   - `tax`: Server-calculated tax (0 for demo/unconfigured).
   - `total`: Authoritative INR charge.
   - `currency`: Locked to `INR`.
   - `orderStatus`: `PENDING_PAYMENT`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`.
   - `paymentStatus`: `unpaid`, `paid`, `failed`, `refunded`.
   - `cashfreeOrderId`: Cashfree's external order ID.
   - `paymentId`: Internal payment reference.
   - `inventoryDeducted`: Boolean preventing multiple ingredient deductions.
2. **`payments`**:
   - `paymentId`: Unique internal payment document key.
   - `orderId`: Associated AI Café order ID.
   - `provider`: Set to `"cashfree"`.
   - `providerOrderId`: Cashfree order ID.
   - `paymentSessionId`: Transient checkout token for Web Checkout SDK.
   - `amount`: Transaction amount in INR.
   - `currency`: `"INR"`.
   - `status`: `CREATED`, `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`.
3. **`paymentEvents`**:
   - Stores incoming webhook notifications indexed by event reference / transaction ID.
   - Enforces zero duplicate actions when webhooks repeat.

---

## 5. Payment Flow (Step-by-Step)

1. **Tray Selection**: Customer builds custom drinks in `/builder` or browses catalog, adding items to tray.
2. **Checkout Submission**: Customer opens `/checkout`, selects fulfillment (Takeaway, Dine-in, Curbside), and clicks "Pay with Cashfree".
3. **Server Pricing**: Frontend sends item IDs, sizes, quantities, and customizations. Backend loads items from the catalog, computes customization price deltas, calculates subtotal and total in INR, and writes the `orders` document in `PENDING_PAYMENT` state.
4. **Session Initiation**: Backend calls `POST https://sandbox.cashfree.com/pg/orders` with headers `x-client-id`, `x-client-secret`, `x-api-version: 2025-01-01`. Cashfree returns `payment_session_id`.
5. **Web Checkout**: Frontend Cashfree JS SDK v3 opens the checkout interface in `sandbox` mode.
6. **Payment Interaction**: User completes sandbox payment using Cashfree test instruments (`testsuccess@gocash`, test card, or test net-banking).
7. **Resolution**: Webhook and Return URL synchronize the state:
   - Webhook verifies signature, records event, updates order to `PAID`, dispatches order to kitchen (`PREPARING`), and deducts inventory safely.
   - Return URL invokes `GET /api/payments/cashfree/status/:orderId` to verify final status directly with the gateway before displaying the confirmed screen.

---

## 6. Webhook Flow & Cryptographic Verification

1. **Receipt**: Cashfree posts to `/api/payments/cashfree/webhook`.
2. **Raw Body Buffer**: `express.json({ verify: ... })` captures the exact raw UTF-8 buffer (`req.rawBody`).
3. **Signature Extraction**: Reads `x-webhook-signature` and `x-webhook-timestamp`.
4. **Replay Window Check**: Verifies timestamp is within a 10-minute tolerance (`Math.abs(Date.now() - timestamp) <= 600000`).
5. **HMAC Calculation**: Computes `crypto.createHmac('sha256', secretKey).update(timestamp + rawBody).digest('base64')`.
6. **Constant-Time Verification**: Verifies using `crypto.timingSafeEqual` to thwart timing-based attacks.
7. **Idempotency Gate**: Checks `paymentEvents` for the event reference ID. If duplicate, returns HTTP 200 `{ success: true, alreadyProcessed: true }`.
8. **Amount & Currency Validation**: Validates that webhook amount equals order total and currency is `INR`.
9. **Dispatch & Inventory**: Transitions order to `PAID` / `PREPARING` and safely triggers unit-converted inventory deduction.

---

## 7. Security Measures

- **Zero Credential Exposure**: `CASHFREE_SECRET_KEY` is loaded strictly via `backend/.env`. It is never exported, logged, included in error bodies, or exposed to Next.js client bundles (`NEXT_PUBLIC_` forbidden).
- **APIKey.csv Isolated**: Downloaded export file is ignored in `.gitignore` and never read or tracked by Git.
- **Server-Authoritative Pricing**: Client-injected prices or totals in request payloads are disregarded.
- **Ownership & RBAC Isolation**: Customers cannot view or trigger payments on orders belonging to other users. Staff and admin roles access orders under RBAC rules.
- **Tamper Protection**: Order status transitions prevent re-paying paid or cancelled orders.
- **No Sensitive Card/UPI Data Stored**: No card numbers, CVVs, or bank credentials ever touch AI Café servers.

---

## 8. Idempotency & Inventory Safety

- **Deterministic Event Indexing**: `paymentEvents` documents prevent duplicate processing of re-delivered webhooks or simultaneous polling.
- **Unit-Converted Deductions**: Beverage recipes define ingredient usage in `ml` and `g`, while inventory stocks base supplies in `l` and `kg`. Deductions divide by 1000, preventing inventory zeroing.
- **`inventoryDeducted` Guard**: Each order stores an atomic `inventoryDeducted` flag. Repeated status checks or re-sent webhooks exit immediately without touching stock.
- **Failed Payments Untouched**: No inventory is deducted if payments fail or are cancelled.

---

## 9. Automated Test Suite Results

Test command: `npm test` inside `backend/`  
**Total Tests:** 162  
**Passing:** 162  
**Failing:** 0  

### Phase 8 Specific Tests (Tests 121–162):
1. **Test 121**: Cashfree Provider: Sandbox environment endpoint selected (`https://sandbox.cashfree.com/pg`)
2. **Test 122**: Cashfree Provider: Missing credentials rejected with clear diagnostic
3. **Test 123**: Cashfree Provider: Creates payment order and returns `payment_session_id`
4. **Test 124**: Payment Service: Rejects 0 or negative payment order amounts
5. **Test 125**: Price Integrity: `POST /api/orders` ignores client-injected price and calculates server price
6. **Test 126**: Catalog Validation: Rejects order with non-existent product ID
7. **Test 127**: Customization Validation: Rejects invalid drink recipe customization
8. **Test 128**: Security: `POST /api/orders` without Bearer token returns 401 UNAUTHORIZED
9. **Test 129**: Isolation: Customer B cannot access Customer A's order (403 FORBIDDEN)
10. **Test 130**: RBAC: Staff token CAN access Customer A's order for café operations
11. **Test 131**: Payment Session: `POST /api/orders/:orderId/payment` returns session ID
12. **Test 132**: Payment Authorization: Customer B cannot initiate payment for Customer A's order
13. **Test 133**: State Defense: Rejects payment session request if order is already paid
14. **Test 134**: State Defense: Rejects payment session request if order is cancelled
15. **Test 135**: Webhook Security: Valid HMAC-SHA256 signature passes cryptographic verification
16. **Test 136**: Webhook Security: Tampered payload fails cryptographic signature verification
17. **Test 137**: Webhook Security: Expired timestamp (> 10m) is rejected to block replay attacks
18. **Test 138**: Webhook Endpoint: Rejects untrusted request without valid headers (400 Bad Request)
19. **Test 139**: Webhook Delivery: Valid signed webhook confirms payment and order
20. **Test 140**: Idempotency: Duplicate webhook acknowledged harmlessly with `alreadyProcessed: true`
21. **Test 141**: Security: Webhook with amount differing from order total is rejected
22. **Test 142**: Security: Webhook with invalid currency (non-INR) is rejected
23. **Test 143**: Security: Webhook referencing non-existent internal order ID is rejected
24. **Test 144**: State Transition: Verified payment marks order paid and status `PREPARING`
25. **Test 145**: State Transition: Failed payment sets `paymentStatus` to 'failed' without kitchen dispatch
26. **Test 146**: State Transition: Pending payment leaves order in `PENDING_PAYMENT` state
27. **Test 147**: State Transition: Cancelled payment handled gracefully
28. **Test 148**: Inventory Safety: Ingredients deducted safely upon verified payment
29. **Test 149**: Inventory Safety: Multiple deductions on the same order are strictly idempotent
30. **Test 150**: Inventory Safety: Inventory is NOT deducted if payment fails
31. **Test 151**: Kitchen Operations: Confirmed paid orders appear in active preparing queue
32. **Test 152**: State Separation: Order status can advance to `READY` without modifying `paymentStatus`
33. **Test 153**: Security: No secret key or sensitive credentials exposed in API responses
34. **Test 154**: Security: Source code check verifies `NEXT_PUBLIC_CASHFREE_SECRET_KEY` is never defined
35. **Test 155**: Git Security: `.gitignore` excludes `APIKey.csv`, `*.csv`, and `.env` files
36. **Test 156**: Payment Inspection: `GET /api/orders/:orderId/payment` returns payment metadata
37. **Test 157**: Gateway Verification: `GET /api/payments/cashfree/status/:orderId` syncs payment status
38. **Test 158**: Audit Logging: Confirmed payment writes `ORDER_PAID_CONFIRMED` audit event
39. **Test 159**: Pricing Validation: Order creation rejects payload with 0 items
40. **Test 160**: Custom Drink Pricing: Size and ingredient add-on deltas correctly accumulated
41. **Test 161**: E2E Lifecycle: Create Order -> Payment Session -> Webhook -> Order Preparing
42. **Test 162**: Environment Safeguard: Cashfree Provider enforces sandbox mode and prevents accidental live calls

---

## 10. Build, Typecheck, & Lint Verification

- **Backend TypeScript Check** (`npm run typecheck` in `backend/`):  
  Result: **0 Errors (Exit code 0)**
- **Frontend TypeScript Check** (`npx tsc --noEmit` in root):  
  Result: **0 Errors (Exit code 0)**
- **Next.js Production Build** (`npm run build` in root):  
  Result: **39 / 39 static routes generated cleanly (Exit code 0)**
- **Git Security Verification**:
  - `git check-ignore -v APIKey.csv backend/.env` confirmed both are completely ignored.
  - No secret keys or credentials exist in Git-tracked files or source code.

---

## 11. Sandbox Payment Instruments

| Payment Instrument | Sandbox Value / Action | Expected Result |
|---|---|---|
| **Success UPI** | `testsuccess@gocash` | Immediate Payment Success, order advances to `PAID` / `PREPARING`. |
| **Failure UPI** | `testfailure@gocash` | Payment Failed, order remains unpaid, UI shows "Payment wasn't completed" with Retry. |
| **Invalid UPI** | `testinvalid@gocash` | Invalid VPA error returned by gateway. |
| **Test Cards** | Any valid 16-digit test card + any future MM/YY + CVV `123` | Modal OTP simulation screen; any 6-digit OTP completes transaction. |
| **Net Banking** | Sandbox simulated banks (HDFC, SBI, ICICI) | Simulates bank portal with explicit Success/Failure action buttons. |

---

## 12. Limitations & Scope Boundaries

- **Sandbox Only**: Cashfree is strictly locked to the sandbox endpoint (`https://sandbox.cashfree.com/pg`). Real funds are not processed.
- **Refund Processing**: The refund method is architected in the interface and types, but automated merchant refund workflows are reserved for administrative post-order phases.
- **Single Currency**: Currently restricted to `INR` as per Cashfree Indian payment regulations and AI Café's market focus.

---

## 13. Recommended Next Phase 8 Step

With the core Cashfree payment foundation, server-authoritative order creation, webhook verification, and checkout UI completed and verified:
1. **Live Kitchen Ticket Real-Time Updates**: Connect the kitchen dashboard via Firestore real-time listeners (`onSnapshot`) so that newly confirmed orders in `PREPARING` immediately sound the barista chime.
2. **Order Tracking Page (`/orders/:orderId`)**: Build the dedicated real-time order status tracking timeline showing the progress from `PREPARING` -> `READY` -> `COMPLETED`.
