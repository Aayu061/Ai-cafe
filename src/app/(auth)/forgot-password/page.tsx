"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { mapAuthError } from "@/features/auth/services/auth.service";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
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
          Reset Password
        </h1>
        <p className="text-xs sm:text-sm text-espresso/70 font-sans">
          Enter your email to receive password reset instructions
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-6 rounded-2xl bg-sage/10 border border-sage/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-sage text-offwhite flex items-center justify-center mx-auto shadow-soft">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-lg font-bold text-espresso">
            Check Your Email
          </h2>
          <p className="text-xs text-espresso/80 leading-relaxed">
            We sent a password reset link to <strong className="text-espresso font-semibold">{email}</strong>. Please follow the link in your email to choose a new password.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="primary" size="sm" className="w-full justify-center">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
              Account Email
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full justify-center mt-2 shadow-soft"
          >
            <span>{loading ? "Sending..." : "Send Reset Instructions"}</span>
          </Button>

          <div className="pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-espresso/70 hover:text-espresso transition-colors font-medium"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
