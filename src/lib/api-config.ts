/**
 * AI CAFÉ — Centralized API Configuration
 *
 * Single source of truth for all backend API URLs.
 * Uses NEXT_PUBLIC_API_URL from the environment — never hardcodes localhost.
 *
 * Vercel production environment must have:
 *   NEXT_PUBLIC_API_URL=https://ai-cafe-1v5c.onrender.com
 *
 * Local development .env.local should have:
 *   NEXT_PUBLIC_API_URL=http://localhost:5001
 */

const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!CONFIGURED_API_URL && typeof window === "undefined") {
  // Server-side build warning only — not a runtime crash
  console.warn(
    "[AI CAFÉ API Config] NEXT_PUBLIC_API_URL is not set. " +
      "Add it to .env.local for development or Vercel environment variables for production."
  );
}

/**
 * The base URL for the AI CAFÉ backend API.
 * All API calls must use this constant — never hardcode localhost anywhere.
 */
export const API_BASE_URL: string =
  CONFIGURED_API_URL && CONFIGURED_API_URL.trim() !== ""
    ? CONFIGURED_API_URL.replace(/\/+$/, "")
    : "";

/**
 * Helper to build a full API endpoint URL.
 * @param endpoint - The API path, e.g. "/api/products"
 */
export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}
