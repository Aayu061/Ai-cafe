"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  Coffee,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  RotateCw,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminAnalyticsData {
  totalOrders: number;
  totalInventoryItems: number;
  lowStockCount: number;
  activeProductsCount: number;
  hasOrderHistory: boolean;
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5001/api/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.warn("Could not fetch admin analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold uppercase tracking-wider mb-2 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrative Command</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 tracking-tight">
            Café Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time catalog state, ingredient inventories, and live fulfillment telemetries.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalytics()}
          className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 self-start sm:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5 text-caramel" />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      {/* Primary KPI Cards (Real Data Only — Zero Fabricated Sales or Revenue) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Products</span>
            <div className="w-8 h-8 rounded-lg bg-caramel/10 text-caramel flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-gray-900">
            {loading ? "..." : analytics?.activeProductsCount ?? 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 flex items-center justify-between">
            <span>Available on menu</span>
            <Link href="/admin/products" className="text-caramel font-semibold hover:underline flex items-center">
              <span>Catalog</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Items</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-gray-900">
            {loading ? "..." : analytics?.totalInventoryItems ?? 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 flex items-center justify-between">
            <span>Ingredients tracked</span>
            <Link href="/admin/inventory" className="text-caramel font-semibold hover:underline flex items-center">
              <span>Stocks</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-gray-900">
            {loading ? "..." : analytics?.lowStockCount ?? 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 flex items-center justify-between">
            <span>At or below threshold</span>
            <Link href="/admin/inventory" className="text-caramel font-semibold hover:underline flex items-center">
              <span>Inspect</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Orders Received</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-gray-900">
            {loading ? "..." : analytics?.totalOrders ?? 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 flex items-center justify-between">
            <span>Fulfillment pipeline</span>
            <Link href="/admin/orders" className="text-caramel font-semibold hover:underline flex items-center">
              <span>Orders</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Empty States for Orders & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base font-bold text-gray-900">
              Live Orders Feed
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              Real Orders Only
            </span>
          </div>

          <div className="py-12 px-4 rounded-xl border border-dashed border-gray-200 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-2">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="font-medium text-xs text-gray-700">No order data yet.</p>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs mx-auto">
              Real-time orders will display here once customers complete purchases in future order phases.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base font-bold text-gray-900">
              Revenue & Financial Analytics
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              Server Authoritative
            </span>
          </div>

          <div className="py-12 px-4 rounded-xl border border-dashed border-gray-200 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="font-medium text-xs text-gray-700">No analytics data yet.</p>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs mx-auto">
              Financial trends and gross volume charts will generate organically once checkout transactions occur.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Administration Shortcuts */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
        <h3 className="font-serif text-base font-bold text-gray-900 mb-4">
          Quick Administrative Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <Link
            href="/admin/products"
            className="p-4 rounded-xl border border-gray-200 hover:border-caramel hover:bg-caramel/5 transition-all group"
          >
            <div className="font-bold text-gray-900 group-hover:text-caramel flex items-center justify-between">
              <span>Catalog Management</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-caramel" />
            </div>
            <p className="text-gray-500 mt-1">
              Toggle drink availability, configure base pricing, or create items.
            </p>
          </Link>

          <Link
            href="/admin/inventory"
            className="p-4 rounded-xl border border-gray-200 hover:border-caramel hover:bg-caramel/5 transition-all group"
          >
            <div className="font-bold text-gray-900 group-hover:text-caramel flex items-center justify-between">
              <span>Adjust Stock & Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-caramel" />
            </div>
            <p className="text-gray-500 mt-1">
              Record inventory restocks, waste corrections, and stock movements.
            </p>
          </Link>

          <Link
            href="/admin/staff"
            className="p-4 rounded-xl border border-gray-200 hover:border-caramel hover:bg-caramel/5 transition-all group"
          >
            <div className="font-bold text-gray-900 group-hover:text-caramel flex items-center justify-between">
              <span>Staff & Role Access</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-caramel" />
            </div>
            <p className="text-gray-500 mt-1">
              Assign staff or admin permissions with strict server verification.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
