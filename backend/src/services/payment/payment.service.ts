import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../../config/firebase-admin";
import { OrderDoc } from "../../types/operations";
import {
  IPaymentProvider,
  PaymentDoc,
  PaymentEventDoc,
  PaymentOrderResult,
  PaymentVerificationResult,
} from "../../types/payment";
import { cashfreeProvider } from "./cashfree.provider";
import { orderService } from "../operations/order.service";
import { inventoryService } from "../operations/inventory.service";
import { recipeService } from "../operations/recipe.service";
import { auditService } from "../operations/audit.service";

export class PaymentService {
  private provider: IPaymentProvider;
  private memoryPayments: Map<string, PaymentDoc> = new Map();
  private memoryEvents: Map<string, PaymentEventDoc> = new Map();
  private processedOrderDeductions: Set<string> = new Set();

  constructor(provider: IPaymentProvider = cashfreeProvider) {
    this.provider = provider;
  }

  /**
   * Sets custom provider (useful for testing and extensibility)
   */
  setProvider(provider: IPaymentProvider) {
    this.provider = provider;
  }

  /**
   * Initiates payment for an internal order and gets Cashfree payment_session_id
   */
  async createPaymentSession(
    order: OrderDoc,
    returnUrl: string,
    notifyUrl?: string
  ): Promise<PaymentOrderResult> {
    if (order.total <= 0) {
      throw new Error(`Invalid order amount: ₹${order.total}. Must be greater than 0.`);
    }

    const result = await this.provider.createPaymentOrder({
      orderId: order.id,
      amount: order.total,
      currency: order.currency || "INR",
      customer: {
        id: order.userId || "guest",
        name: order.customerName || "AI Café Guest",
        email: order.customerEmail || "guest@aicafe.internal",
        phone: order.customerPhone || "9999999999",
      },
      returnUrl,
      notifyUrl,
      orderNote: `AI Café Order ${order.id}`,
    });

    const now = new Date().toISOString();
    const paymentDoc: PaymentDoc = {
      paymentId: `pay-${order.id}-${Date.now()}`,
      orderId: order.id,
      userId: order.userId,
      provider: "cashfree",
      providerOrderId: result.providerOrderId,
      paymentSessionId: result.paymentSessionId,
      amount: order.total,
      currency: order.currency || "INR",
      status: "CREATED",
      createdAt: now,
      updatedAt: now,
    };

    this.memoryPayments.set(order.id, paymentDoc);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await Promise.all([
          db.collection("payments").doc(paymentDoc.paymentId).set(paymentDoc),
          db.collection("orders").doc(order.id).update({
            cashfreeOrderId: result.providerOrderId,
            paymentSessionId: result.paymentSessionId,
            paymentOrderId: result.providerOrderId,
            paymentStatus: "processing",
            updatedAt: now,
          }),
        ]);
      } catch (err) {
        console.warn("[PaymentService]: Firestore sync failed for payment session:", (err as Error).message);
      }
    }

    // Update in-memory order
    order.cashfreeOrderId = result.providerOrderId;
    order.paymentSessionId = result.paymentSessionId;
    order.paymentOrderId = result.providerOrderId;
    order.paymentStatus = "processing";
    order.updatedAt = now;

    return result;
  }

  /**
   * Fetches payment status from Cashfree, verifies amount and order state, and confirms order if successful
   */
  async verifyAndSyncPayment(orderId: string): Promise<{
    order: OrderDoc;
    payment: PaymentVerificationResult;
  }> {
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const verification = await this.provider.getPaymentStatus(orderId);

    // Security Check: Verify amount and currency to detect tampering
    if (verification.status === "SUCCESS") {
      if (Math.abs(verification.amount - order.total) > 0.01) {
        console.error(`[PaymentService]: Security Alert - Amount mismatch for order ${orderId}: Expected ${order.total}, got ${verification.amount}`);
        verification.status = "FAILED";
      }

      if (verification.currency && verification.currency.toUpperCase() !== (order.currency || "INR").toUpperCase()) {
        console.error(`[PaymentService]: Security Alert - Currency mismatch for order ${orderId}: Expected ${order.currency || "INR"}, got ${verification.currency}`);
        verification.status = "FAILED";
      }
    }

    // Process State Transitions
    if (verification.status === "SUCCESS" && order.paymentStatus !== "paid") {
      await this.confirmOrderPayment(order, verification);
    } else if (verification.status === "FAILED" && order.paymentStatus !== "paid") {
      await this.markOrderPaymentFailed(order, verification);
    }

    return { order, payment: verification };
  }

  /**
   * Processes incoming Cashfree webhook with cryptographic signature validation & idempotency
   */
  async processWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{
    success: boolean;
    alreadyProcessed?: boolean;
    orderId?: string;
    status?: string;
    message?: string;
  }> {
    const verification = await this.provider.verifyWebhook(rawBody, headers);
    if (!verification.isValid || !verification.orderId) {
      return {
        success: false,
        message: verification.error || "Invalid webhook payload or signature",
      };
    }

    const orderId = verification.orderId;
    const eventType = verification.eventType || "PAYMENT_EVENT";
    const paymentId = verification.paymentId || "cf_event";

    // Strict Idempotency Check: Prevent duplicate event processing
    const idempotencyKey = `cashfree-${orderId}-${paymentId}-${verification.status}`;

    if (this.memoryEvents.has(idempotencyKey)) {
      return {
        success: true,
        alreadyProcessed: true,
        orderId,
        status: verification.status,
        message: "Duplicate webhook event acknowledged and skipped",
      };
    }

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const eventDoc = await db.collection("paymentEvents").doc(idempotencyKey).get();
        if (eventDoc.exists && eventDoc.data()?.processed) {
          return {
            success: true,
            alreadyProcessed: true,
            orderId,
            status: verification.status,
            message: "Duplicate webhook event acknowledged from Firestore and skipped",
          };
        }
      } catch (err) {
        console.warn("[PaymentService]: Firestore idempotency check error:", (err as Error).message);
      }
    }

    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return {
        success: false,
        message: `Order #${orderId} not found in AI Café system`,
      };
    }

    // Amount & Currency Validation
    if (verification.amount !== undefined && Math.abs(verification.amount - order.total) > 0.01) {
      console.error(`[PaymentService]: Security Alert - Webhook amount mismatch for order ${orderId}: Expected ${order.total}, got ${verification.amount}`);
      return {
        success: false,
        message: "Amount mismatch detected in webhook",
      };
    }

    // Record Event Receipt
    const now = new Date().toISOString();
    const eventRecord: PaymentEventDoc = {
      id: idempotencyKey,
      provider: "cashfree",
      eventType,
      orderId,
      paymentId,
      status: verification.status || "UNKNOWN",
      processed: false,
      receivedAt: now,
      metadata: verification.rawPayload,
    };
    this.memoryEvents.set(idempotencyKey, eventRecord);

    if (verification.status === "SUCCESS") {
      await this.confirmOrderPayment(order, {
        orderId,
        providerOrderId: orderId,
        providerPaymentId: paymentId,
        amount: verification.amount || order.total,
        currency: verification.currency || "INR",
        status: "SUCCESS",
        rawStatus: "SUCCESS",
        paymentTime: verification.eventTime,
      });
    } else if (verification.status === "FAILED") {
      await this.markOrderPaymentFailed(order, {
        orderId,
        providerOrderId: orderId,
        providerPaymentId: paymentId,
        amount: verification.amount || order.total,
        currency: verification.currency || "INR",
        status: "FAILED",
        rawStatus: "FAILED",
      });
    }

    // Mark event processed
    eventRecord.processed = true;
    eventRecord.processedAt = new Date().toISOString();

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("paymentEvents").doc(idempotencyKey).set(eventRecord);
      } catch (err) {
        console.warn("[PaymentService]: Failed to save payment event to Firestore:", (err as Error).message);
      }
    }

    return {
      success: true,
      orderId,
      status: verification.status,
      message: "Webhook processed successfully",
    };
  }

  /**
   * Confirms payment, marks order paid & confirmed, deducts inventory, and routes to kitchen
   */
  private async confirmOrderPayment(
    order: OrderDoc,
    verification: PaymentVerificationResult
  ): Promise<void> {
    const now = new Date().toISOString();

    order.paymentStatus = "paid";
    order.status = "preparing"; // Moving to kitchen!
    order.paymentTransactionId = verification.providerPaymentId;
    order.paymentId = verification.providerPaymentId;
    order.updatedAt = now;

    // Update Payment Doc
    let paymentDoc = this.memoryPayments.get(order.id);
    if (!paymentDoc) {
      paymentDoc = {
        paymentId: `pay-${order.id}`,
        orderId: order.id,
        userId: order.userId,
        provider: "cashfree",
        providerOrderId: verification.providerOrderId,
        providerPaymentId: verification.providerPaymentId,
        amount: verification.amount,
        currency: verification.currency,
        status: "SUCCESS",
        paymentMethod: verification.paymentMethod,
        bankReference: verification.bankReference,
        createdAt: now,
        updatedAt: now,
      };
      this.memoryPayments.set(order.id, paymentDoc);
    } else {
      paymentDoc.status = "SUCCESS";
      paymentDoc.providerPaymentId = verification.providerPaymentId;
      paymentDoc.paymentMethod = verification.paymentMethod;
      paymentDoc.bankReference = verification.bankReference;
      paymentDoc.updatedAt = now;
    }

    // Idempotent Inventory Deduction (Crucial: only occurs upon verified successful payment)
    await this.deductOrderInventory(order);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await Promise.all([
          db.collection("orders").doc(order.id).update({
            status: "preparing",
            paymentStatus: "paid",
            paymentId: verification.providerPaymentId || null,
            paymentTransactionId: verification.providerPaymentId || null,
            updatedAt: now,
          }),
          db.collection("payments").doc(paymentDoc.paymentId).set(paymentDoc, { merge: true }),
        ]);
      } catch (err) {
        console.warn("[PaymentService]: Failed to update Firestore on payment confirmation:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId: order.userId || "system",
      actorRole: "customer",
      action: "ORDER_PAID_CONFIRMED",
      resourceType: "order",
      resourceId: order.id,
      metadata: {
        provider: "cashfree",
        amount: verification.amount,
        currency: verification.currency,
        paymentId: verification.providerPaymentId,
      },
    });
  }

  /**
   * Marks payment as failed without touching inventory
   */
  private async markOrderPaymentFailed(
    order: OrderDoc,
    _verification: PaymentVerificationResult
  ): Promise<void> {
    const now = new Date().toISOString();
    order.paymentStatus = "failed";
    order.updatedAt = now;

    const paymentDoc = this.memoryPayments.get(order.id);
    if (paymentDoc) {
      paymentDoc.status = "FAILED";
      paymentDoc.updatedAt = now;
    }

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("orders").doc(order.id).update({
          paymentStatus: "failed",
          updatedAt: now,
        });
      } catch (err) {
        console.warn("[PaymentService]: Failed to update Firestore on payment failure:", (err as Error).message);
      }
    }
  }

  /**
   * Safe, Idempotent Inventory Deduction
   * Guaranteed to deduct ingredients at most once per order ID
   */
  async deductOrderInventory(order: OrderDoc): Promise<void> {
    if (this.processedOrderDeductions.has(order.id)) {
      return; // Already deducted!
    }
    this.processedOrderDeductions.add(order.id);

    try {
      const inventory = await inventoryService.getInventory();

      for (const item of order.items) {
        const recipe = await recipeService.getRecipeByProductId(item.productId);
        if (!recipe) continue;

        for (const ing of recipe.ingredients) {
          const invItem = inventory.find((i) => i.ingredientId === ing.ingredientId);
          if (!invItem) continue;

          let deductionQty = ing.quantity * item.quantity;
          if (invItem.unit === "l" && ing.unit === "ml") {
            deductionQty = deductionQty / 1000;
          } else if (invItem.unit === "kg" && ing.unit === "g") {
            deductionQty = deductionQty / 1000;
          }
          const totalQuantityDelta = -Number(deductionQty.toFixed(3));

          await inventoryService.adjustStock(
            invItem.id,
            totalQuantityDelta,
            "order_consumption",
            `Order #${order.id} consumption (${item.productName} x${item.quantity})`,
            "system",
            "customer",
            order.id
          );
        }
      }
    } catch (err) {
      console.error(`[PaymentService]: Error during inventory deduction for order ${order.id}:`, (err as Error).message);
    }
  }

  /**
   * Retrieves payment document for an order
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentDoc | null> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const snap = await db.collection("payments").where("orderId", "==", orderId).limit(1).get();
        if (!snap.empty) {
          return snap.docs[0].data() as PaymentDoc;
        }
      } catch (err) {
        console.warn("[PaymentService]: Firestore payment lookup failed:", (err as Error).message);
      }
    }
    return this.memoryPayments.get(orderId) || null;
  }
}

export const paymentService = new PaymentService();
