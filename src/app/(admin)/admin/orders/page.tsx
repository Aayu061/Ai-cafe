"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  ShoppingBag,
  RotateCw,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderDoc, OrderStatus } from "@/types";
import { apiUrl } from "@/lib/api-config";

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(apiUrl("/api/admin/orders"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.warn("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Orders & Operational Fulfillment
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            End-to-end customer order tracking, operational lifecycle, and ticket history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders()}
            className="gap-2 border-gray-300 text-gray-700"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-700">Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            className="border border-gray-300 rounded-xl px-3 py-1.5 bg-gray-50/50 text-gray-700 focus:outline-none"
          >
            <option value="all">All Orders ({orders.length})</option>
            <option value="new">New</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table or Empty State */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading order records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-gray-900 mb-1">
              No order data yet.
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Customer drink orders from the AI Barista and Drink Studio will appear here once placed in future order phases.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {order.customerName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      ₹{order.total}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-bold uppercase tracking-wider">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
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
