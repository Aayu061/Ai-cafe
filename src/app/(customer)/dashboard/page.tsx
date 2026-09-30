"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerSidebar } from "@/components/customer/customer-sidebar";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCart } from "@/features/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import { APPROVED_DRINKS } from "@/lib/constants";
import {
  fetchCustomerOrders,
  fetchFavorites,
  fetchSavedDrinks,
} from "@/lib/api-client";
import {
  Sparkles,
  Coffee,
  Sliders,
  Clock,
  Heart,
  BookmarkCheck,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { AuthGuard } from "@/features/auth/components/auth-guard";

function CustomerDashboardContent() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { addItem } = useCart();

  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [savedDrinks, setSavedDrinks] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Time-based greeting
  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const displayName = userProfile?.displayName || user?.displayName || "Friend";

  // Fetch Customer Data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user) {
        setLoadingData(false);
        return;
      }
      try {
        const [ordersResult, favsResult, savedResult] = await Promise.allSettled([
          fetchCustomerOrders(),
          fetchFavorites(),
          fetchSavedDrinks(),
        ]);

        if (isMounted) {
          if (ordersResult.status === "fulfilled" && ordersResult.value.success && (ordersResult.value as any).orders) {
            setOrders((ordersResult.value as any).orders);
          }
          if (favsResult.status === "fulfilled" && favsResult.value.success && (favsResult.value as any).favorites) {
            setFavorites((favsResult.value as any).favorites);
          }
          if (savedResult.status === "fulfilled" && savedResult.value.success && (savedResult.value as any).savedDrinks) {
            setSavedDrinks((savedResult.value as any).savedDrinks);
          }
        }
      } catch (err) {
        console.warn("Failed to load customer dashboard data:", err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    if (!authLoading) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  // Find active order
  const activeOrder = orders.find(
    (o) => o.status === "preparing" || o.status === "ready" || o.status === "placed"
  );

  // Reorder action: adds all items from order to tray with current server prices
  const handleReorder = (order: any) => {
    if (!order?.items || !Array.isArray(order.items)) return;
    order.items.forEach((item: any) => {
      addItem({
        productId: item.productId,
        productName: item.name || item.productName || "Specialty Beverage",
        quantity: item.quantity || 1,
        unitPrice: item.finalPrice || item.price || 180,
        configuration: item.configuration,
        configurationSummary: item.configurationSummary || "Reordered Specialty",
      });
    });
  };

  return (
    <CustomerSidebar>
      <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-10">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-espresso/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-caramel" />
              <span>Personal Café Sanctuary</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
              {greeting}, {displayName.split(" ")[0]}.
            </h1>
            <p className="text-sm text-warmgray mt-1">
              Ready for your next cup? Explore handcrafted roasts, tailor a recipe, or consult the AI Barista.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Link href="/barista">
              <Button variant="primary" size="md" className="gap-2 shadow-soft">
                <Sparkles className="w-4 h-4 text-caramel" />
                <span>Ask AI Barista</span>
              </Button>
            </Link>
            <Link href="/builder">
              <Button variant="secondary" size="md" className="gap-2">
                <Sliders className="w-4 h-4 text-caramel" />
                <span>Build Drink</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Active Order Banner / Tracker */}
        <section>
          <h2 className="font-serif text-xl font-bold text-espresso mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-caramel" />
            <span>Active Order Status</span>
          </h2>

          {activeOrder ? (
            <div className="p-6 rounded-3xl bg-offwhite border-2 border-caramel/30 shadow-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-semibold text-warmgray uppercase">
                    Order #{activeOrder.id}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-espresso mt-0.5">
                    {activeOrder.items?.map((i: any) => i.name || i.productName).join(", ")}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="caramel" size="md">
                    {activeOrder.status.toUpperCase()}
                  </Badge>
                  <Link href={`/orders/${activeOrder.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 border-espresso/20">
                      <span>Track Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="pt-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
                  <div className="flex flex-col items-center gap-1.5 text-sage font-semibold">
                    <div className="w-6 h-6 rounded-full bg-sage text-cream flex items-center justify-center text-xs">✓</div>
                    <span>Placed</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1.5 ${
                    activeOrder.paymentStatus === "paid" ? "text-sage font-semibold" : "text-warmgray"
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      activeOrder.paymentStatus === "paid" ? "bg-sage text-cream" : "bg-espresso/10 text-espresso/40"
                    }`}>
                      {activeOrder.paymentStatus === "paid" ? "✓" : "2"}
                    </div>
                    <span>Paid</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1.5 ${
                    activeOrder.status === "preparing" || activeOrder.status === "ready" ? "text-caramel font-semibold" : "text-warmgray"
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      activeOrder.status === "preparing" ? "bg-caramel text-espresso animate-pulse" : activeOrder.status === "ready" ? "bg-sage text-cream" : "bg-espresso/10 text-espresso/40"
                    }`}>
                      3
                    </div>
                    <span>Preparing</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1.5 ${
                    activeOrder.status === "ready" ? "text-caramel font-semibold" : "text-warmgray"
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      activeOrder.status === "ready" ? "bg-caramel text-espresso animate-bounce" : "bg-espresso/10 text-espresso/40"
                    }`}>
                      4
                    </div>
                    <span>Ready</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-offwhite border border-espresso/10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-caramel/10 flex items-center justify-center text-caramel mb-3">
                <Coffee className="w-6 h-6 opacity-75" />
              </div>
              <h3 className="font-serif font-bold text-lg text-espresso mb-1">
                No active orders right now
              </h3>
              <p className="text-xs text-warmgray max-w-sm mb-4">
                Ready when you are. Your freshly brewed order will appear here with live preparation tracking.
              </p>
              <Link href="/menu">
                <Button variant="outline" size="sm" className="border-espresso/20">
                  Explore Full Menu
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Favorites & Saved Creations Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Favorites Preview */}
          <section className="p-6 rounded-3xl bg-offwhite border border-espresso/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg font-bold text-espresso flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                  <span>Your Favorites</span>
                </h2>
                <Link href="/favorites" className="text-xs text-caramel font-semibold hover:underline">
                  View all ({favorites.length})
                </Link>
              </div>

              {favorites.length === 0 ? (
                <div className="py-8 text-center text-xs text-warmgray">
                  <p className="mb-3">Save the drinks you keep coming back to.</p>
                  <Link href="/menu">
                    <Button variant="outline" size="sm" className="text-xs border-espresso/20">
                      Browse Menu
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-cream border border-espresso/5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="font-serif font-bold text-sm text-espresso">{item.name}</h4>
                        <span className="text-xs text-caramel font-mono">{formatPrice(item.basePrice || item.price)}</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          addItem({
                            productId: item.id,
                            productName: item.name,
                            quantity: 1,
                            unitPrice: item.basePrice || item.price,
                            configurationSummary: "Favorite Drink",
                          });
                        }}
                        className="text-xs px-2.5 py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Saved Custom Creations Preview */}
          <section className="p-6 rounded-3xl bg-offwhite border border-espresso/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg font-bold text-espresso flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-caramel" />
                  <span>Custom Saved Drinks</span>
                </h2>
                <Link href="/saved-drinks" className="text-xs text-caramel font-semibold hover:underline">
                  View all ({savedDrinks.length})
                </Link>
              </div>

              {savedDrinks.length === 0 ? (
                <div className="py-8 text-center text-xs text-warmgray">
                  <p className="mb-3">Create something that&apos;s completely yours in the Drink Studio.</p>
                  <Link href="/builder">
                    <Button variant="outline" size="sm" className="text-xs border-espresso/20">
                      Build Your Drink
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedDrinks.slice(0, 3).map((creation) => (
                    <div
                      key={creation.id}
                      className="p-3 rounded-xl bg-cream border border-espresso/5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="font-serif font-bold text-sm text-espresso">{creation.name}</h4>
                        <span className="text-xs text-caramel font-mono">{formatPrice(creation.serverPrice)}</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          addItem({
                            productId: creation.configuration?.productId || "custom-drink",
                            productName: creation.name,
                            quantity: 1,
                            unitPrice: creation.serverPrice,
                            configuration: creation.configuration,
                            configurationSummary: "Custom Creation",
                          });
                        }}
                        className="text-xs px-2.5 py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Recent Orders Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-caramel" />
              <span>Recent Orders</span>
            </h2>
            <Link href="/orders" className="text-xs text-caramel font-semibold hover:underline">
              View Order History
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 rounded-3xl bg-offwhite border border-espresso/10 text-center">
              <p className="text-sm text-warmgray mb-4">
                Your first café moment is waiting. Discover our handcrafted menu and order your favorite roast.
              </p>
              <Link href="/menu">
                <Button variant="primary" size="md">
                  Explore Menu
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-offwhite border border-espresso/10 shadow-sm flex flex-col justify-between hover:border-caramel/30 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono font-semibold text-warmgray">#{order.id}</span>
                      <Badge variant={order.paymentStatus === "paid" ? "caramel" : "cream"} size="sm">
                        {order.status}
                      </Badge>
                    </div>
                    <h4 className="font-serif font-bold text-base text-espresso line-clamp-1">
                      {order.items?.map((i: any) => i.name || i.productName).join(", ")}
                    </h4>
                    <span className="text-xs font-mono font-bold text-caramel mt-1 inline-block">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  <div className="pt-4 mt-4 border-t border-espresso/5 flex items-center justify-between gap-2">
                    <Link href={`/orders/${order.id}`} className="text-xs text-espresso/70 hover:text-espresso font-semibold">
                      Details
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(order)}
                      className="text-xs gap-1.5 border-espresso/20 hover:border-caramel hover:text-espresso"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-caramel" />
                      <span>Order Again</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recommended For You Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-caramel" />
              <span>Recommended For You</span>
            </h2>
            <Link href="/menu" className="text-xs text-caramel font-semibold hover:underline">
              See Full Menu →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {APPROVED_DRINKS.slice(0, 4).map((drink) => (
              <div
                key={drink.id}
                className="p-4 rounded-2xl bg-offwhite border border-espresso/10 shadow-sm flex flex-col justify-between hover:border-caramel/30 transition-all"
              >
                <div>
                  <div className="w-full h-24 rounded-xl bg-cream flex items-center justify-center text-caramel mb-3">
                    <Coffee className="w-10 h-10 opacity-75" />
                  </div>
                  <h4 className="font-serif font-bold text-base text-espresso line-clamp-1">{drink.name}</h4>
                  <p className="text-xs text-warmgray line-clamp-1 mt-0.5">{drink.description}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-espresso/5 flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-espresso">{formatPrice(drink.price)}</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      addItem({
                        productId: drink.id,
                        productName: drink.name,
                        quantity: 1,
                        unitPrice: drink.price,
                        configurationSummary: "Standard Recipe",
                      });
                    }}
                    className="text-xs px-2.5 py-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CustomerSidebar>
  );
}

export default function CustomerDashboardPage() {
  return (
    <AuthGuard>
      <CustomerDashboardContent />
    </AuthGuard>
  );
}
