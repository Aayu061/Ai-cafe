"use client";

import React from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, LogOut, Sparkles, Coffee, ShieldCheck } from "lucide-react";
import Link from "next/link";

function ProfileContent() {
  const { user, userProfile, signOut } = useAuth();

  const displayName = userProfile?.displayName || user?.displayName || "Café Guest";
  const email = user?.email || userProfile?.email || "";
  const photoURL = user?.photoURL || userProfile?.photoURL;
  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  // Initials for fallback avatar
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "AC";

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
                <span>My Profile</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso tracking-tight">
                Welcome, {displayName.split(" ")[0]}
              </h1>
              <p className="text-sm sm:text-base text-espresso/70 mt-1 font-sans">
                Manage your account credentials and personal café preferences.
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
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-serif text-2xl font-bold text-espresso">
                        {displayName}
                      </h2>
                      <Badge variant="caramel" size="sm">
                        Verified
                      </Badge>
                    </div>
                    <p className="text-sm text-espresso/70 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-warmgray" />
                      <span>{email}</span>
                    </p>
                  </div>
                </div>

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

              {/* Account Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
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
                    <span>Account Security</span>
                  </div>
                  <p className="font-serif text-base font-bold text-espresso">
                    Firebase Protected
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-cream/50 border border-espresso/5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray mb-1">
                    <Coffee className="w-3.5 h-3.5 text-caramel" />
                    <span>Membership Status</span>
                  </div>
                  <p className="font-serif text-base font-bold text-espresso">
                    Guest Explorer
                  </p>
                </div>
              </div>
            </div>

            {/* Teaser placeholder for future phases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-offwhite/60 border border-dashed border-espresso/15">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray mb-2">
                  <Coffee className="w-4 h-4 text-caramel" />
                  <span>Saved Drink Customizations</span>
                </div>
                <p className="text-sm text-espresso/70 mb-4 leading-relaxed">
                  Your personalized recipes created with the Drink Studio will be saved here in later phases.
                </p>
                <Link href="/#build">
                  <Button variant="outline" size="sm">
                    Open Drink Studio
                  </Button>
                </Link>
              </div>

              <div className="p-6 rounded-3xl bg-offwhite/60 border border-dashed border-espresso/15">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warmgray mb-2">
                  <Sparkles className="w-4 h-4 text-caramel" />
                  <span>AI Barista History</span>
                </div>
                <p className="text-sm text-espresso/70 mb-4 leading-relaxed">
                  Your sensory consultations and flavor recommendations will be securely logged here.
                </p>
                <Link href="/#ai-barista">
                  <Button variant="outline" size="sm">
                    Ask AI Barista
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
