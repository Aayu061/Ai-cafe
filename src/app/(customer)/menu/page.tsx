"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { DrinkCard } from "@/features/drinks/drink-card";
import { APPROVED_DRINKS } from "@/lib/constants";
import { DrinkItem, DrinkCategory } from "@/types";
import { apiFetch } from "@/lib/api-client";
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Coffee,
  Flame,
  X,
  ArrowUpDown,
  Filter,
} from "lucide-react";

type CategoryFilter =
  | "all"
  | "coffee"
  | "cold"
  | "signature"
  | "matcha"
  | "smoothie"
  | "refresher"
  | "bakery";

const CATEGORIES: { label: string; value: CategoryFilter }[] = [
  { label: "All Items", value: "all" },
  { label: "Coffee Classics", value: "coffee" },
  { label: "Cold Brews", value: "cold" },
  { label: "Signature Drinks", value: "signature" },
  { label: "Matcha & Tea", value: "matcha" },
  { label: "Smoothies & Blended", value: "smoothie" },
  { label: "Refreshers", value: "refresher" },
  { label: "Food & Bakery", value: "bakery" },
];

export default function MenuPage() {
  const [products, setProducts] = useState<DrinkItem[]>(APPROVED_DRINKS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [temperatureFilter, setTemperatureFilter] = useState<"all" | "Hot" | "Iced" | "Blended">("all");
  const [tasteFilter, setTasteFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recommended" | "price-asc" | "price-desc">("recommended");

  // Fetch catalog from backend API with fallback
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const res = await apiFetch<{ products: any[] }>("/api/products");
        const apiProds = (res as any).products || (res.data as any)?.products;
        if (isMounted && res.success && Array.isArray(apiProds) && apiProds.length > 0) {
          const mapped: DrinkItem[] = apiProds.map((p: any) => {
            let cat: DrinkCategory = "cold-brew";
            if (p.category === "frappe") cat = "frappe";
            else if (p.category === "hot-coffee" || p.category === "coffee") cat = "espresso";
            else if (p.category === "matcha" || p.category === "tea") cat = "tea";
            else if (p.category === "smoothie" || p.category === "creamy") cat = "smoothie";
            else if (p.category === "bakery") cat = "bakery";
            else if (p.category === "savory") cat = "savory";
            else if (p.category === "refresher") cat = "refresher";

            return {
              id: p.id,
              name: p.name,
              category: cat,
              categoryLabel: p.categoryLabel || (cat === "bakery" ? "Artisan Bakery" : "Specialty Coffee"),
              description: p.description,
              price: p.basePrice || p.price,
              popular: p.featured,
              tag: p.tags?.[0],
              calories: p.calories,
              temperature: p.temperatureProfile || (p.temperature === "Hot" ? "Hot" : "Iced"),
              tasteNotes: p.tasteNotes || [],
              pairings: p.pairings || [],
              productType: p.productType || (cat === "bakery" ? "bakery" : "drink"),
            };
          });
          setProducts(mapped);
        }
      } catch {
        // Fallback to APPROVED_DRINKS
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesNotes = item.tasteNotes.some((n) => n.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesNotes) return false;
      }

      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "coffee" && item.category !== "espresso") return false;
        if (selectedCategory === "cold" && item.category !== "cold-brew") return false;
        if (selectedCategory === "signature" && !item.popular && item.tag !== "Signature") return false;
        if (selectedCategory === "matcha" && item.category !== "tea") return false;
        if (selectedCategory === "smoothie" && item.category !== "smoothie" && item.category !== "frappe") return false;
        if (selectedCategory === "refresher" && item.category !== "refresher" && !item.id.includes("refresher") && !item.id.includes("cooler")) return false;
        if (selectedCategory === "bakery" && item.category !== "bakery" && item.category !== "savory") return false;
      }

      // Temperature filter
      if (temperatureFilter !== "all" && item.temperature !== temperatureFilter) {
        return false;
      }

      // Taste Filter
      if (tasteFilter !== "all") {
        const hasTaste = item.tasteNotes.some((n) =>
          n.toLowerCase().includes(tasteFilter.toLowerCase())
        );
        if (!hasTaste) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      // Recommended / Popular first
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    });
  }, [products, searchQuery, selectedCategory, temperatureFilter, tasteFilter, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-24">
        <Container>
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-3 border border-caramel/20">
              <Sparkles className="w-3.5 h-3.5 text-caramel" />
              <span>Full Café Collection</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl font-bold text-espresso tracking-tight mb-3">
              MENU
            </h1>
            <p className="font-serif italic text-lg sm:text-xl text-espresso/80">
              “Find something made for your moment.”
            </p>
          </div>

          {/* Search & Main Filter Bar */}
          <div className="max-w-4xl mx-auto mb-10 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-warmgray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drinks, coffee or something sweet..."
                className="w-full pl-12 pr-10 py-3.5 rounded-full bg-offwhite border border-espresso/15 focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel/30 text-espresso text-sm shadow-soft transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-warmgray hover:text-espresso"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.value
                      ? "bg-espresso text-cream shadow-soft"
                      : "bg-offwhite text-espresso/70 hover:text-espresso hover:bg-espresso/5 border border-espresso/10"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sub-Filters: Temperature, Taste, Sort */}
            <div className="p-4 rounded-2xl bg-offwhite/80 border border-espresso/10 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-espresso/60 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-caramel" />
                  <span>Filters:</span>
                </span>

                {/* Temperature */}
                <select
                  value={temperatureFilter}
                  onChange={(e) => setTemperatureFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg bg-cream border border-espresso/15 text-espresso focus:outline-none focus:border-caramel"
                >
                  <option value="all">All Temperatures</option>
                  <option value="Hot">Hot</option>
                  <option value="Iced">Chilled / Iced</option>
                  <option value="Blended">Blended Frappe</option>
                </select>

                {/* Taste Note */}
                <select
                  value={tasteFilter}
                  onChange={(e) => setTasteFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-cream border border-espresso/15 text-espresso focus:outline-none focus:border-caramel"
                >
                  <option value="all">All Taste Profiles</option>
                  <option value="caramel">Caramel & Sweet</option>
                  <option value="chocolate">Chocolate & Mocha</option>
                  <option value="berry">Berry & Fruity</option>
                  <option value="vanilla">Vanilla & Creamy</option>
                  <option value="matcha">Matcha & Earthy</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-warmgray" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg bg-cream border border-espresso/15 text-espresso focus:outline-none focus:border-caramel"
                >
                  <option value="recommended">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-caramel/10 flex items-center justify-center text-caramel mx-auto mb-4">
                <Coffee className="w-8 h-8 opacity-70" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-espresso mb-2">
                No matching creations
              </h3>
              <p className="text-sm text-warmgray mb-6">
                We couldn&apos;t find any drinks matching your filter criteria. Try resetting your search or exploring our full catalog.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setTemperatureFilter("all");
                  setTasteFilter("all");
                }}
                className="px-5 py-2.5 rounded-full bg-espresso text-cream hover:bg-caramel hover:text-espresso transition-all text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((drink) => (
                <DrinkCard key={drink.id} drink={drink} />
              ))}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
