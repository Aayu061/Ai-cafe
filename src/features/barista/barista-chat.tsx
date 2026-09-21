"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { recommendDrink } from "@/lib/api-client";
import {
  BaristaConversationMessage,
  BaristaRecommendation,
  BaristaPreferences,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const INITIAL_GREETING: BaristaConversationMessage = {
  role: "assistant",
  content:
    "Hello! I am your AI Barista. Tell me what you're craving, your mood, caffeine needs, or dietary preferences, and I'll craft an authoritative recipe tailored to your exact taste profile.",
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

    // Dynamic loading steps for delightful sensory feedback
    setLoadingStep("Interpreting sensory desires & mood...");
    const t1 = setTimeout(() => {
      setLoadingStep("Matching with café catalog & real ingredients...");
    }, 600);
    const t2 = setTimeout(() => {
      setLoadingStep("Running Drink DNA sensory & pricing engine...");
    }, 1200);

    try {
      // Build conversation context for server (last 4 turns)
      const contextTurns = newHistory
        .filter((m) => m !== INITIAL_GREETING)
        .slice(-4)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await recommendDrink(text, contextTurns);

      clearTimeout(t1);
      clearTimeout(t2);

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

      const assistantMessage: BaristaConversationMessage = {
        role: "assistant",
        content:
          res.message ||
          "Here are the ideal beverage recommendations tailored to your profile:",
        recommendations: res.recommendations || [],
        preferences: res.preferences,
        followUpSuggestion: res.followUpSuggestion,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      clearTimeout(t1);
      clearTimeout(t2);
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
            <span>Real AI Sensory Engine</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso tracking-tight">
            Consult Your AI Barista
          </h1>
          <p className="text-sm text-espresso/70 mt-1">
            Natural language drinks consultation grounded in real café ingredients and authoritative pricing.
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
                  <p className="text-sm sm:text-base leading-relaxed mb-2">{msg.content}</p>

                  {/* Extracted Sensory Preferences Badges */}
                  {msg.preferences && Object.keys(msg.preferences).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-espresso/5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-warmgray mr-1">
                        Detected Taste Preferences:
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
                          ⚡ Caffeine: {msg.preferences.strength}%
                        </span>
                      )}
                      {msg.preferences.flavorPreferences?.map((f) => (
                        <span
                          key={f}
                          className="text-xs px-2.5 py-0.5 rounded-full bg-caramel/10 text-caramel-dark border border-caramel/20 capitalize"
                        >
                          🍯 {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grounded Drink Recommendations Grid */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-espresso/80">
                      <Coffee className="w-4 h-4 text-caramel" />
                      <span>Recommended Custom Creations ({msg.recommendations.length})</span>
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

                    {/* Follow-up Inquiry Chip */}
                    {msg.followUpSuggestion && (
                      <div className="bg-cream/60 rounded-2xl p-4 border border-espresso/10 flex items-start gap-3">
                        <Info className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-espresso">
                            Barista Follow-up:
                          </p>
                          <p className="text-xs sm:text-sm text-espresso/80 mt-0.5">
                            {msg.followUpSuggestion}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner with Dynamic Step */}
        {isLoading && (
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 rounded-full bg-espresso text-cream flex items-center justify-center shrink-0 mt-1 shadow-soft">
              <Loader2 className="w-4 h-4 text-caramel animate-spin" />
            </div>

            <div className="bg-white/80 rounded-3xl rounded-tl-sm px-5 py-4 border border-espresso/10 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-caramel animate-ping" />
                <span className="text-sm font-medium text-espresso/80">
                  {loadingStep || "Crafting your personalized drink..."}
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your desired drink (e.g., 'I want a cold caramel latte with oat milk and light ice')..."
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
