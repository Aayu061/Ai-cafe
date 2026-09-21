import React from "react";
import { DrinkCustomization } from "@/types";
import { Sparkles } from "lucide-react";

interface DrinkVisualizerProps {
  customization: DrinkCustomization;
}

export function DrinkVisualizer({ customization }: DrinkVisualizerProps) {
  // Base color mapping
  const baseColorMap = {
    "cold-brew": "bg-[#27160C]", // Deep cold brew
    espresso: "bg-[#4A2D1B]",   // Warm espresso
    matcha: "bg-[#4F7942]",     // Vibrant matcha
    chai: "bg-[#9A5B32]",       // Spiced chai
  };

  // Milk color/opacity mapping
  const milkColorMap = {
    whole: "bg-[#FFFBF2]",
    oat: "bg-[#F4ECD8]",
    almond: "bg-[#FBF5EC]",
    coconut: "bg-[#FFFFFF]",
  };

  // Foam color mapping
  const foamColorMap = {
    none: "transparent",
    "vanilla-sweet-foam": "bg-[#FFFDF6]",
    "caramel-foam": "bg-[#E8C294]",
    "matcha-foam": "bg-[#9FB895]",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-cream-dark/50 to-cream rounded-3xl border border-espresso/10">
      {/* Visual Cup Container */}
      <div className="relative w-48 h-72 flex flex-col items-center justify-end">
        {/* Glass Outline */}
        <div className="relative w-40 h-64 border-4 border-espresso/20 rounded-b-3xl rounded-t-sm overflow-hidden backdrop-blur-sm bg-white/20 shadow-floating flex flex-col justify-end">
          {/* Condensation / Highlights on glass */}
          <div className="absolute left-2 top-4 bottom-4 w-1 bg-white/30 rounded-full blur-[0.5px]" />
          <div className="absolute right-3 top-6 bottom-8 w-0.5 bg-white/20 rounded-full" />

          {/* Ice Cubes Visual */}
          {customization.iceLevel !== "No Ice" && (
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-wrap gap-2 p-4 items-center justify-center opacity-70">
              <div className="w-8 h-8 rounded-lg bg-white/40 backdrop-blur-sm rotate-12 border border-white/40 shadow-sm" />
              <div className="w-9 h-7 rounded-lg bg-white/30 backdrop-blur-sm -rotate-6 border border-white/40 shadow-sm" />
              <div className="w-8 h-9 rounded-lg bg-white/40 backdrop-blur-sm rotate-45 border border-white/40 shadow-sm" />
            </div>
          )}

          {/* Foam Layer (Top) */}
          {customization.foam !== "none" && (
            <div
              className={`w-full h-14 ${foamColorMap[customization.foam]} transition-all duration-500 relative z-20 flex items-center justify-center border-b border-espresso/10`}
            >
              {/* Foam bubbles texture */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.04)_1px,_transparent_1px)] bg-[length:4px_4px]" />

              {/* Toppings visual */}
              {customization.topping === "cinnamon" && (
                <div className="w-16 h-2 rounded-full bg-[#8B4513]/40 blur-[1px]" />
              )}
              {customization.topping === "cocoa-dust" && (
                <div className="w-16 h-2 rounded-full bg-[#3D2314]/50 blur-[1px]" />
              )}
              {customization.topping === "caramel-drizzle" && (
                <div className="w-20 h-1.5 rounded-full bg-[#C98A4A] shadow-sm animate-pulse" />
              )}
            </div>
          )}

          {/* Milk Swirl Layer (Middle) */}
          <div
            className={`w-full h-24 ${milkColorMap[customization.milk]} opacity-90 transition-all duration-500 relative overflow-hidden`}
          >
            {/* Liquid marble gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-espresso/10 to-transparent" />
          </div>

          {/* Base Layer (Bottom) */}
          <div
            className={`w-full h-28 ${baseColorMap[customization.base]} transition-all duration-500 relative`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          </div>
        </div>

        {/* Straw (Iced drinks) */}
        <div className="absolute -top-6 right-16 w-3 h-20 bg-caramel/90 rounded-t-full border border-caramel-dark/20 shadow-sm -rotate-6 z-0" />
      </div>

      {/* Real-time Layer Summary Badge */}
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-espresso uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-caramel" />
          <span>Live Drink Preview</span>
        </div>
        <p className="text-xs text-espresso/70 mt-1 capitalize font-medium">
          {customization.base.replace("-", " ")} • {customization.milk} milk • {customization.sweetness}% sweet
        </p>
      </div>
    </div>
  );
}
