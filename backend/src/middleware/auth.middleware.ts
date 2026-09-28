import { Request, Response, NextFunction } from "express";
import { getFirebaseAdminAuth, FirebaseAdminNotConfiguredError } from "../config/firebase-admin";
import type { AuthenticatedUser } from "../types/express";
import { UserRole, UserStatus, AccountDomain, ROLE_PERMISSIONS } from "../types/roles";
import { accountResolutionService } from "../services/account-resolution.service";

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
    const testDomain: AccountDomain = (req.headers["x-test-domain"] as AccountDomain) || testRole;

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
      accountDomain: testDomain,
      role: testRole,
      status: testStatus,
      permissions: ROLE_PERMISSIONS[testRole] || [],
      employeeId: testRole === "staff" ? "STF-TEST" : testRole === "admin" ? "ADM-TEST" : undefined,
    };
    return next();
  }

  try {
    // 4. Verify token using Firebase Admin SDK
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    // 5. Look up user account domain and profile via AccountResolutionService
    const resolved = await accountResolutionService.resolveAccount(decodedToken.uid);

    if (resolved.status === "suspended") {
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
      email: decodedToken.email || resolved.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name || resolved.displayName,
      picture: (decodedToken.picture || resolved.photoURL) ?? undefined,
      accountDomain: resolved.accountDomain,
      role: resolved.role,
      status: resolved.status,
      permissions: resolved.permissions || ROLE_PERMISSIONS[resolved.role] || [],
      employeeId: resolved.employeeId,
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
 * Ensures user has exactly the specified role.
 */
export function requireRole(requiredRole: UserRole) {
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

    if (req.user.role !== requiredRole && req.user.role !== "super_admin") {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Requires role: "${requiredRole}". Your current role is "${req.user.role}".`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Ensures user possesses at least one of the allowed roles.
 */
export function requireAnyRole(allowedRoles: UserRole[]) {
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

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role) && req.user.role !== "super_admin") {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Requires one of: [${allowedRoles.join(", ")}]. Current role: "${req.user.role}".`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Backwards compatible alias for requireAnyRole.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return requireAnyRole(allowedRoles);
}

/**
 * Ensures user's account belongs to one of the specified account domains.
 */
export function requireAccountDomain(...allowedDomains: AccountDomain[]) {
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

    if (!allowedDomains.includes(req.user.accountDomain) && req.user.accountDomain !== "super_admin") {
      res.status(403).json({
        success: false,
        error: {
          code: "CROSS_DOMAIN_ACCESS_DENIED",
          message: `Cross-domain access denied. Account domain "${req.user.accountDomain}" is not permitted for this endpoint.`,
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

/**
 * Optional authentication middleware:
 * Attaches user to req.user if a valid token is provided,
 * but allows unauthenticated guest requests to proceed safely.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer" || !parts[1]) {
    return next();
  }

  const token = parts[1];

  // Test token simulation
  if (process.env.NODE_ENV === "test" && token.startsWith("test-token-")) {
    const testRole = (req.headers["x-test-role"] as UserRole) || (token.replace("test-token-", "") as UserRole);
    const testStatus = (req.headers["x-test-status"] as UserStatus) || "active";
    const testUid = (req.headers["x-test-uid"] as string) || `test-${testRole}-uid`;
    const testDomain: AccountDomain = (req.headers["x-test-domain"] as AccountDomain) || testRole;

    req.user = {
      uid: testUid,
      email: `${testRole}@aicafe.test`,
      accountDomain: testDomain,
      role: testRole,
      status: testStatus,
      permissions: ROLE_PERMISSIONS[testRole] || [],
    };
    return next();
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const resolved = await accountResolutionService.resolveAccount(decodedToken.uid);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || resolved.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name || resolved.displayName,
      picture: (decodedToken.picture || resolved.photoURL) ?? undefined,
      accountDomain: resolved.accountDomain,
      role: resolved.role,
      status: resolved.status,
      permissions: resolved.permissions || ROLE_PERMISSIONS[resolved.role] || [],
      employeeId: resolved.employeeId,
      claims: decodedToken,
    };
  } catch {
    // Guest fallback on token failure
    req.user = undefined;
  }

  next();
}

