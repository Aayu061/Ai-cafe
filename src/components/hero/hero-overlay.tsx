"use client";

import React from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowDown, Sparkles } from "lucide-react";
import { MusicPlayer } from "./music-player";
import { cn } from "@/lib/utils";

interface HeroOverlayProps {
  scrollProgress: number; // 0.0 to 1.0
  isReducedMotion?: boolean;
}

export function HeroOverlay({ scrollProgress, isReducedMotion = false }: HeroOverlayProps) {
  // Calculate opacities based on scroll progress
  // Phase 1 (0 to 0.25): Initial headline & CTAs
  // Phase 2 (0.30 to 0.65): "Cold Brew. Smoothly crafted."
  // Phase 3 (0.70 to 1.0): "Personalized by AI. Make it yours."

  const getPhaseOpacity = (start: number, peakStart: number, peakEnd: number, end: number) => {
    if (isReducedMotion) return 1;
    if (scrollProgress < start || scrollProgress > end) return 0;
    if (scrollProgress >= peakStart && scrollProgress <= peakEnd) return 1;
    if (scrollProgress < peakStart) {
      return (scrollProgress - start) / (peakStart - start);
    }
    return (end - scrollProgress) / (end - peakEnd);
  };

  const initialOpacity = isReducedMotion ? 1 : Math.max(0, 1 - scrollProgress * 3.5);
  const storyOneOpacity = getPhaseOpacity(0.25, 0.35, 0.55, 0.65);
  const storyTwoOpacity = getPhaseOpacity(0.65, 0.75, 0.90, 1.0);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 sm:p-10 lg:p-16">
      {/* Top bar placeholder for spacing under navbar */}
      <div className="pt-16 sm:pt-20" />

      {/* Center Narrative Layers */}
      <div className="relative w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center text-center">
        {/* Main Hero Header (Visible at start) */}
        <div
          style={{ opacity: initialOpacity }}
          className={cn(
            "transition-opacity duration-300 max-w-3xl flex flex-col items-center",
            initialOpacity > 0.05 ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream/80 backdrop-blur-md border border-espresso/10 text-espresso text-xs font-medium tracking-wider uppercase mb-6 shadow-soft">
            <Sparkles className="w-3.5 h-3.5 text-caramel" />
            <span>{BRAND.supporting}</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-offwhite drop-shadow-md leading-[1.08] mb-6">
            Your Drink. <br />
            <span className="italic font-normal text-cream">Your Way.</span>
          </h1>

          <p className="text-base sm:text-xl text-cream/90 max-w-xl font-sans font-light drop-shadow mb-8 leading-relaxed">
            Specialty coffee and crafted beverages personalized to your exact taste, mood, and moments.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="#build">
              <Button
                variant="accent"
                size="lg"
                className="w-full sm:w-auto shadow-floating hover:scale-[1.02]"
              >
                Create Your Drink
              </Button>
            </Link>
            <Link href="#menu">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-offwhite/15 text-offwhite border-offwhite/30 backdrop-blur-sm hover:bg-offwhite/25 hover:border-offwhite"
              >
                Explore Menu
              </Button>
            </Link>
          </div>
        </div>

        {/* Storytelling Caption 1: Cold Brew. Smoothly crafted. */}
        {!isReducedMotion && (
          <div
            style={{ opacity: storyOneOpacity }}
            className="absolute max-w-2xl px-6 py-4 rounded-3xl bg-espresso/60 backdrop-blur-md border border-cream/10 text-offwhite transition-opacity duration-300 pointer-events-none shadow-floating"
          >
            <p className="text-xs uppercase tracking-widest text-caramel font-semibold mb-1">
              AI Café Signature
            </p>
            <h2 className="font-serif text-2xl sm:text-4xl font-medium text-cream">
              {BRAND.phrases.coldBrew}
            </h2>
            <p className="text-sm sm:text-base text-cream/80 mt-2 font-light">
              Slow-steeped caramel cold brew poured over ice, finished with velvet sweet cream.
            </p>
          </div>
        )}

        {/* Storytelling Caption 2: Personalized by AI. Make it yours. */}
        {!isReducedMotion && (
          <div
            style={{ opacity: storyTwoOpacity }}
            className="absolute max-w-2xl px-6 py-4 rounded-3xl bg-espresso/60 backdrop-blur-md border border-cream/10 text-offwhite transition-opacity duration-300 pointer-events-none shadow-floating"
          >
            <p className="text-xs uppercase tracking-widest text-caramel font-semibold mb-1">
              {BRAND.phrases.personalized}
            </p>
            <h2 className="font-serif text-2xl sm:text-4xl font-medium text-cream">
              {BRAND.phrases.makeItYours}
            </h2>
            <p className="text-sm sm:text-base text-cream/80 mt-2 font-light">
              Customize base, sweetness, foam, and flavors. Live visual calibration in real time.
            </p>
          </div>
        )}
      </div>

      {/* Bottom bar with Audio widget and scroll prompt */}
      <div className="w-full flex items-end justify-between pointer-events-auto">
        {/* Morning Vibes Audio Widget */}
        <div className="flex items-center">
          <MusicPlayer />
        </div>

        {/* Scroll Indicator */}
        {!isReducedMotion && (
          <div
            style={{ opacity: Math.max(0, 1 - scrollProgress * 5) }}
            className="hidden sm:flex flex-col items-center gap-1.5 text-cream/80 transition-opacity duration-300"
          >
            <span className="text-[11px] uppercase tracking-widest font-medium">
              Scroll to explore
            </span>
            <ArrowDown className="w-4 h-4 animate-bounce text-caramel" />
          </div>
        )}
      </div>
    </div>
  );
}
