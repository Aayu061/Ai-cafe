import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../../config/firebase-admin";
import {
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
  InventoryStatus,
  InventoryUnit,
} from "../../types/operations";
import { UserRole } from "../../types/roles";
import { auditService } from "./audit.service";

/**
 * Derives inventory status mathematically based on current quantity vs reorder threshold.
 */
export function deriveInventoryStatus(quantity: number, threshold: number): InventoryStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "inv-cold-brew",
    name: "Slow-Steeped Cold Brew Concentrate",
    ingredientId: "cold-brew",
    quantity: 18.5,
    unit: "l",
    reorderThreshold: 5.0,
    status: "in_stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inv-espresso-beans",
    name: "Artisan Espresso Roast Beans",
    ingredientId: "espresso-shot",
    quantity: 7.2,
    unit: "kg",
    reorderThreshold: 2.5,
    status: "in_stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inv-oat-milk",
    name: "Barista Edition Oat Milk",
    ingredientId: "oat-milk",
    quantity: 3.2,
    unit: "l",
    reorderThreshold: 5.0,
    status: "low_stock", // Derived low stock alert!
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inv-whole-milk",
    name: "Farm Fresh Whole Milk",
    ingredientId: "whole-milk",
    quantity: 26.0,
    unit: "l",
    reorderThreshold: 8.0,
    status: "in_stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inv-caramel-syrup",
    name: "Handcrafted Salted Caramel Syrup",
    ingredientId: "caramel",
    quantity: 4200,
    unit: "ml",
    reorderThreshold: 1000,
    status: "in_stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inv-vanilla-syrup",
    name: "Madagascar Bourbon Vanilla Syrup",
    ingredientId: "vanilla",
    quantity: 2800,
    unit: "ml",
    reorderThreshold: 800,
    status: "in_stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inv-ceremonial-matcha",
    name: "Kyoto Uji Ceremonial Matcha Powder",
    ingredientId: "matcha-base",
    quantity: 1100,
    unit: "g",
    reorderThreshold: 300,
    status: "in_stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inv-dark-cocoa",
    name: "70% Single Origin Belgian Cocoa",
    ingredientId: "chocolate",
    quantity: 2400,
    unit: "g",
    reorderThreshold: 600,
    status: "in_stock",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class InventoryService {
  private memoryInventory: Map<string, InventoryItem> = new Map();
  private memoryMovements: InventoryMovement[] = [];

  constructor() {
    INITIAL_INVENTORY.forEach((item) => {
      this.memoryInventory.set(item.id, { ...item });
    });
  }

  /**
   * Retrieves all inventory items with real-time derived status.
   */
  async getInventory(): Promise<InventoryItem[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const snap = await db.collection("inventory").get();
        if (!snap.empty) {
          return snap.docs.map((d) => {
            const data = d.data() as InventoryItem;
            return {
              ...data,
              status: deriveInventoryStatus(data.quantity, data.reorderThreshold),
            };
          });
        }
      } catch (err) {
        console.warn("[InventoryService]: Firestore read failed, using memory:", (err as Error).message);
      }
    }

    return Array.from(this.memoryInventory.values()).map((item) => ({
      ...item,
      status: deriveInventoryStatus(item.quantity, item.reorderThreshold),
    }));
  }

  /**
   * Retrieves single inventory item by ID.
   */
  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    const items = await this.getInventory();
    return items.find((i) => i.id === id) || null;
  }

  /**
   * Creates a new inventory record.
   */
  async createInventoryItem(
    data: {
      name: string;
      ingredientId: string;
      quantity: number;
      unit: InventoryUnit;
      reorderThreshold: number;
    },
    actorId: string,
    actorRole: UserRole
  ): Promise<InventoryItem> {
    const id = `inv-${data.ingredientId || Date.now()}`;
    const now = new Date().toISOString();
    const item: InventoryItem = {
      id,
      name: data.name,
      ingredientId: data.ingredientId,
      quantity: Math.max(0, data.quantity),
      unit: data.unit,
      reorderThreshold: Math.max(0, data.reorderThreshold),
      status: deriveInventoryStatus(data.quantity, data.reorderThreshold),
      createdAt: now,
      updatedAt: now,
    };

    this.memoryInventory.set(item.id, item);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("inventory").doc(item.id).set(item);
      } catch (err) {
        console.warn("[InventoryService]: Firestore write failed:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: "INVENTORY_CREATED",
      resourceType: "inventory",
      resourceId: item.id,
      metadata: { name: item.name, quantity: item.quantity, unit: item.unit },
    });

    return item;
  }

  /**
   * Adjusts stock quantity, generates movement record, and records audit log.
   */
  async adjustStock(
    inventoryId: string,
    quantityDelta: number,
    type: InventoryMovementType,
    reason: string,
    actorId: string,
    actorRole: UserRole,
    referenceId?: string
  ): Promise<{ item: InventoryItem; movement: InventoryMovement }> {
    const item = await this.getInventoryItem(inventoryId);
    if (!item) {
      throw new Error(`Inventory item "${inventoryId}" not found.`);
    }

    const previousQuantity = item.quantity;
    const newQuantity = Math.max(0, Number((previousQuantity + quantityDelta).toFixed(2)));
    const now = new Date().toISOString();
    const updatedStatus = deriveInventoryStatus(newQuantity, item.reorderThreshold);

    const updatedItem: InventoryItem = {
      ...item,
      quantity: newQuantity,
      status: updatedStatus,
      updatedAt: now,
    };

    this.memoryInventory.set(item.id, updatedItem);

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      inventoryId: item.id,
      type,
      quantity: quantityDelta,
      unit: item.unit,
      reason,
      referenceId,
      createdBy: actorId,
      createdAt: now,
    };

    this.memoryMovements.unshift(movement);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await Promise.all([
          db.collection("inventory").doc(item.id).update({
            quantity: newQuantity,
            status: updatedStatus,
            updatedAt: now,
          }),
          db.collection("inventoryMovements").doc(movement.id).set(movement),
        ]);
      } catch (err) {
        console.warn("[InventoryService]: Firestore sync failed:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: "INVENTORY_STOCK_ADJUSTED",
      resourceType: "inventory",
      resourceId: item.id,
      metadata: {
        previousQuantity,
        newQuantity,
        quantityDelta,
        unit: item.unit,
        type,
        reason,
      },
    });

    return { item: updatedItem, movement };
  }

  /**
   * Returns items at or below reorder threshold for staff & operations monitoring.
   */
  async getLowStockItems(): Promise<InventoryItem[]> {
    const all = await this.getInventory();
    return all.filter((i) => i.status === "low_stock" || i.status === "out_of_stock");
  }

  /**
   * Retrieves recent stock movements.
   */
  async getMovements(inventoryId?: string): Promise<InventoryMovement[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        let query: FirebaseFirestore.Query = db.collection("inventoryMovements").orderBy("createdAt", "desc").limit(50);
        if (inventoryId) {
          query = query.where("inventoryId", "==", inventoryId);
        }
        const snap = await query.get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as InventoryMovement);
        }
      } catch (err) {
        console.warn("[InventoryService]: Movements query failed:", (err as Error).message);
      }
    }

    if (inventoryId) {
      return this.memoryMovements.filter((m) => m.inventoryId === inventoryId);
    }
    return this.memoryMovements;
  }
}

export const inventoryService = new InventoryService();
