"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "@/types";
import { ShieldAlert, Sparkles, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackUrl = "/" }: RoleGuardProps) {
  const { user, userProfile, loading } = useAuth();
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-cream px-4">
        <div className="w-12 h-12 rounded-full bg-espresso text-cream flex items-center justify-center shadow-card mb-4 animate-bounce">
          <Sparkles className="w-6 h-6 text-caramel" />
        </div>
        <h3 className="font-serif text-xl font-bold text-espresso mb-1">
          Verifying security clearance...
        </h3>
        <p className="text-xs text-warmgray tracking-wide">
          Authorizing role-based operational permissions
        </p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const currentRole: UserRole = userProfile?.role || "customer";
  const hasAccess = allowedRoles.includes(currentRole);

  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-cream px-4 py-16">
        <div className="max-w-md w-full bg-offwhite p-8 rounded-3xl border border-red-200 shadow-card text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2 className="font-serif text-2xl font-bold text-espresso mb-2">
            Access Restricted
          </h2>

          <p className="text-sm text-espresso/70 mb-4 leading-relaxed">
            This operational portal requires{" "}
            <span className="font-semibold text-espresso">
              {allowedRoles.map((r) => r.replace("_", " ").toUpperCase()).join(" or ")}
            </span>{" "}
            privileges.
          </p>

          <div className="inline-block px-3 py-1 rounded-full bg-espresso/5 text-espresso text-xs font-semibold uppercase tracking-wider mb-6">
            Your current role: <span className="text-caramel font-bold">{currentRole.replace("_", " ")}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/profile">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>My Profile</span>
              </Button>
            </Link>

            <Link href={fallbackUrl}>
              <Button variant="primary" size="sm" className="w-full gap-2">
                <Home className="w-4 h-4" />
                <span>Return Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
