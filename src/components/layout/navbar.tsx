"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND, NAV_ITEMS } from "@/lib/constants";
import { Search, ShoppingBag, User, Menu, X, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount] = useState(0);

  const { user, userProfile, loading, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const displayName = userProfile?.displayName || user?.displayName || "Guest";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-offwhite/90 backdrop-blur-md shadow-soft border-b border-espresso/5 py-3"
            : "bg-gradient-to-b from-espresso/40 via-espresso/15 to-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus:outline-none"
            aria-label="AI Café Home"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm",
                isScrolled
                  ? "bg-espresso text-cream group-hover:bg-caramel group-hover:text-espresso"
                  : "bg-cream/90 text-espresso backdrop-blur group-hover:bg-caramel"
              )}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  "font-serif font-bold tracking-wider text-lg transition-colors leading-none",
                  isScrolled ? "text-espresso" : "text-cream"
                )}
              >
                {BRAND.name}
              </span>
              <span
                className={cn(
                  "text-[9px] uppercase tracking-widest font-sans font-medium mt-0.5",
                  isScrolled ? "text-warmgray" : "text-cream/80"
                )}
              >
                Specialty & AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors relative group py-1",
                  isScrolled
                    ? "text-espresso/85 hover:text-caramel"
                    : "text-cream/90 hover:text-white"
                )}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-caramel/20 text-caramel border border-caramel/30 align-middle">
                    {item.badge}
                  </span>
                )}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-caramel transition-all duration-200 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Search */}
            <button
              type="button"
              className={cn(
                "p-2 rounded-full transition-colors focus:outline-none",
                isScrolled
                  ? "text-espresso/80 hover:text-espresso hover:bg-espresso/5"
                  : "text-cream/90 hover:text-white hover:bg-cream/10"
              )}
              aria-label="Search drinks"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Cart with Badge */}
            <button
              type="button"
              className={cn(
                "relative p-2 rounded-full transition-colors focus:outline-none",
                isScrolled
                  ? "text-espresso/80 hover:text-espresso hover:bg-espresso/5"
                  : "text-cream/90 hover:text-white hover:bg-cream/10"
              )}
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-caramel text-espresso text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              ) : null}
            </button>

            {/* Dynamic Authentication State */}
            {loading ? (
              <div
                className={cn(
                  "h-9 px-4 rounded-full flex items-center justify-center text-xs animate-pulse",
                  isScrolled ? "bg-espresso/10 text-espresso/40" : "bg-cream/20 text-cream/40"
                )}
              >
                <span>Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Button
                    variant={isScrolled ? "primary" : "secondary"}
                    size="sm"
                    className="gap-2 shadow-soft"
                  >
                    <User className="w-3.5 h-3.5 text-caramel" />
                    <span className="max-w-[100px] truncate">{displayName.split(" ")[0]}</span>
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={() => signOut()}
                  title="Sign Out"
                  className={cn(
                    "p-2 rounded-full transition-colors focus:outline-none",
                    isScrolled
                      ? "text-espresso/70 hover:text-red-600 hover:bg-espresso/5"
                      : "text-cream/80 hover:text-cream hover:bg-cream/10"
                  )}
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant={isScrolled ? "primary" : "secondary"}
                  size="sm"
                  className="gap-2"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center gap-3">
            <button
              type="button"
              className={cn(
                "relative p-2 rounded-full focus:outline-none",
                isScrolled ? "text-espresso" : "text-cream"
              )}
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "p-2 rounded-full focus:outline-none",
                isScrolled ? "text-espresso hover:bg-espresso/5" : "text-cream hover:bg-cream/10"
              )}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[68px] z-40 bg-cream-light/95 backdrop-blur-xl border-b border-espresso/10 p-6 shadow-floating sm:hidden"
          >
            <nav className="flex flex-col gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-base font-medium text-espresso hover:text-caramel py-2 border-b border-espresso/5"
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-caramel/20 text-caramel border border-caramel/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}

              <div className="pt-4 flex flex-col gap-3">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full justify-center gap-2"
                      >
                        <User className="w-4 h-4 text-caramel" />
                        <span>Profile ({displayName.split(" ")[0]})</span>
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-center gap-2 border-espresso/20 text-espresso"
                    >
                      <LogOut className="w-4 h-4 text-caramel" />
                      <span>Sign Out</span>
                    </Button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Join</span>
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
