import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../../config/firebase-admin";
import { AuditLog, AuditResourceType } from "../../types/operations";
import { UserRole } from "../../types/roles";

export class AuditService {
  // Local in-memory buffer for local dev / testing or fast querying
  private memoryLogs: AuditLog[] = [];

  /**
   * Records an audit log entry to Cloud Firestore (or memory buffer if unconfigured).
   */
  async logAction(entry: {
    actorId: string;
    actorRole: UserRole;
    action: string;
    resourceType: AuditResourceType;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLog> {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      metadata: entry.metadata || {},
      createdAt: new Date().toISOString(),
    };

    this.memoryLogs.unshift(log);
    if (this.memoryLogs.length > 500) {
      this.memoryLogs.pop();
    }

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("auditLogs").doc(log.id).set(log);
      } catch (err) {
        console.warn("[AuditService]: Failed to persist audit log to Firestore:", (err as Error).message);
      }
    }

    return log;
  }

  /**
   * Retrieves recent audit logs with optional resource filter.
   */
  async getLogs(limit: number = 50, resourceType?: AuditResourceType): Promise<AuditLog[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        let query: FirebaseFirestore.Query = db.collection("auditLogs").orderBy("createdAt", "desc").limit(limit);
        if (resourceType) {
          query = query.where("resourceType", "==", resourceType);
        }
        const snap = await query.get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as AuditLog);
        }
      } catch (err) {
        console.warn("[AuditService]: Firestore audit query failed, falling back to memory:", (err as Error).message);
      }
    }

    let logs = this.memoryLogs;
    if (resourceType) {
      logs = logs.filter((l) => l.resourceType === resourceType);
    }
    return logs.slice(0, limit);
  }
}

export const auditService = new AuditService();
