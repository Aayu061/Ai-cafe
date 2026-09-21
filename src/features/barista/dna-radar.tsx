"use client";

import React from "react";
import { DrinkDna } from "@/types/barista";
import { motion } from "framer-motion";

interface DnaRadarProps {
  dna: DrinkDna;
  compact?: boolean;
}

const DIMENSIONS: Array<{
  key: keyof DrinkDna;
  label: string;
  icon: string;
  colorClass: string;
  bgGlow: string;
  getDescriptor: (val: number) => string;
}> = [
  {
    key: "sweetness",
    label: "Sweetness",
    icon: "🍬",
    colorClass: "from-amber-400 to-amber-500 text-amber-900",
    bgGlow: "bg-amber-400",
    getDescriptor: (v) => (v <= 20 ? "Unsweetened" : v <= 45 ? "Subtle" : v <= 75 ? "Balanced" : "Luscious"),
  },
  {
    key: "strength",
    label: "Boldness",
    icon: "⚡",
    colorClass: "from-orange-600 to-amber-700 text-orange-950",
    bgGlow: "bg-orange-600",
    getDescriptor: (v) => (v <= 25 ? "Zero/Decaf" : v <= 50 ? "Mellow" : v <= 75 ? "Active Kick" : "Intense Peak"),
  },
  {
    key: "creaminess",
    label: "Creaminess",
    icon: "🥛",
    colorClass: "from-stone-300 to-amber-200 text-stone-900",
    bgGlow: "bg-stone-300",
    getDescriptor: (v) => (v <= 25 ? "Clean & Light" : v <= 50 ? "Silky" : v <= 75 ? "Velvety" : "Ultra Rich"),
  },
  {
    key: "chill",
    label: "Chill Factor",
    icon: "❄️",
    colorClass: "from-cyan-400 to-sky-500 text-cyan-950",
    bgGlow: "bg-cyan-400",
    getDescriptor: (v) => (v <= 20 ? "Steamed Warm" : v <= 45 ? "Cool" : v <= 75 ? "Iced Crisp" : "Deep Frost"),
  },
  {
    key: "richness",
    label: "Body & Depth",
    icon: "☕",
    colorClass: "from-stone-700 to-amber-950 text-stone-100",
    bgGlow: "bg-stone-700",
    getDescriptor: (v) => (v <= 25 ? "Delicate" : v <= 50 ? "Medium" : v <= 75 ? "Full Body" : "Complex Reserve"),
  },
];

export function DnaRadar({ dna, compact = false }: DnaRadarProps) {
  if (compact) {
    return (
      <div className="space-y-1.5 w-full">
        {DIMENSIONS.map((dim) => {
          const val = Math.min(100, Math.max(0, dna[dim.key] ?? 50));
          return (
            <div key={dim.key} className="flex items-center gap-2 text-xs">
              <span className="w-20 text-[11px] font-medium text-espresso/70 truncate flex items-center gap-1">
                <span>{dim.icon}</span>
                <span>{dim.label}</span>
              </span>
              <div className="flex-1 h-2 bg-espresso/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${dim.colorClass}`}
                />
              </div>
              <span className="w-8 text-right font-mono text-[11px] text-espresso/80 font-semibold">
                {val}%
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-espresso/5 rounded-2xl p-4 border border-espresso/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-caramel flex items-center gap-1.5">
          <span>🧬</span> Drink DNA Profile
        </span>
        <span className="text-[11px] text-warmgray">Authoritative Sensory Score</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DIMENSIONS.map((dim) => {
          const val = Math.min(100, Math.max(0, dna[dim.key] ?? 50));
          const descriptor = dim.getDescriptor(val);
          return (
            <div
              key={dim.key}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-espresso/5 shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-espresso">
                  <span>{dim.icon}</span>
                  <span>{dim.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-espresso/5 text-espresso/70">
                    {descriptor}
                  </span>
                  <span className="font-mono text-xs font-bold text-espresso">{val}%</span>
                </div>
              </div>

              <div className="h-2 w-full bg-espresso/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${dim.colorClass}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
