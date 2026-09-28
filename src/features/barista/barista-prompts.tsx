"use client";

import React from "react";
import { Sparkles, Zap, Heart, Snowflake, Flame, Leaf } from "lucide-react";

interface BaristaPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const PROMPT_CHIPS = [
  {
    icon: Sparkles,
    category: "Priciest",
    prompt: "Which coffee costs the most?",
    shortLabel: "Primiest Coffee",
  },
  {
    icon: Zap,
    category: "Cheapest",
    prompt: "What is the cheapest coffee?",
    shortLabel: "Cheapest Coffee",
  },
  {
    icon: Heart,
    category: "Café Moment",
    prompt: "Coffee and something sweet under ₹300",
    shortLabel: "Combo Under ₹300",
  },
  {
    icon: Flame,
    category: "Compare",
    prompt: "Compare Vanilla Latte and Caramel Cold Brew",
    shortLabel: "Compare Latte & Cold Brew",
  },
  {
    icon: Leaf,
    category: "Food Pairing",
    prompt: "What snack goes with my cold brew?",
    shortLabel: "Artisan Food Pairing",
  },
  {
    icon: Sparkles,
    category: "Surprise",
    prompt: "Surprise me with something unexpected!",
    shortLabel: "Surprise Me",
  },
  {
    icon: Snowflake,
    category: "Chilled",
    prompt: "I want an iced caramel drink with oat milk, not too sweet.",
    shortLabel: "Iced Caramel Oat Drink",
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
