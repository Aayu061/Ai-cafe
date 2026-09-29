"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCart } from "@/features/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { launchCashfreeCheckout } from "@/features/payments/cashfree-checkout";
import {
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Coffee,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
  Store,
  Car,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { items, cartSubtotal, cartCount } = useCart();

  const [fulfillmentType, setFulfillmentType] = useState<"takeaway" | "dine-in" | "curbside">("takeaway");
  const [tableOrVehicle, setTableOrVehicle] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("9999999999");

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInitiatePayment = async () => {
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add drinks before checkout.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage("Preparing your payment...");

    try {
      // 1. Create Server-Authoritative AI Café Order
      const combinedNotes = [
        tableOrVehicle ? `Location/Table: ${tableOrVehicle}` : "",
        notes ? `Notes: ${notes}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          configuration: item.configuration,
          configurationSummary: item.configurationSummary,
        })),
        customerName: userProfile?.displayName || user.displayName || "AI Café Patron",
        customerEmail: user.email || "patron@aicafe.internal",
        customerPhone: phone || "9999999999",
        fulfillmentType,
        notes: combinedNotes || undefined,
      };

      const orderRes = (await apiFetch<{ order: { id: string } }>("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      })) as any;

      if (!orderRes.success || !orderRes.order?.id) {
        throw new Error(orderRes.error?.message || "Failed to create order on server.");
      }

      const orderId = orderRes.order.id;

      // 2. Request Cashfree Payment Session from Backend
      setStatusMessage("Opening secure checkout...");

      const returnUrl = `${window.location.origin}/checkout/payment-result?order_id=${orderId}`;

      const sessionRes = (await apiFetch<{
        paymentSessionId: string;
        providerOrderId: string;
      }>(`/api/orders/${orderId}/payment`, {
        method: "POST",
        body: JSON.stringify({ returnUrl }),
      })) as any;

      if (!sessionRes.success || !sessionRes.paymentSessionId) {
        throw new Error(sessionRes.error?.message || "Failed to obtain payment session.");
      }

      // 3. Launch Cashfree Web Checkout in Sandbox Mode
      await launchCashfreeCheckout(sessionRes.paymentSessionId);
    } catch (err: unknown) {
      console.error("[Checkout]: Payment flow failed:", err);
      setErrorMessage((err as Error).message || "An unexpected error occurred during checkout.");
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <Container className="max-w-5xl">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 text-xs font-semibold text-warmgray hover:text-espresso transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Menu & Builder</span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: Checkout Configuration */}
            <div className="w-full lg:w-3/5 space-y-6">
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                    Review & Checkout
                  </h1>
                  <Badge variant="caramel" size="sm" className="gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sandbox Mode</span>
                  </Badge>
                </div>
                <p className="text-sm text-warmgray">
                  Specialty coffee crafting • Cashfree sandbox payment gateway
                </p>
              </div>

              {/* Authentication Status */}
              {!authLoading && !user && (
                <div className="p-4 rounded-xl bg-caramel/10 border border-caramel/30 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-caramel flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-espresso text-sm">Customer Sign-in Required</h3>
                    <p className="text-xs text-warmgray mt-0.5 mb-2">
                      Please sign in to AI Café so your order and live drink preparation status are saved to your profile.
                    </p>
                    <Link href="/login?redirect=/checkout">
                      <Button variant="primary" size="sm">
                        Sign In / Join AI Café
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Dining Option Selection */}
              <div className="p-6 rounded-2xl bg-offwhite border border-espresso/10 space-y-4">
                <h2 className="font-serif text-lg font-bold text-espresso">1. Fulfillment Experience</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("takeaway")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                      fulfillmentType === "takeaway"
                        ? "border-caramel bg-caramel/10 ring-1 ring-caramel"
                        : "border-espresso/10 hover:border-espresso/30 bg-cream/40"
                    }`}
                  >
                    <Coffee className="w-5 h-5 text-caramel" />
                    <span className="font-bold text-sm text-espresso">Takeaway</span>
                    <span className="text-[11px] text-warmgray leading-snug">Quick counter pickup at your pace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType("dine-in")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                      fulfillmentType === "dine-in"
                        ? "border-caramel bg-caramel/10 ring-1 ring-caramel"
                        : "border-espresso/10 hover:border-espresso/30 bg-cream/40"
                    }`}
                  >
                    <Store className="w-5 h-5 text-caramel" />
                    <span className="font-bold text-sm text-espresso">Dine-In</span>
                    <span className="text-[11px] text-warmgray leading-snug">Artisan ceramic cup at your table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType("curbside")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                      fulfillmentType === "curbside"
                        ? "border-caramel bg-caramel/10 ring-1 ring-caramel"
                        : "border-espresso/10 hover:border-espresso/30 bg-cream/40"
                    }`}
                  >
                    <Car className="w-5 h-5 text-caramel" />
                    <span className="font-bold text-sm text-espresso">Curbside</span>
                    <span className="text-[11px] text-warmgray leading-snug">Vehicle delivery at café bay</span>
                  </button>
                </div>

                <div className="pt-2">
                  <label htmlFor="table-details" className="block text-xs font-semibold text-espresso mb-1">
                    {fulfillmentType === "dine-in"
                      ? "Table Number (Optional)"
                      : fulfillmentType === "curbside"
                      ? "Vehicle Color & Plate Number"
                      : "Pickup Name or Special Request"}
                  </label>
                  <input
                    id="table-details"
                    type="text"
                    value={tableOrVehicle}
                    onChange={(e) => setTableOrVehicle(e.target.value)}
                    placeholder={
                      fulfillmentType === "dine-in"
                        ? "e.g., Table 4 near window"
                        : fulfillmentType === "curbside"
                        ? "e.g., White Creta, KA-01-AB-1234"
                        : "e.g., Leave in cup carrier"
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-espresso/15 bg-cream/50 text-sm text-espresso focus:outline-none focus:border-caramel"
                  />
                </div>
              </div>

              {/* Patron & Barista Details */}
              <div className="p-6 rounded-2xl bg-offwhite border border-espresso/10 space-y-4">
                <h2 className="font-serif text-lg font-bold text-espresso">2. Patron Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-espresso mb-1">Customer Name</label>
                    <input
                      type="text"
                      disabled
                      value={userProfile?.displayName || user?.displayName || "Guest Patron"}
                      className="w-full px-3.5 py-2 rounded-lg border border-espresso/15 bg-cream/30 text-xs text-warmgray cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-espresso mb-1">Customer Email</label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || "guest@aicafe.internal"}
                      className="w-full px-3.5 py-2 rounded-lg border border-espresso/15 bg-cream/30 text-xs text-warmgray cursor-not-allowed"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="phone-number" className="block text-xs font-semibold text-espresso mb-1">
                      Mobile Number (For Sandbox UPI / SMS notifications)
                    </label>
                    <input
                      id="phone-number"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9999999999"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-espresso/15 bg-cream/50 text-sm text-espresso focus:outline-none focus:border-caramel font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="barista-notes" className="block text-xs font-semibold text-espresso mb-1">
                      Notes for Barista (Optional)
                    </label>
                    <textarea
                      id="barista-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Extra hot, please write 'Good Luck' on the lid"
                      className="w-full px-3.5 py-2 rounded-lg border border-espresso/15 bg-cream/50 text-xs text-espresso focus:outline-none focus:border-caramel"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Order Summary & Payment Button */}
            <div className="w-full lg:w-2/5 space-y-4 lg:sticky lg:top-28">
              <div className="p-6 rounded-2xl bg-offwhite border border-espresso/10 space-y-5 shadow-card">
                <div className="flex items-center justify-between pb-3 border-b border-espresso/10">
                  <h2 className="font-serif text-lg font-bold text-espresso">Order Summary</h2>
                  <span className="text-xs font-semibold text-caramel bg-caramel/15 px-2 py-0.5 rounded-full">
                    {cartCount} {cartCount === 1 ? "Item" : "Items"}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <p className="text-xs text-warmgray text-center py-4">No drinks in tray.</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-2 text-xs">
                        <div>
                          <p className="font-bold text-espresso">{item.productName} × {item.quantity}</p>
                          {item.configurationSummary && (
                            <p className="text-[11px] text-warmgray leading-snug">{item.configurationSummary}</p>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-espresso">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Pricing Summary */}
                <div className="pt-3 border-t border-espresso/10 space-y-2 text-xs">
                  <div className="flex justify-between text-warmgray">
                    <span>Subtotal</span>
                    <span className="font-mono text-espresso font-semibold">{formatPrice(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-warmgray">
                    <span>Taxes & Artisan Preparation</span>
                    <span className="text-forest font-medium">Included</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-espresso pt-2 border-t border-espresso/10">
                    <span className="font-serif text-lg">Order Total</span>
                    <span className="font-serif text-2xl text-caramel">{formatPrice(cartSubtotal)}</span>
                  </div>
                </div>

                {/* Server-Authoritative Notice */}
                <div className="p-3 rounded-xl bg-cream/70 border border-espresso/5 text-[11px] text-warmgray flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-caramel flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Server-Authoritative Pricing:</strong> All customization prices are validated on our Express engine prior to Cashfree order creation.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Status Indicator */}
                {statusMessage && (
                  <div className="p-3 rounded-xl bg-caramel/15 border border-caramel/30 text-xs text-espresso font-medium flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-caramel" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                {/* Checkout CTA */}
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isProcessing || items.length === 0}
                  onClick={handleInitiatePayment}
                  className="w-full gap-2 shadow-card py-3.5 font-bold"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{statusMessage || "Processing..."}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-caramel" />
                      <span>Pay {formatPrice(cartSubtotal)} via Cashfree Sandbox</span>
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-center text-warmgray">
                  Secured by Cashfree Payments Sandbox (API v2025-01-01). No real money is charged.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
