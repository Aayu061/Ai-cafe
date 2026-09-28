"use client";

import React, { useState, useEffect } from "react";
import { RoleGuard } from "@/features/auth/components/role-guard";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Package,
  Sparkles,
  ChefHat,
  Filter,
  ArrowRight,
  Shield,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { InventoryItem, OrderDoc, OrderStatus } from "@/types";

type StaffTab = "orders" | "inventory" | "profile";

function StaffDashboardContent() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<StaffTab>("orders");
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "all">("all");
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [loadingInventory, setLoadingInventory] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5001/api/staff/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.warn("Could not fetch staff orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5001/api/staff/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
        setLowStockAlerts(data.lowStockAlerts || []);
      }
    } catch (err) {
      console.warn("Could not fetch staff inventory:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchInventory();
    }
  }, [user]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:5001/api/staff/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionMessage(`Order #${orderId} marked as ${newStatus}`);
        setTimeout(() => setActionMessage(null), 3000);
        await fetchOrders();
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const role = userProfile?.role || "staff";

  const filteredOrders =
    orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);

  const orderColumns: Array<{ title: string; status: OrderStatus; badgeColor: string }> = [
    { title: "NEW ORDERS", status: "new", badgeColor: "bg-blue-100 text-blue-800" },
    { title: "PREPARING", status: "preparing", badgeColor: "bg-amber-100 text-amber-800" },
    { title: "READY FOR PICKUP", status: "ready", badgeColor: "bg-emerald-100 text-emerald-800" },
    { title: "COMPLETED", status: "completed", badgeColor: "bg-gray-100 text-gray-800" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        <Container>
          <div className="max-w-6xl mx-auto">
            {/* Staff Top Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-espresso/5 text-espresso text-xs font-semibold tracking-wider uppercase mb-2">
                  <ChefHat className="w-3.5 h-3.5 text-caramel" />
                  <span>Operations Hub</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso tracking-tight">
                  Barista & Kitchen Terminal
                </h1>
                <p className="text-xs sm:text-sm text-espresso/70 mt-1">
                  Active fulfillment queue, operational stock monitoring, and kitchen readiness.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchOrders();
                    fetchInventory();
                  }}
                  className="gap-2 border-espresso/20 text-espresso"
                >
                  <RotateCw className="w-3.5 h-3.5 text-caramel" />
                  <span>Refresh Queue</span>
                </Button>

                {(role === "admin" || role === "super_admin") && (
                  <Link href="/admin">
                    <Button variant="primary" size="sm" className="gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Portal</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Notification alert */}
            {actionMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-sm animate-fade-in">
                <span>{actionMessage}</span>
              </div>
            )}

            {/* Low stock alert banner */}
            {lowStockAlerts.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold">Operational Warning:</span> {lowStockAlerts.length}{" "}
                  ingredient{lowStockAlerts.length > 1 ? "s are" : " is"} currently low or out of
                  stock ({lowStockAlerts.map((i) => i.name).join(", ")}).
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-espresso/10">
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2",
                  activeTab === "orders"
                    ? "bg-espresso text-cream shadow-sm"
                    : "text-espresso/70 hover:bg-espresso/5"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Today's Orders ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2",
                  activeTab === "inventory"
                    ? "bg-espresso text-cream shadow-sm"
                    : "text-espresso/70 hover:bg-espresso/5"
                )}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Operational Inventory ({inventory.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap flex items-center gap-2",
                  activeTab === "profile"
                    ? "bg-espresso text-cream shadow-sm"
                    : "text-espresso/70 hover:bg-espresso/5"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Staff Profile</span>
              </button>
            </div>

            {/* Tab 1: Orders Fulfillment Board */}
            {activeTab === "orders" && (
              <div>
                {orders.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-offwhite border border-espresso/10 text-center shadow-card">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-espresso/5 text-espresso flex items-center justify-center">
                      <Clock className="w-7 h-7 text-caramel" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-espresso mb-1">
                      No active orders yet
                    </h3>
                    <p className="text-xs text-espresso/70 max-w-sm mx-auto leading-relaxed mb-6">
                      The live fulfillment queue will dynamically populate as customers submit orders from the café menu and Drink Studio.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Kitchen terminal is online and listening</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {orderColumns.map((col) => {
                      const colOrders = orders.filter((o) => o.status === col.status);
                      return (
                        <div
                          key={col.status}
                          className="bg-offwhite rounded-2xl p-4 border border-espresso/10 flex flex-col"
                        >
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-espresso/10">
                            <span className="text-[11px] font-bold tracking-wider text-espresso">
                              {col.title}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                col.badgeColor
                              )}
                            >
                              {colOrders.length}
                            </span>
                          </div>

                          <div className="space-y-3 flex-1">
                            {colOrders.length === 0 ? (
                              <div className="py-8 text-center text-xs text-warmgray">
                                No {col.status} orders
                              </div>
                            ) : (
                              colOrders.map((order) => (
                                <div
                                  key={order.id}
                                  className="p-3.5 rounded-xl bg-cream/50 border border-espresso/5 shadow-xs"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-xs font-bold text-espresso">
                                      #{order.id.slice(-4).toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-warmgray">
                                      ₹{order.total}
                                    </span>
                                  </div>

                                  <div className="text-xs font-semibold text-espresso mb-1">
                                    {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                                  </div>

                                  {order.items[0]?.customizationSummary && (
                                    <p className="text-[10px] text-espresso/70 mb-3 italic">
                                      {order.items[0].customizationSummary}
                                    </p>
                                  )}

                                  <div className="pt-2 border-t border-espresso/5 flex items-center justify-end gap-1.5">
                                    {col.status === "new" && (
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        className="h-7 text-[11px] px-2.5"
                                        onClick={() => handleUpdateStatus(order.id, "preparing")}
                                      >
                                        Accept & Brew
                                      </Button>
                                    )}

                                    {col.status === "preparing" && (
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => handleUpdateStatus(order.id, "ready")}
                                      >
                                        Mark Ready
                                      </Button>
                                    )}

                                    {col.status === "ready" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[11px] px-2.5"
                                        onClick={() => handleUpdateStatus(order.id, "completed")}
                                      >
                                        Complete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Operational Inventory Table */}
            {activeTab === "inventory" && (
              <div className="bg-offwhite rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-espresso">
                      Ingredient Inventory Status
                    </h3>
                    <p className="text-xs text-espresso/70 mt-0.5">
                      Real-time stock levels derived from authorized inventory management.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>In Stock</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span>Low Stock</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                      <span>Out of Stock</span>
                    </span>
                  </div>
                </div>

                {inventory.length === 0 ? (
                  <div className="py-12 text-center text-xs text-espresso/70 border border-dashed border-espresso/10 rounded-2xl">
                    No inventory items tracked yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-espresso/10 text-warmgray uppercase tracking-wider text-[10px]">
                          <th className="pb-3 font-semibold">Ingredient</th>
                          <th className="pb-3 font-semibold">Available Stock</th>
                          <th className="pb-3 font-semibold">Reorder Threshold</th>
                          <th className="pb-3 font-semibold">Unit</th>
                          <th className="pb-3 font-semibold text-right">Operational Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-espresso/5">
                        {inventory.map((item) => (
                          <tr key={item.id} className="hover:bg-cream/30 transition-colors">
                            <td className="py-3.5 font-medium text-espresso flex items-center gap-2">
                              <Coffee className="w-3.5 h-3.5 text-caramel" />
                              <span>{item.name}</span>
                            </td>
                            <td className="py-3.5 font-mono font-bold text-espresso">
                              {item.quantity}
                            </td>
                            <td className="py-3.5 text-warmgray font-mono">
                              {item.reorderThreshold}
                            </td>
                            <td className="py-3.5 uppercase text-warmgray">
                              {item.unit}
                            </td>
                            <td className="py-3.5 text-right">
                              {item.status === "in_stock" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                  In Stock
                                </span>
                              )}
                              {item.status === "low_stock" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                                  Low Stock
                                </span>
                              )}
                              {item.status === "out_of_stock" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider">
                                  Out of Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Staff Profile */}
            {activeTab === "profile" && (
              <div className="bg-offwhite rounded-3xl p-6 sm:p-8 border border-espresso/10 shadow-card">
                <h3 className="font-serif text-xl font-bold text-espresso mb-1">
                  Staff Operational Clearances
                </h3>
                <p className="text-xs text-espresso/70 mb-6">
                  Authorized permissions and shift credentials.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-cream/40 border border-espresso/5">
                    <span className="text-[10px] uppercase font-bold text-warmgray tracking-wider">
                      Staff ID / UID
                    </span>
                    <p className="font-mono text-xs text-espresso mt-1 truncate">
                      {user?.uid}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-cream/40 border border-espresso/5">
                    <span className="text-[10px] uppercase font-bold text-warmgray tracking-wider">
                      Role Designation
                    </span>
                    <p className="font-serif text-sm font-bold text-espresso mt-1 capitalize">
                      {role.replace("_", " ")}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-cream/40 border border-espresso/5">
                    <span className="text-[10px] uppercase font-bold text-warmgray tracking-wider">
                      Assigned Capabilities
                    </span>
                    <ul className="text-xs text-espresso/80 mt-1 space-y-1 list-disc list-inside">
                      <li>Order status transitions (accept, brew, ready, complete)</li>
                      <li>Operational inventory stock inspection</li>
                      <li>Low-stock alert monitoring</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-cream/40 border border-espresso/5">
                    <span className="text-[10px] uppercase font-bold text-warmgray tracking-wider">
                      Access Level
                    </span>
                    <p className="text-xs text-espresso mt-1">
                      Staff terminal authorization (Role authorization enforced server-side)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function StaffPage() {
  return (
    <RoleGuard allowedRoles={["staff", "admin", "super_admin"]}>
      <StaffDashboardContent />
    </RoleGuard>
  );
}
