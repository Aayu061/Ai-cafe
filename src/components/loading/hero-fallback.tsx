import React from "react";
import { BRAND } from "@/lib/constants";

interface HeroFallbackProps {
  reason?: string;
  onRetry?: () => void;
}

/**
 * AI CAFÉ — Fallback presentation when hero assets or canvas are unavailable
 * Provides an elegant warm branded atmosphere preserving the café visual identity.
 */
export function HeroFallback({ reason, onRetry }: HeroFallbackProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#120905] flex items-center justify-center text-center px-6">
      {/* Background warm café gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2A1810] via-[#1A0E08] to-[#120905]" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#C98A4A_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 max-w-lg text-[#FFFDF8]">
        <span className="text-[11px] uppercase tracking-[0.3em] text-[#C98A4A] font-semibold mb-3 block">
          Artisan Experience
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-[#FFFDF8]">
          {BRAND.name}
        </h1>
        <p className="font-serif text-xl sm:text-2xl text-[#C98A4A] italic mb-6">
          {BRAND.tagline}
        </p>
        <p className="text-sm text-[#8C877F] leading-relaxed mb-8 max-w-md mx-auto">
          {reason || "Slow-steeped craft coffee meets intuitive AI personalization."}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-6 py-2.5 rounded-full bg-[#C98A4A] text-[#120905] font-semibold text-xs tracking-wider uppercase hover:bg-[#FFFDF8] transition-colors shadow-soft"
          >
            Refresh Experience
          </button>
        )}
      </div>
    </div>
  );
}

export default HeroFallback;
