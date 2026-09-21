import React, { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BaristaChat } from "@/features/barista/barista-chat";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Barista — Personalized Drink Consultation | AI CAFÉ",
  description:
    "Consult our AI Barista with natural language to discover custom craft coffee tailored to your sensory cravings, caffeine tolerance, and dietary preferences.",
};

function BaristaLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-espresso">
      <div className="w-12 h-12 rounded-full bg-espresso text-cream flex items-center justify-center shadow-soft mb-4">
        <Sparkles className="w-6 h-6 text-caramel animate-pulse" />
      </div>
      <div className="flex items-center gap-2 text-sm text-warmgray">
        <Loader2 className="w-4 h-4 animate-spin text-caramel" />
        <span>Loading AI Barista Engine...</span>
      </div>
    </div>
  );
}

export default function BaristaPage() {
  return (
    <main className="min-h-screen bg-cream text-espresso flex flex-col justify-between selection:bg-caramel selection:text-cream">
      <Navbar />

      <div className="pt-28 pb-16 flex-1 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-caramel/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-soft-sage/15 blur-3xl pointer-events-none" />

        <Container className="relative z-10">
          {/* Breadcrumb / Back button */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-espresso/70 hover:text-espresso transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to AI CAFÉ Home</span>
            </Link>
          </div>

          {/* Barista Consultation Terminal */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 md:p-10 border border-espresso/10 shadow-floating">
            <Suspense fallback={<BaristaLoadingFallback />}>
              <BaristaChat />
            </Suspense>
          </div>
        </Container>
      </div>

      <Footer />
    </main>
  );
}
