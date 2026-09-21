import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

/**
 * In-memory sliding window rate limiter middleware factory.
 * Lightweight, zero-dependency, suitable for protecting LLM endpoints from abuse.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = "Too many requests. Please slow down." } = options;
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

    let record = ipMap.get(ip);
    if (!record) {
      record = { timestamps: [] };
      ipMap.set(ip, record);
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
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "Too many recommendation requests. Please wait a moment before consulting the barista again.",
});
