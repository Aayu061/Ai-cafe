"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APPROVED_DRINKS } from "@/lib/constants";
import { DrinkItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/features/cart/cart-context";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { addFavoriteApi, removeFavoriteApi, apiFetch } from "@/lib/api-client";
import {
  ArrowLeft,
  Sliders,
  ShoppingBag,
  Heart,
  Flame,
  Coffee,
  Cookie,
  Sparkles,
  Check,
  Plus,
  Minus,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.productId as string;

  const { addItem } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<DrinkItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    // Look up product from APPROVED_DRINKS or API
    const local = APPROVED_DRINKS.find(
      (p) => p.id === productId || p.name.toLowerCase().replace(/\s+/g, "-") === productId
    );
    if (local) {
      setProduct(local);
    }

    // Try fetching latest live metadata from server
    async function loadServerProduct() {
      try {
        const res = await apiFetch<{ product: any }>(`/api/products/${productId}`);
        const prod = (res as any).product || (res.data as any)?.product;
        if (prod) {
          setProduct({
            id: prod.id,
            name: prod.name,
            category: prod.category || "cold-brew",
            categoryLabel: prod.categoryLabel || "Specialty Drink",
            description: prod.description,
            price: prod.basePrice || prod.price,
            popular: prod.featured,
            tag: prod.tags?.[0],
            calories: prod.calories,
            temperature: prod.temperatureProfile || "Iced",
            tasteNotes: prod.tasteNotes || [],
            pairings: prod.pairings || [],
            productType: prod.productType || "drink",
          });
        }
      } catch {
        // Keep fallback
      }
    }

    loadServerProduct();
  }, [productId]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-cream font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-28">
          <div className="text-center p-8">
            <h2 className="font-serif text-2xl font-bold text-espresso mb-2">Item Not Found</h2>
            <p className="text-sm text-warmgray mb-6">The item you requested is not currently in our menu catalog.</p>
            <Link href="/menu">
              <Button variant="primary">Return to Menu</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isCustomizable = product.category !== "bakery" && product.category !== "savory";
  const isBakery = product.category === "bakery" || product.category === "savory";

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      configurationSummary: isCustomizable ? "Standard Barista Recipe • Regular" : "Artisan Kitchen Special",
    });

    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      setIsAdding(false);
    }, 1500);
  };

  const handleToggleFavorite = async () => {
    const nextState = !isFavorited;
    setIsFavorited(nextState);

    if (user) {
      try {
        if (nextState) {
          await addFavoriteApi(product.id);
        } else {
          await removeFavoriteApi(product.id);
        }
      } catch (err) {
        console.warn("Failed to update favorite:", err);
      }
    }
  };

  // Find paired items from APPROVED_DRINKS
  const pairedItems = (product.pairings || [])
    .map((pairingName) =>
      APPROVED_DRINKS.find(
        (d) =>
          d.name.toLowerCase() === pairingName.toLowerCase() ||
          d.id.toLowerCase() === pairingName.toLowerCase()
      )
    )
    .filter(Boolean) as DrinkItem[];

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-24">
        <Container className="max-w-5xl">
          {/* Back Navigation */}
          <div className="mb-8">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray hover:text-espresso transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Full Menu</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Product Visual Frame */}
            <div className="rounded-3xl bg-gradient-to-br from-offwhite to-cream border border-espresso/10 p-8 sm:p-12 shadow-card flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {product.tag && <Badge variant="caramel">{product.tag}</Badge>}
                <Badge variant="cream">{product.temperature}</Badge>
              </div>

              {/* Large Icon Graphic */}
              <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-cream shadow-inner border border-espresso/10 flex items-center justify-center text-caramel mb-6">
                {isBakery ? (
                  <Cookie className="w-20 h-20 sm:w-28 sm:h-28 text-caramel/90" />
                ) : (
                  <Coffee className="w-20 h-20 sm:w-28 sm:h-28 text-caramel/90" />
                )}
              </div>

              <span className="text-xs uppercase tracking-widest text-warmgray font-semibold mb-1">
                {product.categoryLabel}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
                {product.name}
              </h2>

              <div className="mt-4 flex items-center gap-2 text-xs text-sage font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Crafted Fresh on Order</span>
              </div>
            </div>

            {/* Right: Product Details & Actions */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                    {product.name}
                  </h1>
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={`p-2.5 rounded-full border transition-all ${
                      isFavorited
                        ? "bg-red-50 border-red-200 text-red-500"
                        : "bg-offwhite border-espresso/15 text-espresso/50 hover:text-red-500 hover:border-red-200"
                    }`}
                    aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
                  </button>
                </div>

                <div className="flex items-baseline gap-4 mb-4">
                  <span className="font-serif text-3xl font-bold text-espresso">
                    {formatPrice(product.price)}
                  </span>
                  {product.calories && (
                    <span className="text-xs text-warmgray flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-caramel" />
                      <span>{product.calories} kcal</span>
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-base text-espresso/80 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Taste Profile Notes */}
              <div className="p-5 rounded-2xl bg-offwhite border border-espresso/10 space-y-3">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-espresso/70">
                  Taste Notes & Character
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tasteNotes.map((note) => (
                    <span
                      key={note}
                      className="px-3 py-1 rounded-full bg-cream text-espresso text-xs font-medium border border-espresso/10"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quantity Selector & Add to Cart */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-4">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-3 bg-offwhite border border-espresso/15 rounded-full px-3 py-1.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-espresso/70 hover:bg-espresso/10"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm text-espresso w-4 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-espresso/70 hover:bg-espresso/10"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="flex-1 gap-2 shadow-card"
                  >
                    {addedNotice ? (
                      <>
                        <Check className="w-5 h-5 text-sage" />
                        <span>Added to Tray!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5 text-caramel" />
                        <span>Add {quantity} to Tray • {formatPrice(product.price * quantity)}</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Customizer Option for Drinks */}
                {isCustomizable && (
                  <Link href={`/builder?product=${product.id}`} className="block">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full gap-2 border-espresso/20 hover:border-caramel hover:text-espresso"
                    >
                      <Sliders className="w-4 h-4 text-caramel" />
                      <span>Customize in Interactive Drink Studio</span>
                    </Button>
                  </Link>
                )}
              </div>

              {/* Pairing Recommendations */}
              {pairedItems.length > 0 && (
                <div className="mt-8 pt-6 border-t border-espresso/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-caramel" />
                    <h3 className="font-serif font-bold text-lg text-espresso">
                      Pairs Beautifully With
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pairedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-offwhite border border-espresso/10 flex items-center justify-between gap-3 shadow-sm hover:border-caramel/30 transition-all"
                      >
                        <div>
                          <h4 className="font-serif font-bold text-sm text-espresso">{item.name}</h4>
                          <span className="text-xs text-caramel font-mono">{formatPrice(item.price)}</span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            addItem({
                              productId: item.id,
                              productName: item.name,
                              quantity: 1,
                              unitPrice: item.price,
                              configurationSummary: "Artisan Kitchen Pairing",
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
