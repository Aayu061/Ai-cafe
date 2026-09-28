"use client";

import React, { useState } from "react";
import Link from "next/link";
import { sendPasswordReset } from "@/features/auth/services/auth.service";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, ChefHat, CheckCircle2, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function StaffForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please provide your work email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSubmitted(true);
    } catch {
      // For security, do not leak whether account exists
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1E7]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-[#FFFDF8] rounded-3xl p-8 sm:p-10 border border-[#3A2418]/10 shadow-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#263A2E]/10 text-[#263A2E] text-[11px] font-bold tracking-widest uppercase mb-3">
                <ChefHat className="w-3.5 h-3.5 text-[#C98A4A]" />
                <span>AI CAFÉ • STAFF PORTAL</span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#3A2418] mb-2">
                Reset Credentials
              </h1>
              <p className="text-xs sm:text-sm text-[#8C877F]">
                Authorized Café Staff Account Recovery
              </p>
            </div>

            {submitted ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#3A2418]">
                  Instructions Dispatched
                </h3>
                <p className="text-xs text-[#3A2418]/80 leading-relaxed">
                  If an authorized staff account is associated with <span className="font-semibold text-[#3A2418]">{email}</span>, password reset guidance has been sent to your inbox.
                </p>
                <div className="pt-4">
                  <Link href="/staff-login">
                    <Button variant="primary" size="md" className="w-full bg-[#3A2418] text-[#F7F1E7] hover:bg-[#263A2E]">
                      Return to Staff Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A2418] mb-1.5">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8C877F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@aicafe.com"
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
                  <span>{loading ? "Sending instructions..." : "Send Reset Link"}</span>
                </Button>

                <div className="mt-6 pt-6 border-t border-[#3A2418]/10 text-center">
                  <Link
                    href="/staff-login"
                    className="inline-flex items-center gap-1.5 text-xs text-[#8C877F] hover:text-[#3A2418] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>← Back to Staff Sign In</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
