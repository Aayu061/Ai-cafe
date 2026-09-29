/**
 * AI CAFÉ — Privacy-Preserving Client Analytics Boundary
 * Handles high-level interaction telemetry without collecting or transmitting
 * sensitive tokens, passwords, payment credentials, or private message content.
 */

export type AnalyticsEventType =
  | "page_view"
  | "menu_view"
  | "product_view"
  | "builder_started"
  | "builder_completed"
  | "ai_barista_opened"
  | "ai_recommendation"
  | "cart_action";

export interface AnalyticsEventData {
  page?: string;
  productId?: string;
  productName?: string;
  category?: string;
  mode?: string;
  totalPrice?: number;
  [key: string]: unknown;
}

// Restricted keys that must NEVER be captured in analytics payloads
const FORBIDDEN_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "apiKey",
  "secret",
  "creditCard",
  "cvv",
  "cardNumber",
  "idToken",
]);

/**
 * Sanitizes event data by stripping forbidden credentials and sensitive strings
 */
function sanitizeEventData(data?: AnalyticsEventData): Record<string, unknown> {
  if (!data) return {};

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      continue;
    }
    if (typeof value === "string" && (value.length > 200 || value.startsWith("eyJ"))) {
      // Avoid raw JWTs or oversized blocks
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

/**
 * Safe client event tracker
 */
export function trackEvent(eventType: AnalyticsEventType, data?: AnalyticsEventData): void {
  try {
    const cleanData = sanitizeEventData(data);
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      ...cleanData,
    };

    if (process.env.NODE_ENV === "development") {
      console.log(`📊 [AI Café Analytics]: ${eventType}`, payload);
    }

    // In production, dispatch to backend audit/analytics collector if configured
    // window.dispatchEvent(new CustomEvent("aicafe:analytics", { detail: payload }));
  } catch {
    // Fail silently — analytics must never disrupt user experience
  }
}
