"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/features/cart/cart-context";
import { UtensilsCrossed, Plus, Sparkles, Coffee, Cookie } from "lucide-react";

export function HomePairingsSection() {
  const { addItem } = useCart();

  const curatedPairings = [
    {
      drink: { id: "caramel-cold-brew", name: "Caramel Cold Brew", price: 180 },
      food: { id: "butter-croissant", name: "Butter Croissant", price: 95 },
      reason: "The crisp sweetness of velvety caramel cold foam balances the honeycomb flaky butter layers.",
      comboTotal: 275,
    },
    {
      drink: { id: "vanilla-latte", name: "Vanilla Latte", price: 190 },
      food: { id: "chocolate-croissant", name: "Chocolate Croissant", price: 110 },
      reason: "Madagascar vanilla steamed milk elevates warm, melted semi-sweet Belgian chocolate.",
      comboTotal: 300,
    },
    {
      drink: { id: "cappuccino", name: "Classic Cappuccino", price: 160 },
      food: { id: "chocolate-chip-cookie", name: "Chocolate Chip Cookie", price: 75 },
      reason: "Thick espresso microfoam pairs effortlessly with chewy brown-butter and sea salt flakes.",
      comboTotal: 235,
    },
  ];

  const handleAddCombo = (drink: any, food: any) => {
    addItem({
      productId: drink.id,
      productName: drink.name,
      quantity: 1,
      unitPrice: drink.price,
      configurationSummary: "Pairing Combo • Standard",
    });
    addItem({
      productId: food.id,
      productName: food.name,
      quantity: 1,
      unitPrice: food.price,
      configurationSummary: "Pairing Combo • Bakery",
    });
  };

  return (
    <section className="py-20 sm:py-28 bg-cream">
      <Container>
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage/15 text-sage text-xs font-semibold tracking-wider uppercase mb-3">
            <UtensilsCrossed className="w-3.5 h-3.5 text-caramel" />
            <span>Curated Harmonies</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso tracking-tight">
            Pair It With
          </h2>
          <p className="text-sm sm:text-base text-espresso/70 mt-2">
            Specially balanced coffee and bakery pairings crafted by our sensory team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {curatedPairings.map((pair, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-offwhite border border-espresso/10 hover:border-caramel/40 shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-espresso/5 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-cream flex items-center justify-center text-caramel">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <span className="font-serif font-bold text-sm text-espresso">
                      {pair.drink.name}
                    </span>
                  </div>
                  <span className="text-xs text-warmgray font-mono">+</span>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-cream flex items-center justify-center text-caramel">
                      <Cookie className="w-4 h-4" />
                    </div>
                    <span className="font-serif font-bold text-sm text-espresso">
                      {pair.food.name}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-espresso/75 italic leading-relaxed mb-4">
                  “{pair.reason}”
                </p>
              </div>

              <div className="pt-4 border-t border-espresso/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-warmgray uppercase font-semibold block">
                    Pairing Total
                  </span>
                  <span className="font-serif font-bold text-lg text-espresso">
                    {formatPrice(pair.comboTotal)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddCombo(pair.drink, pair.food)}
                  className="gap-1.5 text-xs shadow-soft"
                >
                  <Plus className="w-3.5 h-3.5 text-caramel" />
                  <span>Add Both to Tray</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
