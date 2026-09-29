"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Sparkles, Sliders, ArrowRight } from "lucide-react";

export function HomeFinalCta() {
  return (
    <section className="py-24 sm:py-32 bg-espresso text-cream relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-caramel/15 rounded-full blur-[120px] pointer-events-none" />

      <Container className="relative z-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/20 text-caramel text-xs font-semibold tracking-wider uppercase mb-6 border border-caramel/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Future of Specialty Coffee</span>
        </div>

        <h2 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight mb-4">
          Crafted by AI. Inspired by You.
        </h2>

        <p className="text-base sm:text-lg text-cream/75 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          Step into a café experience designed around your palate. Start exploring our curated signature menu or engineer your own masterpiece.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/menu" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto gap-2 bg-caramel text-espresso hover:bg-caramel-light font-semibold shadow-floating px-8"
            >
              <span>Explore Full Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/builder" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 text-cream border-cream/30 hover:bg-cream/10 px-8"
            >
              <Sliders className="w-4 h-4 text-caramel" />
              <span>Interactive Drink Studio</span>
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
