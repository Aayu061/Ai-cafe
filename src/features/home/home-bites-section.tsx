"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/features/cart/cart-context";
import { APPROVED_DRINKS } from "@/lib/constants";
import { Utensils, Cookie, ShoppingBag, Plus, Sparkles, ArrowRight } from "lucide-react";

export function HomeBitesSection() {
  const { addItem } = useCart();

  const bakeryItems = APPROVED_DRINKS.filter(
    (d) => d.category === "bakery" || d.category === "savory"
  ).slice(0, 4);

  return (
    <section className="py-20 sm:py-28 bg-offwhite border-y border-espresso/5">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-3 border border-caramel/20">
              <Utensils className="w-3.5 h-3.5 text-caramel" />
              <span>Artisan Kitchen</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso tracking-tight">
              Fresh Café Bites & Bakery
            </h2>
            <p className="text-sm sm:text-base text-espresso/70 mt-2 max-w-xl">
              Golden French croissants, brown-butter sea salt cookies, and warm artisan loaves baked fresh to pair with your brew.
            </p>
          </div>

          <Link href="/menu">
            <Button variant="outline" size="md" className="gap-2 border-espresso/20 hover:border-caramel hover:text-espresso">
              <span>View All Pastries</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bakeryItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-cream border border-espresso/10 hover:border-caramel/40 shadow-sm hover:shadow-card transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="w-full h-32 rounded-2xl bg-offwhite flex items-center justify-center text-caramel mb-4 group-hover:scale-[1.02] transition-transform">
                  <Cookie className="w-12 h-12 opacity-80" />
                </div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-caramel">
                    {item.categoryLabel}
                  </span>
                  {item.tag && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-caramel/15 text-caramel-dark">
                      {item.tag}
                    </span>
                  )}
                </div>
                <Link href={`/menu/${item.id}`} className="block focus:outline-none">
                  <h3 className="font-serif font-bold text-lg text-espresso group-hover:text-caramel transition-colors">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-xs text-espresso/70 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-espresso/5 flex items-center justify-between">
                <span className="font-serif font-bold text-lg text-espresso">
                  {formatPrice(item.price)}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    addItem({
                      productId: item.id,
                      productName: item.name,
                      quantity: 1,
                      unitPrice: item.price,
                      configurationSummary: "Fresh Kitchen Bakery",
                    });
                  }}
                  className="gap-1.5 text-xs shadow-soft"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Tray</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
