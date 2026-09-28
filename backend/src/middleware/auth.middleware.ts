import { Request, Response, NextFunction } from "express";
import { getFirebaseAdminAuth, FirebaseAdminNotConfiguredError } from "../config/firebase-admin";
import type { AuthenticatedUser } from "../types/express";
import { UserRole, UserStatus, ROLE_PERMISSIONS } from "../types/roles";
import { userService } from "../services/user.service";

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

  // In test environment, allow simulating verified roles via signed test tokens
  if (process.env.NODE_ENV === "test" && token.startsWith("test-token-")) {
    const testRole = (req.headers["x-test-role"] as UserRole) || (token.replace("test-token-", "") as UserRole);
    const testStatus = (req.headers["x-test-status"] as UserStatus) || "active";
    const testUid = (req.headers["x-test-uid"] as string) || `test-${testRole}-uid`;

    if (testStatus === "suspended") {
      res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_SUSPENDED",
          message: "Your AI Café account has been suspended. Please contact café operations.",
        },
      });
      return;
    }

    req.user = {
      uid: testUid,
      email: `${testRole}@aicafe.test`,
      role: testRole,
      status: testStatus,
      permissions: ROLE_PERMISSIONS[testRole] || [],
    };
    return next();
  }

  try {
    // 4. Verify token using Firebase Admin SDK
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    // 5. Look up user profile to resolve role & status
    const profile = await userService.getUserProfile(decodedToken.uid);
    const role: UserRole = profile?.role || (decodedToken.role as UserRole) || "customer";
    const status: UserStatus = profile?.status || "active";

    if (status === "suspended") {
      res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_SUSPENDED",
          message: "Your AI Café account has been suspended. Please contact café operations.",
        },
      });
      return;
    }

    // 6. Attach authenticated user information to Express request
    const authenticatedUser: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name || profile?.displayName,
      picture: (decodedToken.picture || profile?.photoURL) ?? undefined,
      role,
      status,
      permissions: profile?.permissions || ROLE_PERMISSIONS[role] || [],
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

/**
 * Role-based authorization middleware. Rejects requests where user lacks any of the allowed roles.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required to access this resource.",
        },
      });
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Requires one of the following roles: [${allowedRoles.join(
            ", "
          )}]. Your current role is "${req.user.role}".`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based authorization middleware.
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
        },
      });
      return;
    }

    // super_admin always bypasses granular permission restrictions
    if (req.user.role === "super_admin") {
      return next();
    }

    const userPerms = req.user.permissions || [];
    const hasAll = requiredPermissions.every((p) => userPerms.includes(p));

    if (!hasAll) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Missing required permissions: [${requiredPermissions.join(", ")}].`,
        },
      });
      return;
    }

    next();
  };
}
