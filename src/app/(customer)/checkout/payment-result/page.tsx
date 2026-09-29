"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/features/cart/cart-context";
import { apiFetch } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  ShoppingBag,
  ShieldCheck,
  Coffee,
  HelpCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface VerificationResponse {
  success: boolean;
  status: "SUCCESS" | "FAILED" | "PENDING" | "CANCELLED" | "CREATED";
  order?: {
    id: string;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
    cashfreeOrderId?: string;
    paymentTransactionId?: string;
  };
  payment?: {
    orderId: string;
    providerOrderId: string;
    providerPaymentId?: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();

  const orderId = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSandboxGuide, setShowSandboxGuide] = useState(false);

  // Authoritative server-side verification: NEVER trusts client URL params alone
  const verifyPayment = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      setErrorMessage("No Order ID provided in payment return URL.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = (await apiFetch<VerificationResponse>(
        `/api/payments/cashfree/status/${orderId}`
      )) as any;

      if (!res.success) {
        setErrorMessage(res.error?.message || "Failed to verify payment with server.");
        setData(null);
      } else {
        setData(res);
        if (res.status === "SUCCESS") {
          // Clear cart only after verified server confirmation
          clearCart();
        }
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Network error while verifying payment.");
    } finally {
      setLoading(false);
    }
  }, [orderId, clearCart]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  const isSuccess = data?.status === "SUCCESS";
  const isFailed = data?.status === "FAILED" || data?.status === "CANCELLED";
  const isPending = data?.status === "PENDING" || data?.status === "CREATED";

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans">
      <Navbar />

      <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
        <Container className="max-w-xl">
          <div className="bg-offwhite rounded-3xl border border-espresso/10 p-6 sm:p-10 shadow-card text-center space-y-6">
            {/* Header Badge */}
            <div className="flex items-center justify-center gap-1.5">
              <Badge variant="caramel" size="sm" className="gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cashfree Sandbox Engine</span>
              </Badge>
            </div>

            {/* 1. Loading / Verifying State */}
            {loading && (
              <div className="py-12 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-caramel/15 flex items-center justify-center text-caramel animate-pulse">
                  <Clock className="w-8 h-8 animate-spin" />
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
                  Verifying your payment...
                </h1>
                <p className="text-sm text-warmgray max-w-sm mx-auto">
                  Connecting to Cashfree Sandbox API and synchronizing server-authoritative payment records.
                </p>
              </div>
            )}

            {/* 2. Success State */}
            {!loading && isSuccess && data?.order && (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-forest/15 text-forest flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                    Order Confirmed
                  </h1>
                  <p className="text-sm sm:text-base text-caramel font-serif italic">
                    “Your café moment is confirmed. Your drink is now moving to the café.”
                  </p>
                </div>

                {/* Order Receipt Card */}
                <div className="p-5 rounded-2xl bg-cream/70 border border-espresso/10 text-left space-y-3">
                  <div className="flex items-center justify-between text-xs text-warmgray border-b border-espresso/10 pb-2">
                    <span>AI Café Order ID</span>
                    <span className="font-mono font-bold text-espresso">{data.order.id}</span>
                  </div>

                  {data.order.cashfreeOrderId && (
                    <div className="flex items-center justify-between text-xs text-warmgray border-b border-espresso/10 pb-2">
                      <span>Cashfree Reference</span>
                      <span className="font-mono text-espresso text-[11px]">
                        {data.order.cashfreeOrderId}
                      </span>
                    </div>
                  )}

                  {data.order.paymentTransactionId && (
                    <div className="flex items-center justify-between text-xs text-warmgray border-b border-espresso/10 pb-2">
                      <span>Payment Transaction</span>
                      <span className="font-mono text-espresso text-[11px]">
                        {data.order.paymentTransactionId}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-warmgray border-b border-espresso/10 pb-2">
                    <span>Order Status</span>
                    <Badge variant="caramel" size="sm">
                      Kitchen Preparing
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-base font-bold text-espresso pt-1">
                    <span>Amount Paid</span>
                    <span className="font-serif text-xl text-caramel">
                      {formatPrice(data.order.total)}
                    </span>
                  </div>
                </div>

                {/* Post-order CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/profile" className="flex-1">
                    <Button variant="primary" size="md" className="w-full gap-2 shadow-soft">
                      <Coffee className="w-4 h-4 text-caramel" />
                      <span>Track Order</span>
                    </Button>
                  </Link>
                  <Link href="/builder" className="flex-1">
                    <Button variant="outline" size="md" className="w-full gap-2 border-espresso/20">
                      <Sparkles className="w-4 h-4 text-caramel" />
                      <span>Craft Another Drink</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* 3. Pending State */}
            {!loading && isPending && (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h1 className="font-serif text-3xl font-bold text-espresso">
                    Payment Pending
                  </h1>
                  <p className="text-sm text-warmgray max-w-sm mx-auto">
                    Cashfree is processing your transaction with your bank. We will confirm your order as soon as authorization arrives.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800">
                  Order ID: <span className="font-mono font-bold">{orderId}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={verifyPayment}
                    className="flex-1 gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Check Again</span>
                  </Button>
                  <Link href="/checkout" className="flex-1">
                    <Button variant="outline" size="md" className="w-full border-espresso/20">
                      Back to Checkout
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* 4. Failed / Cancelled State */}
            {!loading && (isFailed || errorMessage) && (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <XCircle className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h1 className="font-serif text-3xl font-bold text-espresso">
                    Payment wasn&apos;t completed.
                  </h1>
                  <p className="text-sm text-warmgray max-w-sm mx-auto">
                    {errorMessage || "The transaction was cancelled or declined by the payment provider."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 text-left">
                  <p className="font-semibold mb-1">Notice:</p>
                  <p className="text-red-700">
                    No money was deducted and café inventory was not altered. You can safely retry with Cashfree Sandbox testing credentials.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/checkout" className="flex-1">
                    <Button variant="primary" size="md" className="w-full gap-2 shadow-soft">
                      <RotateCcw className="w-4 h-4 text-caramel" />
                      <span>Try Again</span>
                    </Button>
                  </Link>
                  <Link href="/builder" className="flex-1">
                    <Button variant="outline" size="md" className="w-full gap-2 border-espresso/20">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Back to Cart</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* 5. Cashfree Sandbox Testing Guide (Collapsible) */}
            <div className="pt-4 border-t border-espresso/10">
              <button
                type="button"
                onClick={() => setShowSandboxGuide(!showSandboxGuide)}
                className="inline-flex items-center gap-1.5 text-xs text-warmgray hover:text-espresso transition-colors font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5 text-caramel" />
                <span>{showSandboxGuide ? "Hide" : "Show"} Cashfree Sandbox Test Instruments</span>
              </button>

              {showSandboxGuide && (
                <div className="mt-4 p-4 rounded-xl bg-cream/80 border border-espresso/10 text-left text-xs text-espresso space-y-3">
                  <p className="font-bold text-espresso">Official Cashfree Sandbox Test Credentials:</p>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-espresso/5 pb-1">
                      <span className="text-warmgray">UPI Success:</span>
                      <span className="text-forest font-bold">testsuccess@gocash</span>
                    </div>
                    <div className="flex justify-between border-b border-espresso/5 pb-1">
                      <span className="text-warmgray">UPI Failure:</span>
                      <span className="text-red-600 font-bold">testfailure@gocash</span>
                    </div>
                    <div className="flex justify-between border-b border-espresso/5 pb-1">
                      <span className="text-warmgray">UPI Invalid:</span>
                      <span className="text-warmgray font-bold">testinvalid@gocash</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-warmgray">Test Card:</span>
                      <span className="text-espresso font-bold">4111 1111 1111 1111</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-warmgray">
                    OTP for Sandbox test cards is any 6 digits (e.g. 123456).
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream font-serif text-espresso">
          Verifying payment status...
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
