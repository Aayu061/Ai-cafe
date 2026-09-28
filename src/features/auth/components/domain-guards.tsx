"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import { ShieldAlert, Sparkles, ArrowLeft, Home, LogOut, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOutUser } from "../services/auth.service";

interface GuardProps {
  children: React.ReactNode;
  fallbackUrl?: string;
}

/**
 * Loading state matching AI Café aesthetic
 */
function CaféAuthLoading({ message, submessage }: { message: string; submessage: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F7F1E7] px-4">
      <div className="w-14 h-14 rounded-2xl bg-[#3A2418] text-[#F7F1E7] flex items-center justify-center shadow-lg mb-4 animate-pulse">
        <Sparkles className="w-7 h-7 text-[#C98A4A]" />
      </div>
      <h3 className="font-serif text-2xl font-bold text-[#3A2418] mb-1">
        {message}
      </h3>
      <p className="text-xs text-[#8C877F] tracking-wide">
        {submessage}
      </p>
    </div>
  );
}

/**
 * Unauthorized state display
 */
function UnauthorizedNotice({
  title,
  description,
  requiredRole,
  currentRole,
  currentDomain,
  loginPath,
  fallbackUrl = "/",
}: {
  title: string;
  description: string;
  requiredRole: string;
  currentRole: string;
  currentDomain?: string;
  loginPath: string;
  fallbackUrl?: string;
}) {
  const router = useRouter();

  const handleSwitchAccount = async () => {
    await signOutUser();
    router.push(loginPath);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#F7F1E7] px-4 py-16">
      <div className="max-w-md w-full bg-[#FFFDF8] p-8 rounded-3xl border border-[#3A2418]/10 shadow-xl text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center border border-red-100">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-[#3A2418] mb-2">
          {title}
        </h2>

        <p className="text-sm text-[#3A2418]/80 mb-4 leading-relaxed">
          {description}
        </p>

        <div className="inline-flex flex-col gap-1 p-3 rounded-xl bg-[#3A2418]/5 text-xs text-[#3A2418] mb-6 w-full">
          <div>
            Required Clearance: <span className="font-bold text-[#C98A4A] uppercase">{requiredRole}</span>
          </div>
          <div>
            Active Account Role: <span className="font-bold uppercase text-red-600">{currentRole.replace("_", " ")}</span>
            {currentDomain && <span className="text-[#8C877F]"> ({currentDomain})</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchAccount}
            className="w-full gap-2 border-[#3A2418]/20 text-[#3A2418] hover:bg-[#3A2418]/5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign In to Authorized Portal</span>
          </Button>

          <Link href={fallbackUrl} className="w-full">
            <Button variant="primary" size="sm" className="w-full gap-2 bg-[#3A2418] text-[#F7F1E7] hover:bg-[#263A2E]">
              <Home className="w-4 h-4" />
              <span>Return to Safe Workspace</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Account Suspended State
 */
function SuspendedNotice({ email, role }: { email?: string; role: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#F7F1E7] px-4 py-16">
      <div className="max-w-md w-full bg-[#FFFDF8] p-8 rounded-3xl border border-red-200 shadow-xl text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-[#3A2418] mb-2">
          Account Suspended
        </h2>

        <p className="text-sm text-[#3A2418]/80 mb-4 leading-relaxed">
          Your café account credentials for <span className="font-semibold text-espresso">{email || "this identity"}</span> ({role.toUpperCase()}) have been temporarily deactivated by café administration.
        </p>

        <p className="text-xs text-[#8C877F] mb-6">
          Please contact system operations or your café supervisor to restore access.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full gap-2 border-red-300 text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * StaffGuard: Protects /staff operational terminal.
 * Redirects unauthenticated users to /staff-login.
 * Permits staff, admin, and super_admin.
 */
export function StaffGuard({ children, fallbackUrl = "/" }: GuardProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = pathname ? `/staff-login?redirect=${encodeURIComponent(pathname)}` : "/staff-login";
      router.push(redirectUrl);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <CaféAuthLoading message="Checking staff clearance..." submessage="Validating operational credentials" />;
  }

  if (!user) return null;

  const role = userProfile?.role || "customer";
  const status = userProfile?.status || "active";

  if (status === "suspended") {
    return <SuspendedNotice email={user.email || undefined} role={role} />;
  }

  const isAllowed = role === "staff" || role === "admin" || role === "super_admin";
  if (!isAllowed) {
    return (
      <UnauthorizedNotice
        title="Staff Terminal Restricted"
        description="This operations portal is restricted to authorized café staff and supervisors."
        requiredRole="STAFF"
        currentRole={role}
        currentDomain={userProfile?.accountDomain}
        loginPath="/staff-login"
        fallbackUrl={fallbackUrl}
      />
    );
  }

  return <>{children}</>;
}

/**
 * AdminGuard: Protects /admin portal.
 * Redirects unauthenticated users to /admin-login.
 * Permits admin and super_admin.
 */
export function AdminGuard({ children, fallbackUrl = "/staff" }: GuardProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = pathname ? `/admin-login?redirect=${encodeURIComponent(pathname)}` : "/admin-login";
      router.push(redirectUrl);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <CaféAuthLoading message="Verifying administrative authority..." submessage="Connecting to management console" />;
  }

  if (!user) return null;

  const role = userProfile?.role || "customer";
  const status = userProfile?.status || "active";

  if (status === "suspended") {
    return <SuspendedNotice email={user.email || undefined} role={role} />;
  }

  const isAllowed = role === "admin" || role === "super_admin";
  if (!isAllowed) {
    return (
      <UnauthorizedNotice
        title="Administrative Access Restricted"
        description="This administrative console requires verified Admin or Super Admin privileges."
        requiredRole="ADMIN"
        currentRole={role}
        currentDomain={userProfile?.accountDomain}
        loginPath="/admin-login"
        fallbackUrl={fallbackUrl}
      />
    );
  }

  return <>{children}</>;
}

/**
 * SuperAdminGuard: Protects /super-admin portal.
 * Redirects unauthenticated users to /super-admin-login.
 * Permits super_admin ONLY.
 */
export function SuperAdminGuard({ children, fallbackUrl = "/admin" }: GuardProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = pathname ? `/super-admin-login?redirect=${encodeURIComponent(pathname)}` : "/super-admin-login";
      router.push(redirectUrl);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <CaféAuthLoading message="Authenticating system controller..." submessage="Root governance verification" />;
  }

  if (!user) return null;

  const role = userProfile?.role || "customer";
  const status = userProfile?.status || "active";

  if (status === "suspended") {
    return <SuspendedNotice email={user.email || undefined} role={role} />;
  }

  const isAllowed = role === "super_admin";
  if (!isAllowed) {
    return (
      <UnauthorizedNotice
        title="Root System Control Restricted"
        description="System control and administrator governance is strictly limited to Super Administrators."
        requiredRole="SUPER ADMIN"
        currentRole={role}
        currentDomain={userProfile?.accountDomain}
        loginPath="/super-admin-login"
        fallbackUrl={fallbackUrl}
      />
    );
  }

  return <>{children}</>;
}

/**
 * CustomerGuard: Protects consumer routes like /profile.
 * Redirects unauthenticated users to /login.
 */
export function CustomerGuard({ children, fallbackUrl = "/login" }: GuardProps) {
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
    return <CaféAuthLoading message="Opening your café profile..." submessage="Preparing your taste profile" />;
  }

  if (!user) return null;

  return <>{children}</>;
}
