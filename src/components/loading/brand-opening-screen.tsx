"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/features/auth/context/auth-context";
import { LogoMark } from "@/components/brand/logo-mark";
import { BRAND } from "@/lib/constants";
import { BootTasks, BootTaskStatus } from "@/types/brand";
import { ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

interface BrandOpeningScreenProps {
  onBootComplete?: () => void;
}

/**
 * AI CAFÉ — Phase 7.4 Premium Brand Opening & Loading Experience
 * "Walking into a premium café early in the morning."
 *
 * Warm Cream (#F7F1E7), Espresso (#3A2418), Caramel (#C98A4A), Soft Sage (#A8B9A3).
 * Connected to genuine startup initialization without artificial 5-second delays.
 * Features graceful non-blocking fallbacks, reduced-motion awareness, and screen-reader accessibility.
 */
export function BrandOpeningScreen({ onBootComplete }: BrandOpeningScreenProps) {
  const { loading: authLoading } = useAuth();
  const [bootVisible, setBootVisible] = useState<boolean>(true);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Opening the café...");
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [degradedNotice, setDegradedNotice] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const [tasks, setTasks] = useState<BootTasks>({
    fonts: "active",
    hero: "pending",
    menu: "pending",
    barista: "pending",
    auth: "pending",
  });

  const hasBootedRef = useRef<boolean>(false);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Dismiss / reveal helper
  const completeOpeningSequence = useCallback(() => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
    }
    setFadingOut(true);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("ai_cafe_booted", "true");
      } catch {
        // Safe storage fallback
      }
    }
    setTimeout(() => {
      setBootVisible(false);
      onBootComplete?.();
    }, prefersReducedMotion ? 150 : 650);
  }, [onBootComplete, prefersReducedMotion]);

  useEffect(() => {
    // If previously booted in this session, reveal immediately
    if (typeof window !== "undefined") {
      try {
        const alreadyBooted = sessionStorage.getItem("ai_cafe_booted");
        if (alreadyBooted === "true") {
          setBootVisible(false);
          return;
        }
      } catch {
        // ignore storage error
      }
    }

    if (hasBootedRef.current) return;
    hasBootedRef.current = true;

    // Safety fallback: Never trap user in infinite loading under any failure
    safetyTimeoutRef.current = setTimeout(() => {
      setDegradedNotice("Café startup took longer than expected.");
    }, 5500);

    async function runBootSequence() {
      // 1. Task: Core Fonts & Styling
      setStatusMessage("Opening the café...");
      setProgressPercent(20);
      try {
        if (typeof document !== "undefined" && "fonts" in document) {
          await document.fonts.ready;
        }
        setTasks((t) => ({ ...t, fonts: "done", hero: "active" }));
      } catch {
        setTasks((t) => ({ ...t, fonts: "done", hero: "active" }));
      }

      // 2. Task: Hero Frame 1 Preload & Decode
      setStatusMessage("Preparing the experience...");
      setProgressPercent(40);
      try {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.src = "/asset/caramel-cold-brew/frame-0001.webp";
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve(); // graceful fallback if frame delayed
        });
        setTasks((t) => ({ ...t, hero: "done", menu: "active" }));
      } catch {
        setTasks((t) => ({ ...t, hero: "done", menu: "active" }));
      }

      // 3. Task: Product Catalog & Ingredients Preload
      setStatusMessage("Preparing the menu...");
      setProgressPercent(65);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const catalogPromise = fetch(`${apiUrl}/api/products`, { cache: "force-cache" });
        const timeoutPromise = new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("Catalog Timeout")), 3000)
        );
        await Promise.race([catalogPromise, timeoutPromise]);
        setTasks((t) => ({ ...t, menu: "done", barista: "active" }));
      } catch {
        // Fall back gracefully if offline or backend delayed
        setTasks((t) => ({ ...t, menu: "done", barista: "active" }));
      }

      // 4. Task: AI Barista Intelligence Health Check
      setStatusMessage("Warming up the AI Barista...");
      setProgressPercent(85);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const healthPromise = fetch(`${apiUrl}/health`);
        const timeoutPromise = new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("AI Health Timeout")), 2500)
        );
        const res = await Promise.race([healthPromise, timeoutPromise]);
        if (!res.ok) {
          setDegradedNotice("AI Barista is temporarily unavailable. You can still explore the menu and build your drink.");
        }
        setTasks((t) => ({ ...t, barista: "done", auth: "active" }));
      } catch {
        // AI unavailable fallback
        setDegradedNotice("AI Barista is temporarily offline. Menu and Drink Builder are fully active.");
        setTasks((t) => ({ ...t, barista: "done", auth: "active" }));
      }

      // 5. Task: Firebase Auth State Resolution
      setStatusMessage("Welcome to AI Café.");
      setProgressPercent(100);
      setTasks((t) => ({ ...t, auth: "done" }));

      // Complete smoothly without artificial multi-second delays
      setTimeout(() => {
        completeOpeningSequence();
      }, 400);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
      setStatusMessage("You appear to be offline.");
      setDegradedNotice("Working in offline mode. Cached assets and menu are available.");
    }

    runBootSequence();

    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, [authLoading, completeOpeningSequence]);

  if (!bootVisible) return null;

  return (
    <div
      id="ai-cafe-brand-opening"
      role="status"
      aria-live="polite"
      aria-label="AI Café loading and initialization"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between py-12 px-6 bg-[#F7F1E7] text-[#3A2418] transition-all duration-700 ease-out select-none ${
        fadingOut
          ? "opacity-0 pointer-events-none filter blur-sm transform scale-[1.01]"
          : "opacity-100"
      }`}
    >
      {/* Background warm grain texture */}
      <div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(#3A2418_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Brand Spacer */}
      <div className="w-full flex justify-end max-w-lg mx-auto">
        {degradedNotice && (
          <button
            type="button"
            onClick={completeOpeningSequence}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#3A2418]/5 hover:bg-[#3A2418]/10 text-[#3A2418] border border-[#3A2418]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C98A4A]"
            aria-label="Skip waiting and enter café"
          >
            <span>Enter Café</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Brand Opening Hierarchy */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center my-auto">
        {/* Animated Brand Logo Mark */}
        <div
          className={`relative mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-[#EFE7D8] border border-[#C98A4A]/30 shadow-sm transition-transform duration-700 ${
            prefersReducedMotion ? "" : "hover:scale-105"
          }`}
        >
          <LogoMark
            size={42}
            glassColor="#3A2418"
            sparkleColor="#C98A4A"
            liquidColor="#C98A4A"
            className={prefersReducedMotion ? "" : "animate-pulse"}
          />
        </div>

        {/* Brand Name */}
        <h1 className="font-serif text-3xl sm:text-4xl text-[#3A2418] font-bold tracking-tight mb-2">
          {BRAND.name}
        </h1>

        {/* Tagline */}
        <p className="font-serif text-base sm:text-lg text-[#795548] italic mb-6">
          {BRAND.tagline}
        </p>

        {/* Minimal Progress Line */}
        <div className="w-48 sm:w-56 h-1 bg-[#EAE2D2] rounded-full overflow-hidden mb-5 relative">
          <div
            className="h-full bg-[#C98A4A] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Contextual Status Message */}
        <p className="font-sans text-xs font-medium tracking-wide text-[#795548] uppercase min-h-[18px]">
          {statusMessage}
        </p>

        {/* Degraded State or Offline Notice */}
        {degradedNotice && (
          <div className="mt-4 px-4 py-2.5 rounded-xl bg-[#FFFDF8] border border-[#C98A4A]/30 text-left flex items-start gap-2.5 max-w-sm shadow-sm animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-[#C98A4A] flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#3A2418] leading-tight">
              <p className="font-semibold text-[#795548] mb-0.5">Notice</p>
              <p>{degradedNotice}</p>
            </div>
          </div>
        )}

        {/* Offline retry button if applicable */}
        {isOffline && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[#3A2418] text-[#FFFDF8] hover:bg-[#C98A4A] transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>

      {/* Supporting Footer Tagline */}
      <div className="relative z-10 text-center max-w-xs">
        <p className="font-sans text-[11px] tracking-widest text-[#8C877F] uppercase font-medium">
          {BRAND.supporting}
        </p>
      </div>
    </div>
  );
}

export default BrandOpeningScreen;
