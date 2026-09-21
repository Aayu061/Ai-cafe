import { Request, Response, NextFunction } from "express";
import { getFirebaseAdminAuth, FirebaseAdminNotConfiguredError } from "../config/firebase-admin";
import type { AuthenticatedUser } from "../types/express";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  // 1 & 2. Validate Authorization header exists
  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authorization header is required.",
      },
    });
    return;
  }

  // 3. Extract the Bearer token
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer" || !parts[1]) {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN_FORMAT",
        message: "Authorization header must be formatted as 'Bearer <token>'.",
      },
    });
    return;
  }

  const token = parts[1];

  try {
    // 4. Verify token using Firebase Admin SDK
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    // 5. Attach authenticated user information to Express request
    const authenticatedUser: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      claims: decodedToken,
    };

    req.user = authenticatedUser;
    next();
  } catch (error: unknown) {
    // Handle unconfigured Firebase Admin explicitly
    if (error instanceof FirebaseAdminNotConfiguredError) {
      console.error("❌ [Auth Middleware]: Cannot verify token because Firebase Admin is not configured.");
      res.status(500).json({
        success: false,
        error: {
          code: "FIREBASE_ADMIN_NOT_CONFIGURED",
          message: "Firebase Admin SDK credentials are not configured on this server.",
        },
      });
      return;
    }

    const err = error as { code?: string; message?: string };
    const errorCode = err.code || "auth/invalid-token";

    if (errorCode === "auth/id-token-expired") {
      res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Firebase authentication token has expired. Please refresh your session.",
        },
      });
      return;
    }

    if (
      errorCode === "auth/argument-error" ||
      errorCode === "auth/invalid-id-token" ||
      errorCode === "auth/id-token-revoked"
    ) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "The provided authentication token is invalid or has been revoked.",
        },
      });
      return;
    }

    console.warn("[Auth Middleware]: Authentication verification failed:", err.message);
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication verification failed.",
      },
    });
  }
}
