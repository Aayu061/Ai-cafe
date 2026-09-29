"use client";

import React from "react";
import Link from "next/link";
import { Container } from "./container";
import { BRAND, NAV_ITEMS } from "@/lib/constants";
import { Sparkles, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export function Footer() {
  return (
    <footer className="bg-espresso text-cream border-t border-cream/10 pt-20 pb-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Column 1: Brand & Tagline */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Logo variant="default" theme="cream" size={38} />
            </div>

            <p className="font-serif text-lg text-cream/90 italic mb-2">
              {BRAND.tagline}
            </p>
            <p className="text-sm text-cream/70 font-sans leading-relaxed max-w-sm mb-6">
              {BRAND.supporting} Combining the natural warmth of a specialty coffee house with intuitive AI personalization.
            </p>

            <div className="text-xs text-cream/60 space-y-1">
              <p>Flagship: 142 Artisan Boulevard, Suite 100</p>
              <p>Hours: Daily 7:00 AM – 8:00 PM</p>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="font-serif font-bold text-base text-cream mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-cream/70 hover:text-caramel transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Approved Menu Categories */}
          <div>
            <h4 className="font-serif font-bold text-base text-cream mb-4">
              Menu
            </h4>
            <ul className="space-y-2.5 text-sm text-cream/70">
              <li>
                <Link href="#menu" className="hover:text-caramel transition-colors">
                  Caramel Cold Brew
                </Link>
              </li>
              <li>
                <Link href="#menu" className="hover:text-caramel transition-colors">
                  Chocolate Frappe
                </Link>
              </li>
              <li>
                <Link href="#menu" className="hover:text-caramel transition-colors">
                  Matcha Cloud
                </Link>
              </li>
              <li>
                <Link href="#menu" className="hover:text-caramel transition-colors">
                  Strawberry Cream
                </Link>
              </li>
              <li>
                <Link href="#menu" className="hover:text-caramel transition-colors">
                  Vanilla Latte
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="font-serif font-bold text-base text-cream mb-4">
              Café Updates
            </h4>
            <p className="text-xs text-cream/70 leading-relaxed mb-4">
              Sign up to receive news about new seasonal drops and AI Barista features.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3.5 py-2 rounded-xl bg-espresso-light/60 border border-cream/15 text-xs text-cream placeholder:text-cream/40 focus:outline-none focus:border-caramel transition-colors"
              />
              <Button
                type="submit"
                variant="accent"
                size="sm"
                className="w-full justify-center gap-1.5"
              >
                <span>Subscribe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/50">
          <p>© {new Date().getFullYear()} AI CAFÉ. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-cream transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-cream transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-cream transition-colors">
              Contact & Flagship
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
