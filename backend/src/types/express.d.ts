import type { DecodedIdToken } from "firebase-admin/auth";
import type { UserRole, UserStatus } from "./roles";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  role: UserRole;
  status: UserStatus;
  permissions?: string[];
  claims?: DecodedIdToken;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
