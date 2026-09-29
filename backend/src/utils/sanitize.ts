/**
 * AI CAFÉ — Input Sanitization Utility
 * Sanitizes untrusted user inputs, preventing Cross-Site Scripting (XSS),
 * HTML injection, and control character tampering.
 */

const HTML_TAG_REGEX = /<[^>]*>?/gm;
const SCRIPT_INJECTION_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;
const EVENT_HANDLER_REGEX = /\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;

/**
 * Strips HTML tags, script blocks, event handlers, and dangerous URI schemes.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(SCRIPT_INJECTION_REGEX, "")
    .replace(EVENT_HANDLER_REGEX, "")
    .replace(JAVASCRIPT_URI_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .trim();
}

/**
 * Sanitizes plain text input, removing non-printable control characters
 * while preserving standard punctuation, emojis, and international text.
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== "string") return "";

  // Strip control characters except newline and tab
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return sanitizeHtml(cleaned);
}

/**
 * Recursively traverses and sanitizes all string properties in a payload.
 */
export function sanitizePayload<T>(payload: T): T {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (typeof payload === "string") {
    return sanitizeText(payload) as unknown as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item)) as unknown as T;
  }

  if (typeof payload === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      result[key] = sanitizePayload(value);
    }
    return result as unknown as T;
  }

  return payload;
}
