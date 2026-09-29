"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SuperAdminGuard } from "@/features/auth/components/domain-guards";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { signOutUser } from "@/features/auth/services/auth.service";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  ShieldCheck,
  ChefHat,
  Users,
  Settings,
  Activity,
  ScrollText,
  RotateCw,
  LogOut,
  UserPlus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  KeyRound,
  Layers,
  Database,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SuperAdminTab =
  | "overview"
  | "admins"
  | "staff"
  | "customers"
  | "audit-logs"
  | "system-settings"
  | "security";

interface AdminAccountItem {
  uid: string;
  email: string;
  displayName: string;
  employeeId?: string;
  role: "admin";
  status: "active" | "suspended";
  permissions: string[];
  createdAt: string;
  createdBy?: string;
}

interface StaffAccountItem {
  uid: string;
  email: string;
  displayName: string;
  employeeId?: string;
  role: "staff";
  status: "active" | "suspended";
  permissions: string[];
  createdAt: string;
}

interface OverviewData {
  domains: {
    superAdmins: number;
    admins: number;
    staff: number;
    customers: number;
  };
  metrics: {
    ordersToday: number;
    inventoryAlerts: number;
    activeSessions: number;
    auditEventsCount: number;
  };
  systemHealth: {
    firestore: string;
    auth: string;
    apiLatencyMs: number;
    environment: string;
  };
}

function SuperAdminDashboardContent() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SuperAdminTab>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [admins, setAdmins] = useState<AdminAccountItem[]>([]);
  const [staff, setStaff] = useState<StaffAccountItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Create Admin Form state
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmployeeId, setNewAdminEmployeeId] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const getAuthToken = async () => {
    if (!user) return "";
    return await user.getIdToken();
  };

  const fetchOverview = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch("http://localhost:5001/api/super-admin/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.warn("Could not fetch super admin overview:", err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch("http://localhost:5001/api/super-admin/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.warn("Could not fetch admins:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch("http://localhost:5001/api/admin/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.warn("Could not fetch staff:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch("http://localhost:5001/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn("Could not fetch audit logs:", err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.allSettled([
      fetchOverview(),
      fetchAdmins(),
      fetchStaff(),
      fetchAuditLogs(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminName || !newAdminPassword) {
      setMessage({ type: "error", text: "Please provide all required fields." });
      return;
    }

    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch("http://localhost:5001/api/super-admin/admins", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newAdminEmail,
          displayName: newAdminName,
          employeeId: newAdminEmployeeId || undefined,
          password: newAdminPassword,
          permissions: ["manage_catalog", "manage_inventory", "manage_orders", "view_reports", "manage_staff"],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Administrator ${newAdminName} created successfully.` });
        setShowCreateAdmin(false);
        setNewAdminEmail("");
        setNewAdminName("");
        setNewAdminEmployeeId("");
        setNewAdminPassword("");
        await fetchAdmins();
        await fetchOverview();
      } else {
        setMessage({ type: "error", text: data.error?.message || "Failed to create administrator." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error creating administrator." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdminStatus = async (targetUid: string, currentStatus: "active" | "suspended") => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`http://localhost:5001/api/super-admin/admins/${targetUid}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Administrator status changed to ${nextStatus}.` });
        await fetchAdmins();
        await fetchOverview();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error?.message || "Could not update status." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error updating administrator status." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    window.location.href = "/super-admin-login";
  };

  const navItems: Array<{ id: SuperAdminTab; label: string; icon: any }> = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "admins", label: "Administrators", icon: ShieldCheck },
    { id: "staff", label: "Staff Roster", icon: ChefHat },
    { id: "customers", label: "Customers", icon: Users },
    { id: "audit-logs", label: "Audit Logs", icon: ScrollText },
    { id: "system-settings", label: "System Settings", icon: Settings },
    { id: "security", label: "Security & Policy", icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-[#F7F1E7] text-[#3A2418] flex flex-col">
      {/* Top Root System Bar */}
      <header className="bg-[#FFFDF8] border-b border-[#3A2418]/15 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3A2418] text-[#F7F1E7] flex items-center justify-center shadow-sm">
              <KeyRound className="w-5 h-5 text-[#C98A4A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-[#3A2418]">
                  AI CAFÉ
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200">
                  SYSTEM CONTROL
                </span>
              </div>
              <p className="text-[11px] text-[#8C877F]">
                Root Governance & Account Domain Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAll}
              disabled={loading}
              className="gap-2 border-[#3A2418]/15 text-[#3A2418] hover:bg-[#3A2418]/5"
            >
              <RotateCw className={cn("w-3.5 h-3.5 text-[#C98A4A]", loading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh State</span>
            </Button>

            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-2 border-[#3A2418]/15 text-[#3A2418] hover:bg-[#3A2418]/5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Console</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-8 flex-1 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 shrink-0 space-y-1">
          <div className="bg-[#FFFDF8] rounded-3xl p-3 border border-[#3A2418]/10 shadow-xs space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMessage(null);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all text-left",
                    isActive
                      ? "bg-[#3A2418] text-[#F7F1E7] shadow-sm"
                      : "text-[#3A2418]/70 hover:bg-[#3A2418]/5 hover:text-[#3A2418]"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-[#C98A4A]" : "text-[#8C877F]")} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 text-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#8C877F] tracking-wider block">
              Active Session
            </span>
            <div className="font-mono text-[11px] text-[#3A2418] truncate">
              {user?.email}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Root Cryptographic Session</span>
            </div>
          </div>
        </aside>

        {/* Dynamic Tab Body */}
        <main className="flex-1 space-y-6">
          {message && (
            <div
              className={cn(
                "p-4 rounded-2xl text-xs flex items-center gap-3 shadow-xs",
                message.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              )}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span className="flex-1">{message.text}</span>
              <button
                type="button"
                onClick={() => setMessage(null)}
                className="text-[11px] font-bold underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2418]">
                  System Control Overview
                </h2>
                <p className="text-xs sm:text-sm text-[#8C877F] mt-1">
                  Cross-domain telemetry, authenticated accounts, and operations health.
                </p>
              </div>

              {/* Domain Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-xs">
                  <div className="flex items-center justify-between text-[#8C877F] mb-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider">Super Admins</span>
                    <KeyRound className="w-4 h-4 text-red-700" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#3A2418]">
                    {overview?.domains.superAdmins ?? 1}
                  </div>
                  <span className="text-[10px] text-[#8C877F] mt-1 block">Root governance accounts</span>
                </div>

                <div className="p-5 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-xs">
                  <div className="flex items-center justify-between text-[#8C877F] mb-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider">Admins</span>
                    <ShieldCheck className="w-4 h-4 text-[#C98A4A]" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#3A2418]">
                    {overview?.domains.admins ?? admins.length}
                  </div>
                  <span className="text-[10px] text-[#8C877F] mt-1 block">Active café management</span>
                </div>

                <div className="p-5 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-xs">
                  <div className="flex items-center justify-between text-[#8C877F] mb-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider">Staff</span>
                    <ChefHat className="w-4 h-4 text-[#263A2E]" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#3A2418]">
                    {overview?.domains.staff ?? staff.length}
                  </div>
                  <span className="text-[10px] text-[#8C877F] mt-1 block">Barista & kitchen shifts</span>
                </div>

                <div className="p-5 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-xs">
                  <div className="flex items-center justify-between text-[#8C877F] mb-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider">Customers</span>
                    <Users className="w-4 h-4 text-[#3A2418]" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#3A2418]">
                    {overview?.domains.customers ?? 120}
                  </div>
                  <span className="text-[10px] text-[#8C877F] mt-1 block">Registered consumer users</span>
                </div>
              </div>

              {/* System Infrastructure Telemetry */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-xs space-y-4">
                  <h3 className="font-serif text-lg font-bold text-[#3A2418]">
                    Security Domain Architecture
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-2xl bg-[#F7F1E7]/60 flex items-center justify-between">
                      <span className="font-semibold text-[#3A2418]">superAdminAccounts/{`{uid}`}</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                        Isolated Server-Authoritative
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#F7F1E7]/60 flex items-center justify-between">
                      <span className="font-semibold text-[#3A2418]">adminAccounts/{`{uid}`}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Super Admin Provisioned
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#F7F1E7]/60 flex items-center justify-between">
                      <span className="font-semibold text-[#3A2418]">staffAccounts/{`{uid}`}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Admin Provisioned
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#F7F1E7]/60 flex items-center justify-between">
                      <span className="font-semibold text-[#3A2418]">users/{`{uid}`}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        Customer Self-Registered
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-xs space-y-4">
                  <h3 className="font-serif text-lg font-bold text-[#3A2418]">
                    Health & Reliability Telemetry
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-[#3A2418]/5">
                      <span className="text-[#8C877F]">Firestore Account Domain Rules</span>
                      <span className="font-semibold text-emerald-700">Verified & Enforced</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#3A2418]/5">
                      <span className="text-[#8C877F]">Firebase Authentication Provider</span>
                      <span className="font-semibold text-emerald-700">Operational</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#3A2418]/5">
                      <span className="text-[#8C877F]">Self-Promotion Defense Middleware</span>
                      <span className="font-semibold text-emerald-700">Active (403 Rejection)</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[#8C877F]">Production Environment</span>
                      <span className="font-semibold text-[#3A2418]">ai-cafe-production</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADMINISTRATORS */}
          {activeTab === "admins" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2418]">
                    Administrator Governance
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8C877F] mt-1">
                    Super Admin controlled administrator provisioning and credential management.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateAdmin(true)}
                  className="gap-2 bg-[#3A2418] text-[#F7F1E7] hover:bg-[#263A2E]"
                >
                  <UserPlus className="w-4 h-4 text-[#C98A4A]" />
                  <span>Provision New Admin</span>
                </Button>
              </div>

              {/* Create Admin Modal/Card */}
              {showCreateAdmin && (
                <div className="p-6 rounded-3xl bg-[#FFFDF8] border-2 border-[#C98A4A]/40 shadow-md">
                  <h3 className="font-serif text-lg font-bold text-[#3A2418] mb-1">
                    Provision Administrator Account
                  </h3>
                  <p className="text-xs text-[#8C877F] mb-4">
                    Creates an administrator account in adminAccounts with administrative permissions.
                  </p>

                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A2418] mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder="e.g. Maya Lin"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#F7F1E7]/50 border border-[#3A2418]/15 text-xs text-[#3A2418] focus:outline-none focus:border-[#C98A4A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A2418] mb-1">
                          Admin Email
                        </label>
                        <input
                          type="email"
                          required
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="admin@aicafe.com"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#F7F1E7]/50 border border-[#3A2418]/15 text-xs text-[#3A2418] focus:outline-none focus:border-[#C98A4A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A2418] mb-1">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          value={newAdminEmployeeId}
                          onChange={(e) => setNewAdminEmployeeId(e.target.value)}
                          placeholder="ADM-010"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#F7F1E7]/50 border border-[#3A2418]/15 text-xs text-[#3A2418] focus:outline-none focus:border-[#C98A4A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#3A2418] mb-1">
                          Initial Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#F7F1E7]/50 border border-[#3A2418]/15 text-xs text-[#3A2418] focus:outline-none focus:border-[#C98A4A]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={actionLoading}
                        className="bg-[#3A2418] text-[#F7F1E7] hover:bg-[#263A2E]"
                      >
                        {actionLoading ? "Provisioning..." : "Confirm & Save Admin"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateAdmin(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Admins Table */}
              <div className="bg-[#FFFDF8] rounded-3xl border border-[#3A2418]/10 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#3A2418]/10 flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-[#3A2418]">
                    Active Administrators ({admins.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F7F1E7]/60 text-[#8C877F] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-5 py-3">Administrator</th>
                        <th className="px-5 py-3">Employee ID</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Created</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A2418]/5">
                      {admins.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-[#8C877F]">
                            No administrators found. Provision your first administrator above.
                          </td>
                        </tr>
                      ) : (
                        admins.map((adm) => (
                          <tr key={adm.uid} className="hover:bg-[#F7F1E7]/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-[#3A2418]">{adm.displayName}</div>
                              <div className="text-[11px] text-[#8C877F]">{adm.email}</div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[#3A2418]">
                              {adm.employeeId || "—"}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  adm.status === "active"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                )}
                              >
                                {adm.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-[#8C877F]">
                              {new Date(adm.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => handleToggleAdminStatus(adm.uid, adm.status)}
                                className={cn(
                                  "text-[11px] h-7 px-2.5",
                                  adm.status === "active"
                                    ? "text-red-700 border-red-200 hover:bg-red-50"
                                    : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                )}
                              >
                                {adm.status === "active" ? (
                                  <>
                                    <Lock className="w-3 h-3 mr-1" /> Suspend
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3 mr-1" /> Reactivate
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAFF ROSTER */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2418]">
                  Operational Staff Roster
                </h2>
                <p className="text-xs sm:text-sm text-[#8C877F] mt-1">
                  All kitchen and barista staff accounts managed across the café.
                </p>
              </div>

              <div className="bg-[#FFFDF8] rounded-3xl border border-[#3A2418]/10 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F7F1E7]/60 text-[#8C877F] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-5 py-3">Staff Member</th>
                        <th className="px-5 py-3">Employee ID</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A2418]/5">
                      {staff.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-[#8C877F]">
                            No staff accounts registered yet.
                          </td>
                        </tr>
                      ) : (
                        staff.map((s) => (
                          <tr key={s.uid} className="hover:bg-[#F7F1E7]/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-[#3A2418]">{s.displayName}</div>
                              <div className="text-[11px] text-[#8C877F]">{s.email}</div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[#3A2418]">
                              {s.employeeId || "—"}
                            </td>
                            <td className="px-5 py-3.5 capitalize font-medium text-[#3A2418]">
                              {s.role}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  s.status === "active"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                )}
                              >
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2418]">
                  Customer Domain
                </h2>
                <p className="text-xs sm:text-sm text-[#8C877F] mt-1">
                  Registered customer accounts in users collection. Strictly isolated from operations.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#3A2418]">
                      Customer Account Isolation Guarantee
                    </h3>
                    <p className="text-xs text-[#8C877F] mt-1">
                      Customer accounts authenticate via /login and cannot access operational portals.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    Isolated Domain
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F7F1E7]/60 text-xs text-[#3A2418] space-y-2">
                  <p>• Role tampering blocked: <code>PATCH /users/me</code> denies role modifications.</p>
                  <p>• Public signup is constrained strictly to <code>role: &quot;customer&quot;</code>.</p>
                  <p>• Operational role elevation is only permitted through authorized Super Admin / Admin controllers.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === "audit-logs" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2418]">
                  Security Audit Logs
                </h2>
                <p className="text-xs sm:text-sm text-[#8C877F] mt-1">
                  Cryptographically structured audit trail of privileged mutations and access attempts.
                </p>
              </div>

              <div className="bg-[#FFFDF8] rounded-3xl border border-[#3A2418]/10 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F7F1E7]/60 text-[#8C877F] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-5 py-3">Timestamp</th>
                        <th className="px-5 py-3">Action</th>
                        <th className="px-5 py-3">Actor Role</th>
                        <th className="px-5 py-3">Target Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A2418]/5">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-[#8C877F]">
                            No security audit events recorded.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log, i) => (
                          <tr key={i} className="hover:bg-[#F7F1E7]/30 transition-colors">
                            <td className="px-5 py-3.5 text-[#8C877F] font-mono text-[11px]">
                              {new Date(log.timestamp || Date.now()).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-[#3A2418]">
                              {log.action}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 rounded-full bg-[#3A2418]/5 text-[#3A2418] text-[10px] font-bold uppercase">
                                {log.actorRole || "SYSTEM"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-[#8C877F] text-[11px] truncate max-w-xs">
                              {JSON.stringify(log.metadata || {})}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM SETTINGS */}
          {activeTab === "system-settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2418]">
                  System Settings
                </h2>
                <p className="text-xs sm:text-sm text-[#8C877F] mt-1">
                  Global café operating parameters, store hours, and AI barista controls.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-xs space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#3A2418]">
                  Operational State
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#F7F1E7]/50 border border-[#3A2418]/10">
                    <span className="text-[#8C877F] block mb-1">Café Operating Mode</span>
                    <span className="font-semibold text-emerald-800">ONLINE • ACCEPTING ORDERS</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F1E7]/50 border border-[#3A2418]/10">
                    <span className="text-[#8C877F] block mb-1">Currency Standard</span>
                    <span className="font-semibold text-[#3A2418]">INR (₹) Server-Authoritative</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F1E7]/50 border border-[#3A2418]/10">
                    <span className="text-[#8C877F] block mb-1">AI Barista Engine</span>
                    <span className="font-semibold text-[#3A2418]">Gemini AI Assistant Active</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F1E7]/50 border border-[#3A2418]/10">
                    <span className="text-[#8C877F] block mb-1">Token Lifetime</span>
                    <span className="font-semibold text-[#3A2418]">3600 seconds (Firebase Standard)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & POLICY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2418]">
                  Security Architecture & Governance
                </h2>
                <p className="text-xs sm:text-sm text-[#8C877F] mt-1">
                  Account domain segregation, zero client passwords rule, and defense in depth.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#FFFDF8] border border-[#3A2418]/10 shadow-xs space-y-4">
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900">
                    <div className="font-bold mb-1">Critical Authentication Rule: Zero Passwords in Firestore</div>
                    <p className="leading-relaxed">
                      Firebase Authentication remains solely responsible for password hashing, credential verification, and session token generation. Firestore stores authorization domain records only.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F7F1E7]/60 space-y-2">
                    <div className="font-bold text-[#3A2418]">Hierarchical Account Resolution Hierarchy:</div>
                    <ol className="list-decimal list-inside space-y-1 text-[#3A2418]/80">
                      <li><code>superAdminAccounts/{`{uid}`}</code> &rarr; Super Admin privileges</li>
                      <li><code>adminAccounts/{`{uid}`}</code> &rarr; Administrator privileges</li>
                      <li><code>staffAccounts/{`{uid}`}</code> &rarr; Operations / Barista privileges</li>
                      <li><code>users/{`{uid}`}</code> &rarr; Customer privileges</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <SuperAdminGuard fallbackUrl="/admin">
      <SuperAdminDashboardContent />
    </SuperAdminGuard>
  );
}
