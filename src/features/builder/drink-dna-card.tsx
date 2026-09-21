"use client";

import React from "react";
import { Sparkles, Activity } from "lucide-react";

export interface DrinkDnaScores {
  sweetness: number;
  strength: number;
  creaminess: number;
  chill: number;
  richness: number;
}

interface DrinkDnaCardProps {
  dna: DrinkDnaScores;
  isValidating?: boolean;
}

export function DrinkDnaCard({ dna, isValidating }: DrinkDnaCardProps) {
  const dimensions = [
    { label: "Sweetness", value: dna.sweetness, color: "bg-caramel" },
    { label: "Strength", value: dna.strength, color: "bg-espresso" },
    { label: "Creaminess", value: dna.creaminess, color: "bg-[#E6D4B8]" },
    { label: "Chill Level", value: dna.chill, color: "bg-[#7DA0CA]" },
    { label: "Richness", value: dna.richness, color: "bg-caramel-dark" },
  ];

  return (
    <div className="bg-offwhite rounded-3xl p-6 sm:p-7 border border-espresso/10 shadow-soft">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-caramel" />
          <h3 className="font-serif text-lg font-bold text-espresso">
            Drink DNA™ Profile
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-warmgray uppercase tracking-wider">
          <Sparkles className={`w-3 h-3 text-caramel ${isValidating ? "animate-spin" : ""}`} />
          <span>{isValidating ? "Calibrating..." : "Real-time UX"}</span>
        </div>
      </div>

      <p className="text-xs text-espresso/70 mb-6 font-sans leading-relaxed">
        Dynamic sensory representation calibrated to your selected base, sweetness level, milk choice, and toppings.
      </p>

      <div className="space-y-4">
        {dimensions.map((dim) => (
          <div key={dim.label}>
            <div className="flex items-center justify-between text-xs font-medium mb-1.5 text-espresso">
              <span>{dim.label}</span>
              <span className="font-mono text-[11px] text-warmgray">{dim.value}%</span>
            </div>
            <div className="w-full h-2.5 bg-cream rounded-full overflow-hidden border border-espresso/5">
              <div
                className={`h-full rounded-full ${dim.color} transition-all duration-700 ease-out`}
                style={{ width: `${Math.min(100, Math.max(0, dim.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
