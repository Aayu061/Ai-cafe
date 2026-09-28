import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../config/firebase-admin";
import {
  ResolvedAccount,
  ROLE_PERMISSIONS,
  StaffAccount,
  AdminAccount,
  SuperAdminAccount,
  CustomerAccount,
} from "../types/roles";

// In-memory seeds for decoupled testing & local development
const MEMORY_SUPER_ADMINS: Map<string, SuperAdminAccount> = new Map([
  [
    "test-super-admin-uid",
    {
      uid: "test-super-admin-uid",
      email: "founder@aicafe.internal",
      displayName: "Principal Super Admin",
      role: "super_admin",
      status: "active",
      permissions: ROLE_PERMISSIONS.super_admin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system_bootstrap",
    },
  ],
  [
    "test-super_admin-uid",
    {
      uid: "test-super_admin-uid",
      email: "founder@aicafe.internal",
      displayName: "Principal Super Admin",
      role: "super_admin",
      status: "active",
      permissions: ROLE_PERMISSIONS.super_admin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system_bootstrap",
    },
  ],
]);

const MEMORY_ADMINS: Map<string, AdminAccount> = new Map([
  [
    "test-admin-uid",
    {
      uid: "test-admin-uid",
      email: "admin@aicafe.internal",
      displayName: "Café General Manager",
      employeeId: "ADM-1001",
      role: "admin",
      status: "active",
      permissions: ROLE_PERMISSIONS.admin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "test-super-admin-uid",
    },
  ],
]);

const MEMORY_STAFF: Map<string, StaffAccount> = new Map([
  [
    "test-staff-uid",
    {
      uid: "test-staff-uid",
      email: "barista@aicafe.internal",
      displayName: "Head Artisan Barista",
      employeeId: "STF-2041",
      role: "staff",
      status: "active",
      permissions: ROLE_PERMISSIONS.staff,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "test-admin-uid",
    },
  ],
]);

const MEMORY_CUSTOMERS: Map<string, CustomerAccount> = new Map([
  [
    "test-customer-uid",
    {
      uid: "test-customer-uid",
      email: "patron@example.com",
      displayName: "Café Patron",
      role: "customer",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

export class AccountResolutionService {
  /**
   * Resolves the authoritative account domain and profile for a given UID.
   * Priority search order:
   * 1. superAdminAccounts/{uid}
   * 2. adminAccounts/{uid}
   * 3. staffAccounts/{uid}
   * 4. users/{uid} (Customer)
   */
  async resolveAccount(uid: string): Promise<ResolvedAccount> {
    if (!uid || typeof uid !== "string") {
      throw new Error("Invalid UID provided for account resolution");
    }

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();

        // 1. Super Admin Account Check
        const superDoc = await db.collection("superAdminAccounts").doc(uid).get();
        if (superDoc.exists) {
          const data = superDoc.data();
          return {
            uid,
            accountDomain: "super_admin",
            role: "super_admin",
            status: data?.status || "active",
            permissions: data?.permissions || ROLE_PERMISSIONS.super_admin,
            email: data?.email || "",
            displayName: data?.displayName || "Super Admin",
          };
        }

        // 2. Admin Account Check
        const adminDoc = await db.collection("adminAccounts").doc(uid).get();
        if (adminDoc.exists) {
          const data = adminDoc.data();
          return {
            uid,
            accountDomain: "admin",
            role: "admin",
            status: data?.status || "active",
            permissions: data?.permissions || ROLE_PERMISSIONS.admin,
            email: data?.email || "",
            displayName: data?.displayName || "Café Admin",
            employeeId: data?.employeeId,
          };
        }

        // 3. Staff Account Check
        const staffDoc = await db.collection("staffAccounts").doc(uid).get();
        if (staffDoc.exists) {
          const data = staffDoc.data();
          return {
            uid,
            accountDomain: "staff",
            role: "staff",
            status: data?.status || "active",
            permissions: data?.permissions || ROLE_PERMISSIONS.staff,
            email: data?.email || "",
            displayName: data?.displayName || "Café Barista",
            employeeId: data?.employeeId,
          };
        }

        // 4. Customer Account Check (users/{uid})
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          return {
            uid,
            accountDomain: "customer",
            role: "customer",
            status: data?.status || "active",
            permissions: ROLE_PERMISSIONS.customer,
            email: data?.email || "",
            displayName: data?.displayName || "Café Guest",
            photoURL: data?.photoURL || null,
          };
        }
      } catch (err) {
        console.warn("[AccountResolution]: Firestore lookup error, falling back to memory:", (err as Error).message);
      }
    }

    // In-memory fallback check
    const superAdmin = MEMORY_SUPER_ADMINS.get(uid);
    if (superAdmin) {
      return {
        uid,
        accountDomain: "super_admin",
        role: "super_admin",
        status: superAdmin.status,
        permissions: superAdmin.permissions,
        email: superAdmin.email,
        displayName: superAdmin.displayName,
      };
    }

    const admin = MEMORY_ADMINS.get(uid);
    if (admin) {
      return {
        uid,
        accountDomain: "admin",
        role: "admin",
        status: admin.status,
        permissions: admin.permissions,
        email: admin.email,
        displayName: admin.displayName,
        employeeId: admin.employeeId,
      };
    }

    const staff = MEMORY_STAFF.get(uid);
    if (staff) {
      return {
        uid,
        accountDomain: "staff",
        role: "staff",
        status: staff.status,
        permissions: staff.permissions,
        email: staff.email,
        displayName: staff.displayName,
        employeeId: staff.employeeId,
      };
    }

    const customer = MEMORY_CUSTOMERS.get(uid);
    if (customer) {
      return {
        uid,
        accountDomain: "customer",
        role: "customer",
        status: customer.status,
        permissions: ROLE_PERMISSIONS.customer,
        email: customer.email,
        displayName: customer.displayName,
      };
    }

    // Default fallback: any unknown authenticated user is treated strictly as an unprivileged customer
    return {
      uid,
      accountDomain: "customer",
      role: "customer",
      status: "active",
      permissions: ROLE_PERMISSIONS.customer,
      email: "",
      displayName: "Café Guest",
    };
  }

  // Memory mutation methods for testing and local management
  setSuperAdmin(account: SuperAdminAccount) {
    MEMORY_SUPER_ADMINS.set(account.uid, account);
  }

  setAdmin(account: AdminAccount) {
    MEMORY_ADMINS.set(account.uid, account);
  }

  setStaff(account: StaffAccount) {
    MEMORY_STAFF.set(account.uid, account);
  }

  setCustomer(account: CustomerAccount) {
    MEMORY_CUSTOMERS.set(account.uid, account);
  }

  getSuperAdmins(): SuperAdminAccount[] {
    return Array.from(MEMORY_SUPER_ADMINS.values());
  }

  getAdmins(): AdminAccount[] {
    return Array.from(MEMORY_ADMINS.values());
  }

  getStaff(): StaffAccount[] {
    return Array.from(MEMORY_STAFF.values());
  }
}

export const accountResolutionService = new AccountResolutionService();
