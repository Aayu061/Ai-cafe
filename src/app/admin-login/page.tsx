"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmail } from "@/features/auth/services/auth.service";
import { getUserDocument } from "@/features/auth/services/user.service";
import { Button } from "@/components/ui/button";
import { Mail, Lock, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please provide both your administrator email and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      // Verify admin/super_admin role
      const doc = await getUserDocument(user.uid);
      const role = doc?.role || "customer";
      const status = doc?.status || "active";

      if (status === "suspended") {
        setError("Your administrative credentials have been suspended. Please contact root governance.");
        return;
      }

      if (role !== "admin" && role !== "super_admin") {
        setError("This account is not authorized for administration access.");
        return;
      }

      router.push(redirectUrl);
    } catch {
      setError("Unable to sign in with those credentials. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="bg-[#FFFDF8] rounded-3xl p-8 sm:p-10 border border-[#3A2418]/10 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C98A4A]/15 text-[#3A2418] text-[11px] font-bold tracking-widest uppercase mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C98A4A]" />
            <span>AI CAFÉ • ADMINISTRATION</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#3A2418] mb-2">
            Admin Sign In
          </h1>
          <p className="text-xs sm:text-sm text-[#8C877F]">
            Restricted Administration
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A2418] mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C877F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aicafe.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F7F1E7]/50 border border-[#3A2418]/15 text-xs sm:text-sm text-[#3A2418] placeholder:text-[#8C877F] focus:outline-none focus:border-[#C98A4A] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A2418]">
                Password
              </label>
              <Link
                href="/admin-forgot-password"
                className="text-[11px] text-[#C98A4A] hover:text-[#3A2418] transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C877F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F7F1E7]/50 border border-[#3A2418]/15 text-xs sm:text-sm text-[#3A2418] placeholder:text-[#8C877F] focus:outline-none focus:border-[#C98A4A] transition-colors"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full justify-center gap-2 mt-2 bg-[#3A2418] text-[#F7F1E7] hover:bg-[#263A2E] shadow-sm"
          >
            <span>{loading ? "Verifying clearance..." : "Admin Sign In"}</span>
            <ArrowRight className="w-4 h-4 text-[#C98A4A]" />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#3A2418]/10 text-center space-y-2">
          <p className="text-[11px] text-[#8C877F]">
            Operations Management Console Access Only
          </p>
          <div>
            <Link
              href="/team"
              className="inline-flex items-center gap-1.5 text-xs text-[#8C877F] hover:text-[#3A2418] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to AI Café</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1E7]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
        <Suspense
          fallback={
            <div className="bg-[#FFFDF8] rounded-3xl p-10 text-center font-serif text-[#3A2418]">
              Connecting to administration...
            </div>
          }
        >
          <AdminLoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
