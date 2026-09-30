import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { applyCorsHeaders } from "../utils/cors";
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

  // Ensure CORS headers are attached to every error response so browsers
  // do not swallow 503, 500, or 401 payloads under a generic CORS error
  applyCorsHeaders(req, res);

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

  // Handle Firebase Admin not configured (503 Service Unavailable)
  if (err instanceof FirebaseAdminNotConfiguredError) {
    res.status(503).json({
      success: false,
      error: {
        code: "FIREBASE_ADMIN_NOT_CONFIGURED",
        message: isProduction
          ? "Server authentication provider is currently unavailable. Please verify Firebase Admin credentials."
          : err.message,
      },
    });
    return;
  }

  // Handle malformed JSON request body
  if (err instanceof SyntaxError && "body" in err && (err as { status?: number }).status === 400) {
    res.status(400).json({
      success: false,
      error: {
        code: "MALFORMED_JSON_PAYLOAD",
        message: "The request body contains invalid or malformed JSON.",
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
