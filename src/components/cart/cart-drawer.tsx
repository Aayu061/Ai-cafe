"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Sparkles, Coffee } from "lucide-react";
import { useCart } from "@/features/cart/cart-context";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, cartSubtotal, cartCount } = useCart();
  const router = useRouter();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Cart">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-espresso/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-screen max-w-md bg-cream border-l border-espresso/10 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-offwhite border-b border-espresso/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-caramel/15 flex items-center justify-center text-caramel">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-espresso">Your Café Order</h2>
                    <p className="text-xs text-warmgray">
                      {cartCount === 0 ? "Empty tray" : `${cartCount} handcrafted ${cartCount === 1 ? "item" : "items"}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full text-espresso/60 hover:text-espresso hover:bg-espresso/5 transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-caramel/10 flex items-center justify-center text-caramel mb-4">
                      <Coffee className="w-8 h-8 opacity-75" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-espresso mb-1">Your tray is empty</h3>
                    <p className="text-sm text-warmgray max-w-xs mb-6">
                      Explore our handcrafted specialty menu or tailor your taste profile in the Drink Builder.
                    </p>
                    <Link
                      href="/builder"
                      onClick={() => setIsCartOpen(false)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-espresso text-cream hover:bg-caramel hover:text-espresso transition-all text-sm font-semibold shadow-soft"
                    >
                      <Sparkles className="w-4 h-4 text-caramel" />
                      <span>Open Drink Builder</span>
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-offwhite border border-espresso/10 hover:border-caramel/30 transition-all flex flex-col gap-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-serif font-bold text-espresso text-base">{item.productName}</h4>
                          {item.configurationSummary && (
                            <p className="text-xs text-warmgray mt-0.5 leading-relaxed">
                              {item.configurationSummary}
                            </p>
                          )}
                          <span className="text-xs font-mono font-medium text-caramel mt-1 inline-block">
                            {formatPrice(item.unitPrice)} each
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-warmgray/60 hover:text-red-600 p-1 transition-colors"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-espresso/5">
                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2 bg-cream px-2 py-1 rounded-full border border-espresso/10">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-espresso/70 hover:bg-espresso/10 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-espresso w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-espresso/70 hover:bg-espresso/10 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line total */}
                        <span className="font-serif font-bold text-espresso text-base">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {items.length > 0 && (
                <div className="p-6 bg-offwhite border-t border-espresso/10 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm text-warmgray">
                      <span>Subtotal</span>
                      <span className="font-mono text-espresso font-semibold">{formatPrice(cartSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-warmgray/80">
                      <span>Taxes & Café Prep</span>
                      <span className="text-forest font-medium">Included</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold text-espresso pt-2 border-t border-espresso/10">
                      <span className="font-serif text-lg">Total</span>
                      <span className="font-serif text-xl text-caramel">{formatPrice(cartSubtotal)}</span>
                    </div>
                    <p className="text-[10px] text-warmgray/80 text-center">
                      * All prices are verified server-authoritatively at checkout.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleProceedToCheckout}
                    className="w-full gap-2 shadow-card py-3"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
