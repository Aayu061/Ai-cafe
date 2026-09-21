import express, { Express } from "express";
import cors from "cors";
import { env } from "./config/env";
import { requestLogger } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";
import { healthRoutes } from "./routes/health.routes";
import { userRoutes } from "./routes/user.routes";
import { catalogRoutes } from "./routes/catalog.routes";
import { baristaRoutes } from "./routes/barista.routes";

export function createApp(): Express {
  const app = express();

  // 1. Security & Body Parsing Middleware
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // 2. CORS Configuration
  const allowedOrigins = [
    env.FRONTEND_URL,
    "http://localhost:3000", // Ensure local Next.js dev server is supported
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || env.NODE_ENV === "development") {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // 3. Structured Request Logging
  app.use(requestLogger);

  // 4. Mount Routes
  app.use(["/health", "/health%20", "/health "], healthRoutes);
  app.use("/api", userRoutes);
  app.use("/api", catalogRoutes);
  app.use("/api/barista", baristaRoutes);

  // 5. 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
