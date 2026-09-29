"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { recommendDrink } from "@/lib/api-client";
import {
  BaristaConversationMessage,
  BaristaPreferences,
  BaristaComparisonItem,
  BaristaPairingItem,
  BaristaProductSummary,
  BaristaCatalogProduct,
  CafeMomentCombo,
  BaristaMoodContext,
} from "@/types/barista";
import { RecommendationCard } from "./recommendation-card";
import { BaristaPrompts } from "./barista-prompts";
import {
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  AlertCircle,
  Coffee,
  Info,
  Scale,
  Utensils,
  ArrowRight,
  Compass,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const INITIAL_GREETING: BaristaConversationMessage = {
  role: "assistant",
  mode: "GREETING",
  content:
    "Hello! I am your AI Café Concierge. Whether you're craving something bold, refreshing, within a specific budget, or curious about what pairs with your coffee, I'm here to guide you through our actual menu.",
  timestamp: Date.now(),
};

export function BaristaChat() {
  const searchParams = useSearchParams();
  const initialPromptParam = searchParams.get("prompt") || "";

  const [messages, setMessages] = useState<BaristaConversationMessage[]>([
    INITIAL_GREETING,
  ]);
  const [inputValue, setInputValue] = useState(initialPromptParam);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Multi-turn Preference Accumulation, Repetition Tracking & Active Context
  const [currentPreferences, setCurrentPreferences] = useState<BaristaPreferences>({});
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);
  const [activeProductId, setActiveProductId] = useState<string | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle auto-send if prompted from home teaser
  useEffect(() => {
    if (initialPromptParam && messages.length === 1) {
      handleSend(initialPromptParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPromptParam]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || inputValue).trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    setIsRateLimited(false);
    setInputValue("");

    const userMessage: BaristaConversationMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    // Realistic concierge status messages based on query context
    const lower = text.toLowerCase();
    if (lower.includes("budget") || lower.includes("price") || lower.includes("expensive") || lower.includes("cheapest") || /\d+/.test(lower)) {
      setLoadingStep("Checking what works within your budget & menu pricing...");
    } else if (lower.includes("snack") || lower.includes("food") || lower.includes("pairing") || lower.includes("eat")) {
      setLoadingStep("Let me find a good pairing from our kitchen...");
    } else if (lower.includes("available") || lower.includes("menu")) {
      setLoadingStep("Looking through today's menu...");
    } else {
      setLoadingStep("Let me find something that fits...");
    }

    try {
      // Build conversation context for server (last 4 turns)
      const contextTurns = newHistory
        .filter((m) => m !== INITIAL_GREETING)
        .slice(-4)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Phase 7.2 Grounded API call with active context and cumulative preferences
      const res = await recommendDrink(
        text,
        contextTurns,
        currentPreferences,
        recentProductIds,
        activeProductId
      );

      if (res.error) {
        if (res.error.code === "RATE_LIMITED") {
          setIsRateLimited(true);
          setErrorMsg(
            res.error.message ||
              "You have submitted multiple requests. Please wait a moment before asking again."
          );
        } else if (res.error.code === "AI_BARISTA_NOT_CONFIGURED") {
          setErrorMsg(
            "The AI Barista is currently in offline configuration mode. Ensure AI_API_KEY is set or AI_PROVIDER=mock is active on the server."
          );
        } else {
          setErrorMsg(res.error.message || "Failed to receive recommendation.");
        }
        setIsLoading(false);
        return;
      }

      // Update multi-turn cumulative preferences
      if (res.preferences) {
        setCurrentPreferences((prev) => ({ ...prev, ...res.preferences }));
      }

      // Update active product reference
      if (res.activeProductId) {
        setActiveProductId(res.activeProductId);
      } else if (res.recommendations && res.recommendations.length > 0) {
        setActiveProductId(res.recommendations[0].product.id);
      }

      // Update recent product IDs to avoid repetitive recommendations
      if (res.recommendations && res.recommendations.length > 0) {
        const newIds = res.recommendations.map((r) => r.product.id);
        setRecentProductIds((prev) => [...new Set([...prev, ...newIds])].slice(-8));
      }

      const assistantMessage: BaristaConversationMessage = {
        role: "assistant",
        content:
          res.message ||
          "Here is what our café concierge crafted for you from our menu:",
        mode: res.mode,
        intent: res.intent,
        recommendations: res.recommendations || [],
        catalogProducts: res.catalogProducts,
        comparison: res.comparison,
        productDetails: res.productDetails,
        pairings: res.pairings,
        cafeMoment: res.cafeMoment,
        preferences: res.preferences,
        moodContext: res.moodContext,
        budget: res.budget,
        totalPrice: res.totalPrice,
        followUpSuggestion: res.followUpSuggestion,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      setErrorMsg(
        (err as Error).message ||
          "Could not reach AI Barista. Please check your internet connection."
      );
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_GREETING]);
    setCurrentPreferences({});
    setRecentProductIds([]);
    setActiveProductId(undefined);
    setErrorMsg(null);
    setIsRateLimited(false);
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Console Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-espresso/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-caramel/15 text-caramel-dark text-xs font-semibold tracking-wider uppercase mb-2 border border-caramel/20">
            <Sparkles className="w-3.5 h-3.5 text-caramel" />
            <span>Café Concierge Intelligence V7.2</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso tracking-tight">
            Consult Your AI Barista
          </h1>
          <p className="text-sm text-espresso/70 mt-1">
            A knowledgeable café concierge who understands cravings, our real menu, pairings, and budgets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2 text-xs border-espresso/15 hover:bg-espresso/5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-warmgray" />
            <span>New Consultation</span>
          </Button>
        </div>
      </div>

      {/* Messages Feed Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 min-h-[420px]">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";

          if (isUser) {
            return (
              <div key={idx} className="flex justify-end">
                <div className="max-w-xl bg-espresso text-cream rounded-3xl rounded-tr-sm px-5 py-4 shadow-soft">
                  <p className="text-sm sm:text-base leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          }

          // Assistant Response
          return (
            <div key={idx} className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 rounded-full bg-espresso text-cream flex items-center justify-center shrink-0 mt-1 shadow-soft">
                <Sparkles className="w-4 h-4 text-caramel" />
              </div>

              <div className="flex-1 space-y-4">
                {/* Assistant Chat Bubble */}
                <div className="max-w-2xl bg-white rounded-3xl rounded-tl-sm p-5 border border-espresso/10 shadow-soft text-espresso">
                  {/* Mode / Intent Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {msg.mode && msg.mode !== "RECOMMENDATION" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAE2D2] text-[#3A2418] text-[10px] font-semibold tracking-wider uppercase">
                        <Compass className="w-3 h-3 text-[#C98A4A]" />
                        <span>Mode: {msg.mode.replace("_", " ")}</span>
                      </span>
                    )}
                    {msg.moodContext && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold tracking-wider uppercase">
                        <Zap className="w-3 h-3 text-amber-700" />
                        <span>Mood: {msg.moodContext}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed mb-2">{msg.content}</p>

                  {/* Extracted Sensory Preferences Badges */}
                  {msg.preferences && Object.keys(msg.preferences).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-espresso/5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-warmgray mr-1">
                        Active Taste Profile:
                      </span>
                      {msg.preferences.temperature && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 capitalize">
                          ❄️ {msg.preferences.temperature}
                        </span>
                      )}
                      {typeof msg.preferences.sweetness === "number" && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          🍬 Sweetness: {msg.preferences.sweetness}%
                        </span>
                      )}
                      {typeof msg.preferences.strength === "number" && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-900 border border-orange-200">
                          ⚡ Boldness: {msg.preferences.strength}%
                        </span>
                      )}
                      {msg.preferences.flavor && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-caramel/10 text-caramel-dark border border-caramel/20 capitalize">
                          🍯 {msg.preferences.flavor}
                        </span>
                      )}
                      {msg.preferences.milk && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200 capitalize">
                          🥛 {msg.preferences.milk.replace("-", " ")}
                        </span>
                      )}
                      {typeof msg.preferences.budget === "number" && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ₹ Under ₹{msg.preferences.budget}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 1. CATALOG_QUERY: Show authentic catalog product cards without forcing custom creation cards */}
                {msg.mode === "CATALOG_QUERY" && msg.catalogProducts && msg.catalogProducts.length > 0 && (
                  <CatalogQueryBlock products={msg.catalogProducts} />
                )}

                {/* 2. BUDGET_COMBO: Complete My Café Moment (Drink + Snack <= Budget) */}
                {msg.mode === "BUDGET_COMBO" && msg.cafeMoment && (
                  <CafeMomentBlock combo={msg.cafeMoment} />
                )}

                {/* 3. COMPARISON BLOCK */}
                {msg.comparison && (
                  <ComparisonBlock comparison={msg.comparison} />
                )}

                {/* 4. FOOD PAIRINGS BLOCK */}
                {msg.pairings && msg.pairings.length > 0 && msg.mode !== "BUDGET_COMBO" && (
                  <PairingsBlock pairings={msg.pairings} />
                )}

                {/* 5. PRODUCT DETAILS BLOCK */}
                {msg.productDetails && (
                  <ProductDetailsBlock product={msg.productDetails} />
                )}

                {/* 6. Standard Grounded Drink Recommendations Grid (for RECOMMENDATION & CUSTOMIZATION modes) */}
                {msg.recommendations &&
                  msg.recommendations.length > 0 &&
                  msg.mode !== "CATALOG_QUERY" &&
                  msg.mode !== "BUDGET_COMBO" &&
                  !msg.comparison &&
                  !msg.productDetails && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-espresso/80">
                        <Coffee className="w-4 h-4 text-caramel" />
                        <span>
                          {msg.mode === "CUSTOMIZATION"
                            ? "Customized Recipe for You"
                            : `Recommended Creations (${msg.recommendations.length})`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.recommendations.map((rec, rIdx) => (
                          <RecommendationCard
                            key={`${rec.product.id}-${rIdx}`}
                            recommendation={rec}
                            rankIndex={rIdx}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Follow-up Inquiry Chip */}
                {msg.followUpSuggestion && (
                  <div className="bg-cream/60 rounded-2xl p-4 border border-espresso/10 flex items-start gap-3">
                    <Info className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-espresso">
                        Barista Inquiry:
                      </p>
                      <p className="text-xs sm:text-sm text-espresso/80 mt-0.5">
                        {msg.followUpSuggestion}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner with Dynamic Concierge Step */}
        {isLoading && (
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 rounded-full bg-espresso text-cream flex items-center justify-center shrink-0 mt-1 shadow-soft">
              <Loader2 className="w-4 h-4 text-caramel animate-spin" />
            </div>

            <div className="bg-white/80 rounded-3xl rounded-tl-sm px-5 py-4 border border-espresso/10 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-caramel animate-ping" />
                <span className="text-sm font-medium text-espresso/80">
                  {loadingStep || "Consulting the menu..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-semibold">{isRateLimited ? "Rate Limited" : "Consultation Notice"}</p>
              <p className="mt-0.5 text-red-800/90 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="pt-2 pb-4 border-t border-espresso/10">
        <BaristaPrompts onSelect={(prompt) => handleSend(prompt)} disabled={isLoading} />
      </div>

      {/* Input Composer */}
      <div className="relative pt-2">
        <form
          action="#"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSend();
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="barista-drink-input"
              name="baristaDrinkInput"
              type="text"
              aria-label="Ask your AI Barista Concierge"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything (e.g. 'which coffee costs the most?', 'coffee & snack under ₹300', 'make it strong')..."
              disabled={isLoading}
              maxLength={500}
              className="w-full pl-5 pr-14 py-3.5 sm:py-4 rounded-full bg-white border border-espresso/15 text-sm text-espresso placeholder:text-warmgray focus:outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/20 shadow-soft disabled:opacity-60 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-mono text-warmgray hidden sm:block">
              {inputValue.length}/500
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            aria-label="Send message to AI Barista"
            onClick={(e) => {
              e.preventDefault();
              handleSend();
            }}
            disabled={!inputValue.trim() || isLoading}
            className="rounded-full px-5 py-3.5 sm:py-4 shrink-0 shadow-soft"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-cream" />
            ) : (
              <Send className="w-4 h-4 text-cream" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * Phase 7.2: Actual Catalog Product Query Cards
 */
function CatalogQueryBlock({ products }: { products: BaristaCatalogProduct[] }) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-espresso/80">
        <Coffee className="w-4 h-4 text-caramel" />
        <span>Authentic Café Menu Items ({products.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="p-4 rounded-2xl bg-white border border-espresso/10 shadow-soft flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-caramel px-2 py-0.5 rounded-full bg-caramel/10">
                  {p.categoryLabel}
                </span>
                <span className="text-sm font-bold text-espresso">
                  ₹{p.basePrice}
                </span>
              </div>
              <h4 className="font-serif text-base font-bold text-espresso mt-1.5">
                {p.name}
              </h4>
              <p className="text-xs text-espresso/70 mt-1 line-clamp-2">
                {p.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-espresso/70 border border-espresso/5">
                  {p.temperatureProfile}
                </span>
                {p.tasteNotes.slice(0, 2).map((n, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-espresso/70 border border-espresso/5"
                  >
                    🌿 {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-espresso/5 flex items-center justify-between">
              <span className={`text-[11px] font-medium ${p.available ? "text-emerald-700 flex items-center gap-1" : "text-amber-700"}`}>
                {p.available ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>In Stock</span>
                  </>
                ) : (
                  <span>Limited Batch</span>
                )}
              </span>
              <Link
                href={`/builder?preset=${p.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-caramel hover:text-caramel-dark transition-colors"
              >
                <span>Customize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Phase 7.2: Complete My Café Moment (Budget Combo) Block
 */
function CafeMomentBlock({ combo }: { combo: CafeMomentCombo }) {
  return (
    <div className="bg-gradient-to-br from-cream/90 to-white rounded-3xl p-6 border border-espresso/15 shadow-soft space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-espresso/10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-caramel-dark">
          <Utensils className="w-4 h-4 text-caramel" />
          <span>Complete Your Café Moment</span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-espresso/60 block">Combo Total</span>
          <span className="text-base font-bold text-espresso">₹{combo.totalPrice}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Drink */}
        <div className="p-4 rounded-2xl bg-white/90 border border-espresso/10 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-caramel px-2 py-0.5 rounded-full bg-caramel/10">
              {combo.drink.categoryLabel}
            </span>
            <h5 className="font-serif font-bold text-base text-espresso mt-1.5">
              {combo.drink.name}
            </h5>
            <div className="text-xs font-semibold text-espresso/80 mt-1">
              ₹{combo.drink.price}
            </div>
          </div>
          <Link
            href={`/builder?preset=${combo.drink.id}`}
            className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-espresso text-cream text-xs font-medium hover:bg-espresso/90 transition-colors"
          >
            <span>Customize Drink</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Snack */}
        <div className="p-4 rounded-2xl bg-white/90 border border-espresso/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-warmgray px-2 py-0.5 rounded-full bg-espresso/5">
                {combo.snack.category}
              </span>
              <span className="text-xs font-bold text-espresso">
                ₹{combo.snack.price}
              </span>
            </div>
            <h5 className="font-serif font-bold text-base text-espresso mt-1.5">
              {combo.snack.name}
            </h5>
            <p className="text-xs text-espresso/70 mt-1 leading-relaxed">
              {combo.snack.description}
            </p>
          </div>
          <div className="mt-3 text-[10px] text-espresso/80 italic pt-2 border-t border-espresso/5">
            ✨ {combo.snack.whyItWorks}
          </div>
        </div>
      </div>

      {combo.dessert && (
        <div className="p-3.5 rounded-2xl bg-white/60 border border-espresso/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-caramel uppercase tracking-wider">
              Optional Sweet Addition: {combo.dessert.name}
            </span>
            <p className="text-xs text-espresso/70 mt-0.5">{combo.dessert.whyItWorks}</p>
          </div>
          <span className="text-xs font-bold text-espresso">+₹{combo.dessert.price}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Phase 6/7: Side-by-side Product Comparison Block
 */
function ComparisonBlock({ comparison }: { comparison: BaristaComparisonItem }) {
  const { productA, productB, highlights, priceDifference } = comparison;

  return (
    <div className="bg-white rounded-3xl p-6 border border-espresso/10 shadow-soft space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-espresso/10">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-caramel-dark">
          <Scale className="w-4 h-4 text-caramel" />
          <span>Side-by-Side Comparison</span>
        </div>
        {priceDifference > 0 && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-medium">
            ₹{priceDifference} Price Difference
          </span>
        )}
      </div>

      {/* Two Column Product Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Product A */}
        <div className="p-4 rounded-2xl bg-cream/40 border border-espresso/5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-caramel uppercase tracking-wider">
              {productA.categoryLabel}
            </span>
            <h4 className="font-serif text-lg font-bold text-espresso mt-0.5">
              {productA.name}
            </h4>
            <p className="text-xs text-espresso/70 mt-1 line-clamp-2">
              {productA.description}
            </p>
            <div className="mt-3 text-sm font-bold text-espresso">
              ₹{productA.basePrice}
            </div>
          </div>
          <Link
            href={`/builder?preset=${productA.id}`}
            className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-espresso text-cream text-xs font-medium hover:bg-espresso/90 transition-colors"
          >
            <span>Customize {productA.name.split(" ")[0]}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Product B */}
        <div className="p-4 rounded-2xl bg-cream/40 border border-espresso/5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-caramel uppercase tracking-wider">
              {productB.categoryLabel}
            </span>
            <h4 className="font-serif text-lg font-bold text-espresso mt-0.5">
              {productB.name}
            </h4>
            <p className="text-xs text-espresso/70 mt-1 line-clamp-2">
              {productB.description}
            </p>
            <div className="mt-3 text-sm font-bold text-espresso">
              ₹{productB.basePrice}
            </div>
          </div>
          <Link
            href={`/builder?preset=${productB.id}`}
            className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-espresso text-cream text-xs font-medium hover:bg-espresso/90 transition-colors"
          >
            <span>Customize {productB.name.split(" ")[0]}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Sensory Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-semibold text-espresso uppercase tracking-wider mb-2">
            Sensory Differences:
          </p>
          <ul className="space-y-1.5">
            {highlights.map((h, i) => (
              <li key={i} className="text-xs text-espresso/80 flex items-start gap-2">
                <span className="text-caramel mt-0.5">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Phase 6/7: Food & Snack Pairings Block
 */
function PairingsBlock({ pairings }: { pairings: BaristaPairingItem[] }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-espresso/10 shadow-soft space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-caramel-dark pb-2 border-b border-espresso/10">
        <Utensils className="w-4 h-4 text-caramel" />
        <span>Chef's Recommended Café Pairings</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {pairings.map((p, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-cream/40 border border-espresso/5 flex flex-col justify-between text-left"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-caramel px-2 py-0.5 rounded-full bg-caramel/10">
                  {p.category}
                </span>
                {typeof p.pairingPrice === "number" && (
                  <span className="text-xs font-bold text-espresso">
                    ₹{p.pairingPrice}
                  </span>
                )}
              </div>
              <h5 className="font-serif font-bold text-sm text-espresso mt-1">
                {p.name}
              </h5>
              <p className="text-[11px] text-espresso/70 mt-1 leading-relaxed">
                {p.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-espresso/5 text-[10px] text-espresso/80 italic">
              ✨ {p.whyItWorks}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Phase 6/7: Product Details Block
 */
function ProductDetailsBlock({ product }: { product: BaristaProductSummary & { tasteNotes?: string[]; calories?: number } }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-espresso/10 shadow-soft space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-caramel">
            {product.categoryLabel}
          </span>
          <h3 className="font-serif text-2xl font-bold text-espresso mt-0.5">
            {product.name}
          </h3>
        </div>
        {typeof product.basePrice === "number" && (
          <div className="text-xl font-bold text-espresso">
            ₹{product.basePrice}
          </div>
        )}
      </div>

      <p className="text-sm text-espresso/80 leading-relaxed">
        {product.description}
      </p>

      {product.tasteNotes && product.tasteNotes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {product.tasteNotes.map((note, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full bg-cream text-espresso border border-espresso/10"
            >
              🌿 {note}
            </span>
          ))}
        </div>
      )}

      <div className="pt-3 flex items-center justify-between border-t border-espresso/10">
        <span className="text-xs text-emerald-800 font-medium">
          ✓ Freshly Crafted in Café
        </span>
        <Link
          href={`/builder?preset=${product.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-espresso text-cream text-xs font-semibold hover:bg-espresso/90 shadow-soft transition-colors"
        >
          <span>Craft in Drink Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
