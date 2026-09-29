"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CustomerSidebar } from "@/components/customer/customer-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { fetchOrderById } from "@/lib/api-client";
import { useCart } from "@/features/cart/cart-context";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Coffee,
  ShoppingBag,
  CreditCard,
  ChefHat,
  BellRing,
  PackageCheck,
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const { addItem } = useCart();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
      try {
        const res = await fetchOrderById(orderId);
        if (isMounted && res.success && (res as any).order) {
          setOrder((res as any).order);
        }
      } catch (err) {
        console.warn("Failed to load order detail:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <CustomerSidebar>
        <div className="p-10 max-w-4xl mx-auto text-center py-20">
          <div className="w-10 h-10 border-2 border-caramel border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif text-lg text-espresso">Retrieving Café Order...</p>
        </div>
      </CustomerSidebar>
    );
  }

  if (!order) {
    return (
      <CustomerSidebar>
        <div className="p-10 max-w-4xl mx-auto text-center py-20">
          <h2 className="font-serif text-2xl font-bold text-espresso mb-2">Order Not Found</h2>
          <p className="text-sm text-warmgray mb-6">Order #{orderId} could not be found or you do not have permission to view it.</p>
          <Link href="/orders">
            <Button variant="primary">Back to Orders</Button>
          </Link>
        </div>
      </CustomerSidebar>
    );
  }

  const handleReorder = () => {
    if (!order?.items || !Array.isArray(order.items)) return;
    order.items.forEach((item: any) => {
      addItem({
        productId: item.productId,
        productName: item.name || item.productName || "Specialty Beverage",
        quantity: item.quantity || 1,
        unitPrice: item.finalPrice || item.price || 180,
        configuration: item.configuration,
        configurationSummary: item.configurationSummary || "Reordered Recipe",
      });
    });
  };

  // Determine stage active/complete
  const isPaid = order.paymentStatus === "paid";
  const isPreparing = order.status === "preparing" || order.status === "ready" || order.status === "completed";
  const isReady = order.status === "ready" || order.status === "completed";
  const isCompleted = order.status === "completed";

  return (
    <CustomerSidebar>
      <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray hover:text-espresso transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Orders</span>
          </Link>
        </div>

        {/* Order Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-offwhite border border-espresso/10 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-espresso/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-lg font-bold text-espresso">
                  #{order.id}
                </span>
                <Badge
                  variant={
                    order.status === "ready"
                      ? "sage"
                      : order.status === "preparing"
                      ? "caramel"
                      : "cream"
                  }
                  size="sm"
                >
                  {order.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-warmgray">
                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Recent"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleReorder}
                className="gap-1.5 shadow-soft"
              >
                <RotateCcw className="w-3.5 h-3.5 text-caramel" />
                <span>Reorder Items</span>
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-espresso">
              Crafting & Fulfillment Timeline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              {/* Step 1: Placed */}
              <div className="p-3 rounded-2xl bg-cream border border-espresso/10 flex flex-col items-center text-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-sage text-cream flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <span className="font-semibold text-xs text-espresso">1. Placed</span>
                <span className="text-[10px] text-warmgray">Received</span>
              </div>

              {/* Step 2: Paid */}
              <div className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 ${
                isPaid ? "bg-cream border-sage/40 text-sage" : "bg-offwhite border-espresso/10 text-warmgray"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isPaid ? "bg-sage text-cream" : "bg-espresso/10 text-espresso/40"
                }`}>
                  {isPaid ? "✓" : "2"}
                </div>
                <span className="font-semibold text-xs text-espresso">2. Payment</span>
                <span className="text-[10px]">{isPaid ? "Cashfree Paid" : "Pending"}</span>
              </div>

              {/* Step 3: Preparing */}
              <div className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 ${
                order.status === "preparing"
                  ? "bg-caramel/15 border-caramel shadow-soft text-caramel-dark"
                  : isPreparing
                  ? "bg-cream border-sage/40 text-sage"
                  : "bg-offwhite border-espresso/10 text-warmgray"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  order.status === "preparing"
                    ? "bg-caramel text-espresso animate-pulse"
                    : isPreparing
                    ? "bg-sage text-cream"
                    : "bg-espresso/10 text-espresso/40"
                }`}>
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-espresso">3. Preparing</span>
                <span className="text-[10px]">{order.status === "preparing" ? "In Crafting" : isPreparing ? "Done" : "Queued"}</span>
              </div>

              {/* Step 4: Ready */}
              <div className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 ${
                order.status === "ready"
                  ? "bg-sage/20 border-sage shadow-soft text-sage"
                  : isReady
                  ? "bg-cream border-sage/40 text-sage"
                  : "bg-offwhite border-espresso/10 text-warmgray"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  order.status === "ready"
                    ? "bg-sage text-cream animate-bounce"
                    : isReady
                    ? "bg-sage text-cream"
                    : "bg-espresso/10 text-espresso/40"
                }`}>
                  <BellRing className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-espresso">4. Ready</span>
                <span className="text-[10px]">{order.status === "ready" ? "Ready for Tray" : isReady ? "Done" : "Pending"}</span>
              </div>

              {/* Step 5: Completed */}
              <div className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 ${
                isCompleted ? "bg-cream border-sage/40 text-sage" : "bg-offwhite border-espresso/10 text-warmgray"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCompleted ? "bg-sage text-cream" : "bg-espresso/10 text-espresso/40"
                }`}>
                  <PackageCheck className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-espresso">5. Completed</span>
                <span className="text-[10px]">{isCompleted ? "Enjoyed" : "Final Stage"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Breakdown Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-offwhite border border-espresso/10 shadow-sm space-y-6">
          <h3 className="font-serif font-bold text-xl text-espresso">
            Ordered Items & Recipe Blueprint
          </h3>

          <div className="divide-y divide-espresso/10">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cream border border-espresso/10 flex items-center justify-center text-caramel shrink-0">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-espresso">
                      {item.quantity}× {item.name || item.productName}
                    </h4>
                    {item.configurationSummary && (
                      <p className="text-xs text-warmgray mt-0.5 max-w-md">
                        {item.configurationSummary}
                      </p>
                    )}
                    {item.configuration && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(item.configuration)
                          .filter(([k]) => k !== "productId")
                          .map(([key, val]) => (
                            <span
                              key={key}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-cream border border-espresso/10 text-espresso/70 font-mono"
                            >
                              {key}: {Array.isArray(val) ? val.join(", ") : String(val)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <span className="font-serif font-bold text-base text-espresso">
                  {formatPrice(item.finalPrice || item.price)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-espresso/10 space-y-2 text-sm">
            <div className="flex justify-between text-espresso/70">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(order.total)}</span>
            </div>
            <div className="flex justify-between text-espresso/70">
              <span>Taxes & Kitchen Service</span>
              <span className="text-xs text-sage font-medium">Included</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-espresso pt-2 border-t border-espresso/10">
              <span>Total Paid</span>
              <span className="font-serif text-2xl text-caramel-dark font-bold">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Fulfillment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-offwhite border border-espresso/10 text-xs space-y-2">
            <h4 className="font-serif font-bold text-sm text-espresso mb-1">
              Fulfillment Method
            </h4>
            <p className="text-espresso/80 font-medium capitalize">
              Mode: {order.fulfillmentType || "Takeaway"}
            </p>
            {order.notes && (
              <p className="text-warmgray italic">
                Notes: {order.notes}
              </p>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-offwhite border border-espresso/10 text-xs space-y-2">
            <h4 className="font-serif font-bold text-sm text-espresso mb-1">
              Payment Record
            </h4>
            <p className="text-espresso/80 font-medium">
              Provider: Cashfree Sandbox Gateway
            </p>
            <p className="text-warmgray">
              Status: <span className="font-semibold text-sage uppercase">{order.paymentStatus}</span>
            </p>
          </div>
        </div>
      </div>
    </CustomerSidebar>
  );
}
