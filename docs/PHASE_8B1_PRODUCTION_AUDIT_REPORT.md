# PHASE 8B.1 — PRODUCTION AUDIT REPORT & CASHFREE CHECKOUT VERIFICATION

> **Date**: 30 September 2026  
> **Target Deployments**:  
> - **Frontend**: `https://ai-cafe-zeta.vercel.app` (Vercel)  
> - **Backend**: `https://ai-cafe-1v5c.onrender.com` (Render)  
> **Backend Tests**: 192/192 PASSED (100% clean)  
> **TypeScript Errors**: 0  
> **Status**: RESOLVED & VERIFIED  

---

## 1. Executive Summary

During Phase 8B production testing on `https://ai-cafe-zeta.vercel.app/checkout`, customers experienced an indefinite hang on:
```
"Preparing your payment..."
```
The Cashfree Sandbox checkout window/modal never appeared, and DevTools showed pending requests for `orders`, `favorites`, and `saved-drinks` alongside `Cross-Origin-Opener-Policy` (COOP) console messages.

This audit report documents the **root cause identification**, the **exact failing request**, the **fixes applied across frontend and backend**, the **network timeline (T0–T7)**, and the **validation of Cashfree Sandbox checkout**.

---

## 2. Root Cause Analysis

### 2.1 The Exact Failing Request
1. **Unbounded Client-Side Fetch (`apiFetch`)**:
   `src/lib/api-client.ts` previously invoked raw `fetch()` without an `AbortController` timeout and parsed JSON directly via `res.json()`. When Render's free tier was cold-starting (sleeping), requests to `POST /api/orders` and background requests hung in the browser indefinitely (up to browser socket timeout of minutes).
2. **Cashfree Script Loader Race Condition**:
   In `src/features/payments/cashfree-checkout.ts`, `loadCashfreeScript()` created a `<script>` tag and attached a `"load"` listener. If the script was already injected or cached in the DOM, adding the `"load"` listener to an already-loaded node never fired. This resulted in an unresolved promise at the `loading_cashfree` stage.
3. **Modal vs. Self Redirect**:
   The Cashfree checkout invocation used `redirectTarget: "_self"`. For the in-page checkout experience, the official Cashfree Web SDK v3 requires `redirectTarget: "_modal"`, which injects the responsive iframe modal over the checkout page.
4. **Background Dashboard Request Saturation**:
   On customer navigation, `/dashboard` loaded `orders`, `favorites`, and `saved-drinks` via unconstrained `Promise.all` with no timeouts. Under cold-start conditions, these requests occupied browser HTTP connection slots, exacerbating checkout latency.
5. **Absence of State Machine & Timeout Recovery**:
   The checkout UI lacked timeout guards and granular state tracking. Once `isSubmitting` was true, any network delay left the patron permanently stuck on `"Preparing your payment..."` with no error recovery or retry button.

---

## 3. Network Request Timeline (T0 → T7)

| Timestamp | Phase | Action / Event | Target Endpoint | Status |
|:---:|:---|:---|:---|:---:|
| **T0** | User Action | Customer clicks **"Pay ₹220 with Cashfree"** | Client UI | State: `creating_order` |
| **T1** | Order Dispatch | Frontend sends authenticated order payload | `POST /api/orders` | 15s timeout guard |
| **T2** | Order Created | Backend verifies prices, creates `PENDING_PAYMENT` order, returns `orderId` | Backend → Client | `HTTP 201 Created` |
| **T3** | Session Request | Frontend requests payment session for `orderId` | `POST /api/orders/:orderId/payment` | State: `creating_payment_session` |
| **T4** | Gateway Call | Backend invokes Cashfree Sandbox API with 12s timeout | `https://sandbox.cashfree.com/pg/orders` | Backend → Cashfree |
| **T5** | Session Returned | Cashfree returns `payment_session_id`. Backend returns session info | Backend → Client | `HTTP 200 OK` |
| **T6** | SDK Loader | Frontend checks `window.Cashfree`, loads official SDK from CDN | `https://sdk.cashfree.com/js/v3/cashfree.js` | State: `loading_cashfree` (10s timeout) |
| **T7** | Checkout Modal | Cashfree instance initialized (`mode: "sandbox"`), opens in-page modal | `cashfree.checkout({ redirectTarget: "_modal" })` | State: `payment_ready` |

---

## 4. Cross-Origin-Opener-Policy (COOP) Investigation

### Observation
DevTools displayed:
```
Cross-Origin-Opener-Policy policy would block the window.closed call.
```

### Technical Assessment
- **Origin**: This message is generated when Google Firebase Auth or third-party authentication popups interact with `window.closed` across disparate origins.
- **Header Check**: Neither `next.config.mjs` nor the Express backend sets restrictive `Cross-Origin-Opener-Policy: same-origin` headers.
- **Impact on Checkout**: COOP has **zero** bearing on Cashfree checkout initialization or session generation. It does not block DOM script execution or fetch requests.
- **Action Taken**: Documented as harmless third-party browser telemetry. Security headers (CSP, HSTS) remain strict and unweakened.

---

## 5. Non-Blocking Background Data Requests

To prevent dashboard and background data fetches from blocking or contending with the checkout pipeline:
- **`Promise.allSettled` Migration**: `src/app/(customer)/dashboard/page.tsx` now uses `Promise.allSettled` so any single slow endpoint fails gracefully without breaking the UI.
- **Short Timeouts**: All background fetches specify `timeoutMs: 6000`.
- **Zero Impact on Checkout**: Checkout payment flow does not await favorites, saved-drinks, or order lists; it only requires the active cart and verified server session.

---

## 6. Deterministic Checkout State Machine

The checkout lifecycle in `src/app/(customer)/checkout/page.tsx` implements a deterministic state machine:

```
                    ┌──────────────┐
                    │     idle     │
                    └──────┬───────┘
                           │ (Click Pay)
                    ┌──────▼───────┐
                    │creating_order│ ───────► [order_failed]
                    └──────┬───────┘
                           │ (Order created)
             ┌─────────────▼─────────────┐
             │ creating_payment_session  │ ──► [payment_session_failed]
             └─────────────┬─────────────┘
                           │ (Session received)
                    ┌──────▼───────┐
                    │loading_cashfr│ ───────► [cashfree_load_failed]
                    └──────┬───────┘
                           │ (SDK loaded)
                    ┌──────▼───────┐
                    │opening_cashfr│ ───────► [cashfree_open_failed]
                    └──────┬───────┘
                           │ (Modal mounted)
                    ┌──────▼───────┐
                    │payment_ready │
                    └──────────────┘
```

### Idempotency & Duplicate Order Prevention
- **`activeOrderId` Tracking**: When an order is created in `PENDING_PAYMENT`, its ID is retained in component state.
- **Retry Mechanism**: If payment session creation or SDK loading times out, clicking **[Retry Payment]** reuses the existing `activeOrderId` instead of creating redundant orders.
- **Button Locking**: The payment button is disabled throughout initialization, preventing double-clicks.

---

## 7. Automated Test Suite (192/192 PASSED)

The backend test suite was expanded with tests 185–192 specifically verifying Cashfree gateway resilience:

```text
  ✅ PASS: 185. Cashfree Gateway: Missing credentials throws PaymentGatewayError with HTTP 502 code
  ✅ PASS: 186. Cashfree Gateway: Invalid gateway response throws PaymentGatewayError with 502
  ✅ PASS: 187. Security: Customer B cannot create payment session for Customer A's order (403 Forbidden)
  ✅ PASS: 188. Idempotency: Multiple payment requests on same PENDING_PAYMENT order reuse order without duplicating
  ✅ PASS: 189. State Machine: Order starts in PENDING_PAYMENT and transitions to paid upon verified payment
  ✅ PASS: 190. Cashfree SDK: Script URL points to official Cashfree CDN (sdk.cashfree.com)
  ✅ PASS: 191. Webhook Idempotency: Re-submitting duplicate webhook is acknowledged with alreadyProcessed: true
  ✅ PASS: 192. Inventory Safety: Ingredient deduction occurs exactly once per confirmed order

📊 Verification Summary: 192 Passed, 0 Failed
```

---

## 8. Summary of Files Changed

| File Path | Description of Changes |
|:---|:---|
| `backend/src/services/payment/cashfree.provider.ts` | Added `PaymentGatewayError` (502), safe diagnostics, 12s timeout AbortSignal, and credentials validation. |
| `src/lib/api-client.ts` | Added `timeoutMs` support with `AbortController`, safe response text parsing, and structured 502/504 fallback handling. |
| `src/features/payments/cashfree-checkout.ts` | Hardened `loadCashfreeScript` with instant resolution check, 100ms interval polling, 10s timeout, and `redirectTarget: "_modal"`. |
| `src/lib/cashfree-loader.ts` | Created wrapper module re-exporting SDK loaders and constants. |
| `src/app/(customer)/checkout/page.tsx` | Implemented full state machine, `activeOrderId` retry reuse, informative error banner with `[Retry Payment]` and `[Review Tray]`. |
| `src/app/(customer)/dashboard/page.tsx` | Upgraded to `Promise.allSettled` with 6s timeouts for non-blocking telemetry. |
| `backend/src/test-verify.ts` | Added tests 185–192 covering gateway errors, security isolation, idempotency, and state lifecycle. |
| `docs/PHASE_8B1_PRODUCTION_AUDIT_REPORT.md` | Comprehensive audit report covering T0–T7 timeline, root causes, and verification evidence. |

---

## 9. Final Acceptance Checklist

- [x] Exact failing request identified (unbounded client fetch during backend spin-up + script load listener race condition).
- [x] No fake payment or bypass introduced (Cashfree Sandbox integration fully preserved).
- [x] Server-authoritative pricing strictly enforced.
- [x] Zero sensitive secrets exposed (`CASHFREE_SECRET_KEY` remains backend-only).
- [x] Official Cashfree Web SDK v3 modal loaded via CDN (`https://sdk.cashfree.com/js/v3/cashfree.js`).
- [x] COOP warning analyzed and confirmed non-blocking.
- [x] Background telemetry decoupled via `Promise.allSettled` and short timeouts.
- [x] Deterministic state machine with timeout recovery and idempotent retry implemented.
- [x] 192/192 backend tests passing.
- [x] Frontend Next.js production build verified.
