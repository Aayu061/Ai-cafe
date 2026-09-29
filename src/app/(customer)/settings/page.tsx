"use client";

import React from "react";
import Link from "next/link";
import { CustomerSidebar } from "@/components/customer/customer-sidebar";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { Settings, Bell, Shield, Palette, Globe, Smartphone, ChevronRight } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    title: "Notifications",
    icon: Bell,
    description: "Manage order updates, promotions, and AI Barista alerts.",
    status: "Coming Soon",
  },
  {
    title: "Privacy & Security",
    icon: Shield,
    description: "Control your data, connected accounts, and session management.",
    status: "Coming Soon",
  },
  {
    title: "Appearance",
    icon: Palette,
    description: "Choose your preferred theme and display preferences.",
    status: "Coming Soon",
  },
  {
    title: "Language & Region",
    icon: Globe,
    description: "Set your language, currency, and regional preferences.",
    status: "Coming Soon",
  },
  {
    title: "Devices & Sessions",
    icon: Smartphone,
    description: "View and manage active sessions and connected devices.",
    status: "Coming Soon",
  },
];

function SettingsContent() {
  return (
    <CustomerSidebar>
      <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-espresso/10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/10 text-caramel text-xs font-semibold tracking-wider uppercase mb-3">
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
            Account Settings
          </h1>
          <p className="text-sm text-warmgray mt-1">
            Manage your preferences, notifications, and account configuration.
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-3">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="flex items-center justify-between p-4 rounded-2xl bg-offwhite border border-espresso/8 hover:border-caramel/30 hover:shadow-soft transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-caramel/10 text-caramel flex items-center justify-center shrink-0 group-hover:bg-caramel/20 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-espresso">{section.title}</p>
                    <p className="text-xs text-warmgray leading-relaxed">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-warmgray/10 text-warmgray">
                    {section.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-warmgray/40" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Profile Link */}
        <div className="rounded-2xl bg-caramel/8 border border-caramel/20 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-espresso">Looking for profile settings?</p>
            <p className="text-xs text-warmgray mt-0.5">
              Update your name, email, photo, and account details on the Profile page.
            </p>
          </div>
          <Link
            href="/profile"
            className="shrink-0 ml-4 px-4 py-2 rounded-full bg-espresso text-cream text-xs font-semibold hover:bg-caramel hover:text-espresso transition-colors"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    </CustomerSidebar>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
