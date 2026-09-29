"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DrinkItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Sliders, Flame, ShoppingBag, Heart, Check, Coffee, Cookie, Sparkles } from "lucide-react";
import { useCart } from "@/features/cart/cart-context";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { addFavoriteApi, removeFavoriteApi } from "@/lib/api-client";

interface DrinkCardProps {
  drink: DrinkItem;
  initialFavorited?: boolean;
  onFavoriteChange?: (productId: string, favorited: boolean) => void;
}

export function DrinkCard({ drink, initialFavorited = false, onFavoriteChange }: DrinkCardProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isCustomizable = drink.category !== "bakery" && drink.category !== "savory";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);

    addItem({
      productId: drink.id,
      productName: drink.name,
      quantity: 1,
      unitPrice: drink.price,
      configurationSummary: isCustomizable ? "Standard Barista Recipe • Regular" : "Artisan Kitchen Special",
    });

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setIsAdding(false);
    }, 1200);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    if (onFavoriteChange) {
      onFavoriteChange(drink.id, nextState);
    }

    if (user) {
      try {
        if (nextState) {
          await addFavoriteApi(drink.id);
        } else {
          await removeFavoriteApi(drink.id);
        }
      } catch (err) {
        console.warn("Failed to persist favorite:", err);
      }
    }
  };

  // Determine visual icon/accent
  const isBakery = drink.category === "bakery" || drink.category === "savory";

  return (
    <Card className="group relative flex flex-col justify-between h-full bg-offwhite border-espresso/10 hover:border-caramel/40 hover:shadow-card transition-all duration-300 rounded-2xl overflow-hidden p-5">
      <div>
        {/* Top Badges & Favorite Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-caramel">
            {drink.categoryLabel}
          </span>
          <div className="flex items-center gap-1.5">
            {drink.tag && (
              <Badge variant="caramel" size="sm">
                {drink.tag}
              </Badge>
            )}
            <Badge variant="cream" size="sm">
              {drink.temperature}
            </Badge>
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`p-1.5 rounded-full transition-colors ${
                isFavorited
                  ? "text-red-500 bg-red-50"
                  : "text-espresso/40 hover:text-red-500 hover:bg-espresso/5"
              }`}
              aria-label={isFavorited ? `Remove ${drink.name} from favorites` : `Add ${drink.name} to favorites`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* Visual Badge/Emblem */}
        <div className="w-full h-32 rounded-xl bg-gradient-to-br from-cream to-espresso/5 border border-espresso/5 flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-offwhite/90 shadow-soft flex items-center justify-center text-espresso/70 group-hover:text-caramel transition-colors">
            {isBakery ? <Cookie className="w-8 h-8" /> : <Coffee className="w-8 h-8" />}
          </div>
          <span className="absolute bottom-2 right-2 text-[10px] font-mono text-warmgray/70 uppercase">
            AI CAFÉ
          </span>
        </div>

        {/* Drink Title linking to product detail */}
        <Link href={`/menu/${drink.id}`} className="block focus:outline-none">
          <h3 className="font-serif text-xl font-bold text-espresso mb-1.5 group-hover:text-caramel transition-colors">
            {drink.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-xs text-espresso/70 leading-relaxed line-clamp-2 mb-3">
          {drink.description}
        </p>

        {/* Taste Notes */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {drink.tasteNotes.slice(0, 3).map((note) => (
            <span
              key={note}
              className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-espresso/80 border border-espresso/5 font-medium"
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      {/* Footer / Pricing & Actions */}
      <div className="pt-3 border-t border-espresso/5 flex flex-col gap-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-espresso font-serif">
              {formatPrice(drink.price)}
            </span>
            {drink.calories && (
              <span className="text-[10px] text-warmgray flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-caramel/80" />
                {drink.calories} kcal
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCustomizable && (
              <Link href={`/builder?product=${drink.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 px-2.5 py-1 text-xs border-espresso/20 hover:border-caramel hover:text-espresso"
                >
                  <Sliders className="w-3 h-3 text-caramel" />
                  <span>Customize</span>
                </Button>
              </Link>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="gap-1.5 px-3 py-1 text-xs shadow-soft"
            >
              {justAdded ? (
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
      </div>
    </Card>
  );
}
