import React from "react";
import Link from "next/link";
import { Sparkles, ChefHat, ShieldCheck, ShieldAlert, ArrowLeft, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Team Access | AI CAFÉ",
  description: "Operational workspace access for AI Café staff, administration, and system control.",
};

export default function TeamAccessPage() {
  const workspaces = [
    {
      title: "Staff Portal",
      subtitle: "Barista, kitchen terminal, order queue, and daily inventory",
      href: "/staff-login",
      icon: ChefHat,
      badge: "Operational Staff",
      badgeColor: "bg-[#263A2E]/10 text-[#263A2E]",
      buttonText: "Staff Login",
    },
    {
      title: "Administration",
      subtitle: "Catalog management, ingredients, operations analytics, and staff roster",
      href: "/admin-login",
      icon: ShieldCheck,
      badge: "Café Management",
      badgeColor: "bg-[#C98A4A]/15 text-[#3A2418]",
      buttonText: "Admin Login",
    },
    {
      title: "System Control",
      subtitle: "Root governance, administrator provisioning, security, and audit logs",
      href: "/super-admin-login",
      icon: ShieldAlert,
      badge: "Authorized Personnel",
      badgeColor: "bg-red-50 text-red-800 border border-red-200/50",
      buttonText: "Super Admin Login",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1E7] text-[#3A2418]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
        <div className="max-w-2xl w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3A2418]/5 text-[#3A2418] text-xs font-semibold tracking-widest uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#C98A4A]" />
              <span>AI CAFÉ OPERATIONS</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#3A2418] mb-3">
              Team Access
            </h1>
            <p className="text-sm sm:text-base text-[#8C877F] max-w-md mx-auto">
              Choose your operational workspace to continue
            </p>
          </div>

          {/* Workspace Selection Cards */}
          <div className="space-y-4">
            {workspaces.map((ws) => {
              const Icon = ws.icon;
              return (
                <Link
                  key={ws.href}
                  href={ws.href}
                  className="group block p-6 sm:p-7 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-sm hover:shadow-md hover:border-[#C98A4A]/50 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#3A2418] text-[#F7F1E7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6 text-[#C98A4A]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-serif text-xl font-bold text-[#3A2418]">
                            {ws.title}
                          </h2>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${ws.badgeColor}`}>
                            {ws.badge}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#8C877F]">
                          {ws.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end sm:shrink-0">
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-[#3A2418] group-hover:text-[#C98A4A] transition-colors">
                        <span>{ws.buttonText}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Back link */}
          <div className="mt-10 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#8C877F] hover:text-[#3A2418] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to AI Café</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
