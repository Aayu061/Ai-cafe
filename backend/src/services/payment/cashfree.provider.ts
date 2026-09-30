import crypto from "crypto";
import { env } from "../../config/env";
import {
  CreatePaymentParams,
  IPaymentProvider,
  InternalPaymentStatus,
  PaymentOrderResult,
  PaymentVerificationResult,
  WebhookVerificationResult,
} from "../../types/payment";

export class PaymentGatewayError extends Error {
  public readonly statusCode = 502;
  public readonly code = "PAYMENT_GATEWAY_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "PaymentGatewayError";
  }
}

export interface CashfreeConfig {
  appId?: string;
  secretKey?: string;
  apiVersion?: string;
  environment?: "sandbox" | "production";
}

export class CashfreeProvider implements IPaymentProvider {
  public readonly name = "cashfree";
  private config?: CashfreeConfig;

  constructor(config?: CashfreeConfig) {
    this.config = config;
  }

  public getBaseUrl(): string {
    const environment = this.config?.environment || env.CASHFREE_ENVIRONMENT;
    if (environment === "production") {
      return "https://api.cashfree.com/pg";
    }
    return "https://sandbox.cashfree.com/pg";
  }

  private getHeaders(): Record<string, string> {
    const appId = this.config?.appId !== undefined ? this.config.appId : env.CASHFREE_APP_ID;
    const secretKey = this.config?.secretKey !== undefined ? this.config.secretKey : env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      throw new PaymentGatewayError(
        "Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in backend environment."
      );
    }

    return {
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": this.config?.apiVersion || env.CASHFREE_API_VERSION || "2025-01-01",
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Creates a Cashfree Order and returns the payment_session_id
   */
  async createPaymentOrder(params: CreatePaymentParams): Promise<PaymentOrderResult> {
    const url = `${this.getBaseUrl()}/orders`;
    const headers = this.getHeaders();

    // Standardize customer phone (Cashfree sandbox requires a 10-digit number)
    const phone = params.customer.phone && /^\d{10}$/.test(params.customer.phone)
      ? params.customer.phone
      : "9999999999";

    const payload = {
      order_id: params.orderId,
      order_amount: Number(params.amount.toFixed(2)),
      order_currency: params.currency || "INR",
      customer_details: {
        customer_id: params.customer.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50),
        customer_name: params.customer.name.slice(0, 100) || "AI Café Guest",
        customer_email: params.customer.email.slice(0, 100) || "guest@aicafe.internal",
        customer_phone: phone,
      },
      order_meta: {
        return_url: params.returnUrl,
        notify_url: params.notifyUrl || undefined,
      },
      order_note: (params.orderNote || "AI Café Artisan Beverage Order").slice(0, 200),
    };

    console.log(
      `[CashfreeProvider]: Initiating order ${params.orderId} (amount: ₹${params.amount}, env: ${env.CASHFREE_ENVIRONMENT})`
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let response: Response;
    let data: Record<string, unknown>;

    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      data = (await response.json()) as Record<string, unknown>;
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        console.error(`[CashfreeProvider]: Gateway request timed out after 12s for order ${params.orderId}`);
        throw new PaymentGatewayError(`Cashfree payment gateway request timed out after 12s. Please retry.`);
      }
      console.error(
        `[CashfreeProvider]: Network error reaching Cashfree gateway for order ${params.orderId}:`,
        (err as Error).message
      );
      throw new PaymentGatewayError(`Failed to communicate with Cashfree gateway: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    console.log(
      `[CashfreeProvider]: Order ${params.orderId} gateway response: HTTP ${response.status} (hasSessionId: ${Boolean(
        data.payment_session_id
      )})`
    );

    if (!response.ok) {
      const errorMsg =
        (data.message as string) ||
        (data.error as string) ||
        `Cashfree Order API returned status ${response.status}`;
      console.error(`[CashfreeProvider]: Failed to create payment order for ${params.orderId}:`, errorMsg);
      throw new PaymentGatewayError(`[Cashfree]: ${errorMsg}`);
    }

    const paymentSessionId = data.payment_session_id as string;
    const cfOrderId = String(data.cf_order_id || data.order_id || params.orderId);

    if (!paymentSessionId) {
      throw new PaymentGatewayError("[CashfreeProvider]: Gateway response did not contain payment_session_id");
    }

    return {
      paymentSessionId,
      providerOrderId: cfOrderId,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency || "INR",
      provider: "cashfree",
      environment: env.CASHFREE_ENVIRONMENT === "production" ? "production" : "sandbox",
    };
  }

  /**
   * Fetches payment status for an order directly from Cashfree
   */
  async getPaymentStatus(orderId: string): Promise<PaymentVerificationResult> {
    const url = `${this.getBaseUrl()}/orders/${orderId}/payments`;
    const headers = this.getHeaders();

    console.log(`[CashfreeProvider]: Querying payment status for order ${orderId}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        console.error(`[CashfreeProvider]: Status lookup timed out after 12s for order ${orderId}`);
        throw new PaymentGatewayError(`Cashfree payment verification timed out after 12s.`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      if (response.status === 404) {
        return {
          orderId,
          providerOrderId: orderId,
          amount: 0,
          currency: "INR",
          status: "PENDING",
          rawStatus: "NOT_FOUND",
        };
      }
      throw new PaymentGatewayError(`[CashfreeProvider]: Failed to get payment status (HTTP ${response.status})`);
    }

    const payments = (await response.json()) as Array<Record<string, unknown>>;

    if (!Array.isArray(payments) || payments.length === 0) {
      return {
        orderId,
        providerOrderId: orderId,
        amount: 0,
        currency: "INR",
        status: "PENDING",
        rawStatus: "NO_PAYMENT_ATTEMPTS",
      };
    }

    // Look for any successful attempt first, otherwise use latest attempt
    const successfulPayment = payments.find(
      (p) => String(p.payment_status).toUpperCase() === "SUCCESS"
    );
    const target = successfulPayment || payments[payments.length - 1];

    const rawStatus = String(target.payment_status || "PENDING").toUpperCase();
    let status: InternalPaymentStatus = "PENDING";

    if (rawStatus === "SUCCESS") {
      status = "SUCCESS";
    } else if (rawStatus === "FAILED") {
      status = "FAILED";
    } else if (rawStatus === "CANCELLED" || rawStatus === "USER_DROPPED") {
      status = "CANCELLED";
    }

    return {
      orderId,
      providerOrderId: String(target.cf_payment_id || target.order_id || orderId),
      providerPaymentId: target.cf_payment_id ? String(target.cf_payment_id) : undefined,
      amount: Number(target.payment_amount || 0),
      currency: String(target.payment_currency || "INR"),
      status,
      rawStatus,
      paymentMethod: target.payment_group ? String(target.payment_group) : undefined,
      bankReference: target.bank_reference ? String(target.bank_reference) : undefined,
      paymentTime: target.payment_time ? String(target.payment_time) : undefined,
      rawResponse: target,
    };
  }

  /**
   * Cryptographically verifies Cashfree webhook signature using HMAC-SHA256
   */
  async verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult> {
    const signatureHeader =
      headers["x-webhook-signature"] ||
      headers["x-cf-signature"] ||
      headers["X-Webhook-Signature"];
    const timestampHeader =
      headers["x-webhook-timestamp"] ||
      headers["x-cf-timestamp"] ||
      headers["X-Webhook-Timestamp"];

    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const timestamp = Array.isArray(timestampHeader) ? timestampHeader[0] : timestampHeader;

    if (!signature || !timestamp) {
      return {
        isValid: false,
        error: "Missing x-webhook-signature or x-webhook-timestamp header",
      };
    }

    const secretKey = env.CASHFREE_SECRET_KEY;
    if (!secretKey) {
      return {
        isValid: false,
        error: "Cashfree secret key not configured",
      };
    }

    // Verify timestamp freshness (allow up to 10 minutes clock drift to prevent replay attacks)
    const webhookTime = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (!isNaN(webhookTime) && Math.abs(now - webhookTime) > 600) {
      return {
        isValid: false,
        error: "Webhook timestamp expired (replay attack defense)",
      };
    }

    // Cashfree algorithm: HMAC-SHA256 of (timestamp + rawBody)
    const dataToSign = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(dataToSign)
      .digest("base64");

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return {
        isValid: false,
        error: "Invalid cryptographic webhook signature",
      };
    }

    try {
      const payload = JSON.parse(rawBody) as Record<string, any>;
      const eventType = payload.type || payload.event || "UNKNOWN_EVENT";
      const data = payload.data || {};
      const order = data.order || {};
      const payment = data.payment || {};

      const orderId = order.order_id || payload.order_id;
      const paymentId = payment.cf_payment_id ? String(payment.cf_payment_id) : undefined;
      const amount = payment.payment_amount || order.order_amount;
      const currency = payment.payment_currency || order.order_currency || "INR";
      const paymentStatus = payment.payment_status || "PENDING";

      let status: InternalPaymentStatus = "PENDING";
      if (paymentStatus === "SUCCESS" || eventType === "PAYMENT_SUCCESS_WEBHOOK") {
        status = "SUCCESS";
      } else if (paymentStatus === "FAILED" || eventType === "PAYMENT_FAILED_WEBHOOK") {
        status = "FAILED";
      } else if (paymentStatus === "USER_DROPPED" || paymentStatus === "CANCELLED") {
        status = "CANCELLED";
      }

      return {
        isValid: true,
        orderId,
        paymentId,
        amount: amount ? Number(amount) : undefined,
        currency,
        status,
        eventType,
        eventTime: payload.event_time,
        rawPayload: payload,
      };
    } catch (err) {
      return {
        isValid: false,
        error: `Malformed JSON webhook payload: ${(err as Error).message}`,
      };
    }
  }
}

export const cashfreeProvider = new CashfreeProvider();
