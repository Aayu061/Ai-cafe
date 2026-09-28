/**
 * AI CAFÉ — Role, Identity & Authorization Types
 */

export type UserRole = "customer" | "staff" | "admin" | "super_admin";

export type UserStatus = "active" | "suspended";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 1,
  staff: 2,
  admin: 3,
  super_admin: 4,
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer: [
    "catalog.read",
    "orders.read_own",
    "orders.create_own",
    "profile.manage_own",
  ],
  staff: [
    "catalog.read",
    "inventory.read",
    "orders.read",
    "orders.update",
    "staff.profile.read",
  ],
  admin: [
    "catalog.read",
    "catalog.create",
    "catalog.update",
    "catalog.delete",
    "inventory.read",
    "inventory.create",
    "inventory.update",
    "inventory.adjust",
    "orders.read",
    "orders.update",
    "orders.cancel",
    "customers.read",
    "customers.update",
    "staff.read",
    "staff.create",
    "staff.update",
    "staff.disable",
    "analytics.read",
  ],
  super_admin: [
    "catalog.read",
    "catalog.create",
    "catalog.update",
    "catalog.delete",
    "inventory.read",
    "inventory.create",
    "inventory.update",
    "inventory.adjust",
    "orders.read",
    "orders.update",
    "orders.cancel",
    "customers.read",
    "customers.update",
    "staff.read",
    "staff.create",
    "staff.update",
    "staff.disable",
    "analytics.read",
    "settings.manage",
    "audit.read",
  ],
};

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  status: UserStatus;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  tasteProfile?: Record<string, unknown>;
  favorites?: string[];
  savedCreations?: string[];
  preferences?: {
    favoriteBases?: string[];
    preferredMilk?: string;
    sweetnessPreference?: number;
  };
}
