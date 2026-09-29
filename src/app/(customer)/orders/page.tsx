"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerSidebar } from "@/components/customer/customer-sidebar";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCart } from "@/features/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import { fetchCustomerOrders } from "@/lib/api-client";
import {
  Clock,
  Coffee,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

type OrderTab = "all" | "active" | "completed" | "cancelled";

import { AuthGuard } from "@/features/auth/components/auth-guard";

function CustomerOrdersContent() {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchCustomerOrders();
        if (isMounted && res.success && (res as any).orders) {
          setOrders((res as any).orders);
        }
      } catch (err) {
        console.warn("Failed to load customer orders:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (!authLoading) {
      loadOrders();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return o.status === "placed" || o.status === "preparing" || o.status === "ready";
    if (activeTab === "completed") return o.status === "completed";
    if (activeTab === "cancelled") return o.status === "cancelled";
    return true;
  });

  const handleReorder = (order: any) => {
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

  return (
    <CustomerSidebar>
      <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-espresso/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-2">
              <Clock className="w-3.5 h-3.5 text-caramel" />
              <span>Order Ledger</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
              Your Orders
            </h1>
            <p className="text-sm text-warmgray mt-1">
              Track live preparation in the kitchen, review past recipes, or reorder your favorites.
            </p>
          </div>

          <Link href="/menu">
            <Button variant="primary" size="md" className="gap-2 shadow-soft">
              <ShoppingBag className="w-4 h-4 text-caramel" />
              <span>New Order</span>
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-espresso/10 pb-3">
          {(
            [
              { label: "All Orders", value: "all" },
              { label: "Active Brewing", value: "active" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.value
                  ? "bg-espresso text-cream shadow-soft"
                  : "bg-offwhite text-espresso/70 hover:text-espresso border border-espresso/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Listing */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 rounded-3xl bg-offwhite border border-espresso/10 text-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-caramel/10 flex items-center justify-center text-caramel mx-auto mb-4">
              <Coffee className="w-8 h-8 opacity-75" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso mb-1">
              Your first café moment is waiting
            </h3>
            <p className="text-xs text-warmgray mb-6 leading-relaxed">
              You don&apos;t have any orders in this category yet. Explore our handcrafted menu to start your order.
            </p>
            <Link href="/menu">
              <Button variant="primary">Explore Full Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isActive =
                order.status === "placed" ||
                order.status === "preparing" ||
                order.status === "ready";

              return (
                <div
                  key={order.id}
                  className={`p-6 rounded-3xl bg-offwhite border transition-all ${
                    isActive
                      ? "border-caramel/40 shadow-card"
                      : "border-espresso/10 shadow-sm hover:border-espresso/25"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-espresso/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-espresso">
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
                        <Badge
                          variant={order.paymentStatus === "paid" ? "sage" : "cream"}
                          size="sm"
                        >
                          {order.paymentStatus === "paid" ? "PAID (CASHFREE)" : "UNPAID"}
                        </Badge>
                      </div>
                      <p className="text-xs text-warmgray mt-1">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Recent Order"}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-warmgray uppercase font-semibold">Total:</span>
                      <span className="font-serif text-2xl font-bold text-espresso">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="py-4 space-y-2">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cream text-espresso font-bold text-[10px] flex items-center justify-center border border-espresso/10">
                            {item.quantity}×
                          </span>
                          <span className="font-semibold text-espresso">
                            {item.name || item.productName}
                          </span>
                          {item.configurationSummary && (
                            <span className="text-warmgray">({item.configurationSummary})</span>
                          )}
                        </div>
                        <span className="font-mono font-medium text-espresso/80">
                          {formatPrice(item.finalPrice || item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-espresso/5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-warmgray">
                      <ShieldCheck className="w-4 h-4 text-sage" />
                      <span>Fulfillment: {order.fulfillmentType || "Takeaway"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 border-espresso/20">
                          <span>View Details & Timeline</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReorder(order)}
                        className="gap-1.5 shadow-soft"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-caramel" />
                        <span>Order Again</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomerSidebar>
  );
}

export default function CustomerOrdersPage() {
  return (
    <AuthGuard>
      <CustomerOrdersContent />
    </AuthGuard>
  );
}
