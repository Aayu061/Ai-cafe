import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  name?: string;
}

/**
 * In-memory sliding window rate limiter middleware factory.
 * Lightweight, zero-dependency, suitable for protecting API endpoints from abuse.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = "Too many requests. Please slow down.", name = "general" } = options;
  const ipMap = new Map<string, RateLimitRecord>();

  // Periodically clean up stale IPs every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        ipMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // Unref cleanup timer so it doesn't hold open process during tests
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    // Resolve client IP (respecting reverse proxies like Render / Vercel)
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : undefined) ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown-client";

    const key = `${name}:${ip}`;
    let record = ipMap.get(key);
    if (!record) {
      record = { timestamps: [] };
      ipMap.set(key, record);
    }

    // Filter out timestamps outside the current sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));

      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message,
          retryAfterSeconds,
        },
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

/**
 * Standard Barista rate limiter: 10 requests per 60 seconds per IP
 */
export const baristaRateLimiter = createRateLimiter({
  name: "barista",
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "Too many recommendation requests. Please wait a moment before consulting the barista again.",
});

/**
 * Authentication & Profile sync rate limiter: 25 requests per 60 seconds per IP
 */
export const authRateLimiter = createRateLimiter({
  name: "auth",
  windowMs: 60 * 1000,
  maxRequests: 25,
  message: "Too many authentication requests. Please wait a moment before trying again.",
});

/**
 * Admin sensitive mutation rate limiter: 20 requests per 60 seconds per IP
 */
export const adminSensitiveRateLimiter = createRateLimiter({
  name: "admin-sensitive",
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: "Administrative rate limit exceeded. Please wait a moment.",
});

/**
 * Test rate limiter for automated security test verification: 2 requests per 5 seconds
 */
export const testStrictRateLimiter = createRateLimiter({
  name: "test-limiter",
  windowMs: 5 * 1000,
  maxRequests: 2,
  message: "Test rate limit threshold reached.",
});
