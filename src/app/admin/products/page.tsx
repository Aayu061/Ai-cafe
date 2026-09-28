"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  Coffee,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCw,
  Plus,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductItem {
  id: string;
  name: string;
  category: string;
  categoryLabel?: string;
  basePrice: number;
  calories: number;
  temperature: string;
  available: boolean;
  tasteNotes: string[];
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5001/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.warn("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    setTogglingId(productId);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:5001/api/admin/products/${productId}/availability`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ available: !currentStatus }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, available: !currentStatus } : p))
        );
        setMessage(`Updated ${productId} availability to ${!currentStatus ? "Available" : "Disabled"}`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to toggle product availability:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Catalog & Product Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Authoritative menu items, base pricing in ₹ (INR), and customer availability toggles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProducts()}
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

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-caramel bg-gray-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50 text-gray-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading catalog items...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            Products will appear here once added.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Calories</th>
                  <th className="py-3 px-4">Temperature</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-caramel/10 text-caramel flex items-center justify-center shrink-0">
                        <Coffee className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div>{product.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{product.id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium capitalize">
                      {product.categoryLabel || product.category}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      ₹{product.basePrice}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono">
                      {product.calories} kcal
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {product.temperature}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {product.available ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Available</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
                          <XCircle className="w-3 h-3" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={product.available ? "outline" : "primary"}
                        size="sm"
                        className="h-7 text-[11px] px-2.5"
                        disabled={togglingId === product.id}
                        onClick={() => handleToggleAvailability(product.id, product.available)}
                      >
                        {product.available ? "Disable" : "Enable"}
                      </Button>
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
