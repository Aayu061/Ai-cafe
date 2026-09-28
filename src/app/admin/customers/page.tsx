"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Users, RotateCw, Search, Shield, CheckCircle2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDocument, UserStatus } from "@/types";

export default function AdminCustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5001/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.warn("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  const handleToggleStatus = async (customerUid: string, currentStatus: UserStatus) => {
    const newStatus: UserStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`http://localhost:5001/api/admin/customers/${customerUid}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.uid === customerUid ? { ...c, status: newStatus } : c))
        );
        setMessage(`Updated customer account status to ${newStatus.toUpperCase()}`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update customer status:", err);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Customer Accounts Directory
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Registered patrons, account statuses, and taste profile integrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCustomers()}
            className="gap-2 border-gray-300 text-gray-700"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {message}
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-caramel bg-gray-50/50"
          />
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline">
          Total Customers: {customers.length}
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading customer records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-gray-900 mb-1">
              No customers yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Customer accounts will be listed here when patrons sign in or create accounts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((customer) => {
                  const status = customer.status || "active";
                  return (
                    <tr key={customer.uid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {customer.displayName || "Café Guest"}
                        <div className="text-[10px] text-gray-400 font-mono">{customer.uid}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {customer.email || "No email"}
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-gray-700">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                          {customer.role || "customer"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
                            <Ban className="w-3 h-3" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2.5"
                          onClick={() => handleToggleStatus(customer.uid, status)}
                        >
                          {status === "active" ? "Suspend Account" : "Reactivate"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
