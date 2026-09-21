import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { HeroCanvas } from "@/components/hero/hero-canvas";
import { SignatureDrinks } from "@/features/drinks/signature-drinks";
import { BaristaTeaser } from "@/features/barista/barista-teaser";
import { DrinkBuilderTeaser } from "@/features/builder/drink-builder-teaser";
import { CafeStory } from "@/features/story/cafe-story";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Navigation */}
      <Navbar />

      {/* Cinematic Hero Canvas Section */}
      <HeroCanvas />

      {/* Signature Drinks Section */}
      <SignatureDrinks />

      {/* AI Barista Natural Language Consultation Teaser */}
      <BaristaTeaser />

      {/* Build Your Drink Interactive Studio Teaser */}
      <DrinkBuilderTeaser />

      {/* Café Philosophy & Story */}
      <CafeStory />

      {/* Footer */}
      <Footer />
    </main>
  );
}
