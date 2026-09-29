import { Router } from "express";
import {
  getCashfreeStatus,
  handleCashfreeWebhook,
} from "../controllers/payment.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// GET /api/payments/cashfree/status/:orderId — Fetch latest payment status directly from Cashfree
router.get("/payments/cashfree/status/:orderId", authRateLimiter, requireAuth, getCashfreeStatus);

// POST /api/payments/cashfree/webhook — Cashfree server-to-server webhook endpoint
router.post("/payments/cashfree/webhook", handleCashfreeWebhook);

export const paymentRoutes = router;
export default paymentRoutes;
