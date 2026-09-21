"use client";

import React, { useState, useEffect } from "react";
import { Container } from "@/components/layout/container";
import { APPROVED_DRINKS } from "@/lib/constants";
import { DrinkCard } from "./drink-card";
import { DrinkItem, DrinkCategory } from "@/types";
import { Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

type FilterTab = "all" | DrinkCategory;

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All Creations", value: "all" },
  { label: "Cold Coffee", value: "cold-brew" },
  { label: "Frappe", value: "frappe" },
  { label: "Hot Coffee", value: "espresso" },
  { label: "Tea & Botanical", value: "tea" },
  { label: "Smoothies & Cream", value: "smoothie" },
];

export function SignatureDrinks() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [drinks, setDrinks] = useState<DrinkItem[]>(APPROVED_DRINKS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFromApi, setIsFromApi] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const res = await apiFetch<{ products: any[] }>("/api/products");
        const apiProducts = (res as any).products || (res.data as any)?.products;
        if (isMounted && res.success && Array.isArray(apiProducts) && apiProducts.length > 0) {
          const mappedDrinks: DrinkItem[] = apiProducts.map((p: any) => {
              // Map backend category to frontend category
              let cat: DrinkCategory = "cold-brew";
              if (p.category === "frappe") cat = "frappe";
              else if (p.category === "hot-coffee") cat = "espresso";
              else if (p.category === "matcha" || p.category === "tea") cat = "tea";
              else if (p.category === "smoothie" || p.category === "creamy") cat = "smoothie";

              return {
                id: p.id,
                name: p.name,
                category: cat,
                categoryLabel: p.categoryLabel || "Specialty Drink",
                description: p.description,
                price: p.basePrice,
                popular: p.featured,
                tag: p.tags?.[0],
                calories: p.calories,
                temperature: p.temperatureProfile || "Iced",
                tasteNotes: p.tasteNotes || [],
              };
            });
            setDrinks(mappedDrinks);
            setIsFromApi(true);
          }
      } catch {
        // Fallback to APPROVED_DRINKS (already formatted with INR)
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDrinks =
    activeTab === "all"
      ? drinks
      : drinks.filter((drink) => drink.category === activeTab);

  return (
    <section id="menu" className="py-24 sm:py-32 bg-cream">
      <Container>
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage/10 text-sage text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-caramel" />
            <span>Café Menu</span>
            {isFromApi && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-sage/20 text-[10px] text-sage font-mono">
                Live Catalog
              </span>
            )}
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-espresso tracking-tight mb-4">
            Crafted For You
          </h2>

          <p className="text-base sm:text-lg text-espresso/70 font-sans leading-relaxed">
            Discover our curated creations—from slow-steeped cold brew to vibrant blended fruit infusions, ready to customize your way.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-12">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 rounded-full transition-all duration-200 focus:outline-none",
                activeTab === tab.value
                  ? "bg-espresso text-cream shadow-soft"
                  : "bg-offwhite text-espresso/75 hover:bg-cream-dark hover:text-espresso border border-espresso/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drinks Grid */}
        {loading && !drinks.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-warmgray">
            <RefreshCw className="w-6 h-6 animate-spin mb-3 text-caramel" />
            <p className="text-sm font-serif">Loading café catalog...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDrinks.map((drink) => (
              <DrinkCard key={drink.id} drink={drink} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
