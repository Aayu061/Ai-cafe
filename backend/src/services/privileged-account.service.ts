import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../config/firebase-admin";
import {
  AdminAccount,
  ROLE_PERMISSIONS,
  StaffAccount,
  SuperAdminAccount,
  UserRole,
  UserStatus,
} from "../types/roles";
import { accountResolutionService } from "./account-resolution.service";
import { auditService } from "./operations/audit.service";

export class PrivilegedAccountService {
  // ==========================================
  // 1. STAFF ACCOUNT MANAGEMENT (Admin & Super Admin)
  // ==========================================

  async listStaffAccounts(): Promise<StaffAccount[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const snap = await db.collection("staffAccounts").get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as StaffAccount);
        }
      } catch (err) {
        console.warn("[PrivilegedAccounts]: Firestore staffAccounts fetch error:", (err as Error).message);
      }
    }
    return accountResolutionService.getStaff();
  }

  async createStaffAccount(
    data: {
      uid: string;
      email: string;
      displayName: string;
      employeeId?: string;
      permissions?: string[];
    },
    actorId: string,
    actorRole: UserRole
  ): Promise<StaffAccount> {
    if (actorRole !== "admin" && actorRole !== "super_admin") {
      throw new Error("Only an Administrator or Super Administrator can create a Staff account.");
    }

    if (!data.uid || !data.email) {
      throw new Error("Staff UID and email are required.");
    }

    const employeeId = data.employeeId || `STF-${Math.floor(1000 + Math.random() * 9000)}`;
    const permissions = data.permissions && data.permissions.length > 0
      ? data.permissions
      : ROLE_PERMISSIONS.staff;

    const now = new Date().toISOString();
    const newStaff: StaffAccount = {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName || "Café Barista",
      employeeId,
      role: "staff",
      status: "active",
      permissions,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
    };

    accountResolutionService.setStaff(newStaff);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("staffAccounts").doc(data.uid).set(newStaff);
      } catch (err) {
        console.warn("[PrivilegedAccounts]: Firestore write to staffAccounts failed:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: "STAFF_ACCOUNT_CREATED",
      resourceType: "staff",
      resourceId: data.uid,
      metadata: { employeeId, email: data.email },
    });

    return newStaff;
  }

  async updateStaffStatus(
    uid: string,
    status: UserStatus,
    actorId: string,
    actorRole: UserRole
  ): Promise<StaffAccount> {
    if (actorRole !== "admin" && actorRole !== "super_admin") {
      throw new Error("Only an Administrator or Super Administrator can alter Staff account status.");
    }

    const staffAccounts = await this.listStaffAccounts();
    const existing = staffAccounts.find((s) => s.uid === uid);
    if (!existing) {
      throw new Error(`Staff account with UID "${uid}" not found.`);
    }

    const updated: StaffAccount = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    accountResolutionService.setStaff(updated);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("staffAccounts").doc(uid).update({
          status,
          updatedAt: updated.updatedAt,
        });
      } catch (err) {
        console.warn("[PrivilegedAccounts]: Firestore update to staffAccounts failed:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: status === "active" ? "STAFF_ACCOUNT_REACTIVATED" : "STAFF_ACCOUNT_SUSPENDED",
      resourceType: "staff",
      resourceId: uid,
      metadata: { previousStatus: existing.status, newStatus: status },
    });

    return updated;
  }

  // ==========================================
  // 2. ADMIN ACCOUNT MANAGEMENT (Super Admin Only)
  // ==========================================

  async listAdminAccounts(): Promise<AdminAccount[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const snap = await db.collection("adminAccounts").get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as AdminAccount);
        }
      } catch (err) {
        console.warn("[PrivilegedAccounts]: Firestore adminAccounts fetch error:", (err as Error).message);
      }
    }
    return accountResolutionService.getAdmins();
  }

  async createAdminAccount(
    data: {
      uid: string;
      email: string;
      displayName: string;
      employeeId?: string;
      permissions?: string[];
    },
    actorId: string,
    actorRole: UserRole
  ): Promise<AdminAccount> {
    if (actorRole !== "super_admin") {
      throw new Error("Strict Access Violation: Only a Super Administrator can provision Administrator accounts.");
    }

    if (!data.uid || !data.email) {
      throw new Error("Admin UID and email are required.");
    }

    const employeeId = data.employeeId || `ADM-${Math.floor(1000 + Math.random() * 9000)}`;
    const permissions = data.permissions && data.permissions.length > 0
      ? data.permissions
      : ROLE_PERMISSIONS.admin;

    const now = new Date().toISOString();
    const newAdmin: AdminAccount = {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName || "Café Admin",
      employeeId,
      role: "admin",
      status: "active",
      permissions,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
    };

    accountResolutionService.setAdmin(newAdmin);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("adminAccounts").doc(data.uid).set(newAdmin);
      } catch (err) {
        console.warn("[PrivilegedAccounts]: Firestore write to adminAccounts failed:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: "ADMIN_ACCOUNT_CREATED",
      resourceType: "admin",
      resourceId: data.uid,
      metadata: { employeeId, email: data.email },
    });

    return newAdmin;
  }

  async updateAdminStatus(
    uid: string,
    status: UserStatus,
    actorId: string,
    actorRole: UserRole
  ): Promise<AdminAccount> {
    if (actorRole !== "super_admin") {
      throw new Error("Strict Access Violation: Only a Super Administrator can modify Administrator accounts.");
    }

    const adminAccounts = await this.listAdminAccounts();
    const existing = adminAccounts.find((a) => a.uid === uid);
    if (!existing) {
      throw new Error(`Admin account with UID "${uid}" not found.`);
    }

    const updated: AdminAccount = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    accountResolutionService.setAdmin(updated);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("adminAccounts").doc(uid).update({
          status,
          updatedAt: updated.updatedAt,
        });
      } catch (err) {
        console.warn("[PrivilegedAccounts]: Firestore update to adminAccounts failed:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: status === "active" ? "ADMIN_ACCOUNT_REACTIVATED" : "ADMIN_ACCOUNT_SUSPENDED",
      resourceType: "admin",
      resourceId: uid,
      metadata: { previousStatus: existing.status, newStatus: status },
    });

    return updated;
  }

  // ==========================================
  // 3. SUPER ADMIN OVERVIEW & HEALTH
  // ==========================================

  async listSuperAdmins(): Promise<SuperAdminAccount[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const snap = await db.collection("superAdminAccounts").get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as SuperAdminAccount);
        }
      } catch (err) {
        console.warn("[PrivilegedAccounts]: Firestore superAdminAccounts fetch error:", (err as Error).message);
      }
    }
    return accountResolutionService.getSuperAdmins();
  }
}

export const privilegedAccountService = new PrivilegedAccountService();
