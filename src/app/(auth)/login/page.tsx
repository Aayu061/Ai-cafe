"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { mapAuthError } from "@/features/auth/services/auth.service";
import { Button } from "@/components/ui/button";
import { Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/profile";

  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.push(redirectUrl);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push(redirectUrl);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-offwhite rounded-3xl p-8 sm:p-10 border border-espresso/10 shadow-card">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl font-bold text-espresso mb-2">
          Welcome Back
        </h1>
        <p className="text-xs sm:text-sm text-espresso/70 font-sans">
          Sign in to your AI Café account
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 p-3 rounded-2xl bg-cream/70 border border-espresso/10 text-espresso/80 text-xs flex items-center justify-between">
        <span className="font-mono text-[11px] text-warmgray">Project: <strong>ai-cafe-2deb5</strong></span>
        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-sage/15 text-sage">
          Firebase Auth
        </span>
      </div>

      {/* Google Sign-In Option */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-espresso/15 bg-cream/50 hover:bg-cream text-espresso text-xs sm:text-sm font-medium transition-all shadow-soft focus:outline-none focus:ring-2 focus:ring-caramel disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-espresso/10" />
        </div>
        <span className="relative bg-offwhite px-3 text-[11px] uppercase tracking-wider text-warmgray font-medium">
          or with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-warmgray absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-cream/40 border border-espresso/10 text-xs sm:text-sm text-espresso placeholder:text-warmgray focus:outline-none focus:border-caramel transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-caramel hover:text-caramel-dark transition-colors font-medium"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-warmgray absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-cream/40 border border-espresso/10 text-xs sm:text-sm text-espresso placeholder:text-warmgray focus:outline-none focus:border-caramel transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={loading}
          className="w-full justify-center gap-2 mt-2 shadow-soft"
        >
          <span>{loading ? "Signing In..." : "Sign In"}</span>
          <ArrowRight className="w-4 h-4 text-caramel" />
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-espresso/10 text-center">
        <p className="text-xs text-espresso/75">
          New to AI Café?{" "}
          <Link
            href="/signup"
            className="font-semibold text-caramel hover:text-caramel-dark transition-colors underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-offwhite rounded-3xl p-10 text-center font-serif text-espresso">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
