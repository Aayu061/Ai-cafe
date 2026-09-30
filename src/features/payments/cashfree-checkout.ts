"use client";

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_top" | "_modal";
      }) => Promise<{
        error?: { message: string; code?: string };
        paymentDetails?: unknown;
        redirect?: boolean;
      }>;
    };
  }
}

export const CASHFREE_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

/**
 * Dynamically loads Cashfree v3 JavaScript SDK into browser if not already present,
 * with strict timeout handling and race condition prevention.
 */
export async function loadCashfreeScript(timeoutMs = 10000): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. If already available on window, resolve immediately
  if (typeof window.Cashfree === "function") {
    return;
  }

  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
    };

    timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Cashfree SDK script loading timed out after ${Math.round(timeoutMs / 1000)}s from CDN.`
        )
      );
    }, timeoutMs);

    // 2. Check if script tag is already injected in document
    const existing = document.querySelector(`script[src="${CASHFREE_SDK_URL}"]`);
    if (existing) {
      // Poll briefly for window.Cashfree to initialize
      const checkInterval = setInterval(() => {
        if (typeof window.Cashfree === "function") {
          clearInterval(checkInterval);
          cleanup();
          resolve();
        }
      }, 100);

      existing.addEventListener(
        "load",
        () => {
          clearInterval(checkInterval);
          cleanup();
          if (typeof window.Cashfree === "function") {
            resolve();
          } else {
            reject(new Error("Cashfree SDK script loaded, but window.Cashfree is undefined"));
          }
        },
        { once: true }
      );

      existing.addEventListener(
        "error",
        () => {
          clearInterval(checkInterval);
          cleanup();
          reject(new Error("Network error loading Cashfree SDK from official CDN (sdk.cashfree.com)"));
        },
        { once: true }
      );

      return;
    }

    // 3. Inject new script tag into head
    const script = document.createElement("script");
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      cleanup();
      if (typeof window.Cashfree === "function") {
        resolve();
      } else {
        reject(new Error("Cashfree SDK script loaded, but window.Cashfree is undefined"));
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Network error loading Cashfree SDK from official CDN (sdk.cashfree.com)"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Launches Cashfree Web Checkout in strict Sandbox mode using the paymentSessionId provided by backend.
 * Uses _modal for in-page iframe popup checkout without requiring a full page refresh.
 */
export async function launchCashfreeCheckout(
  paymentSessionId: string,
  options?: { redirectTarget?: "_modal" | "_self" }
): Promise<void> {
  if (!paymentSessionId) {
    throw new Error("Cannot launch Cashfree Checkout without a valid payment_session_id.");
  }

  // Load SDK with 10s maximum timeout
  await loadCashfreeScript(10000);

  if (typeof window.Cashfree !== "function") {
    throw new Error("Cashfree SDK is not available in the current browser environment.");
  }

  // Strict Sandbox initialization
  const cashfree = window.Cashfree({
    mode: "sandbox",
  });

  const target = options?.redirectTarget || "_modal";

  const result = await cashfree.checkout({
    paymentSessionId,
    redirectTarget: target,
  });

  if (result?.error) {
    console.error("[Cashfree Checkout Error]:", result.error);
    throw new Error(result.error.message || "Cashfree payment modal reported an error.");
  }
}

