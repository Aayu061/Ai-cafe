"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerSidebar } from "@/components/customer/customer-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCart } from "@/features/cart/cart-context";
import { fetchSavedDrinks, deleteSavedDrinkApi } from "@/lib/api-client";
import {
  BookmarkCheck,
  ShoppingBag,
  Sliders,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Coffee,
} from "lucide-react";

import { AuthGuard } from "@/features/auth/components/auth-guard";

function CustomerSavedDrinksContent() {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [savedDrinks, setSavedDrinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadSavedDrinks() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchSavedDrinks();
        if (isMounted && res.success && (res as any).savedDrinks) {
          setSavedDrinks((res as any).savedDrinks);
        }
      } catch (err) {
        console.warn("Failed to load saved drinks:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (!authLoading) {
      loadSavedDrinks();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    setSavedDrinks((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteSavedDrinkApi(id);
    } catch (err) {
      console.warn("Failed to delete saved drink:", err);
    }
  };

  const handleAddToCart = (creation: any) => {
    addItem({
      productId: creation.configuration?.productId || "custom-drink",
      productName: creation.name || "My Custom Creation",
      quantity: 1,
      unitPrice: creation.serverPrice,
      configuration: creation.configuration,
      configurationSummary: "Custom Recipe Creation",
    });

    setAddedMap((prev) => ({ ...prev, [creation.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [creation.id]: false }));
    }, 1200);
  };

  return (
    <CustomerSidebar>
      <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-espresso/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-2">
              <BookmarkCheck className="w-3.5 h-3.5 text-caramel" />
              <span>Artisan Blueprint Archive</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
              Your Custom Saved Drinks
            </h1>
            <p className="text-sm text-warmgray mt-1">
              Personalized recipes crafted by you in the Drink Studio. Prices are calibrated live against current inventory.
            </p>
          </div>

          <Link href="/builder">
            <Button variant="primary" size="md" className="gap-2 shadow-soft">
              <Sliders className="w-4 h-4 text-caramel" />
              <span>Create New Recipe</span>
            </Button>
          </Link>
        </div>

        {/* Saved Creations Grid */}
        {savedDrinks.length === 0 ? (
          <div className="p-12 rounded-3xl bg-offwhite border border-espresso/10 text-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-caramel/10 text-caramel flex items-center justify-center mx-auto mb-4">
              <Sliders className="w-8 h-8 opacity-75" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso mb-1">
              Create something that&apos;s completely yours
            </h3>
            <p className="text-xs text-warmgray mb-6 leading-relaxed">
              Use the Interactive Drink Studio to customize bases, milks, sweetness, ice, and syrups, then save your unique blueprint here.
            </p>
            <Link href="/builder">
              <Button variant="primary">Build Your Drink</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedDrinks.map((creation) => {
              const cfg = creation.configuration || {};
              const builderParams = new URLSearchParams({
                product: cfg.productId || "caramel-cold-brew",
                base: cfg.baseId || "",
                milk: cfg.milkId || "",
                flavor: cfg.flavorId || "",
                sweetness: cfg.sweetnessId || "",
                ice: cfg.iceId || "",
                size: cfg.sizeId || "",
                toppings: Array.isArray(cfg.toppingIds) ? cfg.toppingIds.join(",") : "",
              });
              const isAdded = !!addedMap[creation.id];

              return (
                <div
                  key={creation.id}
                  className="p-6 rounded-3xl bg-offwhite border border-espresso/10 shadow-sm flex flex-col justify-between hover:border-caramel/30 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-sage font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Authoritative Price</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(creation.id)}
                        className="text-warmgray/60 hover:text-red-600 p-1 transition-colors"
                        title="Delete creation"
                        aria-label={`Delete ${creation.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-serif font-bold text-xl text-espresso mb-2">
                      {creation.name}
                    </h3>

                    {creation.notes && (
                      <p className="text-xs text-warmgray italic mb-3">
                        “{creation.notes}”
                      </p>
                    )}

                    {/* Recipe Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {cfg.sizeId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream border border-espresso/10 text-espresso font-medium">
                          {cfg.sizeId}
                        </span>
                      )}
                      {cfg.milkId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream border border-espresso/10 text-espresso font-medium">
                          {cfg.milkId}
                        </span>
                      )}
                      {cfg.flavorId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream border border-espresso/10 text-espresso font-medium">
                          {cfg.flavorId}
                        </span>
                      )}
                      {cfg.sweetnessId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream border border-espresso/10 text-espresso font-medium">
                          {cfg.sweetnessId}
                        </span>
                      )}
                    </div>

                    <span className="font-serif text-2xl font-bold text-espresso block mb-4">
                      {formatPrice(creation.serverPrice)}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-espresso/5 flex items-center justify-between gap-2">
                    <Link href={`/builder?${builderParams.toString()}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs border-espresso/20 hover:border-caramel hover:text-espresso"
                      >
                        <Sliders className="w-3.5 h-3.5 text-caramel" />
                        <span>Edit Studio</span>
                      </Button>
                    </Link>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddToCart(creation)}
                      className="gap-1.5 text-xs shadow-soft"
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-sage" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-caramel" />
                          <span>Add to Tray</span>
                        </>
                      )}
                    </Button>
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

export default function CustomerSavedDrinksPage() {
  return (
    <AuthGuard>
      <CustomerSavedDrinksContent />
    </AuthGuard>
  );
}
