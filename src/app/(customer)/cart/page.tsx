"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Coffee,
  Sparkles,
  ShieldCheck,
  Store,
  Car,
  Utensils,
  ArrowLeft,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, cartCount, cartSubtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [fulfillmentType, setFulfillmentType] = useState<"takeaway" | "dine-in" | "curbside">("takeaway");

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-cream font-sans">
        <Navbar />

        <main className="flex-1 pt-28 sm:pt-36 pb-24 flex items-center justify-center">
          <Container className="max-w-md text-center py-12">
            <div className="w-20 h-20 rounded-full bg-caramel/10 flex items-center justify-center text-caramel mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 opacity-70" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso mb-2">
              Your Tray is Empty
            </h1>
            <p className="text-sm text-warmgray mb-8 leading-relaxed">
              Explore our handcrafted specialty menu or tailor your own unique creation in the Drink Studio.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/menu" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full gap-2">
                  <span>Explore Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/builder" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full gap-2 border-espresso/20">
                  <Sparkles className="w-4 h-4 text-caramel" />
                  <span>Drink Studio</span>
                </Button>
              </Link>
            </div>
          </Container>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-24">
        <Container className="max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-2">
                <ShoppingBag className="w-3.5 h-3.5 text-caramel" />
                <span>Your Order Tray</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                Review Your Order
              </h1>
            </div>

            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-warmgray hover:text-red-600 transition-colors"
            >
              Clear Tray
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-offwhite border border-espresso/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-caramel/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cream border border-espresso/10 flex items-center justify-center text-caramel shrink-0">
                      <Coffee className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-espresso">
                        {item.productName}
                      </h3>
                      {item.configurationSummary && (
                        <p className="text-xs text-warmgray mt-0.5 max-w-md leading-relaxed">
                          {item.configurationSummary}
                        </p>
                      )}
                      <span className="text-xs font-mono font-semibold text-caramel mt-1 inline-block">
                        {formatPrice(item.unitPrice)} each
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-espresso/5">
                    {/* Stepper */}
                    <div className="flex items-center gap-3 bg-cream px-3 py-1 rounded-full border border-espresso/10">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-espresso/70 hover:bg-espresso/10"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-espresso w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-espresso/70 hover:bg-espresso/10"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-serif font-bold text-base text-espresso w-20 text-right">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-warmgray hover:text-red-600 transition-colors p-1"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray hover:text-espresso transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue Browsing Menu</span>
                </Link>
              </div>
            </div>

            {/* Summary & Checkout Sidebar */}
            <div className="p-6 rounded-3xl bg-offwhite border border-espresso/10 shadow-card space-y-6">
              <h2 className="font-serif text-xl font-bold text-espresso">
                Order Summary
              </h2>

              {/* Fulfillment Option */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-espresso/70 uppercase tracking-wider">
                  Fulfillment Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("takeaway")}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      fulfillmentType === "takeaway"
                        ? "bg-caramel/15 border-caramel text-espresso font-semibold"
                        : "bg-cream border-espresso/10 text-warmgray"
                    }`}
                  >
                    <Store className="w-4 h-4 text-caramel" />
                    <span className="text-[11px]">Takeaway</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType("dine-in")}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      fulfillmentType === "dine-in"
                        ? "bg-caramel/15 border-caramel text-espresso font-semibold"
                        : "bg-cream border-espresso/10 text-warmgray"
                    }`}
                  >
                    <Utensils className="w-4 h-4 text-caramel" />
                    <span className="text-[11px]">Dine In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType("curbside")}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      fulfillmentType === "curbside"
                        ? "bg-caramel/15 border-caramel text-espresso font-semibold"
                        : "bg-cream border-espresso/10 text-warmgray"
                    }`}
                  >
                    <Car className="w-4 h-4 text-caramel" />
                    <span className="text-[11px]">Curbside</span>
                  </button>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="space-y-3 pt-4 border-t border-espresso/10 text-sm">
                <div className="flex justify-between text-espresso/80">
                  <span>Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
                  <span className="font-mono font-medium">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-espresso/80">
                  <span>GST & Service</span>
                  <span className="text-xs text-sage font-medium">Included</span>
                </div>
                <div className="flex justify-between text-base font-bold text-espresso pt-3 border-t border-espresso/10">
                  <span>Total Payable</span>
                  <span className="font-serif text-xl text-caramel-dark font-bold">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-sage/10 text-sage text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Cashfree Sandbox Secure Payment</span>
              </div>

              <Link href="/checkout" className="block">
                <Button variant="primary" size="lg" className="w-full gap-2 shadow-card">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
