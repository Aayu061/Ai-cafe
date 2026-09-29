"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useCart } from "@/features/cart/cart-context";
import { Logo } from "@/components/brand/logo";
import {
  LayoutDashboard,
  Coffee,
  Sparkles,
  Sliders,
  ShoppingBag,
  Clock,
  Heart,
  BookmarkCheck,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  X,
} from "lucide-react";

interface CustomerSidebarProps {
  children?: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  count?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function CustomerSidebar({ children }: CustomerSidebarProps) {
  const pathname = usePathname();
  const { user, userProfile, signOut } = useAuth();
  const { cartCount } = useCart();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = userProfile?.displayName || user?.displayName || "Patron";

  const navSections: NavSection[] = [
    {
      title: "HOME",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "DISCOVER",
      items: [
        { label: "Menu", href: "/menu", icon: Coffee },
        { label: "AI Barista", href: "/barista", icon: Sparkles, badge: "AI" },
        { label: "Build Your Drink", href: "/builder", icon: Sliders },
      ],
    },
    {
      title: "YOUR CAFÉ",
      items: [
        { label: "Cart", href: "/cart", icon: ShoppingBag, count: cartCount },
        { label: "Orders", href: "/orders", icon: Clock },
        { label: "Favorites", href: "/favorites", icon: Heart },
        { label: "Saved Drinks", href: "/saved-drinks", icon: BookmarkCheck },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { label: "Profile", href: "/profile", icon: User },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Mobile Top Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-espresso text-cream px-4 py-3.5 flex items-center justify-between border-b border-white/10 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-cream hover:bg-white/10 focus:outline-none"
            aria-label="Open navigation sidebar"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Logo variant="symbol" theme="cream" size={26} />
            <span className="font-serif font-bold text-base tracking-wide">AI CAFÉ</span>
          </Link>
        </div>

        <Link
          href="/cart"
          className="relative p-2 rounded-full text-cream hover:bg-white/10"
          aria-label={`Cart with ${cartCount} items`}
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-caramel text-espresso text-[10px] font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Mobile Slide-Out Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 bg-espresso text-cream flex flex-col transition-transform duration-300 shadow-2xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Logo variant="symbol" theme="cream" size={28} />
            <div>
              <span className="font-serif font-bold text-base">AI CAFÉ</span>
              <p className="text-[10px] text-cream/60">Your Drink. Your Way.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-cream/70 hover:text-white"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cream/40 px-3 uppercase">
                {sec.title}
              </span>
              {sec.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-caramel text-espresso font-semibold"
                        : "text-cream/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/20">
                        {item.badge}
                      </span>
                    )}
                    {typeof item.count === "number" && item.count > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-caramel/30 text-caramel">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Mobile Profile & Logout */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-caramel/20 text-caramel flex items-center justify-center font-bold text-xs shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-cream truncate">{displayName}</p>
              <p className="text-[10px] text-cream/50 truncate">{user?.email || "Patron"}</p>
            </div>
          </div>
          {user && (
            <button
              type="button"
              onClick={() => {
                signOut();
                setMobileOpen(false);
              }}
              className="p-2 text-cream/60 hover:text-red-400"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-screen bg-espresso text-cream transition-all duration-300 border-r border-white/10 z-30 shrink-0 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <Logo variant="symbol" theme="cream" size={28} />
            {!isCollapsed && (
              <div className="leading-tight">
                <span className="font-serif font-bold text-base tracking-wide text-cream">
                  AI CAFÉ
                </span>
                <p className="text-[10px] text-cream/50 font-sans">Your Drink. Your Way.</p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-cream/60 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              {!isCollapsed && (
                <span className="text-[10px] font-mono font-bold tracking-widest text-cream/40 px-3 uppercase block mb-1">
                  {sec.title}
                </span>
              )}
              {sec.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                      isActive
                        ? "bg-caramel text-espresso font-semibold shadow-soft"
                        : "text-cream/80 hover:text-white hover:bg-white/10"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-caramel/20 text-caramel border border-caramel/30">
                            {item.badge}
                          </span>
                        )}
                        {typeof item.count === "number" && item.count > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-caramel text-espresso">
                            {item.count}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Mini Customer Profile & Sign Out */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 overflow-hidden group flex-1"
          >
            <div className="w-8 h-8 rounded-full bg-caramel/20 text-caramel flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-cream truncate group-hover:text-caramel transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] text-cream/50 truncate">
                  {user ? "Authenticated" : "Guest Mode"}
                </p>
              </div>
            )}
          </Link>

          {user && !isCollapsed && (
            <button
              type="button"
              onClick={() => signOut()}
              className="p-1.5 text-cream/50 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-h-screen pt-16 lg:pt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
