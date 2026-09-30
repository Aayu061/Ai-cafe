"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  Package,
  PlusCircle,
  AlertTriangle,
  History,
  RotateCw,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryItem, InventoryMovement, InventoryMovementType } from "@/types";
import { apiUrl } from "@/lib/api-config";

export default function AdminInventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stocks" | "movements">("stocks");
  const [message, setMessage] = useState<string | null>(null);

  // Adjustment Modal State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantityDelta, setQuantityDelta] = useState<number>(0);
  const [adjType, setAdjType] = useState<InventoryMovementType>("adjustment");
  const [reason, setReason] = useState<string>("");
  const [adjusting, setAdjusting] = useState<boolean>(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(apiUrl("/api/admin/inventory"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
      }
    } catch (err) {
      console.warn("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(apiUrl("/api/admin/inventory/movements"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } catch (err) {
      console.warn("Failed to load movements:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchMovements();
    }
  }, [user]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantityDelta === 0 || !reason) return;

    setAdjusting(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(apiUrl("/api/admin/inventory/adjust"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          quantityDelta,
          type: adjType,
          reason,
        }),
      });

      if (res.ok) {
        setMessage(`Adjusted ${selectedItem.name} by ${quantityDelta > 0 ? "+" : ""}${quantityDelta} ${selectedItem.unit}`);
        setTimeout(() => setMessage(null), 3500);
        setSelectedItem(null);
        setQuantityDelta(0);
        setReason("");
        await fetchInventory();
        await fetchMovements();
      }
    } catch (err) {
      console.error("Stock adjustment failed:", err);
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Inventory & Stock Architecture
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Authoritative ingredient stocks, automated status derivation, and audit-logged movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchInventory();
              fetchMovements();
            }}
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("stocks")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors flex items-center gap-2 ${
            activeTab === "stocks"
              ? "bg-espresso text-cream shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Current Stocks ({inventory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("movements")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors flex items-center gap-2 ${
            activeTab === "movements"
              ? "bg-espresso text-cream shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Stock Movement Audit ({movements.length})</span>
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === "stocks" ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400">Loading inventory items...</div>
          ) : inventory.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">
              No inventory items yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Ingredient</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Reorder Level</th>
                    <th className="py-3 px-4">Derived Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {item.name}
                        <div className="text-[10px] text-gray-400 font-mono">{item.ingredientId}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 uppercase text-gray-500">
                        {item.unit}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-mono">
                        {item.reorderThreshold}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2.5 border-gray-300"
                          onClick={() => setSelectedItem(item)}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {movements.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">
              No stock movements recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Movement ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Quantity Delta</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        {m.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold tracking-wider">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {m.quantity > 0 ? (
                          <span className="text-emerald-600">+{m.quantity} {m.unit}</span>
                        ) : (
                          <span className="text-red-600">{m.quantity} {m.unit}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {m.reason}
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-[10px]">
                        {m.createdBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-card border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-serif font-bold text-base text-gray-900">
                Adjust Stock: {selectedItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Movement Type
                </label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as InventoryMovementType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                >
                  <option value="adjustment">Manual Adjustment</option>
                  <option value="purchase">Purchase / Restock</option>
                  <option value="waste">Kitchen Spoilage / Waste</option>
                  <option value="correction">Audit Correction</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Quantity Delta ({selectedItem.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. +500 or -200"
                  value={quantityDelta || ""}
                  onChange={(e) => setQuantityDelta(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Current stock: {selectedItem.quantity} {selectedItem.unit}. Positive values add stock, negative deduct.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Adjustment Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning milk delivery batch #204"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                  className="border-gray-300 text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={adjusting || quantityDelta === 0 || !reason}
                >
                  {adjusting ? "Recording..." : "Save Adjustment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
