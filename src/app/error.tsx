"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error securely client-side without exposing to end-user UI
    console.error("❌ [Global Client Error Boundary caught]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#180C06] text-[#F8F3EA] flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-md w-full bg-[#2A1810] border border-[#C98A4A]/25 rounded-3xl p-8 shadow-floating">
        <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF6F0] mb-2">
          Something spilt in the café
        </h1>

        <p className="text-sm text-[#F8F3EA]/70 leading-relaxed mb-8">
          We encountered an unexpected glitch while preparing this view. Your session and saved drinks remain completely safe.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="accent"
            size="md"
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2 bg-[#C98A4A] hover:bg-[#DCA466] text-[#180C06] font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto gap-2 border-white/20 text-[#F8F3EA]/90 hover:bg-white/10"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
