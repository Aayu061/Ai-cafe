"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import { Sparkles } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
      router.push(redirectUrl);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-cream px-4">
        <div className="w-12 h-12 rounded-full bg-espresso text-cream flex items-center justify-center shadow-card mb-4 animate-bounce">
          <Sparkles className="w-6 h-6 text-caramel" />
        </div>
        <h3 className="font-serif text-xl font-bold text-espresso mb-1">
          Checking your session...
        </h3>
        <p className="text-xs text-warmgray tracking-wide">
          Preparing your AI Café experience
        </p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
