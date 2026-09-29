import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../../config/firebase-admin";
import { OrderDoc, OrderItem, OrderStatus } from "../../types/operations";
import { UserRole } from "../../types/roles";
import { auditService } from "./audit.service";
import { catalogService } from "../catalog.service";
import { DrinkConfiguration } from "../../types/catalog";

export interface CreateOrderInputItem {
  productId: string;
  quantity: number;
  configuration?: DrinkConfiguration;
  configurationSummary?: string;
}

export interface CreateOrderParams {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: CreateOrderInputItem[];
  fulfillmentType?: "dine-in" | "takeaway" | "curbside";
  notes?: string;
}

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
   * Creates an order with 100% server-authoritative pricing and inventory validation.
   */
  async createOrder(params: CreateOrderParams): Promise<OrderDoc> {
    if (!params.items || params.items.length === 0) {
      throw new Error("Cannot create order with an empty item list.");
    }

    const calculatedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of params.items) {
      const quantity = Math.max(1, Math.floor(item.quantity || 1));
      let unitPrice = 0;
      let productName = "Beverage";
      let summary = item.configurationSummary || "";

      if (item.configuration && item.configuration.baseId) {
        // Validate with recipe pricing engine
        const validation = await catalogService.validateDrinkConfiguration(item.configuration);
        if (!validation.valid) {
          throw new Error(
            `Customization validation failed for product "${item.productId}": ${(validation.errors || []).join(", ")}`
          );
        }
        unitPrice = validation.finalPrice;
        const prod = await catalogService.getProductByIdOrSlug(item.productId);
        productName = prod ? prod.name : "Custom Drink";
        if (!summary) {
          summary = `Customized (${validation.configuration.sizeId}, ${validation.configuration.milkId})`;
        }
      } else {
        // Standard catalog item lookup
        const product = await catalogService.getProductByIdOrSlug(item.productId);
        if (!product) {
          throw new Error(`Product "${item.productId}" not found in catalog.`);
        }
        if (!product.available) {
          throw new Error(`Product "${product.name}" is currently unavailable.`);
        }
        unitPrice = product.basePrice;
        productName = product.name;
        if (!summary) {
          summary = product.description || "Artisan Specialty Beverage";
        }
      }

      const finalPrice = Number((unitPrice * quantity).toFixed(2));
      subtotal += finalPrice;

      calculatedItems.push({
        productId: item.productId,
        productName,
        quantity,
        unitPrice,
        finalPrice,
        configurationSummary: summary,
        recipeConfiguration: item.configuration ? (item.configuration as unknown as Record<string, unknown>) : undefined,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const tax = 0; // Tax configuration (included in specialty menu pricing)
    const total = Number((subtotal + tax).toFixed(2));

    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderId = `AC-${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;
    const now = new Date().toISOString();

    const order: OrderDoc = {
      id: orderId,
      userId: params.userId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      items: calculatedItems,
      status: "PENDING_PAYMENT",
      paymentStatus: "unpaid",
      subtotal,
      discount: 0,
      tax,
      total,
      currency: "INR",
      fulfillmentType: params.fulfillmentType || "takeaway",
      notes: params.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryOrders.set(orderId, order);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("orders").doc(orderId).set(order);
      } catch (err) {
        console.warn("[OrderService]: Failed to save order in Firestore:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId: params.userId,
      actorRole: "customer",
      action: "ORDER_CREATED",
      resourceType: "order",
      resourceId: orderId,
      metadata: { total, itemCount: calculatedItems.length, fulfillmentType: order.fulfillmentType },
    });

    return order;
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

  /**
   * Directly sets or updates an order in memory (useful for testing)
   */
  setMemoryOrder(order: OrderDoc) {
    this.memoryOrders.set(order.id, order);
  }

  /**
   * Clears memory orders (useful for clean test isolation)
   */
  clearMemory() {
    this.memoryOrders.clear();
  }
}

export const orderService = new OrderService();
