import { Request, Response } from "express";
import { env } from "../config/env";

export const ALLOWED_STATIC_ORIGINS = [
  env.FRONTEND_URL,
  "https://ai-cafe-zeta.vercel.app", // Production Vercel domain
  "http://localhost:3000",           // Next.js dev server
  "http://localhost:3001",           // Alternate local dev port
].filter(Boolean) as string[];

/**
 * Validates whether an incoming HTTP request origin is allowed.
 * Supports exact matches for production/localhost and wildcard regex for Vercel preview deploys.
 * NEVER uses wildcard "*" for authenticated APIs with credentials.
 */
export function isOriginAllowed(origin?: string): boolean {
  if (!origin) {
    // Non-browser clients (cURL, server-to-server, mobile native)
    return true;
  }

  const cleanOrigin = origin.trim().replace(/\/+$/, "");

  // 1. Direct match with static allowed origins
  if (ALLOWED_STATIC_ORIGINS.some((allowed) => allowed.replace(/\/+$/, "") === cleanOrigin)) {
    return true;
  }

  // 2. Official AI Café Vercel deployments (e.g., ai-cafe-zeta.vercel.app, ai-cafe-*.vercel.app)
  if (/^https:\/\/ai-cafe(-[a-z0-9-]+)?\.vercel\.app$/.test(cleanOrigin)) {
    return true;
  }

  // 3. Local dev and test modes
  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    if (/^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin)) {
      return true;
    }
  }

  return false;
}

/**
 * Attaches standard CORS headers to any outgoing response (including error responses)
 * if the request's origin is allowed. Ensures that HTTP 503, 500, or 401 error payloads
 * are cleanly readable by the frontend application without being swallowed by browser CORS policies.
 */
export function applyCorsHeaders(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-guest-session-id, x-test-role, x-test-uid, x-test-status, x-test-domain, x-test-enforce-ratelimit"
    );
    res.setHeader("Access-Control-Expose-Headers", "Retry-After");
  }
}
