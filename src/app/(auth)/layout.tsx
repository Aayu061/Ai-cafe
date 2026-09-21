import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle warm ambient gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-caramel/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sage/10 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between relative z-10 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-espresso/70 hover:text-espresso transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Café</span>
        </Link>

        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-espresso text-cream flex items-center justify-center shadow-soft">
            <Sparkles className="w-3.5 h-3.5 text-caramel" />
          </div>
          <span className="font-serif font-bold text-sm tracking-wider text-espresso">
            {BRAND.name}
          </span>
        </Link>
      </div>

      {/* Main card container */}
      <div className="w-full max-w-md mx-auto relative z-10">
        {children}
      </div>

      {/* Footer text */}
      <div className="w-full max-w-md mx-auto text-center relative z-10 mt-8">
        <p className="text-[11px] text-warmgray">
          © {new Date().getFullYear()} {BRAND.name}. {BRAND.supporting}
        </p>
      </div>
    </div>
  );
}
