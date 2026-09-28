"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleGuard } from "@/features/auth/components/role-guard";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  LayoutDashboard,
  Coffee,
  Package,
  ShoppingBag,
  Users,
  ShieldAlert,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Coffee },
  { label: "Inventory", href: "/admin/inventory", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Staff", href: "/admin/staff", icon: ShieldAlert },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings & Logs", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userProfile, signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const role = userProfile?.role || "admin";

  return (
    <RoleGuard allowedRoles={["admin", "super_admin"]} fallbackUrl="/staff">
      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-espresso text-cream flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-caramel" />
            </div>
            <span className="font-serif font-bold text-sm tracking-wider">AI CAFÉ ADMIN</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Toggle Navigation"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar for Desktop / Drawer for Mobile */}
        <aside
          className={cn(
            "w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 md:sticky md:top-0 md:h-screen z-30 transition-all",
            mobileNavOpen ? "block" : "hidden md:flex"
          )}
        >
          {/* Brand header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-espresso text-cream flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-caramel" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm text-espresso leading-tight">
                  AI CAFÉ
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-caramel">
                  Operations & Mgmt
                </span>
              </div>
            </Link>

            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-espresso/5 text-espresso border border-espresso/10">
              {role === "super_admin" ? "Super Admin" : "Admin"}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors",
                    isActive
                      ? "bg-espresso text-cream shadow-xs"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-caramel" : "text-gray-400")} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-caramel" />}
                </Link>
              );
            })}
          </nav>

          {/* Quick link to public café & staff terminal */}
          <div className="p-4 border-t border-gray-100 space-y-2 bg-gray-50/50">
            <Link
              href="/staff"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              <span>Staff Kitchen Terminal</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </Link>

            <Link
              href="/"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              <span>Customer Café View</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </Link>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="w-full justify-center gap-2 text-xs border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Operational Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
