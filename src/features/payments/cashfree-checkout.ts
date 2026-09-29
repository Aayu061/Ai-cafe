"use client";

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_top";
      }) => Promise<{
        error?: { message: string; code?: string };
        paymentDetails?: unknown;
        redirect?: boolean;
      }>;
    };
  }
}

const CASHFREE_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

/**
 * Dynamically loads Cashfree v3 JavaScript SDK into browser if not already present
 */
export async function loadCashfreeScript(): Promise<void> {
  if (typeof window === "undefined") return;

  if (typeof window.Cashfree === "function") {
    return; // Already loaded
  }

  return new Promise((resolve, reject) => {
    // Check if script tag is already injected
    const existing = document.querySelector(`script[src="${CASHFREE_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(new Error("Failed to load Cashfree SDK")));
      return;
    }

    const script = document.createElement("script");
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (typeof window.Cashfree === "function") {
        resolve();
      } else {
        reject(new Error("Cashfree SDK script loaded, but window.Cashfree is undefined"));
      }
    };
    script.onerror = () => {
      reject(new Error("Network error loading Cashfree SDK from official CDN"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Launches Cashfree Web Checkout in strict Sandbox mode using the paymentSessionId provided by backend
 */
export async function launchCashfreeCheckout(paymentSessionId: string): Promise<void> {
  if (!paymentSessionId) {
    throw new Error("Cannot launch Cashfree Checkout without a valid payment_session_id.");
  }

  await loadCashfreeScript();

  if (!window.Cashfree) {
    throw new Error("Cashfree SDK is not available in the current browser environment.");
  }

  // Strict Sandbox initialization
  const cashfree = window.Cashfree({
    mode: "sandbox",
  });

  await cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_self", // Seamless redirect to payment result page
  });
}
