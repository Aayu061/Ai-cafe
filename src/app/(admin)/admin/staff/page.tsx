"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ShieldCheck, RotateCw, UserPlus, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDocument, UserRole } from "@/types";

export default function AdminStaffPage() {
  const { user, userProfile } = useAuth();
  const [staffList, setStaffList] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetUid, setTargetUid] = useState("");
  const [targetRole, setTargetRole] = useState<UserRole>("staff");
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5001/api/admin/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.warn("Failed to load staff list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStaff();
    }
  }, [user]);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUid || !targetRole) return;

    setAssigning(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("http://localhost:5001/api/admin/staff/role", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUid, role: targetRole }),
      });

      if (res.ok) {
        setMessage(`Successfully assigned role '${targetRole.toUpperCase()}' to UID: ${targetUid}`);
        setTimeout(() => setMessage(null), 4000);
        setTargetUid("");
        await fetchStaff();
      } else {
        const errData = await res.json();
        setMessage(`Error: ${errData?.error?.message || "Failed to assign role"}`);
      }
    } catch (err) {
      console.error("Failed to assign staff role:", err);
    } finally {
      setAssigning(false);
    }
  };

  const actorRole = userProfile?.role || "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Staff & Operational Clearances
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Authoritative role assignments, kitchen permissions, and administrator access control.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStaff()}
          className="gap-2 border-gray-300 text-gray-700"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {message}
        </div>
      )}

      {/* Role Assignment Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h3 className="font-serif font-bold text-base text-gray-900 mb-1 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-caramel" />
          <span>Assign Staff or Admin Role</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Promote or adjust clearances for an authenticated user. Role mutations are verified server-side and recorded in the audit log.
        </p>

        <form onSubmit={handleAssignRole} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="User UID (from customer directory or Firebase)"
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none"
            required
          />

          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as UserRole)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none"
          >
            <option value="staff">Staff (Kitchen / Orders / Stock)</option>
            <option value="admin">Admin (Full Operations Management)</option>
            {actorRole === "super_admin" && (
              <option value="super_admin">Super Admin (Platform System)</option>
            )}
            <option value="customer">Demote to Customer</option>
          </select>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={assigning || !targetUid}
            className="h-full"
          >
            {assigning ? "Assigning..." : "Assign Role"}
          </Button>
        </form>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-gray-900">
            Active Staff & Administrators ({staffList.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading staff records...</div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No elevated staff assigned yet. Use the form above to assign a user to the staff team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Designation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffList.map((member) => (
                  <tr key={member.uid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {member.displayName || "Staff Member"}
                      <div className="text-[10px] text-gray-400 font-mono">{member.uid}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {member.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-caramel/15 text-caramel font-bold text-[10px] uppercase tracking-wider">
                        <Shield className="w-3 h-3" />
                        <span>{member.role.replace("_", " ")}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                        {member.status || "active"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {member.updatedAt ? new Date(member.updatedAt).toLocaleDateString() : "—"}
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
