import React from "react";
import Link from "next/link";
import { Coffee, ArrowLeft, Sparkles, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#180C06] text-[#F8F3EA] flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C98A4A]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Brand */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full pt-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-[#C98A4A] text-[#180C06] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-serif text-xl font-bold tracking-wider text-[#F8F3EA]">
            AI CAFÉ
          </span>
        </Link>
      </header>

      {/* Main 404 Narrative */}
      <main className="relative z-10 max-w-xl mx-auto w-full text-center py-16 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[#2A1810] border border-[#C98A4A]/30 flex items-center justify-center mb-8 shadow-floating">
          <Coffee className="w-10 h-10 text-[#C98A4A]" />
        </div>

        <span className="text-xs uppercase tracking-widest text-[#C98A4A] font-semibold mb-3">
          Error 404 • Table Not Found
        </span>

        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#FAF6F0] mb-4">
          This cup seems to have vanished.
        </h1>

        <p className="text-sm sm:text-base text-[#F8F3EA]/70 font-sans leading-relaxed mb-8">
          The page or blend you are looking for does not exist on our menu. It may have been moved, retired, or typed incorrectly.
        </p>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="accent"
              size="md"
              className="w-full sm:w-auto gap-2 bg-[#C98A4A] hover:bg-[#DCA466] text-[#180C06] font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Café</span>
            </Button>
          </Link>

          <Link href="/barista" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto gap-2 border-[#C98A4A]/40 text-[#F8F3EA] hover:bg-[#C98A4A]/10"
            >
              <Sparkles className="w-4 h-4 text-[#C98A4A]" />
              <span>Consult AI Barista</span>
            </Button>
          </Link>

          <Link href="/builder" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto gap-2 border-white/20 text-[#F8F3EA]/80 hover:bg-white/5"
            >
              <Sliders className="w-4 h-4 text-[#C98A4A]" />
              <span>Drink Studio</span>
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer Signature */}
      <footer className="relative z-10 text-center text-xs text-[#F8F3EA]/40 pb-4">
        © {new Date().getFullYear()} AI CAFÉ — Your Drink. Your Way.
      </footer>
    </div>
  );
}
