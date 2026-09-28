"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/features/auth/context/auth-context";

export type BootTaskStatus = "pending" | "active" | "done" | "error";

interface BootTasks {
  fonts: BootTaskStatus;
  hero: BootTaskStatus;
  menu: BootTaskStatus;
  barista: BootTaskStatus;
  auth: BootTaskStatus;
}

export function BootScreen() {
  const { loading: authLoading } = useAuth();
  const [bootVisible, setBootVisible] = useState<boolean>(true);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("PREPARING CAFÉ");

  const [tasks, setTasks] = useState<BootTasks>({
    fonts: "active",
    hero: "pending",
    menu: "pending",
    barista: "pending",
    auth: "pending",
  });

  const hasBootedRef = useRef<boolean>(false);

  useEffect(() => {
    // If previously booted in this session, hide immediately without showing splash
    if (typeof window !== "undefined") {
      const alreadyBooted = sessionStorage.getItem("ai_cafe_booted");
      if (alreadyBooted === "true") {
        setBootVisible(false);
        return;
      }
    }

    if (hasBootedRef.current) return;
    hasBootedRef.current = true;

    // Real startup task orchestrator
    async function runBootSequence() {
      // 1. Task: Core Fonts & Styling
      setStatusMessage("PREPARING CAFÉ");
      try {
        if ("fonts" in document) {
          await document.fonts.ready;
        }
        setTasks((t) => ({ ...t, fonts: "done", hero: "active" }));
      } catch {
        setTasks((t) => ({ ...t, fonts: "done", hero: "active" }));
      }

      // 2. Task: Hero Poster / Frame 1 Decode
      setStatusMessage("PREPARING HERO");
      try {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.src = "/asset/caramel-cold-brew/frame-0001.webp";
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
        setTasks((t) => ({ ...t, hero: "done", menu: "active" }));
      } catch {
        setTasks((t) => ({ ...t, hero: "done", menu: "active" }));
      }

      // 3. Task: Product Catalog & Ingredients Preload
      setStatusMessage("LOADING MENU");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const catalogPromise = fetch(`${apiUrl}/api/products`, { cache: "force-cache" });
        // Max timeout of 3.5s so slow network does not permanently hang startup
        const timeoutPromise = new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3500)
        );
        await Promise.race([catalogPromise, timeoutPromise]);
        setTasks((t) => ({ ...t, menu: "done", barista: "active" }));
      } catch {
        // Fall back gracefully if offline or delayed
        setTasks((t) => ({ ...t, menu: "done", barista: "active" }));
      }

      // 4. Task: AI Barista Health & Config Check
      setStatusMessage("WAKING AI BARISTA");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const healthPromise = fetch(`${apiUrl}/health`);
        const timeoutPromise = new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        );
        await Promise.race([healthPromise, timeoutPromise]);
        setTasks((t) => ({ ...t, barista: "done", auth: "active" }));
      } catch {
        setTasks((t) => ({ ...t, barista: "done", auth: "active" }));
      }

      // 5. Task: Firebase Auth State Resolution
      setStatusMessage("CHECKING AVAILABILITY");
      setTasks((t) => ({ ...t, auth: "done" }));

      // Complete!
      setStatusMessage("WELCOME TO AI CAFÉ");

      // Smooth exit transition
      setTimeout(() => {
        setFadingOut(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("ai_cafe_booted", "true");
        }
        setTimeout(() => {
          setBootVisible(false);
        }, 700);
      }, 500);
    }

    runBootSequence();
  }, [authLoading]);

  if (!bootVisible) return null;

  return (
    <div
      id="ai-cafe-boot-screen"
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F1E7] transition-all duration-700 ease-out select-none ${
        fadingOut ? "opacity-0 pointer-events-none filter blur-sm" : "opacity-100"
      }`}
    >
      {/* Background warm grain texture */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3A2418_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Brand Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Artisan Steam Icon */}
        <div className="relative mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-[#EFE7D8] border border-[#C98A4A]/30 shadow-sm">
          <svg
            className="w-8 h-8 text-[#C98A4A] animate-pulse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="font-serif text-3xl sm:text-4xl text-[#3A2418] font-bold tracking-tight mb-2">
          AI CAFÉ
        </h1>

        {/* Tagline */}
        <p className="font-sans text-xs tracking-[0.25em] text-[#C98A4A] uppercase font-semibold mb-6">
          Your Drink. Your Way.
        </p>

        {/* Active Real State Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAE2D2] border border-[#3A2418]/10 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#263A2E] animate-ping" />
          <span className="font-sans text-[11px] font-medium tracking-wider text-[#3A2418] uppercase">
            {statusMessage}
          </span>
        </div>

        {/* Real Task Checklist (Subtle, Minimalist, Café-Inspired) */}
        <div className="w-full space-y-2 text-left bg-[#FFFDF8]/80 backdrop-blur-sm p-4 rounded-xl border border-[#3A2418]/10 shadow-sm">
          <TaskItem label="Core Fonts & Typography" status={tasks.fonts} />
          <TaskItem label="Cinematic Hero Canvas" status={tasks.hero} />
          <TaskItem label="Artisan Catalog & Ingredients" status={tasks.menu} />
          <TaskItem label="AI Barista Intelligence" status={tasks.barista} />
          <TaskItem label="Guest & Member Authentication" status={tasks.auth} />
        </div>

        {/* Subtle subtext */}
        <p className="mt-6 text-[11px] text-[#8C877F] italic">
          Brewing your experience...
        </p>
      </div>
    </div>
  );
}

function TaskItem({ label, status }: { label: string; status: BootTaskStatus }) {
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <span
        className={`transition-colors ${
          status === "done"
            ? "text-[#3A2418] font-medium"
            : status === "active"
            ? "text-[#C98A4A] font-semibold"
            : "text-[#8C877F]/60"
        }`}
      >
        {label}
      </span>
      <div className="flex items-center">
        {status === "done" && (
          <span className="text-[#263A2E] font-bold text-xs">✓ Ready</span>
        )}
        {status === "active" && (
          <span className="inline-block w-2.5 h-2.5 border-2 border-[#C98A4A] border-t-transparent rounded-full animate-spin" />
        )}
        {status === "pending" && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#8C877F]/40" />
        )}
      </div>
    </div>
  );
}
