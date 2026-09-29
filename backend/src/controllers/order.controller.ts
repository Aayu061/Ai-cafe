import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/operations/order.service";
import { paymentService } from "../services/payment/payment.service";
import {
  createOrderSchema,
  createPaymentSessionSchema,
  orderIdParamSchema,
} from "../validators/payment.schemas";

/**
 * POST /api/orders
 * Creates an order with 100% server-authoritative pricing and validation
 */
export async function createOrder(
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
          message: "Authentication is required to place an order.",
        },
      });
      return;
    }

    const input = createOrderSchema.parse(req.body);

    const order = await orderService.createOrder({
      userId: req.user.uid,
      customerName: input.customerName || req.user.name || "AI Café Patron",
      customerEmail: input.customerEmail || req.user.email || "patron@aicafe.internal",
      customerPhone: input.customerPhone,
      items: input.items,
      fulfillmentType: input.fulfillmentType,
      notes: input.notes,
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders
 * Retrieves orders. For customers, strictly limits to their own orders (req.user.uid).
 * For staff/admin, allows viewing all orders or filtering by status/userId.
 */
export async function getOrders(
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
          message: "Authentication is required to view orders.",
        },
      });
      return;
    }

    const isStaffOrAdmin = ["staff", "admin", "super_admin"].includes(req.user.role);
    // If not staff/admin, customer can ONLY see their own orders
    const targetUserId = isStaffOrAdmin ? (req.query.userId as string | undefined) : req.user.uid;
    const targetStatus = req.query.status as any;

    const orders = await orderService.getOrders(targetStatus, targetUserId);

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/:orderId
 * Retrieves order details with strict customer ownership and staff RBAC checks
 */
export async function getOrderById(
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
          message: "Authentication is required to view order details.",
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

    // Security check: Only the customer who placed the order or staff/admin can access
    const isOwner = order.userId === req.user.uid;
    const isPrivilegedStaff = ["staff", "admin", "super_admin"].includes(req.user.role);

    if (!isOwner && !isPrivilegedStaff) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied. You can only access your own orders.",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/orders/:orderId/payment
 * Creates a Cashfree payment session for an existing order
 */
export async function createOrderPayment(
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
          message: "Authentication is required to initiate payment.",
        },
      });
      return;
    }

    const { orderId } = orderIdParamSchema.parse(req.params);
    const { returnUrl, notifyUrl } = createPaymentSessionSchema.parse(req.body);

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

    // Security check: Customer can only pay for their own order
    const isOwner = order.userId === req.user.uid;
    const isPrivilegedStaff = ["staff", "admin", "super_admin"].includes(req.user.role);

    if (!isOwner && !isPrivilegedStaff) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied. You cannot pay for another customer's order.",
        },
      });
      return;
    }

    if (order.paymentStatus === "paid") {
      res.status(400).json({
        success: false,
        error: {
          code: "ORDER_ALREADY_PAID",
          message: "This order has already been paid and confirmed.",
        },
      });
      return;
    }

    if (order.status === "cancelled") {
      res.status(400).json({
        success: false,
        error: {
          code: "ORDER_CANCELLED",
          message: "Cannot initiate payment for a cancelled order.",
        },
      });
      return;
    }

    const session = await paymentService.createPaymentSession(order, returnUrl, notifyUrl);

    res.status(200).json({
      success: true,
      paymentSessionId: session.paymentSessionId,
      providerOrderId: session.providerOrderId,
      orderId: order.id,
      amount: session.amount,
      currency: session.currency,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders/:orderId/payment
 * Retrieves payment status and record for an order
 */
export async function getOrderPayment(
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
          message: "Authentication is required to view payment status.",
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

    const isOwner = order.userId === req.user.uid;
    const isPrivilegedStaff = ["staff", "admin", "super_admin"].includes(req.user.role);

    if (!isOwner && !isPrivilegedStaff) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied. You can only view payment details for your own orders.",
        },
      });
      return;
    }

    const payment = await paymentService.getPaymentByOrderId(orderId);

    res.status(200).json({
      success: true,
      payment,
      order: {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        cashfreeOrderId: order.cashfreeOrderId,
        paymentSessionId: order.paymentSessionId,
        total: order.total,
        currency: order.currency,
      },
    });
  } catch (error) {
    next(error);
  }
}
