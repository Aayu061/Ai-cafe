import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../../config/firebase-admin";
import { OrderDoc, OrderStatus } from "../../types/operations";
import { UserRole } from "../../types/roles";
import { auditService } from "./audit.service";

export class OrderService {
  private memoryOrders: Map<string, OrderDoc> = new Map();

  /**
   * Retrieves operational orders with optional status or customer filter.
   */
  async getOrders(status?: OrderStatus, userId?: string): Promise<OrderDoc[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        let query: FirebaseFirestore.Query = db.collection("orders").orderBy("createdAt", "desc").limit(50);
        if (status) {
          query = query.where("status", "==", status);
        }
        if (userId) {
          query = query.where("userId", "==", userId);
        }
        const snap = await query.get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as OrderDoc);
        }
      } catch (err) {
        console.warn("[OrderService]: Firestore query failed, falling back to memory:", (err as Error).message);
      }
    }

    let orders = Array.from(this.memoryOrders.values());
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }
    if (userId) {
      orders = orders.filter((o) => o.userId === userId);
    }
    return orders;
  }

  /**
   * Retrieves a single order by ID.
   */
  async getOrderById(id: string): Promise<OrderDoc | null> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const doc = await db.collection("orders").doc(id).get();
        if (doc.exists) {
          return doc.data() as OrderDoc;
        }
      } catch (err) {
        console.warn("[OrderService]: Order lookup failed:", (err as Error).message);
      }
    }
    return this.memoryOrders.get(id) || null;
  }

  /**
   * Updates an order's operational fulfillment status (Staff / Admin).
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorId: string,
    actorRole: UserRole
  ): Promise<OrderDoc> {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const previousStatus = order.status;
    const now = new Date().toISOString();

    const updatedOrder: OrderDoc = {
      ...order,
      status: newStatus,
      updatedAt: now,
    };

    this.memoryOrders.set(orderId, updatedOrder);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("orders").doc(orderId).update({
          status: newStatus,
          updatedAt: now,
        });
      } catch (err) {
        console.warn("[OrderService]: Order status update failed in Firestore:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: "ORDER_STATUS_UPDATED",
      resourceType: "order",
      resourceId: orderId,
      metadata: { previousStatus, newStatus },
    });

    return updatedOrder;
  }
}

export const orderService = new OrderService();
