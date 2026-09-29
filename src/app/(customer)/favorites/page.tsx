"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerSidebar } from "@/components/customer/customer-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCart } from "@/features/cart/cart-context";
import { fetchFavorites, removeFavoriteApi } from "@/lib/api-client";
import { APPROVED_DRINKS } from "@/lib/constants";
import {
  Heart,
  ShoppingBag,
  Sliders,
  Trash2,
  Coffee,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

import { AuthGuard } from "@/features/auth/components/auth-guard";

function CustomerFavoritesContent() {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadFavorites() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchFavorites();
        if (isMounted && res.success && (res as any).favorites) {
          setFavorites((res as any).favorites);
        }
      } catch (err) {
        console.warn("Failed to load favorites:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (!authLoading) {
      loadFavorites();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const handleRemove = async (productId: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
    try {
      await removeFavoriteApi(productId);
    } catch (err) {
      console.warn("Failed to remove favorite:", err);
    }
  };

  const handleAddToCart = (product: any) => {
    const isCustomizable = product.category !== "bakery" && product.category !== "savory";
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.basePrice || product.price,
      configurationSummary: isCustomizable ? "Standard Barista Recipe" : "Artisan Kitchen Special",
    });

    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  return (
    <CustomerSidebar>
      <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-espresso/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-2">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
              <span>Personal Vault</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
              Your Favorite Drinks
            </h1>
            <p className="text-sm text-warmgray mt-1">
              The specialty coffees and bites you love most, saved to your account for one-click ordering.
            </p>
          </div>

          <Link href="/menu">
            <Button variant="outline" size="md" className="gap-2 border-espresso/20">
              <Coffee className="w-4 h-4 text-caramel" />
              <span>Browse Menu</span>
            </Button>
          </Link>
        </div>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="p-12 rounded-3xl bg-offwhite border border-espresso/10 text-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso mb-1">
              Save the drinks you keep coming back to
            </h3>
            <p className="text-xs text-warmgray mb-6 leading-relaxed">
              Whenever you find a beverage or pastry you adore, tap the heart icon to save it here for instant ordering.
            </p>
            <Link href="/menu">
              <Button variant="primary">Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => {
              const isCustomizable =
                product.category !== "bakery" && product.category !== "savory";
              const isAdded = !!addedMap[product.id];

              return (
                <div
                  key={product.id}
                  className="p-6 rounded-3xl bg-offwhite border border-espresso/10 shadow-sm flex flex-col justify-between hover:border-caramel/30 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-caramel">
                        {product.categoryLabel || "Specialty Drink"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(product.id)}
                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                        title="Remove from favorites"
                        aria-label={`Remove ${product.name} from favorites`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <Link href={`/menu/${product.id}`} className="block focus:outline-none">
                      <h3 className="font-serif font-bold text-xl text-espresso mb-1 group-hover:text-caramel transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-xs text-espresso/70 leading-relaxed line-clamp-2 mb-4">
                      {product.description}
                    </p>

                    <span className="font-serif text-2xl font-bold text-espresso block mb-4">
                      {formatPrice(product.basePrice || product.price)}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-espresso/5 flex items-center justify-between gap-2">
                    {isCustomizable ? (
                      <Link href={`/builder?product=${product.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs border-espresso/20 hover:border-caramel hover:text-espresso"
                        >
                          <Sliders className="w-3.5 h-3.5 text-caramel" />
                          <span>Customize</span>
                        </Button>
                      </Link>
                    ) : (
                      <span />
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddToCart(product)}
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

export default function CustomerFavoritesPage() {
  return (
    <AuthGuard>
      <CustomerFavoritesContent />
    </AuthGuard>
  );
}
