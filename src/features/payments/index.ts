/**
 * Phase 8 Extension Point: Secure Payment Verification
 * Cryptographic server-verification boundary for Razorpay / Stripe gateway integration.
 */

export type PaymentGatewayProvider = "razorpay" | "stripe" | "mock_artisan";

export interface PaymentVerificationIntent {
  paymentIntentId: string;
  orderId: string;
  amount: number;
  currency: "INR";
  provider: PaymentGatewayProvider;
  signatureVerified: boolean;
  status: "pending" | "processing" | "succeeded" | "failed";
}
