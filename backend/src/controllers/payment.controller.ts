import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/operations/order.service";
import { paymentService } from "../services/payment/payment.service";
import { orderIdParamSchema } from "../validators/payment.schemas";

/**
 * GET /api/payments/cashfree/status/:orderId
 * Fetches the latest verified status from Cashfree and synchronizes order & payment states
 */
export async function getCashfreeStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required to query payment status.",
        },
      });
      return;
    }

    const { orderId } = orderIdParamSchema.parse(req.params);
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: "ORDER_NOT_FOUND",
          message: `Order #${orderId} was not found.`,
        },
      });
      return;
    }

    // Security check: Only order owner or privileged staff can check status
    const isOwner = order.userId === req.user.uid;
    const isPrivilegedStaff = ["staff", "admin", "super_admin"].includes(req.user.role);

    if (!isOwner && !isPrivilegedStaff) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied. You can only query payment status for your own orders.",
        },
      });
      return;
    }

    const result = await paymentService.verifyAndSyncPayment(orderId);

    res.status(200).json({
      success: true,
      status: result.payment.status,
      order: {
        id: result.order.id,
        status: result.order.status,
        paymentStatus: result.order.paymentStatus,
        total: result.order.total,
        currency: result.order.currency,
        cashfreeOrderId: result.order.cashfreeOrderId,
        paymentTransactionId: result.order.paymentTransactionId,
      },
      payment: result.payment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/cashfree/webhook
 * Receives and cryptographically verifies Cashfree payment webhooks
 */
export async function handleCashfreeWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Obtain raw body preserved by express.json verify hook
    const rawBody = (req as any).rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));

    const result = await paymentService.processWebhook(rawBody, req.headers as Record<string, string | string[] | undefined>);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "WEBHOOK_VERIFICATION_FAILED",
          message: result.message || "Failed to verify or process webhook",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      alreadyProcessed: result.alreadyProcessed || false,
      orderId: result.orderId,
      status: result.status,
    });
  } catch (error) {
    next(error);
  }
}
