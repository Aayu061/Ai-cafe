"use client";

import React from "react";
import Link from "next/link";
import { LogoMark } from "./logo-mark";
import { LogoProps } from "@/types/brand";
import { BRAND } from "@/lib/constants";

export function Logo({
  variant = "default",
  theme = "espresso",
  size = "md",
  className = "",
  showTagline = true,
}: LogoProps) {
  // Dimension mapping
  const markSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 26
      : size === "md"
      ? 34
      : size === "lg"
      ? 44
      : 56;

  const isLight = theme === "cream" || theme === "light";

  const textColor = isLight ? "text-[#FFFDF8]" : "text-[#3A2418]";
  const subtextColor = isLight ? "text-[#C98A4A]" : "text-[#795548]";
  const glassColor = isLight ? "#FFFDF8" : "#3A2418";
  const sparkleColor = "#C98A4A";

  if (variant === "symbol") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <LogoMark
          size={markSize}
          glassColor={glassColor}
          sparkleColor={sparkleColor}
          liquidColor={sparkleColor}
        />
        <span className="sr-only">{BRAND.name}</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <div className="flex-shrink-0">
          <LogoMark
            size={markSize}
            glassColor={glassColor}
            sparkleColor={sparkleColor}
            liquidColor={sparkleColor}
          />
        </div>
        <span className={`font-serif font-bold tracking-wider text-lg leading-none ${textColor}`}>
          {BRAND.name}
        </span>
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <LogoMark
          size={markSize}
          glassColor={glassColor}
          sparkleColor={sparkleColor}
          liquidColor={sparkleColor}
        />
        <div className="flex items-baseline gap-2">
          <span className={`font-serif font-bold tracking-wider text-xl leading-none ${textColor}`}>
            {BRAND.name}
          </span>
          <span className="text-[#C98A4A]/40 text-xs">/</span>
          <span className={`text-[11px] uppercase tracking-widest font-sans font-medium ${subtextColor}`}>
            Specialty & AI
          </span>
        </div>
      </div>
    );
  }

  // Default Full Brand Lockup
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="flex-shrink-0">
        <LogoMark
          size={markSize}
          glassColor={glassColor}
          sparkleColor={sparkleColor}
          liquidColor={sparkleColor}
        />
      </div>
      <div className="flex flex-col text-left">
        <span className={`font-serif font-bold tracking-wider text-lg sm:text-xl leading-tight ${textColor}`}>
          {BRAND.name}
        </span>
        {showTagline && (
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-sans font-semibold mt-0.5 ${subtextColor}`}>
            {BRAND.tagline}
          </span>
        )}
      </div>
    </div>
  );
}

export default Logo;
