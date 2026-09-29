"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "ai_cafe_privacy_consent_v1";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const acknowledged = localStorage.getItem(STORAGE_KEY);
      if (!acknowledged) {
        setVisible(true);
      }
    } catch {
      // Storage access blocked or in private browsing
    }
  }, []);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "acknowledged");
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl bg-[#180C06]/95 backdrop-blur-md border border-[#C98A4A]/30 text-cream shadow-floating transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#C98A4A]/20 text-[#C98A4A] flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>

        <div className="flex-1 text-xs">
          <p className="font-semibold text-cream">Privacy & Storage Notice</p>
          <p className="text-cream/75 mt-1 leading-relaxed">
            AI CAFÉ uses essential local storage strictly to preserve your authentication and customized beverage DNA. We do not use intrusive advertising trackers. Learn more in our{" "}
            <Link href="/privacy" className="text-[#C98A4A] underline hover:text-white transition-colors">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcknowledge}
              className="px-3 py-1.5 rounded-lg bg-[#C98A4A] text-espresso font-semibold text-[11px] hover:bg-[#DCA466] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C98A4A]/50"
            >
              Got it
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAcknowledge}
          className="text-cream/50 hover:text-cream transition-colors p-1"
          aria-label="Dismiss privacy notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
