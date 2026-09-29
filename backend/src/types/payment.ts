/**
 * AI CAFÉ — Phase 8 Payment & Cashfree Gateway Types
 */

export type InternalPaymentStatus =
  | "CREATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type InternalOrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED";

export interface CreatePaymentParams {
  orderId: string; // Internal AI Café orderId
  amount: number; // In INR (Authoritative server-calculated)
  currency?: string; // "INR" default
  customer: {
    id: string; // Firebase UID
    name: string;
    email: string;
    phone?: string;
  };
  returnUrl: string;
  notifyUrl?: string;
  orderNote?: string;
}

export interface PaymentOrderResult {
  paymentSessionId: string;
  providerOrderId: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: "cashfree";
  environment: "sandbox" | "production";
}

export interface PaymentVerificationResult {
  orderId: string;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: InternalPaymentStatus;
  rawStatus: string;
  paymentMethod?: string;
  bankReference?: string;
  paymentTime?: string;
  rawResponse?: Record<string, unknown>;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  orderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  status?: InternalPaymentStatus;
  eventType?: string;
  eventTime?: string;
  error?: string;
  rawPayload?: Record<string, unknown>;
}

export interface IPaymentProvider {
  name: string;
  createPaymentOrder(params: CreatePaymentParams): Promise<PaymentOrderResult>;
  getPaymentStatus(orderId: string): Promise<PaymentVerificationResult>;
  verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult>;
}

export interface PaymentDoc {
  paymentId: string;
  orderId: string;
  userId: string;
  provider: "cashfree";
  providerOrderId: string;
  providerPaymentId?: string;
  paymentSessionId?: string;
  amount: number;
  currency: string;
  status: InternalPaymentStatus;
  rawStatus?: string;
  paymentMethod?: string;
  bankReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEventDoc {
  id: string; // Unique idempotency key
  provider: "cashfree";
  eventType: string;
  orderId: string;
  paymentId?: string;
  status: string;
  processed: boolean;
  receivedAt: string;
  processedAt?: string;
  metadata?: Record<string, unknown>;
}
