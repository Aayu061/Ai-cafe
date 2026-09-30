import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { env } from "./config/env";
import { requestLogger } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";
import { healthRoutes } from "./routes/health.routes";
import { userRoutes } from "./routes/user.routes";
import { catalogRoutes } from "./routes/catalog.routes";
import { baristaRoutes } from "./routes/barista.routes";
import { staffRoutes } from "./routes/staff.routes";
import { adminRoutes } from "./routes/admin.routes";
import { superAdminRoutes } from "./routes/super-admin.routes";
import { orderRoutes } from "./routes/order.routes";
import { paymentRoutes } from "./routes/payment.routes";
import { testStrictRateLimiter } from "./middleware/rate-limit.middleware";
import { sanitizePayload } from "./utils/sanitize";

export function createApp(): Express {
  const app = express();

  // 1. Security Headers Middleware (Production-Grade Hardening)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }
    next();
  });

  // 2. Request Timeout Middleware (30s safety bound)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const timeoutMs = 30000;
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: {
            code: "REQUEST_TIMEOUT",
            message: "The server took too long to process this request. Please try again.",
          },
        });
      }
    }, timeoutMs);

    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));
    next();
  });

  // 3. Body Parsing Middleware with Strict Payload Size Limits & Raw Body Retention
  app.use(
    express.json({
      limit: "1mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // 4. Input Sanitization (Cleanse XSS and dangerous script tags, exempting raw webhooks)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.path.includes("/webhook")) {
      return next();
    }
    if (req.body && typeof req.body === "object") {
      req.body = sanitizePayload(req.body);
    }
    next();
  });

  // 5. CORS Configuration
  const allowedOrigins = [
    env.FRONTEND_URL,
    "https://ai-cafe-zeta.vercel.app", // Production Vercel deployment — always allowed
    "http://localhost:3000",            // Local Next.js dev server
    "http://localhost:3001",            // Alternate local dev port
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || env.NODE_ENV === "development" || env.NODE_ENV === "test") {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-guest-session-id", "x-test-role", "x-test-uid", "x-test-status", "x-test-domain", "x-test-enforce-ratelimit"],
    })
  );

  // 6. Structured Request Logging
  app.use(requestLogger);

  // 7. Mount Routes
  app.use("/health", healthRoutes);
  app.use("/api", userRoutes);
  app.use("/api", catalogRoutes);
  app.use("/api/barista", baristaRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/super-admin", superAdminRoutes);
  app.use("/api", orderRoutes);
  app.use("/api", paymentRoutes);

  // Dedicated test rate limit route for automated verification
  app.get("/api/test-rate-limit", testStrictRateLimiter, (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: "Rate limit allowed" });
  });

  // 8. 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
