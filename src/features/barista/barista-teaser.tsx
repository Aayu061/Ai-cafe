"use client";

import React, { useState } from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Send, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BaristaPreset {
  prompt: string;
  recommendedDrink: string;
  reason: string;
  tags: string[];
}

const PRESETS: BaristaPreset[] = [
  {
    prompt: "Something refreshing with oat milk and subtle sweetness",
    recommendedDrink: "Caramel Cold Brew (with Oat Milk)",
    reason: "A smooth, chilled single-origin base balanced with light caramel sweetness and creamy oat texture.",
    tags: ["Chilled", "Balanced", "Plant-Based Option"],
  },
  {
    prompt: "Need an afternoon energy kick that isn't too heavy",
    recommendedDrink: "Matcha Cloud",
    reason: "Sustained green tea energy combined with a light, airy foam crown that won't weigh you down.",
    tags: ["Smooth Energy", "Clean Finish", "Antioxidant Rich"],
  },
  {
    prompt: "A fruity, thirst-quenching drink without caffeine",
    recommendedDrink: "Berry Blast",
    reason: "Crisp iced wild berry infusion with cool mint hints, crisp and entirely caffeine-free.",
    tags: ["0mg Caffeine", "Hydrating", "Naturally Bright"],
  },
  {
    prompt: "A warm and comforting sweet treat",
    recommendedDrink: "Vanilla Latte",
    reason: "Double espresso infused with real vanilla bean syrup and velvety micro-steamed whole milk.",
    tags: ["Warm & Cozy", "Aromatic", "Comfort Classic"],
  },
];

export function BaristaTeaser() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const currentPreset = PRESETS[selectedPresetIndex];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    // For Phase 1 demonstration, acknowledge input
    setSelectedPresetIndex(0);
  };

  return (
    <section id="ai-barista" className="py-24 sm:py-32 bg-offwhite border-y border-espresso/5 relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-caramel/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-sage/10 blur-3xl pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Context & Explanations */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-4 border border-caramel/20">
              <Sparkles className="w-3.5 h-3.5 text-caramel" />
              <span>Smart Coffee Consultation</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-espresso tracking-tight mb-6 leading-[1.15]">
              Ask Your AI Barista
            </h2>

            <p className="text-base sm:text-lg text-espresso/75 font-sans leading-relaxed mb-8">
              Describe your mood, flavor preferences, or dietary goals in plain language. Our smart Barista interprets your taste and suggests the ideal beverage.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 text-sm text-espresso/80">
                <div className="w-5 h-5 rounded-full bg-sage/10 text-sage flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Analyzes temperature, caffeine tolerance, and sweetness</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-espresso/80">
                <div className="w-5 h-5 rounded-full bg-sage/10 text-sage flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Translates cravings into customized drink recipes</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-espresso/80">
                <div className="w-5 h-5 rounded-full bg-sage/10 text-sage flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span>Seamlessly opens in Drink Builder for fine-tuning</span>
              </div>
            </div>

            <Link href="#build">
              <Button variant="primary" size="lg" className="gap-2">
                <span>Try Drink Builder</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Right Column: Interactive Consultation Card */}
          <div className="lg:col-span-7">
            <div className="bg-cream rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-floating">
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-espresso/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-espresso text-cream flex items-center justify-center shadow-soft">
                    <Sparkles className="w-5 h-5 text-caramel" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-espresso">
                      AI Barista Consultation
                    </h3>
                    <p className="text-xs text-warmgray">Online • Instant Taste Matching</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sage/10 text-sage">
                  Interactive Preview
                </span>
              </div>

              {/* Preset Prompts Chips */}
              <div className="py-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-warmgray mb-3">
                  Choose a taste prompt:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset, index) => (
                    <button
                      key={preset.prompt}
                      type="button"
                      onClick={() => setSelectedPresetIndex(index)}
                      className={cn(
                        "text-xs text-left px-3.5 py-2 rounded-xl border transition-all duration-200",
                        selectedPresetIndex === index
                          ? "bg-espresso text-cream border-espresso shadow-soft"
                          : "bg-offwhite text-espresso/80 border-espresso/10 hover:border-caramel/50"
                      )}
                    >
                      &ldquo;{preset.prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Simulation Area */}
              <div className="space-y-4 pt-2">
                {/* User Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-md bg-espresso text-cream text-sm rounded-2xl rounded-tr-sm px-4 py-3 shadow-soft">
                    <p>&ldquo;{currentPreset.prompt}&rdquo;</p>
                  </div>
                </div>

                {/* AI Barista Response Bubble */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-caramel text-espresso flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="max-w-lg bg-offwhite border border-espresso/10 rounded-2xl rounded-tl-sm p-4 text-espresso shadow-soft">
                    <div className="text-[11px] font-semibold text-caramel uppercase tracking-wider mb-1">
                      Recommended Beverage
                    </div>
                    <h4 className="font-serif text-lg font-bold text-espresso mb-1">
                      {currentPreset.recommendedDrink}
                    </h4>
                    <p className="text-xs sm:text-sm text-espresso/70 leading-relaxed mb-3">
                      {currentPreset.reason}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {currentPreset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cream text-espresso/70 border border-espresso/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link href="/builder">
                      <Button variant="accent" size="sm" className="w-full justify-center">
                        Customize In Drink Studio
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Custom Input Bar */}
              <form onSubmit={handleCustomSubmit} className="mt-6 pt-4 border-t border-espresso/10 flex items-center gap-2">
                <div className="relative flex-1">
                  <MessageSquare className="w-4 h-4 text-warmgray absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Type what you want to drink..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full bg-offwhite border border-espresso/10 text-xs sm:text-sm text-espresso placeholder:text-warmgray focus:outline-none focus:border-caramel transition-colors"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" className="px-4 py-2.5 rounded-full">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
