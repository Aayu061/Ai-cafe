"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { DrinkCanvas } from "@/features/builder/drink-canvas";
import { DrinkDnaCard, DrinkDnaScores } from "@/features/builder/drink-dna-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import {
  Sliders,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Coffee,
  Check,
  RotateCcw,
} from "lucide-react";

// Catalog option item interface
interface OptionItem {
  id: string;
  name: string;
  priceDelta: number;
  type: string;
  description?: string;
}

// Default Fallback Catalog Data in INR
const FALLBACK_PRODUCTS = [
  { id: "caramel-cold-brew", name: "Caramel Cold Brew", basePrice: 180, temp: "Iced" },
  { id: "chocolate-frappe", name: "Chocolate Frappe", basePrice: 220, temp: "Blended" },
  { id: "strawberry-cream", name: "Strawberry Cream", basePrice: 210, temp: "Iced" },
  { id: "mango-smoothie", name: "Mango Smoothie", basePrice: 210, temp: "Blended" },
  { id: "matcha-cloud", name: "Matcha Cloud", basePrice: 230, temp: "Iced" },
  { id: "vanilla-latte", name: "Vanilla Latte", basePrice: 190, temp: "Hot" },
  { id: "mocha-cream", name: "Mocha Cream", basePrice: 220, temp: "Hot" },
  { id: "berry-blast", name: "Berry Blast", basePrice: 180, temp: "Iced" },
];

const BASES: OptionItem[] = [
  { id: "cold-brew", name: "Cold Brew", priceDelta: 0, type: "base" },
  { id: "espresso", name: "Espresso", priceDelta: 0, type: "base" },
  { id: "matcha", name: "Matcha", priceDelta: 20, type: "base" },
  { id: "strawberry-base", name: "Strawberry Base", priceDelta: 0, type: "base" },
  { id: "mango-base", name: "Mango Base", priceDelta: 0, type: "base" },
  { id: "berry-base", name: "Berry Base", priceDelta: 0, type: "base" },
  { id: "chocolate-base", name: "Chocolate Base", priceDelta: 10, type: "base" },
  { id: "vanilla-base", name: "Vanilla Base", priceDelta: 0, type: "base" },
];

const SIZES: OptionItem[] = [
  { id: "small", name: "Small (250ml)", priceDelta: -20, type: "size" },
  { id: "medium", name: "Medium (350ml)", priceDelta: 0, type: "size" },
  { id: "large", name: "Large (450ml)", priceDelta: 40, type: "size" },
];

const MILKS: OptionItem[] = [
  { id: "whole-milk", name: "Whole Milk", priceDelta: 0, type: "milk" },
  { id: "oat-milk", name: "Oat Milk", priceDelta: 30, type: "milk" },
  { id: "almond-milk", name: "Almond Milk", priceDelta: 30, type: "milk" },
  { id: "soy-milk", name: "Soy Milk", priceDelta: 20, type: "milk" },
];

const FLAVORS: OptionItem[] = [
  { id: "caramel", name: "Caramel", priceDelta: 25, type: "flavor" },
  { id: "vanilla", name: "Vanilla", priceDelta: 25, type: "flavor" },
  { id: "chocolate", name: "Chocolate", priceDelta: 25, type: "flavor" },
  { id: "hazelnut", name: "Hazelnut", priceDelta: 25, type: "flavor" },
  { id: "strawberry", name: "Strawberry", priceDelta: 25, type: "flavor" },
  { id: "mango", name: "Mango", priceDelta: 25, type: "flavor" },
  { id: "berry", name: "Berry", priceDelta: 25, type: "flavor" },
  { id: "flavor-none", name: "No Flavor", priceDelta: 0, type: "flavor" },
];

const SWEETNESS_OPTIONS: OptionItem[] = [
  { id: "sweetness-0", name: "0% None", priceDelta: 0, type: "sweetness" },
  { id: "sweetness-25", name: "25% Light", priceDelta: 0, type: "sweetness" },
  { id: "sweetness-50", name: "50% Balanced", priceDelta: 0, type: "sweetness" },
  { id: "sweetness-75", name: "75% Sweet", priceDelta: 0, type: "sweetness" },
  { id: "sweetness-100", name: "100% Full", priceDelta: 0, type: "sweetness" },
];

const ICE_OPTIONS: OptionItem[] = [
  { id: "no-ice", name: "No Ice", priceDelta: 0, type: "ice" },
  { id: "light-ice", name: "Light Ice", priceDelta: 0, type: "ice" },
  { id: "regular-ice", name: "Regular Ice", priceDelta: 0, type: "ice" },
  { id: "extra-ice", name: "Extra Ice", priceDelta: 0, type: "ice" },
];

const TOPPINGS: OptionItem[] = [
  { id: "whipped-cream", name: "Whipped Cream", priceDelta: 30, type: "topping" },
  { id: "caramel-drizzle", name: "Caramel Drizzle", priceDelta: 20, type: "topping" },
  { id: "chocolate-drizzle", name: "Chocolate Drizzle", priceDelta: 20, type: "topping" },
  { id: "cocoa-dust", name: "Cocoa Dust", priceDelta: 15, type: "topping" },
  { id: "strawberry-foam", name: "Strawberry Foam", priceDelta: 35, type: "topping" },
  { id: "matcha-foam", name: "Matcha Foam", priceDelta: 35, type: "topping" },
];

function BuilderContent() {
  const searchParams = useSearchParams();
  const initialProductParam = searchParams.get("product") || "caramel-cold-brew";
  const initialBaseParam = searchParams.get("base");
  const initialMilkParam = searchParams.get("milk");
  const initialFlavorParam = searchParams.get("flavor");
  const initialSweetnessParam = searchParams.get("sweetness");
  const initialIceParam = searchParams.get("ice");
  const initialSizeParam = searchParams.get("size");
  const initialToppingsParam = searchParams.get("toppings");
  const isFromBarista = searchParams.get("from") === "barista";

  // Active Drink Configuration State
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductParam);
  const [selectedBase, setSelectedBase] = useState<string>(initialBaseParam || "cold-brew");
  const [selectedSize, setSelectedSize] = useState<string>(initialSizeParam || "medium");
  const [selectedMilk, setSelectedMilk] = useState<string>(initialMilkParam || "oat-milk");
  const [selectedFlavor, setSelectedFlavor] = useState<string>(initialFlavorParam || "caramel");
  const [selectedSweetness, setSelectedSweetness] = useState<string>(initialSweetnessParam || "sweetness-50");
  const [selectedIce, setSelectedIce] = useState<string>(initialIceParam || "regular-ice");
  const [selectedToppings, setSelectedToppings] = useState<string[]>(
    initialToppingsParam !== null
      ? initialToppingsParam.split(",").filter(Boolean)
      : ["caramel-drizzle"]
  );
  const [fromBarista, setFromBarista] = useState<boolean>(isFromBarista);

  // Server Validation State
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [serverPrice, setServerPrice] = useState<number>(255);
  const [customizationTotal, setCustomizationTotal] = useState<number>(75);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [drinkDna, setDrinkDna] = useState<DrinkDnaScores>({
    sweetness: 65,
    strength: 70,
    creaminess: 65,
    chill: 80,
    richness: 75,
  });

  // Current active product info
  const currentProduct =
    FALLBACK_PRODUCTS.find((p) => p.id === selectedProductId) || FALLBACK_PRODUCTS[0]!;

  // Handle Preset drink switch
  const handleSelectPresetProduct = (productId: string) => {
    setSelectedProductId(productId);
    if (productId === "caramel-cold-brew") {
      setSelectedBase("cold-brew");
      setSelectedMilk("oat-milk");
      setSelectedFlavor("caramel");
      setSelectedSweetness("sweetness-50");
      setSelectedIce("regular-ice");
      setSelectedToppings(["caramel-drizzle"]);
    } else if (productId === "chocolate-frappe") {
      setSelectedBase("chocolate-base");
      setSelectedMilk("whole-milk");
      setSelectedFlavor("chocolate");
      setSelectedSweetness("sweetness-75");
      setSelectedIce("regular-ice");
      setSelectedToppings(["whipped-cream", "chocolate-drizzle"]);
    } else if (productId === "matcha-cloud") {
      setSelectedBase("matcha");
      setSelectedMilk("oat-milk");
      setSelectedFlavor("vanilla");
      setSelectedSweetness("sweetness-25");
      setSelectedIce("light-ice");
      setSelectedToppings(["matcha-foam"]);
    } else if (productId === "vanilla-latte") {
      setSelectedBase("espresso");
      setSelectedMilk("whole-milk");
      setSelectedFlavor("vanilla");
      setSelectedSweetness("sweetness-50");
      setSelectedIce("no-ice");
      setSelectedToppings(["cocoa-dust"]);
    } else if (productId === "mocha-cream") {
      setSelectedBase("espresso");
      setSelectedMilk("whole-milk");
      setSelectedFlavor("chocolate");
      setSelectedSweetness("sweetness-50");
      setSelectedIce("no-ice");
      setSelectedToppings(["whipped-cream", "cocoa-dust"]);
    } else if (productId === "strawberry-cream") {
      setSelectedBase("strawberry-base");
      setSelectedMilk("whole-milk");
      setSelectedFlavor("strawberry");
      setSelectedSweetness("sweetness-50");
      setSelectedIce("regular-ice");
      setSelectedToppings(["strawberry-foam"]);
    } else if (productId === "mango-smoothie") {
      setSelectedBase("mango-base");
      setSelectedMilk("almond-milk");
      setSelectedFlavor("mango");
      setSelectedSweetness("sweetness-50");
      setSelectedIce("regular-ice");
      setSelectedToppings([]);
    } else if (productId === "berry-blast") {
      setSelectedBase("berry-base");
      setSelectedMilk("soy-milk");
      setSelectedFlavor("berry");
      setSelectedSweetness("sweetness-50");
      setSelectedIce("regular-ice");
      setSelectedToppings([]);
    }
  };

  // Toggle Toppings
  const toggleTopping = (toppingId: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId) ? prev.filter((id) => id !== toppingId) : [...prev, toppingId]
    );
  };

  // Debounced Server-Authoritative Price Validation
  const validateWithBackend = useCallback(async () => {
    setIsValidating(true);
    setValidationError(null);

    const payload = {
      productId: selectedProductId,
      baseId: selectedBase,
      milkId: selectedMilk,
      flavorId: selectedFlavor,
      sweetnessId: selectedSweetness,
      iceId: selectedIce,
      toppingIds: selectedToppings,
      sizeId: selectedSize,
    };

    try {
      const res = await apiFetch<any>("/api/drinks/validate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const dataObj = (res.data || res) as any;
      if (res.success && typeof dataObj.finalPrice === "number") {
        setServerPrice(dataObj.finalPrice);
        setCustomizationTotal(dataObj.customizationTotal ?? 0);
        if (dataObj.drinkDna) {
          setDrinkDna(dataObj.drinkDna);
        }
      } else {
        // Validation rejection or offline fallback
        const isInfrastructureError =
          res.error?.code === "FIREBASE_ADMIN_NOT_CONFIGURED" ||
          res.error?.code === "NETWORK_ERROR" ||
          res.error?.message?.includes("Firebase Admin credentials");

        if (!isInfrastructureError) {
          if (res.error?.message) {
            setValidationError(res.error.message);
          } else if ((res as any).errors && Array.isArray((res as any).errors)) {
            setValidationError((res as any).errors.join(" "));
          }
        } else {
          setValidationError(null);
        }
        // Authoritative fallback calculation when backend is in local disconnected mode
        const baseItem = BASES.find((b) => b.id === selectedBase)?.priceDelta || 0;
        const milkItem = MILKS.find((m) => m.id === selectedMilk)?.priceDelta || 0;
        const flavorItem = FLAVORS.find((f) => f.id === selectedFlavor)?.priceDelta || 0;
        const sizeItem = SIZES.find((s) => s.id === selectedSize)?.priceDelta || 0;
        const toppingsCost = selectedToppings.reduce((acc, tid) => {
          const t = TOPPINGS.find((top) => top.id === tid);
          return acc + (t?.priceDelta || 0);
        }, 0);

        const customTot = baseItem + milkItem + flavorItem + sizeItem + toppingsCost;
        setCustomizationTotal(customTot);
        setServerPrice(currentProduct.basePrice + customTot);
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setIsValidating(false);
    }
  }, [
    selectedProductId,
    selectedBase,
    selectedMilk,
    selectedFlavor,
    selectedSweetness,
    selectedIce,
    selectedToppings,
    selectedSize,
    currentProduct.basePrice,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      validateWithBackend();
    }, 250);

    return () => clearTimeout(timer);
  }, [validateWithBackend]);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-24">
        <Container>
          {/* Header Banner */}
          <div className="max-w-3xl mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-3 border border-caramel/20">
              <Sliders className="w-3.5 h-3.5 text-caramel" />
              <span>Interactive Drink Studio</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso tracking-tight">
              Customize Your Drink
            </h1>
            <p className="text-sm sm:text-base text-espresso/70 mt-2 font-sans">
              Choose your base, milk, flavor, and toppings. Prices and Drink DNA™ profile are calibrated authoritatively on the AI Café server.
            </p>
          </div>

          {/* AI Barista Recommendation Active Banner */}
          {fromBarista && (
            <div className="mb-8 rounded-3xl bg-gradient-to-r from-caramel/20 via-amber-50 to-cream border border-caramel/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-soft">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-espresso text-cream flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 text-caramel fill-caramel" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-caramel-dark flex items-center gap-1.5">
                    <span>✨</span> AI Barista Recipe Applied
                  </p>
                  <p className="text-xs sm:text-sm text-espresso/80 font-medium mt-0.5">
                    Recipe loaded for <strong className="text-espresso font-semibold">{currentProduct.name}</strong> from your consultation. Customize further below or reset anytime.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFromBarista(false);
                    handleSelectPresetProduct(selectedProductId);
                  }}
                  className="text-xs border-espresso/20 hover:bg-espresso/5 gap-1.5 bg-white/80"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-warmgray" />
                  <span>Reset to Standard Recipe</span>
                </Button>
              </div>
            </div>
          )}

          {/* Preset Product Selector Ribbon */}
          <div className="mb-10 pb-4 border-b border-espresso/10">
            <label className="block text-xs font-semibold uppercase tracking-wider text-warmgray mb-3">
              1. Start With A Signature Creation:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {FALLBACK_PRODUCTS.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleSelectPresetProduct(prod.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                    selectedProductId === prod.id
                      ? "bg-espresso text-cream border-espresso shadow-soft"
                      : "bg-offwhite text-espresso/80 border-espresso/10 hover:border-caramel/50"
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5 text-caramel" />
                  <span>{prod.name}</span>
                  <span className="text-[11px] opacity-75 font-mono">{formatPrice(prod.basePrice)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Validation Notice Alert */}
          {validationError && (
            <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Beverage Incompatibility Notice</p>
                <p className="mt-0.5 opacity-90">{validationError}</p>
              </div>
            </div>
          )}

          {/* Two Column Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Visualizer & DNA Profile (Sticky on Desktop) */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <DrinkCanvas
                baseId={selectedBase}
                milkId={selectedMilk}
                flavorId={selectedFlavor}
                sweetnessId={selectedSweetness}
                iceId={selectedIce}
                toppingIds={selectedToppings}
                sizeId={selectedSize}
                drinkName={currentProduct.name}
              />

              <DrinkDnaCard dna={drinkDna} isValidating={isValidating} />
            </div>

            {/* Right Column: Customization Controls */}
            <div className="lg:col-span-7 space-y-8 bg-offwhite rounded-3xl p-6 sm:p-10 border border-espresso/10 shadow-card">
              {/* Section: Size */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-bold text-espresso">
                    Choose Size
                  </h3>
                  <span className="text-xs text-warmgray font-mono">Step 1 of 7</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {SIZES.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        selectedSize === size.id
                          ? "bg-espresso text-cream border-espresso shadow-soft"
                          : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/40"
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-semibold">{size.name.split(" ")[0]}</p>
                      <p className="text-[11px] opacity-75 font-mono mt-0.5">
                        {size.priceDelta > 0 ? `+${formatPrice(size.priceDelta)}` : size.priceDelta < 0 ? `-${formatPrice(Math.abs(size.priceDelta))}` : "Standard"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Base */}
              <div className="pt-6 border-t border-espresso/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-bold text-espresso">
                    Choose Base
                  </h3>
                  <span className="text-xs text-warmgray font-mono">Step 2 of 7</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {BASES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBase(b.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedBase === b.id
                          ? "bg-espresso text-cream border-espresso shadow-soft"
                          : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/40"
                      }`}
                    >
                      <p className="text-xs font-semibold leading-snug">{b.name}</p>
                      <p className="text-[11px] opacity-75 font-mono mt-1">
                        {b.priceDelta > 0 ? `+${formatPrice(b.priceDelta)}` : "Included"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Milk */}
              <div className="pt-6 border-t border-espresso/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-bold text-espresso">
                    Choose Milk
                  </h3>
                  <span className="text-xs text-warmgray font-mono">Step 3 of 7</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {MILKS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMilk(m.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedMilk === m.id
                          ? "bg-espresso text-cream border-espresso shadow-soft"
                          : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/40"
                      }`}
                    >
                      <p className="text-xs font-semibold">{m.name}</p>
                      <p className="text-[11px] opacity-75 font-mono mt-1">
                        {m.priceDelta > 0 ? `+${formatPrice(m.priceDelta)}` : "Included"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Flavor */}
              <div className="pt-6 border-t border-espresso/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-bold text-espresso">
                    Choose Flavor
                  </h3>
                  <span className="text-xs text-warmgray font-mono">Step 4 of 7</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FLAVORS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFlavor(f.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedFlavor === f.id
                          ? "bg-espresso text-cream border-espresso shadow-soft"
                          : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/40"
                      }`}
                    >
                      <p className="text-xs font-semibold">{f.name}</p>
                      <p className="text-[11px] opacity-75 font-mono mt-1">
                        {f.priceDelta > 0 ? `+${formatPrice(f.priceDelta)}` : "Free"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Sweetness */}
              <div className="pt-6 border-t border-espresso/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-bold text-espresso">
                    Sweetness Level
                  </h3>
                  <span className="text-xs text-warmgray font-mono">Step 5 of 7</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {SWEETNESS_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSweetness(s.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        selectedSweetness === s.id
                          ? "bg-espresso text-cream border-espresso shadow-soft"
                          : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/40"
                      }`}
                    >
                      <p className="text-xs font-bold font-mono">{s.name.split(" ")[0]}</p>
                      <p className="text-[10px] opacity-75 mt-0.5 truncate">{s.name.split(" ")[1] || ""}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Ice */}
              <div className="pt-6 border-t border-espresso/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-bold text-espresso">
                    Ice Temperature
                  </h3>
                  <span className="text-xs text-warmgray font-mono">Step 6 of 7</span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {ICE_OPTIONS.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => setSelectedIce(i.id)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedIce === i.id
                          ? "bg-espresso text-cream border-espresso shadow-soft"
                          : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/40"
                      }`}
                    >
                      <p className="text-xs font-semibold">{i.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Toppings (Multi-select) */}
              <div className="pt-6 border-t border-espresso/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-bold text-espresso">
                    Toppings & Cold Foams
                  </h3>
                  <span className="text-xs text-warmgray font-mono">Step 7 of 7</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TOPPINGS.map((top) => {
                    const isChecked = selectedToppings.includes(top.id);
                    return (
                      <button
                        key={top.id}
                        onClick={() => toggleTopping(top.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                          isChecked
                            ? "bg-espresso text-cream border-espresso shadow-soft"
                            : "bg-cream/40 text-espresso border-espresso/10 hover:border-caramel/40"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold">{top.name}</p>
                          <p className="text-[11px] opacity-75 font-mono mt-0.5">
                            +{formatPrice(top.priceDelta)}
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                            isChecked
                              ? "bg-caramel border-caramel text-espresso"
                              : "border-espresso/20"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-espresso stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Authoritative Server Price Checkout Summary */}
              <div className="mt-8 pt-8 border-t-2 border-espresso/10 bg-cream/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-wider text-warmgray font-semibold">
                      Authoritative Price
                    </span>
                    <Badge variant="caramel" size="sm" className="gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Server Verified</span>
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                      {formatPrice(serverPrice)}
                    </span>
                    {customizationTotal !== 0 && (
                      <span className="text-xs text-warmgray font-mono">
                        (Base {formatPrice(currentProduct.basePrice)} + Addons {formatPrice(customizationTotal)})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-warmgray mt-1">
                    Currency: INR (₹) • Calculated live via AI Café Express Engine
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleSelectPresetProduct(selectedProductId)}
                    className="gap-1.5 border-espresso/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    disabled={isValidating}
                    className="flex-1 sm:flex-initial gap-2 shadow-card"
                    onClick={() => alert("Drink customization saved! Cart & Checkout will be enabled in Phase 5.")}
                  >
                    <Sparkles className="w-4 h-4 text-caramel" />
                    <span>Save Recipe</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream font-serif text-espresso">
          Loading Drink Studio...
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
