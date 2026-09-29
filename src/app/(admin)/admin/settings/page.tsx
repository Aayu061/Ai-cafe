"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Settings, Shield, ScrollText, RotateCw, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditLog } from "@/types";

export default function AdminSettingsPage() {
  const { user, userProfile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5001/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.warn("Failed to load audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAuditLogs();
    }
  }, [user]);

  const role = userProfile?.role || "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Platform Settings & Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Security guarantees, audit trail records, and operational system configurations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAuditLogs()}
          className="gap-2 border-gray-300 text-gray-700"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </Button>
      </div>

      {/* Security Architecture Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h3 className="font-serif font-bold text-base text-gray-900 mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-caramel" />
          <span>Active Platform Defenses</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          All mission-critical security controls are verified and enforced server-side.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="font-bold text-gray-900 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Server-Authoritative Pricing</span>
            </div>
            <p className="text-gray-500 text-[11px]">
              Client drink configurations are re-priced on the backend. Zero client-side price trust.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="font-bold text-gray-900 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role-Based Access Control</span>
            </div>
            <p className="text-gray-500 text-[11px]">
              Customer, Staff, Admin, and Super Admin tiers validated per request via signed tokens.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="font-bold text-gray-900 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Self-Promotion Defense</span>
            </div>
            <p className="text-gray-500 text-[11px]">
              Firestore security rules and backend services prevent clients from mutating role or permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-gray-500" />
            <h3 className="font-serif font-bold text-sm text-gray-900">
              System Audit Trail ({logs.length} events)
            </h3>
          </div>
          <span className="text-[10px] text-gray-400">
            No sensitive keys or passwords logged
          </span>
        </div>

        {loadingLogs ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No audit records created yet. Changes to products, inventory, orders, and roles will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor (Role)</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <span className="font-mono text-[10px]">{log.actorId.slice(-6)}</span>{" "}
                      <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 ml-1">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-mono text-[11px]">
                      {log.resourceType}{log.resourceId ? `:${log.resourceId}` : ""}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[10px] max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
