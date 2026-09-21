"use client";

import React from "react";
import { Sparkles, Zap, Heart, Snowflake, Flame, Leaf } from "lucide-react";

interface BaristaPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const PROMPT_CHIPS = [
  {
    icon: Zap,
    category: "Energy Kick",
    prompt: "I need high caffeine for deep work, something iced and not too sweet.",
    shortLabel: "High Caffeine, Low Sweetness",
  },
  {
    icon: Snowflake,
    category: "Chilled Refreshment",
    prompt: "A crisp, fruity iced beverage that is completely caffeine-free for a hot afternoon.",
    shortLabel: "Fruity Caffeine-Free Cooler",
  },
  {
    icon: Heart,
    category: "Sweet Indulgence",
    prompt: "Something decadent with caramel and rich sweet cream, cold and dessert-like.",
    shortLabel: "Caramel & Velvet Cream Treat",
  },
  {
    icon: Leaf,
    category: "Plant-Based Zen",
    prompt: "A smooth iced ceremonial matcha crafted with oat milk and subtle balanced sweetness.",
    shortLabel: "Matcha Cloud with Oat Milk",
  },
  {
    icon: Flame,
    category: "Warm Comfort",
    prompt: "A steaming, aromatic espresso latte with vanilla notes to keep me warm.",
    shortLabel: "Cozy Steamed Vanilla Latte",
  },
];

export function BaristaPrompts({ onSelect, disabled }: BaristaPromptsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray">
        <Sparkles className="w-3.5 h-3.5 text-caramel" />
        <span>Try Asking About:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROMPT_CHIPS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.shortLabel}
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(item.prompt);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-offwhite hover:bg-cream border border-espresso/10 hover:border-caramel/40 text-xs text-espresso/80 hover:text-espresso transition-all duration-200 shadow-2xs hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group text-left"
            >
              <span className="p-1 rounded-full bg-espresso/5 group-hover:bg-caramel/15 group-hover:text-caramel transition-colors">
                <Icon className="w-3 h-3 text-espresso/60 group-hover:text-caramel-dark" />
              </span>
              <span className="font-medium">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
