import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { HeroCanvas } from "@/components/hero/hero-canvas";
import { SignatureDrinks } from "@/features/drinks/signature-drinks";
import { HomeBitesSection } from "@/features/home/home-bites-section";
import { BaristaTeaser } from "@/features/barista/barista-teaser";
import { DrinkBuilderTeaser } from "@/features/builder/drink-builder-teaser";
import { HomePairingsSection } from "@/features/home/home-pairings-section";
import { CafeStory } from "@/features/story/cafe-story";
import { HomeFinalCta } from "@/features/home/home-final-cta";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Navigation */}
      <Navbar />

      {/* Cinematic 192-Frame Hero Canvas Section */}
      <HeroCanvas />

      {/* Curated Signature Drinks Section */}
      <SignatureDrinks />

      {/* Fresh Café Bites & Bakery Showcase */}
      <HomeBitesSection />

      {/* AI Barista Natural Language Consultation Teaser */}
      <BaristaTeaser />

      {/* Build Your Drink Interactive Studio Teaser */}
      <DrinkBuilderTeaser />

      {/* Curated Coffee & Food Pairings Section */}
      <HomePairingsSection />

      {/* Café Philosophy & Story */}
      <CafeStory />

      {/* Final Brand Call-To-Action */}
      <HomeFinalCta />

      {/* Footer */}
      <Footer />
    </main>
  );
}
