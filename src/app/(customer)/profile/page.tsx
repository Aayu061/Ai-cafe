"use client";

import React, { useState } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Sparkles,
  Coffee,
  ShieldCheck,
  Heart,
  Bookmark,
  Receipt,
  Sliders,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ProfileTab = "overview" | "taste" | "favorites" | "creations" | "orders";

function ProfileContent() {
  const { user, userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  const displayName = userProfile?.displayName || user?.displayName || "Café Guest";
  const email = user?.email || userProfile?.email || "";
  const photoURL = user?.photoURL || userProfile?.photoURL;
  const role = userProfile?.role || "customer";
  const status = userProfile?.status || "active";

  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  // Initials for fallback avatar
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "AC";

  const roleLabelMap: Record<string, string> = {
    customer: "Café Customer",
    staff: "Barista / Café Staff",
    admin: "Café Administrator",
    super_admin: "Super Administrator",
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage/10 text-sage text-xs font-semibold tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-caramel" />
                <span>My Profile & Operations</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso tracking-tight">
                Welcome, {displayName.split(" ")[0]}
              </h1>
              <p className="text-sm sm:text-base text-espresso/70 mt-1 font-sans">
                Manage your profile credentials, personal taste preferences, and operational controls.
              </p>
            </div>

            {/* Profile Card */}
            <div className="bg-offwhite rounded-3xl p-6 sm:p-10 border border-espresso/10 shadow-card mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-espresso/10">
                <div className="flex items-center gap-5">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
                      className="w-20 h-20 rounded-full object-cover border-2 border-caramel shadow-soft"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-espresso text-cream font-serif font-bold text-2xl flex items-center justify-center border-2 border-caramel/40 shadow-soft">
                      {initials}
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="font-serif text-2xl font-bold text-espresso">
                        {displayName}
                      </h2>
                      <Badge variant="caramel" size="sm">
                        {role.replace("_", " ").toUpperCase()}
                      </Badge>
                      {status === "active" ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                          Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-espresso/70 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-warmgray" />
                      <span>{email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="gap-2 self-start sm:self-auto border-espresso/20 text-espresso hover:bg-espresso/5"
                  >
                    <LogOut className="w-4 h-4 text-caramel" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>

              {/* Operational Hub Quick Banner for Staff & Admin */}
              {(role === "staff" || role === "admin" || role === "super_admin") && (
                <div className="mt-6 p-5 rounded-2xl bg-espresso text-cream flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-caramel/20 flex items-center justify-center text-caramel border border-caramel/30 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-bold text-cream">
                        Operational Clearances Active
                      </h4>
                      <p className="text-xs text-cream/70 mt-0.5">
                        Your account has elevated privileges: {roleLabelMap[role]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href="/staff">
                      <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Staff Hub</span>
                      </Button>
                    </Link>

                    {(role === "admin" || role === "super_admin") && (
                      <Link href="/admin">
                        <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Admin Portal</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pt-6 border-b border-espresso/10 pb-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2",
                    activeTab === "overview"
                      ? "bg-espresso text-cream shadow-sm"
                      : "text-espresso/70 hover:bg-espresso/5"
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("taste")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2",
                    activeTab === "taste"
                      ? "bg-espresso text-cream shadow-sm"
                      : "text-espresso/70 hover:bg-espresso/5"
                  )}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Taste Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("favorites")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2",
                    activeTab === "favorites"
                      ? "bg-espresso text-cream shadow-sm"
                      : "text-espresso/70 hover:bg-espresso/5"
                  )}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Favorites</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("creations")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2",
                    activeTab === "creations"
                      ? "bg-espresso text-cream shadow-sm"
                      : "text-espresso/70 hover:bg-espresso/5"
                  )}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Saved Creations</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2",
                    activeTab === "orders"
                      ? "bg-espresso text-cream shadow-sm"
                      : "text-espresso/70 hover:bg-espresso/5"
                  )}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Order History</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="pt-6">
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 rounded-2xl bg-cream/50 border border-espresso/5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray mb-1">
                        <Calendar className="w-3.5 h-3.5 text-caramel" />
                        <span>Member Since</span>
                      </div>
                      <p className="font-serif text-base font-bold text-espresso">
                        {createdAt}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-cream/50 border border-espresso/5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-caramel" />
                        <span>Security Tier</span>
                      </div>
                      <p className="font-serif text-base font-bold text-espresso">
                        {roleLabelMap[role]}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-cream/50 border border-espresso/5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray mb-1">
                        <Coffee className="w-3.5 h-3.5 text-caramel" />
                        <span>Café Privilege</span>
                      </div>
                      <p className="font-serif text-base font-bold text-espresso capitalize">
                        {status} Member
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "taste" && (
                  <div className="p-6 rounded-2xl bg-cream/30 border border-espresso/5">
                    <h3 className="font-serif text-lg font-bold text-espresso mb-1">
                      Sensory Taste Blueprint
                    </h3>
                    <p className="text-xs text-espresso/70 mb-6">
                      Preferences dynamically inform your personalized AI Barista recommendations.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-offwhite border border-espresso/5">
                        <span className="text-[10px] uppercase font-bold text-warmgray tracking-wider">
                          Preferred Base
                        </span>
                        <p className="font-serif text-sm font-bold text-espresso mt-1">
                          Cold Brew & Signature Espresso
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-offwhite border border-espresso/5">
                        <span className="text-[10px] uppercase font-bold text-warmgray tracking-wider">
                          Preferred Milk
                        </span>
                        <p className="font-serif text-sm font-bold text-espresso mt-1">
                          Oat Milk / Velvet Sweet Cream
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-offwhite border border-espresso/5">
                        <span className="text-[10px] uppercase font-bold text-warmgray tracking-wider">
                          Sweetness Baseline
                        </span>
                        <p className="font-serif text-sm font-bold text-espresso mt-1">
                          Balanced (40% Sweetness)
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-offwhite border border-espresso/5">
                        <span className="text-[10px] uppercase font-bold text-warmgray tracking-wider">
                          Favorite Profile Notes
                        </span>
                        <p className="font-serif text-sm font-bold text-espresso mt-1">
                          Caramel, Dark Chocolate, Vanilla Bean
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "favorites" && (
                  <div className="text-center py-10 px-4 bg-cream/20 rounded-2xl border border-dashed border-espresso/15">
                    <div className="w-12 h-12 rounded-full bg-caramel/10 text-caramel mx-auto flex items-center justify-center mb-3">
                      <Heart className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-espresso mb-1">
                      No favorites saved yet
                    </h4>
                    <p className="text-xs text-espresso/70 max-w-sm mx-auto mb-5 leading-relaxed">
                      Tap the heart icon on any signature drink to bookmark it for quick ordering.
                    </p>
                    <Link href="/#menu">
                      <Button variant="outline" size="sm" className="gap-2">
                        <span>Browse Café Menu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}

                {activeTab === "creations" && (
                  <div className="text-center py-10 px-4 bg-cream/20 rounded-2xl border border-dashed border-espresso/15">
                    <div className="w-12 h-12 rounded-full bg-caramel/10 text-caramel mx-auto flex items-center justify-center mb-3">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-espresso mb-1">
                      No saved creations yet
                    </h4>
                    <p className="text-xs text-espresso/70 max-w-sm mx-auto mb-5 leading-relaxed">
                      Design your custom recipe in the interactive Drink Studio and save your Drink DNA recipe.
                    </p>
                    <Link href="/builder">
                      <Button variant="primary" size="sm" className="gap-2">
                        <span>Open Drink Studio</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}

                {activeTab === "orders" && (
                  <div className="text-center py-10 px-4 bg-cream/20 rounded-2xl border border-dashed border-espresso/15">
                    <div className="w-12 h-12 rounded-full bg-espresso/10 text-espresso mx-auto flex items-center justify-center mb-3">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-espresso mb-1">
                      No active orders yet
                    </h4>
                    <p className="text-xs text-espresso/70 max-w-sm mx-auto mb-5 leading-relaxed">
                      Real orders and fulfillment status will appear here once submitted.
                    </p>
                    <Link href="/#menu">
                      <Button variant="outline" size="sm" className="gap-2">
                        <span>Explore Menu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-offwhite/60 border border-dashed border-espresso/15">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray mb-2">
                  <Coffee className="w-4 h-4 text-caramel" />
                  <span>Interactive Drink Studio</span>
                </div>
                <p className="text-sm text-espresso/70 mb-4 leading-relaxed">
                  Calibrate drink base, plant milks, sweetness percentages, and artisan toppings with server validation.
                </p>
                <Link href="/builder">
                  <Button variant="outline" size="sm">
                    Open Drink Studio
                  </Button>
                </Link>
              </div>

              <div className="p-6 rounded-3xl bg-offwhite/60 border border-dashed border-espresso/15">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray mb-2">
                  <Sparkles className="w-4 h-4 text-caramel" />
                  <span>AI Barista Intelligence</span>
                </div>
                <p className="text-sm text-espresso/70 mb-4 leading-relaxed">
                  Engage in multi-turn conversation with our barista engine grounded in the authentic product catalog.
                </p>
                <Link href="/barista">
                  <Button variant="outline" size="sm">
                    Consult AI Barista
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
