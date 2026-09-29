import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  createOrderPayment,
  getOrderPayment,
} from "../controllers/order.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// GET /api/orders — List customer's orders (or all if staff/admin)
router.get("/orders", authRateLimiter, requireAuth, getOrders);

// POST /api/orders — Server-authoritative order creation
router.post("/orders", authRateLimiter, requireAuth, createOrder);

// GET /api/orders/:orderId — Retrieve order details (customer ownership or staff RBAC)
router.get("/orders/:orderId", authRateLimiter, requireAuth, getOrderById);

// POST /api/orders/:orderId/payment — Create Cashfree payment session
router.post("/orders/:orderId/payment", authRateLimiter, requireAuth, createOrderPayment);

// GET /api/orders/:orderId/payment — Retrieve payment status & doc for order
router.get("/orders/:orderId/payment", authRateLimiter, requireAuth, getOrderPayment);

export const orderRoutes = router;
export default orderRoutes;
