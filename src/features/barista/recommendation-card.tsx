"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BaristaRecommendation } from "@/types/barista";
import { DnaRadar } from "./dna-radar";
import { Sparkles, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendationCardProps {
  recommendation: BaristaRecommendation;
  rankIndex: number;
}

const INGREDIENT_LABELS: Record<string, string> = {
  // Bases
  "cold-brew": "Slow-Steeped Cold Brew",
  "espresso-shot": "Espresso Roast",
  "matcha-base": "Ceremonial Matcha",
  "frappe-mix": "Velvet Frappe Base",
  "chai-concentrate": "Spiced Chai",
  "strawberry-base": "Pure Strawberry Blend",
  "mango-puree": "Alphonso Mango Puree",
  "berry-base": "Wild Berry Infusion",

  // Milks
  "whole-milk": "Whole Milk",
  "oat-milk": "Oat Milk (Plant-Based)",
  "almond-milk": "Almond Milk",
  "soy-milk": "Soy Milk",
  "coconut-milk": "Coconut Milk",
  "no-milk": "Black / No Milk",

  // Flavors
  "vanilla": "Madagascar Vanilla",
  "caramel": "Handcrafted Caramel",
  "hazelnut": "Toasted Hazelnut",
  "dark-chocolate": "Deep Dark Cocoa",
  "white-chocolate": "White Chocolate Velvet",
  "cinnamon-spice": "Warm Cinnamon Bark",
  "no-flavor": "Pure Unflavored",

  // Sweetness
  "sweetness-0": "0% (Unsweetened)",
  "sweetness-25": "25% (Light)",
  "sweetness-50": "50% (Balanced)",
  "sweetness-75": "75% (Sweet)",
  "sweetness-100": "100% (Extra Sweet)",

  // Ice
  "no-ice": "Steamed / No Ice",
  "light-ice": "Light Ice",
  "regular-ice": "Standard Chill",
  "extra-ice": "Extra Crisp Ice",

  // Sizes
  "regular": "Standard (350ml)",
  "medium": "Medium (450ml)",
  "large": "Grande (550ml)",

  // Toppings
  "caramel-drizzle": "Caramel Drizzle",
  "chocolate-curls": "Belgian Chocolate Shavings",
  "sweet-cream": "Sweet Cold Foam",
  "whipped-cream": "Whipped Cream Crown",
  "cinnamon-dust": "Cinnamon Dust",
  "matcha-foam": "Matcha Cloud Foam",
  "strawberry-foam": "Strawberry Foam",
  "mint-sprig": "Fresh Garden Mint",
};

export function RecommendationCard({
  recommendation,
  rankIndex,
}: RecommendationCardProps) {
  const [showFullDna, setShowFullDna] = useState(false);
  const { product, configuration, reason, drinkDna, pricing, matchScore } = recommendation;

  // Build prefill URL for /builder
  const query = new URLSearchParams({
    product: product.id,
    base: configuration.baseId,
    milk: configuration.milkId,
    flavor: configuration.flavorId,
    sweetness: configuration.sweetnessId,
    ice: configuration.iceId,
    size: configuration.sizeId,
    toppings: configuration.toppingIds.join(","),
    from: "barista",
  });

  const builderUrl = `/builder?${query.toString()}`;

  const isTopMatch = rankIndex === 0;

  return (
    <div
      className={`rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
        isTopMatch
          ? "bg-gradient-to-b from-cream via-offwhite to-white border-caramel/40 shadow-card hover:shadow-floating"
          : "bg-offwhite border-espresso/10 hover:border-espresso/20 shadow-soft"
      }`}
    >
      <div>
        {/* Top Header Badge */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-espresso/5">
          <div className="flex items-center gap-2">
            {isTopMatch ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel text-espresso font-semibold text-xs shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-espresso" />
                <span>Top Match</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-espresso/5 text-espresso/70 text-xs font-medium">
                <span>Alternative #{rankIndex + 1}</span>
              </span>
            )}
            <span className="text-xs text-warmgray font-medium uppercase tracking-wider">
              {product.categoryLabel}
            </span>
          </div>

          {matchScore && (
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-caramel-dark bg-caramel/10 px-2 py-0.5 rounded-md border border-caramel/20">
              <span>{Math.min(99, Math.round(matchScore))}%</span>
              <span className="text-[10px] text-espresso/60 font-sans font-normal">fit</span>
            </div>
          )}
        </div>

        {/* Product Info & Authoritative Price */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-espresso tracking-tight">
                {product.name}
              </h3>
              <p className="text-xs sm:text-sm text-espresso/70 mt-1 leading-relaxed line-clamp-2">
                {product.description}
              </p>
            </div>

            {/* Authoritative Price Badge */}
            <div className="shrink-0 text-left sm:text-right bg-espresso/5 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
              <div className="flex items-baseline gap-1 sm:justify-end">
                <span className="text-xs text-warmgray font-medium">₹</span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
                  {pricing.finalPrice}
                </span>
              </div>
              <div className="text-[11px] text-warmgray mt-0.5">
                Base ₹{pricing.basePrice}
                {pricing.customizationTotal > 0 && ` + ₹${pricing.customizationTotal} craft`}
              </div>
            </div>
          </div>

          {/* AI Grounded Reasoning Box */}
          <div className="relative rounded-2xl bg-espresso/5 p-4 border border-espresso/10 mb-5">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-espresso text-caramel flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-espresso/80 mb-1">
                  Why this fits your request
                </p>
                <p className="text-xs sm:text-sm text-espresso/85 leading-relaxed italic">
                  &ldquo;{reason}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Configured Ingredients Breakdown */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-warmgray mb-2.5">
              Configured Recipe Components:
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-cream border border-espresso/10 text-espresso font-medium">
                <Coffee className="w-3 h-3 text-caramel" />
                {INGREDIENT_LABELS[configuration.baseId] || configuration.baseId}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-cream border border-espresso/10 text-espresso font-medium">
                🥛 {INGREDIENT_LABELS[configuration.milkId] || configuration.milkId}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-cream border border-espresso/10 text-espresso font-medium">
                🍬 {INGREDIENT_LABELS[configuration.sweetnessId] || configuration.sweetnessId}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-cream border border-espresso/10 text-espresso font-medium">
                ❄️ {INGREDIENT_LABELS[configuration.iceId] || configuration.iceId}
              </span>
              {configuration.flavorId !== "no-flavor" && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-cream border border-espresso/10 text-espresso font-medium">
                  🍯 {INGREDIENT_LABELS[configuration.flavorId] || configuration.flavorId}
                </span>
              )}
              {configuration.toppingIds.map((tid) => (
                <span
                  key={tid}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-caramel/10 border border-caramel/20 text-caramel-dark font-medium"
                >
                  ✨ {INGREDIENT_LABELS[tid] || tid}
                </span>
              ))}
            </div>
          </div>

          {/* Drink DNA Radar / Sliders */}
          <div className="border-t border-espresso/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-espresso/70">
                Drink DNA Fingerprint
              </span>
              <button
                type="button"
                onClick={() => setShowFullDna(!showFullDna)}
                className="text-xs text-caramel-dark font-medium flex items-center gap-1 hover:underline focus:outline-none"
              >
                <span>{showFullDna ? "Compact view" : "Inspect full radar"}</span>
                {showFullDna ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showFullDna ? (
              <DnaRadar dna={drinkDna} compact={false} />
            ) : (
              <DnaRadar dna={drinkDna} compact={true} />
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-6 py-4 bg-espresso/5 border-t border-espresso/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-espresso/70">
          <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
          <span>Validated by Server Pricing Engine</span>
        </div>

        <Link href={builderUrl} className="w-full sm:w-auto">
          <Button
            variant={isTopMatch ? "primary" : "secondary"}
            size="sm"
            className="w-full sm:w-auto gap-2 text-xs font-semibold shadow-soft"
          >
            <span>Customize in Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
