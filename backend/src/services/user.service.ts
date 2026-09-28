import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../config/firebase-admin";
import { UserDocument, UserRole, UserStatus, ROLE_PERMISSIONS } from "../types/roles";
import { auditService } from "./operations/audit.service";

// In-memory user store for dev/testing when Firebase Admin is unconfigured
const MEMORY_USERS: Map<string, UserDocument> = new Map([
  [
    "test-admin-uid",
    {
      uid: "test-admin-uid",
      email: "admin@aicafe.internal",
      displayName: "Head Administrator",
      role: "admin",
      status: "active",
      permissions: ROLE_PERMISSIONS.admin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "test-staff-uid",
    {
      uid: "test-staff-uid",
      email: "barista@aicafe.internal",
      displayName: "Lead Barista",
      role: "staff",
      status: "active",
      permissions: ROLE_PERMISSIONS.staff,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "test-customer-uid",
    {
      uid: "test-customer-uid",
      email: "guest@example.com",
      displayName: "Café Regular",
      role: "customer",
      status: "active",
      permissions: ROLE_PERMISSIONS.customer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

export class UserService {
  /**
   * Retrieves a user profile document from Cloud Firestore or memory fallback.
   * Access path: users/{uid}
   */
  async getUserProfile(uid: string): Promise<UserDocument | null> {
    if (!uid || typeof uid !== "string") {
      throw new Error("Invalid UID provided for profile lookup");
    }

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const docRef = db.collection("users").doc(uid);
        const snapshot = await docRef.get();

        if (snapshot.exists) {
          const data = snapshot.data();
          const role: UserRole = (data?.role as UserRole) || "customer";
          const status: UserStatus = (data?.status as UserStatus) || "active";

          return {
            uid,
            email: data?.email || "",
            displayName: data?.displayName || "Café Guest",
            photoURL: data?.photoURL || null,
            role,
            status,
            permissions: data?.permissions || ROLE_PERMISSIONS[role] || [],
            createdAt: data?.createdAt || new Date().toISOString(),
            updatedAt: data?.updatedAt || new Date().toISOString(),
            tasteProfile: data?.tasteProfile,
            favorites: data?.favorites || [],
            savedCreations: data?.savedCreations || [],
            preferences: data?.preferences,
          };
        }
      } catch (err) {
        console.warn("[UserService]: Firestore user lookup failed, trying memory:", (err as Error).message);
      }
    }

    // Fallback to memory user
    const memUser = MEMORY_USERS.get(uid);
    if (memUser) return { ...memUser };

    // Default basic guest if not explicitly found in memory
    return {
      uid,
      email: "",
      displayName: "Café Guest",
      photoURL: null,
      role: "customer",
      status: "active",
      permissions: ROLE_PERMISSIONS.customer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Updates user profile with server-side protection preventing unauthorized self-promotion.
   */
  async updateUserProfile(
    uid: string,
    updates: Partial<UserDocument>,
    isPrivilegedAdmin: boolean = false
  ): Promise<UserDocument> {
    const existing = await this.getUserProfile(uid);
    if (!existing) {
      throw new Error(`User "${uid}" not found.`);
    }

    // Cleanse updates: Normal customers cannot alter role, status, or permissions
    const cleanUpdates = { ...updates };
    if (!isPrivilegedAdmin) {
      delete cleanUpdates.role;
      delete cleanUpdates.status;
      delete cleanUpdates.permissions;
    }

    const updated: UserDocument = {
      ...existing,
      ...cleanUpdates,
      updatedAt: new Date().toISOString(),
    };

    MEMORY_USERS.set(uid, updated);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("users").doc(uid).set(updated, { merge: true });
      } catch (err) {
        console.warn("[UserService]: Firestore user update failed:", (err as Error).message);
      }
    }

    return updated;
  }

  /**
   * Lists all staff and administrative users.
   */
  async listStaff(): Promise<UserDocument[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const snap = await db.collection("users").where("role", "in", ["staff", "admin", "super_admin"]).get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as UserDocument);
        }
      } catch (err) {
        console.warn("[UserService]: Firestore staff lookup failed:", (err as Error).message);
      }
    }

    return Array.from(MEMORY_USERS.values()).filter((u) => u.role !== "customer");
  }

  /**
   * Lists customer users for administrative inspection.
   */
  async listCustomers(limit: number = 50): Promise<UserDocument[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const snap = await db.collection("users").where("role", "==", "customer").limit(limit).get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as UserDocument);
        }
      } catch (err) {
        console.warn("[UserService]: Firestore customers lookup failed:", (err as Error).message);
      }
    }

    return Array.from(MEMORY_USERS.values()).filter((u) => u.role === "customer").slice(0, limit);
  }

  /**
   * Assigns a role to a user (Admin/Super Admin only).
   */
  async assignRole(
    targetUid: string,
    newRole: UserRole,
    actorId: string,
    actorRole: UserRole
  ): Promise<UserDocument> {
    // Only super_admin can create super_admin
    if (newRole === "super_admin" && actorRole !== "super_admin") {
      throw new Error("Only a Super Administrator can assign the Super Admin role.");
    }

    const existing = await this.getUserProfile(targetUid);
    if (!existing) {
      throw new Error(`Target user "${targetUid}" not found.`);
    }

    const previousRole = existing.role;
    const permissions = ROLE_PERMISSIONS[newRole] || [];

    const updated = await this.updateUserProfile(
      targetUid,
      {
        role: newRole,
        permissions,
      },
      true // Privileged update
    );

    await auditService.logAction({
      actorId,
      actorRole,
      action: "USER_ROLE_ASSIGNED",
      resourceType: "staff",
      resourceId: targetUid,
      metadata: { previousRole, newRole },
    });

    return updated;
  }
}

export const userService = new UserService();
