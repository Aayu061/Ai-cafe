import React from "react";
import { Container } from "@/components/layout/container";
import { BRAND } from "@/lib/constants";
import { Coffee, Heart, Sparkles, SunMedium } from "lucide-react";

export function CafeStory() {
  return (
    <section id="story" className="py-24 sm:py-32 bg-offwhite border-t border-espresso/5">
      <Container>
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage/10 text-sage text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-caramel" />
            <span>Our Philosophy</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-espresso tracking-tight mb-6">
            Crafted by AI. Inspired by You.
          </h2>

          <p className="text-base sm:text-xl text-espresso/75 font-sans leading-relaxed">
            AI Café was born from a simple belief: coffee should never be one-size-fits-all. We combine the warmth of a modern neighborhood café with intelligent personalization so every cup feels made just for you.
          </p>
        </div>

        {/* 3 Core Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Warm Atmosphere */}
          <div className="bg-cream rounded-3xl p-8 border border-espresso/5 shadow-soft flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-espresso text-cream flex items-center justify-center mb-6 shadow-soft">
              <SunMedium className="w-6 h-6 text-caramel" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso mb-3">
              Natural Café Warmth
            </h3>
            <p className="text-sm text-espresso/70 leading-relaxed">
              Designed around morning sunlight, natural wood, and inviting cream tones. A relaxing digital space that feels like stepping into your favorite specialty café.
            </p>
          </div>

          {/* Card 2: Thoughtful AI */}
          <div className="bg-cream rounded-3xl p-8 border border-espresso/5 shadow-soft flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-espresso text-cream flex items-center justify-center mb-6 shadow-soft">
              <Sparkles className="w-6 h-6 text-caramel" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso mb-3">
              Personalized by AI
            </h3>
            <p className="text-sm text-espresso/70 leading-relaxed">
              Intuitive recommendations tailored to your exact taste, dietary preferences, and energy requirements—translating simple descriptions into delicious reality.
            </p>
          </div>

          {/* Card 3: Quality First */}
          <div className="bg-cream rounded-3xl p-8 border border-espresso/5 shadow-soft flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-espresso text-cream flex items-center justify-center mb-6 shadow-soft">
              <Coffee className="w-6 h-6 text-caramel" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso mb-3">
              Your Drink. Your Way.
            </h3>
            <p className="text-sm text-espresso/70 leading-relaxed">
              From our signature Caramel Cold Brew to blended fruit smoothies, explore and build drinks with complete freedom and precision.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
