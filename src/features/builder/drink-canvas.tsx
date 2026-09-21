"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface DrinkCanvasProps {
  baseId: string;
  milkId: string;
  flavorId: string;
  sweetnessId: string;
  iceId: string;
  toppingIds: string[];
  sizeId: string;
  drinkName?: string;
}

export function DrinkCanvas({
  baseId,
  milkId,
  flavorId,
  iceId,
  toppingIds,
  sizeId,
  drinkName,
}: DrinkCanvasProps) {
  // Base liquid gradient mapping
  const baseGradients: Record<string, string> = {
    "cold-brew": "from-[#1A0D07] via-[#2A170C] to-[#120803]",
    espresso: "from-[#2E180E] via-[#3D2114] to-[#1D0D06]",
    matcha: "from-[#2D5A27] via-[#437A3B] to-[#1F421A]",
    "strawberry-base": "from-[#B93848] via-[#D85265] to-[#992233]",
    "mango-base": "from-[#D88A1A] via-[#ECA328] to-[#BA720E]",
    "berry-base": "from-[#5B2144] via-[#7B2E5D] to-[#40132E]",
    "chocolate-base": "from-[#2B170E] via-[#381F13] to-[#1A0B05]",
    "vanilla-base": "from-[#D9CBB5] via-[#ECE1CD] to-[#C4B39A]",
  };

  // Milk swirl colors
  const milkColors: Record<string, { bg: string; opacity: string }> = {
    "whole-milk": { bg: "bg-[#FFFDF4]", opacity: "opacity-85" },
    "oat-milk": { bg: "bg-[#F3E8D2]", opacity: "opacity-90" },
    "almond-milk": { bg: "bg-[#FBF5EC]", opacity: "opacity-80" },
    "soy-milk": { bg: "bg-[#F7F0E0]", opacity: "opacity-85" },
  };

  // Flavor syrup accent lines
  const flavorAccents: Record<string, string | null> = {
    caramel: "bg-[#C98A4A]",
    chocolate: "bg-[#3D1E10]",
    vanilla: "bg-[#E6D4B8]",
    hazelnut: "bg-[#8B5A2B]",
    strawberry: "bg-[#D85265]",
    mango: "bg-[#ECA328]",
    berry: "bg-[#7B2E5D]",
    "flavor-none": null,
  };

  // Glass dimensions by size
  const sizeStyles: Record<string, { height: string; width: string; label: string }> = {
    small: { height: "h-56", width: "w-36", label: "Small (250ml)" },
    medium: { height: "h-64", width: "w-40", label: "Medium (350ml)" },
    large: { height: "h-72", width: "w-44", label: "Large (450ml)" },
  };

  const currentSize = sizeStyles[sizeId] || sizeStyles.medium;
  const currentBase = baseGradients[baseId] || baseGradients["cold-brew"];
  const currentMilk = milkColors[milkId] || milkColors["whole-milk"];
  const currentFlavorAccent = flavorAccents[flavorId];
  const hasIce = iceId !== "no-ice";

  // Ice cube counts based on ice level
  const iceCount =
    iceId === "extra-ice" ? 5 : iceId === "regular-ice" ? 3 : iceId === "light-ice" ? 2 : 0;

  // Topping booleans
  const hasWhippedCream = toppingIds.includes("whipped-cream");
  const hasCaramelDrizzle = toppingIds.includes("caramel-drizzle");
  const hasChocolateDrizzle = toppingIds.includes("chocolate-drizzle");
  const hasCocoaDust = toppingIds.includes("cocoa-dust");
  const hasStrawberryFoam = toppingIds.includes("strawberry-foam");
  const hasMatchaFoam = toppingIds.includes("matcha-foam");

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-gradient-to-b from-cream-dark/40 via-cream to-cream rounded-3xl border border-espresso/10 shadow-soft">
      {/* Beverage Glass Stage */}
      <div className="relative w-56 h-80 flex flex-col items-center justify-end">
        {/* Straw (Iced drinks) */}
        {hasIce && (
          <div className="absolute -top-7 right-14 w-3.5 h-24 bg-gradient-to-r from-caramel via-caramel-light to-caramel rounded-t-full border border-caramel-dark/30 shadow-md -rotate-6 z-10 transition-all duration-300" />
        )}

        {/* Whipped Cream Top (Rises outside glass rim) */}
        {hasWhippedCream && (
          <div className="absolute -top-6 w-36 h-12 bg-white rounded-t-full rounded-b-lg border border-espresso/10 shadow-md z-30 flex items-center justify-center overflow-hidden transition-all duration-500 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-white/90 absolute -top-2 left-6 blur-[1px]" />
            <div className="w-10 h-10 rounded-full bg-white absolute -top-3 right-6 blur-[1px]" />
            {hasCaramelDrizzle && (
              <div className="w-28 h-1.5 bg-[#C98A4A] rounded-full rotate-6 shadow-sm z-30 opacity-90" />
            )}
            {hasChocolateDrizzle && (
              <div className="w-28 h-1.5 bg-[#3D1E10] rounded-full -rotate-6 shadow-sm z-30 opacity-90" />
            )}
            {hasCocoaDust && (
              <div className="absolute inset-0 bg-[radial-gradient(#3D1E10_1px,transparent_1px)] bg-[size:5px_5px] opacity-40 z-30" />
            )}
          </div>
        )}

        {/* Cold Foam Layer (Matcha or Strawberry) */}
        {(hasMatchaFoam || hasStrawberryFoam) && !hasWhippedCream && (
          <div
            className={`absolute top-0 w-36 h-12 rounded-t-xl z-25 border-b border-espresso/10 flex items-center justify-center shadow-inner transition-all duration-500 ${
              hasMatchaFoam ? "bg-[#8FA683]" : "bg-[#F2B6C1]"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_1px,_transparent_1px)] bg-[length:4px_4px]" />
            <span className="text-[9px] uppercase tracking-wider text-white/90 font-semibold drop-shadow-sm">
              {hasMatchaFoam ? "Matcha Cold Foam" : "Strawberry Cold Foam"}
            </span>
          </div>
        )}

        {/* Main Glass Vessel */}
        <div
          className={`relative ${currentSize.width} ${currentSize.height} border-4 border-espresso/25 rounded-b-3xl rounded-t-sm overflow-hidden backdrop-blur-md bg-white/15 shadow-card flex flex-col justify-end transition-all duration-500`}
        >
          {/* Glass Highlights & Reflections */}
          <div className="absolute left-2 top-3 bottom-3 w-1 bg-white/35 rounded-full blur-[0.5px] z-30 pointer-events-none" />
          <div className="absolute right-2.5 top-5 bottom-6 w-0.5 bg-white/20 rounded-full z-30 pointer-events-none" />

          {/* Ice Cubes (Reactively Rendered) */}
          {hasIce && (
            <div className="absolute inset-0 pointer-events-none z-20 flex flex-wrap gap-2.5 p-4 items-center justify-center opacity-80 transition-all duration-300">
              {Array.from({ length: iceCount }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-xl bg-white/45 backdrop-blur-sm border border-white/50 shadow-sm ${
                    i % 2 === 0 ? "w-8 h-8 rotate-12" : "w-9 h-7 -rotate-12"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Liquid Layers */}
          <div className="w-full h-full flex flex-col justify-end relative overflow-hidden">
            {/* Milk Cloud & Swirl Layer */}
            <div
              className={`w-full h-[42%] ${currentMilk.bg} ${currentMilk.opacity} transition-all duration-700 relative overflow-hidden flex flex-col justify-end`}
            >
              {/* Marble Gradient Texture */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-espresso/15 to-transparent" />
              {currentFlavorAccent && (
                <div
                  className={`w-full h-2 ${currentFlavorAccent} opacity-85 blur-[0.5px] transition-all duration-500`}
                />
              )}
            </div>

            {/* Base Beverage Layer (Bottom) */}
            <div
              className={`w-full h-[58%] bg-gradient-to-b ${currentBase} transition-all duration-700 relative`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Caption / Dynamic Specification */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream border border-espresso/10 text-espresso text-xs font-serif font-bold uppercase tracking-wider shadow-soft">
          <Sparkles className="w-3.5 h-3.5 text-caramel" />
          <span>{drinkName || "Personalized Creation"}</span>
        </div>
        <p className="text-xs text-warmgray mt-2 font-medium">
          {currentSize.label} • {baseId.replace("-", " ")} • {milkId.replace("-", " ")} • {iceId.replace("-", " ")}
        </p>
      </div>
    </div>
  );
}
