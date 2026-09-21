import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { FirebaseAdminNotConfiguredError } from "../config/firebase-admin";
import { AiBaristaNotConfiguredError } from "../services/ai/ai-provider";
import { GeminiApiError } from "../services/ai/gemini.provider";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isProduction = env.NODE_ENV === "production";

  // Handle AI Barista provider not configured
  if (err instanceof AiBaristaNotConfiguredError) {
    res.status(503).json({
      success: false,
      error: {
        code: "AI_BARISTA_NOT_CONFIGURED",
        message: err.message,
      },
    });
    return;
  }

  // Handle Gemini Provider errors
  if (err instanceof GeminiApiError) {
    res.status(502).json({
      success: false,
      error: {
        code: "GEMINI_API_ERROR",
        message: err.message,
      },
    });
    return;
  }

  // Handle Firebase Admin not configured
  if (err instanceof FirebaseAdminNotConfiguredError) {
    res.status(500).json({
      success: false,
      error: {
        code: "FIREBASE_ADMIN_NOT_CONFIGURED",
        message: isProduction
          ? "Server authentication provider is currently unavailable."
          : err.message,
      },
    });
    return;
  }

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload or parameters.",
        details: err.flatten(),
      },
    });
    return;
  }

  const customErr = err as AppError;
  const statusCode = customErr.statusCode || 500;
  const errorCode = customErr.code || (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "ERROR");
  const message =
    statusCode === 500 && isProduction
      ? "An unexpected internal server error occurred."
      : err.message || "An unexpected error occurred.";

  // Log error details server-side
  console.error(`❌ [Server Error] ${req.method} ${req.path} -> [${statusCode} ${errorCode}]:`, {
    message: err.message,
    code: customErr.code,
    stack: !isProduction ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(customErr.details && !isProduction ? { details: customErr.details } : {}),
    },
  });
}
