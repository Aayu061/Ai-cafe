"use client";

import React, { useState } from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { DrinkVisualizer } from "./drink-visualizer";
import { DrinkCustomization, DrinkBase, MilkOption, SweetnessLevel, ColdFoamOption, ToppingOption } from "@/types";
import { Sliders, Sparkles, Plus, Check, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const BASES: { label: string; value: DrinkBase; price: number }[] = [
  { label: "Caramel Cold Brew Base", value: "cold-brew", price: 180 },
  { label: "Espresso Roast", value: "espresso", price: 170 },
  { label: "Matcha Cloud Base", value: "matcha", price: 210 },
  { label: "Spiced Chai", value: "chai", price: 180 },
];

const MILKS: { label: string; value: MilkOption; extra: number }[] = [
  { label: "Whole Milk", value: "whole", extra: 0 },
  { label: "Oat Milk", value: "oat", extra: 30 },
  { label: "Almond Milk", value: "almond", extra: 30 },
  { label: "Coconut Milk", value: "coconut", extra: 30 },
];

const SWEETNESS_OPTIONS: SweetnessLevel[] = [0, 25, 50, 75, 100];

const FOAMS: { label: string; value: ColdFoamOption; extra: number }[] = [
  { label: "No Foam", value: "none", extra: 0 },
  { label: "Vanilla Sweet Foam", value: "vanilla-sweet-foam", extra: 35 },
  { label: "Caramel Cold Foam", value: "caramel-foam", extra: 35 },
  { label: "Matcha Foam", value: "matcha-foam", extra: 35 },
];

const TOPPINGS: { label: string; value: ToppingOption; extra: number }[] = [
  { label: "None", value: "none", extra: 0 },
  { label: "Cinnamon Dust", value: "cinnamon", extra: 15 },
  { label: "Cocoa Dust", value: "cocoa-dust", extra: 15 },
  { label: "Caramel Drizzle", value: "caramel-drizzle", extra: 20 },
];

export function DrinkBuilderTeaser() {
  const [customization, setCustomization] = useState<DrinkCustomization>({
    base: "cold-brew",
    milk: "oat",
    sweetness: 50,
    flavor: "caramel",
    foam: "caramel-foam",
    topping: "caramel-drizzle",
    iceLevel: "Regular Ice",
  });

  const [addedToast, setAddedToast] = useState(false);

  // Calculate price dynamically
  const basePrice = BASES.find((b) => b.value === customization.base)?.price || 4.5;
  const milkPrice = MILKS.find((m) => m.value === customization.milk)?.extra || 0;
  const foamPrice = FOAMS.find((f) => f.value === customization.foam)?.extra || 0;
  const toppingPrice = TOPPINGS.find((t) => t.value === customization.topping)?.extra || 0;
  const totalPrice = basePrice + milkPrice + foamPrice + toppingPrice;

  const handleAddToCart = () => {
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <section id="build" className="py-24 sm:py-32 bg-cream">
      <Container>
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-4 border border-caramel/20">
            <Sliders className="w-3.5 h-3.5 text-caramel" />
            <span>Drink Studio</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-espresso tracking-tight mb-4">
            Build Your Drink
          </h2>

          <p className="text-base sm:text-lg text-espresso/70 font-sans leading-relaxed mb-6">
            Customize every layer to match your taste. Watch the drink visualizer update in real time as you adjust base, milk, and foam.
          </p>

          <Link href="/builder">
            <Button
              variant="outline"
              size="md"
              className="gap-2 border-espresso/20 text-espresso hover:border-caramel hover:text-caramel-dark shadow-soft"
            >
              <Sliders className="w-4 h-4 text-caramel" />
              <span>Launch Full Interactive Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-caramel" />
            </Button>
          </Link>
        </div>

        {/* Builder Studio Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Live Drink Visualizer */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="bg-offwhite rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-soft">
              <DrinkVisualizer customization={customization} />

              {/* Price & Summary */}
              <div className="mt-6 pt-6 border-t border-espresso/10 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-warmgray block">
                    Calculated Total
                  </span>
                  <span className="font-serif text-2xl font-bold text-espresso">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleAddToCart}
                  className="gap-2"
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-caramel" />
                      <span>Saved To Studio</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-caramel" />
                      <span>Add To Order</span>
                    </>
                  )}
                </Button>
              </div>

              {addedToast && (
                <div className="mt-3 p-2.5 rounded-xl bg-sage/10 border border-sage/20 text-sage text-xs text-center font-medium">
                  Customization ready. Full checkout connects in the next phase!
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customization Controls */}
          <div className="lg:col-span-7 space-y-8 bg-offwhite rounded-3xl p-6 sm:p-10 border border-espresso/10 shadow-soft">
            {/* Step 1: Base */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-espresso block mb-3">
                1. Select Liquid Base
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BASES.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setCustomization({ ...customization, base: b.value })}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl border text-sm font-medium transition-all text-left",
                      customization.base === b.value
                        ? "bg-espresso text-cream border-espresso shadow-soft"
                        : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/50"
                    )}
                  >
                    <span>{b.label}</span>
                    <span className="text-xs opacity-75">{formatPrice(b.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Milk Option */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-espresso block mb-3">
                2. Choose Milk / Cream
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {MILKS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setCustomization({ ...customization, milk: m.value })}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all text-center gap-1",
                      customization.milk === m.value
                        ? "bg-espresso text-cream border-espresso shadow-soft"
                        : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/50"
                    )}
                  >
                    <span>{m.label}</span>
                    <span className="text-[10px] opacity-75">
                      {m.extra > 0 ? `+${formatPrice(m.extra)}` : "Included"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Sweetness Level */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-espresso">
                  3. Sweetness Level
                </label>
                <span className="text-xs font-bold text-caramel font-mono">
                  {customization.sweetness}% Sweet
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {SWEETNESS_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomization({ ...customization, sweetness: val })}
                    className={cn(
                      "py-2.5 rounded-xl border text-xs font-bold font-mono transition-all text-center",
                      customization.sweetness === val
                        ? "bg-caramel text-espresso border-caramel shadow-soft"
                        : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/50"
                    )}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Cold Foam Crown */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-espresso block mb-3">
                4. Cold Foam Crown
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FOAMS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setCustomization({ ...customization, foam: f.value })}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border text-xs font-medium transition-all text-left",
                      customization.foam === f.value
                        ? "bg-espresso text-cream border-espresso shadow-soft"
                        : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/50"
                    )}
                  >
                    <span>{f.label}</span>
                    <span className="text-[10px] opacity-75">
                      {f.extra > 0 ? `+${formatPrice(f.extra)}` : "None"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 5: Toppings */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-espresso block mb-3">
                5. Topping & Drizzle
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TOPPINGS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setCustomization({ ...customization, topping: t.value })}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all text-center gap-1",
                      customization.topping === t.value
                        ? "bg-espresso text-cream border-espresso shadow-soft"
                        : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/50"
                    )}
                  >
                    <span>{t.label}</span>
                    <span className="text-[10px] opacity-75">
                      {t.extra > 0 ? `+${formatPrice(t.extra)}` : "None"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
