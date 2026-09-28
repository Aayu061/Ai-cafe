import type { UserRole, UserStatus, AccountDomain } from "./roles";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  accountDomain: AccountDomain;
  role: UserRole;
  status: UserStatus;
  permissions?: string[];
  employeeId?: string;
  claims?: DecodedIdToken;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
